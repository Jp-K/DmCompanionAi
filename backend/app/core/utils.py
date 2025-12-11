"""
Utility functions for vectorizing and loading D&D data into Qdrant.

Uses SentenceTransformer for local embeddings (no external API required).
"""
import json
import logging
import uuid
from pathlib import Path
from typing import Literal

from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer

from app.core.config import settings

logger = logging.getLogger(__name__)

# Data source path - relative to this file
DATA_SOURCE_PATH = Path(__file__).parent.parent / "data_source"

# Default embedding model - good balance between speed and quality
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Singleton for encoder
_encoder_instance: SentenceTransformer | None = None


def get_encoder() -> SentenceTransformer:
    """Get SentenceTransformer encoder instance (singleton)."""
    global _encoder_instance
    if _encoder_instance is None:
        logger.info("Loading SentenceTransformer model: %s", EMBEDDING_MODEL)
        _encoder_instance = SentenceTransformer(EMBEDDING_MODEL)
    return _encoder_instance


def get_qdrant_client() -> QdrantClient:
    """Get Qdrant client instance."""
    if not settings.VECTOR_DB_URL:
        raise ValueError("VECTOR_DB_URL is not set")
    return QdrantClient(url=settings.VECTOR_DB_URL)


def generate_embedding(text: str, encoder: SentenceTransformer | None = None) -> list[float]:
    """
    Generate an embedding vector for the given text using SentenceTransformer.
    
    Args:
        text: The text to embed
        encoder: Optional SentenceTransformer instance
        
    Returns:
        List of floats representing the embedding vector
    """
    if encoder is None:
        encoder = get_encoder()
    
    return encoder.encode(text).tolist()


def load_spells() -> list[dict]:
    """Load spells from the JSON file."""
    spells_file = DATA_SOURCE_PATH / "spells-minimal.json"
    if not spells_file.exists():
        logger.warning("Spells file not found: %s", spells_file)
        return []
    
    with open(spells_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    return data.get("spells", [])


def load_rules() -> list[dict]:
    """Load rules from the JSON file."""
    rules_file = DATA_SOURCE_PATH / "rules-minimal.json"
    if not rules_file.exists():
        logger.warning("Rules file not found: %s", rules_file)
        return []
    
    with open(rules_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Flatten the rules structure
    rules = []
    for section_name, section_data in data.items():
        if isinstance(section_data, dict) and "content" in section_data:
            for rule in section_data.get("content", []):
                rule["section"] = section_name
                rules.append(rule)
    
    return rules


def create_spell_document(spell: dict) -> str:
    """
    Create a text document from a spell for embedding.
    
    Args:
        spell: Spell dictionary
        
    Returns:
        Formatted text for embedding
    """
    parts = [
        f"Spell: {spell.get('title', 'Unknown')}",
        f"Source: {spell.get('source', 'Unknown')} (Page {spell.get('page', 'N/A')})",
        f"Type: {spell.get('type', 'Spell')}",
        "",
        spell.get("description", ""),
    ]
    return "\n".join(parts)


def create_rule_document(rule: dict) -> str:
    """
    Create a text document from a rule for embedding.
    
    Args:
        rule: Rule dictionary
        
    Returns:
        Formatted text for embedding
    """
    parts = [
        f"Rule: {rule.get('title', 'Unknown')}",
        f"Section: {rule.get('section', 'General')}",
        f"Source: {rule.get('source', 'Unknown')} (Page {rule.get('page', 'N/A')})",
        f"Type: {rule.get('type', 'Rule')}",
        "",
        rule.get("description", ""),
    ]
    return "\n".join(parts)


def vectorize_and_store_data(
    data_type: Literal["spells", "rules", "all"] = "all",
    batch_size: int = 50,
    clear_existing: bool = False,
) -> dict:
    """
    Vectorize D&D data and store it in Qdrant.
    
    Args:
        data_type: Type of data to process ("spells", "rules", or "all")
        batch_size: Number of items to process in each batch
        clear_existing: If True, delete existing points of the same type before inserting
        
    Returns:
        Dictionary with counts of processed items
    """
    encoder = get_encoder()
    qdrant_client = get_qdrant_client()
    
    results = {"spells": 0, "rules": 0, "errors": []}
    
    # Process spells
    if data_type in ("spells", "all"):
        spells = load_spells()
        logger.info("Processing %d spells...", len(spells))
        
        if clear_existing:
            try:
                qdrant_client.delete(
                    collection_name=settings.VECTOR_DB_COLLECTION,
                    points_selector=models.Filter(
                        must=[models.FieldCondition(key="category", match=models.MatchValue(value="spell"))]
                    ),
                )
                logger.info("Cleared existing spells from collection")
            except Exception as e:
                logger.warning("Failed to clear existing spells: %s", e)
        
        points = []
        for i, spell in enumerate(spells):
            try:
                document = create_spell_document(spell)
                embedding = encoder.encode(document).tolist()
                
                point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "category": "spell",
                        "title": spell.get("title", "Unknown"),
                        "source": spell.get("source", "Unknown"),
                        "page": spell.get("page"),
                        "type": spell.get("type", "Spell"),
                        "description": spell.get("description", ""),
                        "document": document,
                    },
                )
                points.append(point)
                
                # Batch upsert
                if len(points) >= batch_size:
                    qdrant_client.upload_points(
                        collection_name=settings.VECTOR_DB_COLLECTION,
                        points=points,
                    )
                    results["spells"] += len(points)
                    logger.info("Inserted %d spells (total: %d)", len(points), results["spells"])
                    points = []
                    
            except Exception as e:
                error_msg = f"Error processing spell '{spell.get('title', 'Unknown')}': {e}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        # Insert remaining points
        if points:
            qdrant_client.upload_points(
                collection_name=settings.VECTOR_DB_COLLECTION,
                points=points,
            )
            results["spells"] += len(points)
            logger.info("Inserted final %d spells (total: %d)", len(points), results["spells"])
    
    # Process rules
    if data_type in ("rules", "all"):
        rules = load_rules()
        logger.info("Processing %d rules...", len(rules))
        
        if clear_existing:
            try:
                qdrant_client.delete(
                    collection_name=settings.VECTOR_DB_COLLECTION,
                    points_selector=models.Filter(
                        must=[models.FieldCondition(key="category", match=models.MatchValue(value="rule"))]
                    ),
                )
                logger.info("Cleared existing rules from collection")
            except Exception as e:
                logger.warning("Failed to clear existing rules: %s", e)
        
        points = []
        for i, rule in enumerate(rules):
            try:
                document = create_rule_document(rule)
                embedding = encoder.encode(document).tolist()
                
                point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "category": "rule",
                        "title": rule.get("title", "Unknown"),
                        "section": rule.get("section", "General"),
                        "source": rule.get("source", "Unknown"),
                        "page": rule.get("page"),
                        "type": rule.get("type", "Rule"),
                        "description": rule.get("description", ""),
                        "document": document,
                    },
                )
                points.append(point)
                
                # Batch upsert
                if len(points) >= batch_size:
                    qdrant_client.upload_points(
                        collection_name=settings.VECTOR_DB_COLLECTION,
                        points=points,
                    )
                    results["rules"] += len(points)
                    logger.info("Inserted %d rules (total: %d)", len(points), results["rules"])
                    points = []
                    
            except Exception as e:
                error_msg = f"Error processing rule '{rule.get('title', 'Unknown')}': {e}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        # Insert remaining points
        if points:
            qdrant_client.upload_points(
                collection_name=settings.VECTOR_DB_COLLECTION,
                points=points,
            )
            results["rules"] += len(points)
            logger.info("Inserted final %d rules (total: %d)", len(points), results["rules"])
    
    logger.info(
        "Vectorization complete! Spells: %d, Rules: %d, Errors: %d",
        results["spells"],
        results["rules"],
        len(results["errors"]),
    )
    
    return results


