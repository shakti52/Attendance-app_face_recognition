"""
Face recognition service using InsightFace (RetinaFace detector + ArcFace embedder).

Flow:
  register  → detect face → extract 512-d ArcFace embedding → store in DB as JSON
  verify    → detect face → extract embedding → cosine similarity vs stored embedding
"""

import base64
import json
import logging
import os
from io import BytesIO
from typing import Optional, Tuple

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Lazy-load InsightFace model to avoid slow startup on import
_app = None


def _get_insight_app():
    global _app
    if _app is None:
        try:
            import insightface
            from insightface.app import FaceAnalysis
            _app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
            _app.prepare(ctx_id=0, det_size=(640, 640))
            logger.info("InsightFace model loaded.")
        except Exception as e:
            logger.error(f"Failed to load InsightFace: {e}")
            raise
    return _app


def decode_image(image_base64: str) -> np.ndarray:
    """Decode a base64 image string to an OpenCV BGR image."""
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    img_bytes = base64.b64decode(image_base64)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img


def extract_embedding(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Detect the largest face in the image and return its ArcFace embedding.
    Returns None if no face is detected.
    """
    app = _get_insight_app()
    faces = app.get(image)
    if not faces:
        return None
    # Pick the largest face by bounding-box area
    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    return face.embedding  # shape (512,)


def embedding_to_json(embedding: np.ndarray) -> str:
    return json.dumps(embedding.tolist())


def json_to_embedding(json_str: str) -> np.ndarray:
    return np.array(json.loads(json_str), dtype=np.float32)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def register_face(image_base64: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Register a face from a base64 image.
    Returns (embedding_json, error_message).
    """
    try:
        img = decode_image(image_base64)
        embedding = extract_embedding(img)
        if embedding is None:
            return None, "No face detected. Please ensure your face is clearly visible."
        return embedding_to_json(embedding), None
    except Exception as e:
        logger.error(f"Face registration error: {e}")
        return None, "Face processing failed. Please try again."


def verify_face(
    image_base64: str,
    stored_embedding_json: str,
    threshold: float = 0.4,
) -> Tuple[bool, float, Optional[str]]:
    """
    Verify a live face against a stored embedding.
    Returns (match: bool, similarity: float, error: Optional[str]).
    Higher cosine similarity = more similar (range roughly 0–1).
    InsightFace ArcFace threshold ≈ 0.4 (lower is stricter).
    """
    try:
        img = decode_image(image_base64)
        live_embedding = extract_embedding(img)
        if live_embedding is None:
            return False, 0.0, "No face detected in frame."

        stored_embedding = json_to_embedding(stored_embedding_json)
        similarity = cosine_similarity(live_embedding, stored_embedding)
        matched = similarity >= threshold
        return matched, round(similarity, 4), None
    except Exception as e:
        logger.error(f"Face verification error: {e}")
        return False, 0.0, "Face verification failed. Please try again."


def save_face_image(image_base64: str, upload_dir: str, filename: str) -> Optional[str]:
    """Save the face image to disk and return the relative path."""
    try:
        img = decode_image(image_base64)
        os.makedirs(upload_dir, exist_ok=True)
        path = os.path.join(upload_dir, filename)
        cv2.imwrite(path, img)
        return path
    except Exception as e:
        logger.error(f"Failed to save face image: {e}")
        return None
