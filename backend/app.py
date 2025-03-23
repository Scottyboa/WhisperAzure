import os
import threading
import time
import requests
import queue
import hmac
import hashlib
import base64
import subprocess
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import logging

# Import cryptography libraries for decryption
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ------------------------------
# Root Route (Newly Added)
# ------------------------------
@app.route("/")
def index():
    return "Hello, world! Your Flask app is running on Azure."

# ------------------------------
# Helper Functions for Validation
# ------------------------------

def hash_string(s: str) -> str:
    """
    Mimics a simple JavaScript hashString() function.
    """
    hash_val = 0
    for c in s:
        hash_val = ((hash_val << 5) - hash_val) + ord(c)
        hash_val &= 0xFFFFFFFF  # emulate 32-bit integer arithmetic
    return str(hash_val)

def compute_hmac(message: str, secret: str) -> str:
    """
    Computes an HMAC-SHA256 signature for a given message and secret.
    Returns the Base64-encoded signature.
    """
    hm = hmac.new(secret.encode('utf-8'), message.encode('utf-8'), hashlib.sha256)
    return base64.b64encode(hm.digest()).decode('utf-8')

# ------------------------------
# Decryption Function for Audio
# ------------------------------

def decrypt_audio_file(encrypted_data: bytes, salt_b64: str, iv_b64: str, api_key: str, device_token: str) -> bytes:
    """
    Decrypts the provided encrypted audio using AES-GCM.
    
    - salt_b64 and iv_b64 are Base64-encoded strings sent by the client.
    - The key is derived using PBKDF2HMAC with 100,000 iterations.
    - The secret for key derivation is: api_key + ":" + device_token.
    """
    salt = base64.b64decode(salt_b64)
    iv = base64.b64decode(iv_b64)
    password = (api_key + ":" + device_token).encode('utf-8')
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    key = kdf.derive(password)
    
    aesgcm = AESGCM(key)
    decrypted_data = aesgcm.decrypt(iv, encrypted_data, None)
    return decrypted_data

# ------------------------------
# In-Memory Session Storage and Auto-Deletion Logic
# ------------------------------

sessions = {}

def schedule_session_deletion(group_id, delay=120):
    """
    Restarts the deletion timer for the given session.
    After 'delay' seconds of inactivity, the session folder and in-memory session data are deleted.
    """
    def deletion_action():
        group_folder = os.path.join("uploads", group_id)
        if os.path.exists(group_folder):
            try:
                for f in os.listdir(group_folder):
                    os.remove(os.path.join(group_folder, f))
                os.rmdir(group_folder)
                logger.info(f"Auto-deleted group folder for group {group_id} (inactivity)")
            except Exception as e:
                logger.error(f"Error deleting group folder for group {group_id}: {e}")
        sessions.pop(group_id, None)
        logger.info(f"Auto-deleted session {group_id} due to inactivity")
    
    if group_id in sessions and "deletion_timer" in sessions[group_id]:
        try:
            sessions[group_id]["deletion_timer"].cancel()
        except Exception as e:
            logger.error(f"Error cancelling previous deletion timer for group {group_id}: {e}")
    
    t = threading.Timer(delay, deletion_action)
    t.daemon = True
    if group_id in sessions:
        sessions[group_id]["deletion_timer"] = t
    t.start()

# ------------------------------
# Upload Endpoint with Request Signing and Marker Validation
# ------------------------------