def search_vector_db(
    query: str,
    category: Literal["spell", "rule"] | None = None,
    limit: int = 5,
) -> list[dict]:
    """
    Search the vector database for similar content.
    
    Args:
        query: The search query text
        category: Optional category filter ("spell" or "rule")
        limit: Maximum number of results to return
        
    Returns:
        List of matching documents with scores
    """
    encoder = get_encoder()
    qdrant_client = get_qdrant_client()
    
    # Generate embedding for the query
    query_embedding = encoder.encode(query).tolist()
    
    # Build filter if category is specified
    query_filter = None
    if category:
        query_filter = models.Filter(
            must=[models.FieldCondition(key="category", match=models.MatchValue(value=category))]
        )
    
    # Search using query_points
    results = qdrant_client.query_points(
        collection_name=settings.VECTOR_DB_COLLECTION,
        query=query_embedding,
        query_filter=query_filter,
        limit=limit,
    )
    
    return [
        {
            "score": hit.score,
            "category": hit.payload.get("category"),
            "title": hit.payload.get("title"),
            "description": hit.payload.get("description"),
            "source": hit.payload.get("source"),
            "page": hit.payload.get("page"),
            "document": hit.payload.get("document"),
        }
        for hit in results.points
    ]


def get_collection_stats() -> dict:
    """
    Get statistics about the vector collection.
    
    Returns:
        Dictionary with collection statistics
    """
    qdrant_client = get_qdrant_client()
    
    try:
        collection_info = qdrant_client.get_collection(settings.VECTOR_DB_COLLECTION)
        
        # Count by category
        spell_count = qdrant_client.count(
            collection_name=settings.VECTOR_DB_COLLECTION,
            count_filter=models.Filter(
                must=[models.FieldCondition(key="category", match=models.MatchValue(value="spell"))]
            ),
        ).count
        
        rule_count = qdrant_client.count(
            collection_name=settings.VECTOR_DB_COLLECTION,
            count_filter=models.Filter(
                must=[models.FieldCondition(key="category", match=models.MatchValue(value="rule"))]
            ),
        ).count
        
        return {
            "total_points": collection_info.points_count,
            "spells": spell_count,
            "rules": rule_count,
            "status": collection_info.status,
            "vectors_config": str(collection_info.config.params.vectors),
        }
    except Exception as e:
        logger.error("Failed to get collection stats: %s", e)
        return {"error": str(e)}


# CLI entry point for running from command line
if __name__ == "__main__":
    import sys
    
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    
    if len(sys.argv) > 1:
        data_type = sys.argv[1]
        if data_type not in ("spells", "rules", "all"):
            print(f"Invalid data type: {data_type}. Use 'spells', 'rules', or 'all'")
            sys.exit(1)
    else:
        data_type = "all"
    
    clear = "--clear" in sys.argv
    
    print(f"Starting vectorization for: {data_type}")
    if clear:
        print("Will clear existing data first")
    
    results = vectorize_and_store_data(data_type=data_type, clear_existing=clear)
    
    print("\n=== Results ===")
    print(f"Spells processed: {results['spells']}")
    print(f"Rules processed: {results['rules']}")
    print(f"Errors: {len(results['errors'])}")
    
    if results["errors"]:
        print("\n=== Errors ===")
        for error in results["errors"][:10]:
            print(f"  - {error}")
        if len(results["errors"]) > 10:
            print(f"  ... and {len(results['errors']) - 10} more")
    
    print("\n=== Collection Stats ===")
    stats = get_collection_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")
