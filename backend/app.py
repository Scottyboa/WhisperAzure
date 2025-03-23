# app.py (excerpted for clarity; assumes previous logic remains unchanged above)

@app.route("/upload", methods=["POST"])
def upload_audio():
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
    device_token = request.form.get("device_token")
    mime_type = request.form.get("mime_type", "audio/wav")  # ✅ NEW

    missing_fields = []
    for field in ["group_id", "chunk_number", "api_key", "signature", "device_token", "iv", "salt"]:
        if not request.form.get(field):
            missing_fields.append(field)
    if missing_fields:
        return jsonify({"error": "Missing required fields", "fields": missing_fields}), 400

    try:
        chunk_number = int(chunk_number)
    except Exception:
        return jsonify({"error": "Invalid chunk_number"}), 400

    if hash_string(api_key) != api_key_marker:
        return jsonify({"error": "Invalid API key marker"}), 400
    if hash_string(device_token) != device_marker:
        return jsonify({"error": "Invalid device marker"}), 400

    secret = api_key + ":" + device_token
    message = f"upload:{group_id}:{chunk_number}"
    expected_signature = compute_hmac(message, secret)
    if not hmac.compare_digest(expected_signature, signature):
        return jsonify({"error": "Invalid signature"}), 400

    if group_id not in sessions:
        sessions[group_id] = {}
    sessions[group_id]["api_key"] = api_key
    sessions[group_id]["device_token"] = device_token

    if "transcription_queue" not in sessions[group_id]:
        sessions[group_id]["transcription_queue"] = queue.PriorityQueue()

    group_folder = os.path.join("uploads", group_id)
    os.makedirs(group_folder, exist_ok=True)

    original_filename = secure_filename(audio_file.filename)
    if not original_filename:
        original_filename = f"chunk_{chunk_number}.wav"
    else:
        ext = os.path.splitext(original_filename)[1]
        original_filename = f"chunk_{chunk_number}{ext}"
    save_path = os.path.join(group_folder, original_filename)
    audio_file.save(save_path)
    logger.info(f"Received chunk {chunk_number} for group {group_id}, MIME: {mime_type}, stored at {save_path}")  # ✅ Log MIME

    sessions[group_id].setdefault("chunks", {})[chunk_number] = {
        "path": save_path,
        "iv": iv,
        "salt": salt,
        "mime_type": mime_type  # ✅ Store MIME
    }

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


# Inside transcribe_chunk_sync()
def transcribe_chunk_sync(chunk_info, api_key, chunk_number, device_token):
    file_path = chunk_info["path"]
    iv = chunk_info["iv"]
    salt = chunk_info["salt"]
    content_type = chunk_info.get("mime_type", "audio/wav")  # ✅ Use passed MIME type

    try:
        with open(file_path, "rb") as f:
            encrypted_data = f.read()
        decrypted_data = decrypt_audio_file(encrypted_data, salt, iv, api_key, device_token)

        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": (os.path.basename(file_path), decrypted_data, content_type)},
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