@app.route("/upload", methods=["POST"])
def upload_audio():
    # Ensure the file is provided.
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    audio_file = request.files["file"]
    group_id = request.form.get("group_id")
    chunk_number = request.form.get("chunk_number")
    api_key = request.form.get("api_key")
    signature = request.form.get("signature")
    iv = request.form.get("iv")
    salt = request.form.get("salt")
    api_key_marker = request.form.get("api_key_marker")
    device_marker = request.form.get("device_marker")
    device_token = request.form.get("device_token")  # This field is now required

    missing_fields = []
    if not group_id:
        missing_fields.append("group_id")
    if not chunk_number:
        missing_fields.append("chunk_number")
    if not api_key:
        missing_fields.append("api_key")
    if not signature:
        missing_fields.append("signature")
    if not device_token:
        missing_fields.append("device_token")
    if not iv:
        missing_fields.append("iv")
    if not salt:
        missing_fields.append("salt")
    if missing_fields:
        return jsonify({"error": "Missing required fields", "fields": missing_fields}), 400

    try:
        chunk_number = int(chunk_number)
    except Exception:
        return jsonify({"error": "Invalid chunk_number"}), 400

    # Validate markers.
    if hash_string(api_key) != api_key_marker:
        return jsonify({"error": "Invalid API key marker"}), 400
    if hash_string(device_token) != device_marker:
        return jsonify({"error": "Invalid device marker"}), 400

    # Validate the request signature.
    # The secret is defined as: api_key + ":" + device_token
    secret = api_key + ":" + device_token
    message = f"upload:{group_id}:{chunk_number}"
    expected_signature = compute_hmac(message, secret)
    if not hmac.compare_digest(expected_signature, signature):
        return jsonify({"error": "Invalid signature"}), 400

    # Retrieve or initialize the session.
    if group_id not in sessions:
        sessions[group_id] = {}
    sessions[group_id]["api_key"] = api_key
    sessions[group_id]["device_token"] = device_token  # Store device token for decryption

    # Initialize transcription queue if necessary.
    if "transcription_queue" not in sessions[group_id]:
        sessions[group_id]["transcription_queue"] = queue.PriorityQueue()

    group_folder = os.path.join("uploads", group_id)
    os.makedirs(group_folder, exist_ok=True)

    # Determine a safe filename.
    original_filename = secure_filename(audio_file.filename)
    if not original_filename:
        original_filename = f"chunk_{chunk_number}.wav"
    else:
        ext = os.path.splitext(original_filename)[1]
        original_filename = f"chunk_{chunk_number}{ext}"
    save_path = os.path.join(group_folder, original_filename)
    audio_file.save(save_path)
    logger.info(f"Received chunk {chunk_number} for group {group_id} stored at {save_path}")

    # Store chunk info (including encryption metadata) in session.
    sessions[group_id].setdefault("chunks", {})[chunk_number] = {
        "path": save_path,
        "iv": iv,
        "salt": salt
    }

    # Restart the session deletion timer.
    schedule_session_deletion(group_id)

    last_chunk_flag = request.form.get("last_chunk", "false").lower() == "true"
    sessions[group_id]["transcription_queue"].put((chunk_number, sessions[group_id]["chunks"][chunk_number], last_chunk_flag))
    if last_chunk_flag:
        sessions[group_id]["last_chunk_received"] = True
    if not sessions[group_id].get("transcription_worker_started"):
        threading.Thread(
            target=process_transcription_queue,
            args=(group_id, api_key),
            daemon=True
        ).start()
        sessions[group_id]["transcription_worker_started"] = True

    return jsonify({"session_id": group_id})

# ------------------------------
# Fetch Chunk Endpoint
# ------------------------------

@app.route("/fetch_chunk", methods=["POST"])
def fetch_chunk():
    data = request.get_json()
    group_id = data.get("session_id")
    chunk_number = data.get("chunk_number")
    if not group_id or group_id not in sessions:
        return jsonify({"error": "Invalid or missing session_id"}), 400
    try:
        chunk_number = int(chunk_number)
    except Exception:
        return jsonify({"error": "Invalid chunk number"}), 400

    transcript = sessions[group_id].get("chunk_transcripts", {}).get(chunk_number)
    if transcript is not None:
        return jsonify({"transcript": transcript})
    else:
        return jsonify({"error": "Transcript not ready"}), 202

# ------------------------------
# Delete Endpoint for Manual Session Deletion
# ------------------------------

