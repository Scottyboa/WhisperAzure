import os
import threading
import time
import requests
import queue
import hmac
import hashlib
import base64
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
    
    - salt_b64 and iv_b64 are Base64-encoded strings sent by
