from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance

from app.core.config import settings
import logging

def _map_distance(s: str):
    return {
        "cosine": Distance.COSINE,
        "euclid": Distance.EUCLID,
        "dot": Distance.DOT,
    }[s]

def init_vector_db() -> None:
    """Conecta ao Qdrant e cria a collection se não existir."""
    url = settings.VECTOR_DB_URL
    if not url:
        logging.info("VECTOR_DB_URL not set, skipping vector DB init.")
        return

    try:
        client = QdrantClient(url=url)
        try:
            client.get_collection(collection_name=settings.VECTOR_DB_COLLECTION)
            logging.info("Vector collection exists: %s", settings.VECTOR_DB_COLLECTION)
        except Exception:
            logging.info("Creating vector collection %s", settings.VECTOR_DB_COLLECTION)
            client.create_collection(
                collection_name=settings.VECTOR_DB_COLLECTION,
                vectors_config=VectorParams(
                    size=settings.VECTOR_EMBEDDING_DIM,
                    distance=_map_distance(settings.VECTOR_DISTANCE),
                ),
            )
    except Exception as exc:
        logging.warning("Failed to initialize vector DB (%s): %s", url, exc)