@app.route("/delete", methods=["POST"])
def delete_audio():
    data = request.get_json()
    group_id = data.get("session_id")
    if not group_id or group_id not in sessions:
        return jsonify({"error": "Invalid or missing session_id"}), 400

    group_folder = os.path.join("uploads", group_id)
    if os.path.exists(group_folder):
        for f in os.listdir(group_folder):
            try:
                os.remove(os.path.join(group_folder, f))
            except Exception as e:
                logger.error(f"Error deleting file in group {group_id}: {e}")
        try:
            os.rmdir(group_folder)
        except Exception as e:
            logger.error(f"Error removing group folder {group_id}: {e}")
        sessions.pop(group_id, None)
        return jsonify({"message": "Group deleted successfully"})
    return jsonify({"error": "Group folder not found"}), 404

# ------------------------------
# Transcription Functions (with Decryption, sox Conversion, and Fade-In/Out)
# ------------------------------

def transcribe_chunk_sync(chunk_info, api_key, chunk_number, device_token):
    """
    Synchronously decrypts and transcribes an audio chunk using the OpenAI Whisper API.
    Converts the audio to mono, 16kHz, 16-bit PCM WAV using sox and applies a linear fade-in
    over the first 1 second and a fade-out over the last 1 second.
    Returns the transcript (or an error message).
    """
    file_path = chunk_info["path"]
    iv = chunk_info["iv"]
    salt = chunk_info["salt"]

    try:
        # Read the encrypted file
        with open(file_path, "rb") as f:
            encrypted_data = f.read()
        # Decrypt the audio data using the provided salt and iv
        decrypted_data = decrypt_audio_file(encrypted_data, salt, iv, api_key, device_token)
        
        # Write decrypted data to a temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_in:
            temp_in.write(decrypted_data)
            temp_in.flush()
            input_path = temp_in.name

        # Convert audio to mono, 16kHz, 16-bit PCM using sox
        converted_path = input_path + "_converted.wav"
        sox_convert_cmd = [
            "sox",
            input_path,
            "-r", "16000",
            "-b", "16",
            "-e", "signed-integer",
            "-c", "1",
            converted_path
        ]
        subprocess.run(sox_convert_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Apply a linear fade-in of 1 second and fade-out of 1 second using sox's fade effect.
        final_output_path = input_path + "_final.wav"
        sox_fade_cmd = [
            "sox",
            converted_path,
            final_output_path,
            "fade", "l", "0,5", "0", "0,5"
        ]
        subprocess.run(sox_fade_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Read the final output file
        with open(final_output_path, "rb") as f:
            final_data = f.read()
        
        # Clean up temporary files
        os.remove(input_path)
        os.remove(converted_path)
        os.remove(final_output_path)

        # Set the content type to WAV
        content_type = "audio/wav"
        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": (os.path.basename(file_path), final_data, content_type)},
            data={"model": "gpt-4o-transcribe"}
        )
        if response.status_code != 200:
            logger.error(f"OpenAI API error on chunk {chunk_number}: {response.text}")
            transcript = f"[Error transcribing chunk {chunk_number}]"
        else:
            result = response.json()
            transcript = result.get("text", "")
    except Exception as e:
        logger.error(f"Exception transcribing chunk {chunk_number}: {e}")
        transcript = f"[Exception transcribing chunk {chunk_number}]"
    logger.info(f"Stored transcript for chunk {chunk_number}")
    return transcript

def process_transcription_queue(group_id, api_key):
    q = sessions[group_id]["transcription_queue"]
    device_token = sessions[group_id].get("device_token", "")
    while True:
        try:
            item = q.get(timeout=30)
        except queue.Empty:
            if sessions[group_id].get("last_chunk_received", False):
                break
            else:
                continue
        chunk_number, chunk_info, is_last = item
        transcript = transcribe_chunk_sync(chunk_info, api_key, chunk_number, device_token)
        sessions[group_id].setdefault("chunk_transcripts", {})[chunk_number] = transcript
        schedule_session_deletion(group_id)
        if is_last:
            sessions[group_id]["last_chunk_received"] = True
        q.task_done()
        if sessions[group_id].get("last_chunk_received") and q.empty():
            break
    logger.info(f"Finished processing transcription queue for group {group_id}")

# ------------------------------
# Main Application Entry Point
# ------------------------------

if __name__ == "__main__":
    # Use the port from the environment variable if available, otherwise default to 8080.
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
