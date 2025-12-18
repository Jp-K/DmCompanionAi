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
    spells_file = DATA_SOURCE_PATH / "spells_combined.json"
    if not spells_file.exists():
        logger.warning("Spells file not found: %s", spells_file)
        return []
    
    with open(spells_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Handle both formats: {"spells": [...]} or direct array [...]
    if isinstance(data, list):
        return data
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


def load_items() -> list[dict]:
    """Load items from both items_base.json and items_hibrido.json."""
    items = []
    
    # Load base items
    base_file = DATA_SOURCE_PATH / "items_base.json"
    if base_file.exists():
        with open(base_file, "r", encoding="utf-8") as f:
            base_items = json.load(f)
            for item in base_items:
                item["item_category"] = "base"
            items.extend(base_items)
        logger.info("Loaded %d base items", len(base_items))
    else:
        logger.warning("Base items file not found: %s", base_file)
    
    # Load hybrid/magic items
    hybrid_file = DATA_SOURCE_PATH / "items_hibrido.json"
    if hybrid_file.exists():
        with open(hybrid_file, "r", encoding="utf-8") as f:
            hybrid_items = json.load(f)
            for item in hybrid_items:
                item["item_category"] = "magic"
            items.extend(hybrid_items)
        logger.info("Loaded %d magic items", len(hybrid_items))
    else:
        logger.warning("Hybrid items file not found: %s", hybrid_file)
    
    return items


def load_actions() -> list[dict]:
    """Load actions from the JSON file."""
    actions_file = DATA_SOURCE_PATH / "actions.json"
    if not actions_file.exists():
        logger.warning("Actions file not found: %s", actions_file)
        return []
    
    with open(actions_file, "r", encoding="utf-8") as f:
        return json.load(f)


def load_backgrounds() -> list[dict]:
    """Load backgrounds from the JSON file."""
    backgrounds_file = DATA_SOURCE_PATH / "backgrounds.json"
    if not backgrounds_file.exists():
        logger.warning("Backgrounds file not found: %s", backgrounds_file)
        return []
    
    with open(backgrounds_file, "r", encoding="utf-8") as f:
        return json.load(f)


def load_deities() -> list[dict]:
    """Load deities from the JSON file."""
    deities_file = DATA_SOURCE_PATH / "deities.json"
    if not deities_file.exists():
        logger.warning("Deities file not found: %s", deities_file)
        return []
    
    with open(deities_file, "r", encoding="utf-8") as f:
        return json.load(f)


def load_races() -> list[dict]:
    """Load races from the JSON file."""
    races_file = DATA_SOURCE_PATH / "races.json"
    if not races_file.exists():
        logger.warning("Races file not found: %s", races_file)
        return []
    
    with open(races_file, "r", encoding="utf-8") as f:
        return json.load(f)


def load_feats() -> list[dict]:
    """Load feats from the JSON file."""
    feats_file = DATA_SOURCE_PATH / "feats.json"
    if not feats_file.exists():
        logger.warning("Feats file not found: %s", feats_file)
        return []
    
    with open(feats_file, "r", encoding="utf-8") as f:
        return json.load(f)


def create_spell_document(spell: dict) -> str:
    """
    Create a text document from a spell for embedding.
    
    Supports both formats:
    - spells-minimal.json: has "title", "description" (pre-formatted)
    - spells_combined.json: has "name", "entries", "level", "school", etc.
    
    Args:
        spell: Spell dictionary
        
    Returns:
        Formatted text for embedding
    """
    # Determine which format we're dealing with
    # spells_combined.json uses "name", spells-minimal.json uses "title"
    if "name" in spell:
        # spells_combined.json format
        name = spell.get("name", "Unknown")
        source = spell.get("source", "Unknown")
        page = spell.get("page", "N/A")
        level = spell.get("level", 0)
        school = spell.get("school", "")
        
        # Map school abbreviations to full names
        school_map = {
            "A": "Abjuration", "C": "Conjuration", "D": "Divination",
            "E": "Enchantment", "V": "Evocation", "I": "Illusion",
            "N": "Necromancy", "T": "Transmutation"
        }
        school_name = school_map.get(school, school)
        
        # Level string
        if level == 0:
            level_str = "Cantrip"
        else:
            ordinal = {1: "1st", 2: "2nd", 3: "3rd"}.get(level, f"{level}th")
            level_str = f"{ordinal}-level"
        
        # Extract description from entries
        description = _extract_entries_text(spell.get("entries") or [])
        
        # Build components string
        components = []
        if spell.get("components.v"):
            components.append("V")
        if spell.get("components.s"):
            components.append("S")
        components_str = ", ".join(components) if components else ""
        
        # Parse additional info for higher level effects - handle None case
        additional_info = spell.get("additionalInfo")
        if additional_info is None:
            additional_info = {}
        elif isinstance(additional_info, str):
            try:
                additional_info = json.loads(additional_info)
            except json.JSONDecodeError:
                additional_info = {}
        
        higher_level = ""
        if additional_info.get("entriesHigherLevel"):
            higher_level = _extract_entries_text(additional_info["entriesHigherLevel"])
        
        # Get duration
        duration_info = spell.get("duration", [])
        if duration_info and isinstance(duration_info, list) and len(duration_info) > 0:
            dur = duration_info[0]
            if dur.get("type") == "instant":
                duration_str = "Instantaneous"
            elif dur.get("type") == "timed":
                dur_detail = dur.get("duration", {})
                amount = dur_detail.get("amount", 1)
                unit = dur_detail.get("type", "round")
                concentration = " (Concentration)" if dur.get("concentration") else ""
                duration_str = f"{amount} {unit}{concentration}"
            else:
                duration_str = str(dur.get("type", "Unknown"))
        else:
            duration_str = "Unknown"
        
        # Get casting time
        time_info = spell.get("time", [])
        if time_info and isinstance(time_info, list) and len(time_info) > 0:
            time = time_info[0]
            time_str = f"{time.get('number', 1)} {time.get('unit', 'action')}"
        else:
            time_str = "1 action"
        
        # Get range
        range_type = spell.get("range.type", "")
        range_dist = spell.get("range.distance.type", "")
        range_amount = spell.get("range.distance.amount", "")
        if range_dist == "self":
            range_str = "Self"
        elif range_dist == "touch":
            range_str = "Touch"
        elif range_amount:
            range_str = f"{int(range_amount)} feet"
        else:
            range_str = range_dist or "Unknown"
        
        parts = [
            f"Spell: {name}",
            f"Source: {source} (Page {page})",
            f"Level: {level_str} {school_name}",
            f"Casting Time: {time_str}",
            f"Range: {range_str}",
            f"Duration: {duration_str}",
        ]
        
        if components_str:
            parts.append(f"Components: {components_str}")
        
        parts.append("")
        parts.append(description)
        
        if higher_level:
            parts.append("")
            parts.append(f"At Higher Levels: {higher_level}")
        
        return "\n".join(parts)
    else:
        # spells-minimal.json format (original)
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


def create_item_document(item: dict) -> str:
    """
    Create a text document from an item for embedding.
    
    Args:
        item: Item dictionary
        
    Returns:
        Formatted text for embedding
    """
    # Get entries/description - handle None case
    entries = item.get("entries") or []
    if isinstance(entries, list):
        description = " ".join(str(e) for e in entries if isinstance(e, str))
    else:
        description = str(entries) if entries else ""
    
    # Parse additional info if present - handle None case
    additional_info = item.get("additionalInfo")
    if additional_info is None:
        additional_info = {}
    elif isinstance(additional_info, str):
        try:
            additional_info = json.loads(additional_info)
        except json.JSONDecodeError:
            additional_info = {}
    
    parts = [
        f"Item: {item.get('name', 'Unknown')}",
        f"Source: {item.get('source', 'Unknown')} (Page {item.get('page', 'N/A')})",
        f"Rarity: {item.get('rarity', 'none')}",
        f"Type: {item.get('type', 'item')}",
    ]
    
    # Add attunement requirement if present
    req_attune = additional_info.get("reqAttune")
    if req_attune:
        parts.append(f"Attunement: {req_attune}")
    
    # Add weight if present
    weight = item.get("weight")
    if weight:
        parts.append(f"Weight: {weight} lb")
    
    # Add value if present
    value = item.get("value")
    if value:
        parts.append(f"Value: {value} cp")
    
    parts.append("")
    parts.append(description)
    
    return "\n".join(parts)


def _extract_entries_text(entries: list | str | None) -> str:
    """Extract text content from entries field (common in 5etools JSON)."""
    if not entries:
        return ""
    if isinstance(entries, str):
        return entries
    if isinstance(entries, list):
        texts = []
        for entry in entries:
            if isinstance(entry, str):
                texts.append(entry)
            elif isinstance(entry, dict):
                # Handle nested entries
                if "entries" in entry:
                    texts.append(_extract_entries_text(entry["entries"]))
                if "name" in entry:
                    texts.append(entry["name"])
        return " ".join(texts)
    return ""


def create_action_document(action: dict) -> str:
    """Create a text document from an action for embedding."""
    description = _extract_entries_text(action.get("entries") or [])
    
    # Get action time - handle None case
    time_info = action.get("time") or []
    if time_info and isinstance(time_info, list) and len(time_info) > 0:
        time_str = f"{time_info[0].get('number', 1)} {time_info[0].get('unit', 'action')}"
    else:
        time_str = "varies"
    
    parts = [
        f"Action: {action.get('name', 'Unknown')}",
        f"Source: {action.get('source', 'Unknown')} (Page {action.get('page', 'N/A')})",
        f"Time: {time_str}",
        "",
        description,
    ]
    return "\n".join(parts)


def create_background_document(background: dict) -> str:
    """Create a text document from a background for embedding."""
    description = _extract_entries_text(background.get("entries") or [])
    
    # Get skill proficiencies - handle None case
    skill_profs = background.get("skillProficiencies") or []
    skills = []
    if skill_profs and isinstance(skill_profs, list):
        for sp in skill_profs:
            if isinstance(sp, dict):
                skills.extend([k for k, v in sp.items() if v is True])
    
    parts = [
        f"Background: {background.get('name', 'Unknown')}",
        f"Source: {background.get('source', 'Unknown')} (Page {background.get('page', 'N/A')})",
    ]
    
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")
    
    parts.append("")
    parts.append(description)
    
    return "\n".join(parts)


def create_deity_document(deity: dict) -> str:
    """Create a text document from a deity for embedding."""
    # Parse additional info - handle None case
    additional_info = deity.get("additionalInfo")
    if additional_info is None:
        additional_info = {}
    elif isinstance(additional_info, str):
        try:
            additional_info = json.loads(additional_info)
        except json.JSONDecodeError:
            additional_info = {}
    
    description = _extract_entries_text(additional_info.get("entries", []))
    
    # Handle None values for alignment and domains
    alignment = deity.get("alignment") or []
    alignment_str = "".join(alignment) if alignment else "Unknown"
    
    domains = deity.get("domains") or []
    domains_str = ", ".join(domains) if domains else "None"
    
    parts = [
        f"Deity: {deity.get('name', 'Unknown')}",
        f"Source: {deity.get('source', 'Unknown')} (Page {deity.get('page', 'N/A')})",
        f"Pantheon: {deity.get('pantheon', 'Unknown')}",
        f"Alignment: {alignment_str}",
        f"Domains: {domains_str}",
        f"Symbol: {deity.get('symbol', 'Unknown')}",
    ]
    
    if deity.get("title"):
        parts.append(f"Title: {deity.get('title')}")
    
    if additional_info.get("province"):
        parts.append(f"Province: {additional_info.get('province')}")
    
    parts.append("")
    parts.append(description)
    
    return "\n".join(parts)


def create_race_document(race: dict) -> str:
    """Create a text document from a race for embedding."""
    description = _extract_entries_text(race.get("entries") or [])
    
    # Parse additional info - handle None case
    additional_info = race.get("additionalInfo")
    if additional_info is None:
        additional_info = {}
    elif isinstance(additional_info, str):
        try:
            additional_info = json.loads(additional_info)
        except json.JSONDecodeError:
            additional_info = {}
    
    size = race.get("size") or []
    size_str = ", ".join(size) if size else "Medium"
    
    parts = [
        f"Race: {race.get('name', 'Unknown')}",
        f"Source: {race.get('source', 'Unknown')} (Page {race.get('page', 'N/A')})",
        f"Size: {size_str}",
    ]
    
    # Add speed if present
    speed = additional_info.get("speed.walk") or race.get("speed")
    if speed:
        parts.append(f"Speed: {speed} ft")
    
    # Add ability scores if present
    abilities = additional_info.get("ability", [])
    if abilities and isinstance(abilities, list) and len(abilities) > 0:
        ability_strs = []
        for ab in abilities:
            if isinstance(ab, dict):
                ability_strs.extend([f"{k.upper()} +{v}" for k, v in ab.items()])
        if ability_strs:
            parts.append(f"Abilities: {', '.join(ability_strs)}")
    
    parts.append("")
    parts.append(description)
    
    return "\n".join(parts)


def create_feat_document(feat: dict) -> str:
    """Create a text document from a feat for embedding."""
    description = _extract_entries_text(feat.get("entries") or [])
    
    # Get prerequisites - handle None case
    prereqs = feat.get("prerequisite") or []
    prereq_strs = []
    if prereqs and isinstance(prereqs, list):
        for prereq in prereqs:
            if isinstance(prereq, dict):
                if "level" in prereq:
                    prereq_strs.append(f"Level {prereq['level']}")
                if "ability" in prereq:
                    for ab in prereq["ability"]:
                        if isinstance(ab, dict):
                            prereq_strs.extend([f"{k.upper()} {v}+" for k, v in ab.items()])
                if "spellcasting" in prereq:
                    prereq_strs.append("Spellcasting")
    
    parts = [
        f"Feat: {feat.get('name', 'Unknown')}",
        f"Source: {feat.get('source', 'Unknown')} (Page {feat.get('page', 'N/A')})",
        f"Category: {feat.get('category', 'General')}",
    ]
    
    if prereq_strs:
        parts.append(f"Prerequisites: {', '.join(prereq_strs)}")
    
    parts.append("")
    parts.append(description)
    
    return "\n".join(parts)


def vectorize_and_store_data(
    data_type: Literal["spells", "rules", "items", "actions", "backgrounds", "deities", "races", "feats", "all"] = "all",
    batch_size: int = 50,
    clear_existing: bool = False,
) -> dict:
    """
    Vectorize D&D data and store it in Qdrant.
    
    Args:
        data_type: Type of data to process ("spells", "rules", "items", "actions", "backgrounds", "deities", "races", "feats", or "all")
        batch_size: Number of items to process in each batch
        clear_existing: If True, delete existing points of the same type before inserting
        
    Returns:
        Dictionary with counts of processed items
    """
    encoder = get_encoder()
    qdrant_client = get_qdrant_client()
    
    results = {"spells": 0, "rules": 0, "items": 0, "actions": 0, "backgrounds": 0, "deities": 0, "races": 0, "feats": 0, "errors": []}
    
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
                
                # Handle both formats: spells_combined uses "name", spells-minimal uses "title"
                spell_name = spell.get("name") or spell.get("title", "Unknown")
                spell_level = spell.get("level", 0)
                spell_school = spell.get("school", "")
                
                # Get description based on format
                if "entries" in spell:
                    spell_description = _extract_entries_text(spell.get("entries") or [])
                else:
                    spell_description = spell.get("description", "")
                
                point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "category": "spell",
                        "title": spell_name,
                        "source": spell.get("source", "Unknown"),
                        "page": spell.get("page"),
                        "level": spell_level,
                        "school": spell_school,
                        "type": spell.get("type", "Spell"),
                        "description": spell_description,
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
    
    # Process items
    if data_type in ("items", "all"):
        items = load_items()
        logger.info("Processing %d items...", len(items))
        
        if clear_existing:
            try:
                qdrant_client.delete(
                    collection_name=settings.VECTOR_DB_COLLECTION,
                    points_selector=models.Filter(
                        must=[models.FieldCondition(key="category", match=models.MatchValue(value="item"))]
                    ),
                )
                logger.info("Cleared existing items from collection")
            except Exception as e:
                logger.warning("Failed to clear existing items: %s", e)
        
        points = []
        for i, item in enumerate(items):
            try:
                document = create_item_document(item)
                embedding = encoder.encode(document).tolist()
                
                # Parse additional info for extra fields - handle None case
                additional_info = item.get("additionalInfo")
                if additional_info is None:
                    additional_info = {}
                elif isinstance(additional_info, str):
                    try:
                        additional_info = json.loads(additional_info)
                    except json.JSONDecodeError:
                        additional_info = {}
                
                point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "category": "item",
                        "title": item.get("name", "Unknown"),
                        "source": item.get("source", "Unknown"),
                        "page": item.get("page"),
                        "rarity": item.get("rarity", "none"),
                        "type": item.get("type", "item"),
                        "item_category": item.get("item_category", "base"),
                        "weight": item.get("weight"),
                        "value": item.get("value"),
                        "attunement": additional_info.get("reqAttune") if additional_info else None,
                        "description": " ".join(str(e) for e in (item.get("entries") or []) if isinstance(e, str)),
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
                    results["items"] += len(points)
                    logger.info("Inserted %d items (total: %d)", len(points), results["items"])
                    points = []
                    
            except Exception as e:
                error_msg = f"Error processing item '{item.get('name', 'Unknown')}': {e}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        # Insert remaining points
        if points:
            qdrant_client.upload_points(
                collection_name=settings.VECTOR_DB_COLLECTION,
                points=points,
            )
            results["items"] += len(points)
            logger.info("Inserted final %d items (total: %d)", len(points), results["items"])
    
    # Process actions
    if data_type in ("actions", "all"):
        actions = load_actions()
        logger.info("Processing %d actions...", len(actions))
        
        if clear_existing:
            try:
                qdrant_client.delete(
                    collection_name=settings.VECTOR_DB_COLLECTION,
                    points_selector=models.Filter(
                        must=[models.FieldCondition(key="category", match=models.MatchValue(value="action"))]
                    ),
                )
                logger.info("Cleared existing actions from collection")
            except Exception as e:
                logger.warning("Failed to clear existing actions: %s", e)
        
        points = []
        for i, action in enumerate(actions):
            try:
                document = create_action_document(action)
                embedding = encoder.encode(document).tolist()
                
                point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "category": "action",
                        "title": action.get("name", "Unknown"),
                        "source": action.get("source", "Unknown"),
                        "page": action.get("page"),
                        "description": _extract_entries_text(action.get("entries") or []),
                        "document": document,
                    },
                )
                points.append(point)
                
                if len(points) >= batch_size:
                    qdrant_client.upload_points(
                        collection_name=settings.VECTOR_DB_COLLECTION,
                        points=points,
                    )
                    results["actions"] += len(points)
                    logger.info("Inserted %d actions (total: %d)", len(points), results["actions"])
                    points = []
                    
            except Exception as e:
                error_msg = f"Error processing action '{action.get('name', 'Unknown')}': {e}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        if points:
            qdrant_client.upload_points(
                collection_name=settings.VECTOR_DB_COLLECTION,
                points=points,
            )
            results["actions"] += len(points)
            logger.info("Inserted final %d actions (total: %d)", len(points), results["actions"])
    
    # Process backgrounds
    if data_type in ("backgrounds", "all"):
        backgrounds = load_backgrounds()
        logger.info("Processing %d backgrounds...", len(backgrounds))
        
        if clear_existing:
            try:
                qdrant_client.delete(
                    collection_name=settings.VECTOR_DB_COLLECTION,
                    points_selector=models.Filter(
                        must=[models.FieldCondition(key="category", match=models.MatchValue(value="background"))]
                    ),
                )
                logger.info("Cleared existing backgrounds from collection")
            except Exception as e:
                logger.warning("Failed to clear existing backgrounds: %s", e)
        
        points = []
        for i, background in enumerate(backgrounds):
            try:
                document = create_background_document(background)
                embedding = encoder.encode(document).tolist()
                
                point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "category": "background",
                        "title": background.get("name", "Unknown"),
                        "source": background.get("source", "Unknown"),
                        "page": background.get("page"),
                        "description": _extract_entries_text(background.get("entries") or []),
                        "document": document,
                    },
                )
                points.append(point)
                
                if len(points) >= batch_size:
                    qdrant_client.upload_points(
                        collection_name=settings.VECTOR_DB_COLLECTION,
                        points=points,
                    )
                    results["backgrounds"] += len(points)
                    logger.info("Inserted %d backgrounds (total: %d)", len(points), results["backgrounds"])
                    points = []
                    
            except Exception as e:
                error_msg = f"Error processing background '{background.get('name', 'Unknown')}': {e}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        if points:
            qdrant_client.upload_points(
                collection_name=settings.VECTOR_DB_COLLECTION,
                points=points,
            )
            results["backgrounds"] += len(points)
            logger.info("Inserted final %d backgrounds (total: %d)", len(points), results["backgrounds"])
    
    # Process deities
    if data_type in ("deities", "all"):
        deities = load_deities()
        logger.info("Processing %d deities...", len(deities))
        
        if clear_existing:
            try:
                qdrant_client.delete(
                    collection_name=settings.VECTOR_DB_COLLECTION,
                    points_selector=models.Filter(
                        must=[models.FieldCondition(key="category", match=models.MatchValue(value="deity"))]
                    ),
                )
                logger.info("Cleared existing deities from collection")
            except Exception as e:
                logger.warning("Failed to clear existing deities: %s", e)
        
        points = []
        for i, deity in enumerate(deities):
            try:
                document = create_deity_document(deity)
                embedding = encoder.encode(document).tolist()
                
                # Handle None values for alignment and domains
                alignment = deity.get("alignment") or []
                domains = deity.get("domains") or []
                
                point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "category": "deity",
                        "title": deity.get("name", "Unknown"),
                        "source": deity.get("source", "Unknown"),
                        "page": deity.get("page"),
                        "pantheon": deity.get("pantheon", "Unknown"),
                        "alignment": "".join(alignment) if alignment else "Unknown",
                        "domains": domains,
                        "document": document,
                    },
                )
                points.append(point)
                
                if len(points) >= batch_size:
                    qdrant_client.upload_points(
                        collection_name=settings.VECTOR_DB_COLLECTION,
                        points=points,
                    )
                    results["deities"] += len(points)
                    logger.info("Inserted %d deities (total: %d)", len(points), results["deities"])
                    points = []
                    
            except Exception as e:
                error_msg = f"Error processing deity '{deity.get('name', 'Unknown')}': {e}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        if points:
            qdrant_client.upload_points(
                collection_name=settings.VECTOR_DB_COLLECTION,
                points=points,
            )
            results["deities"] += len(points)
            logger.info("Inserted final %d deities (total: %d)", len(points), results["deities"])
    
    # Process races
    if data_type in ("races", "all"):
        races = load_races()
        logger.info("Processing %d races...", len(races))
        
        if clear_existing:
            try:
                qdrant_client.delete(
                    collection_name=settings.VECTOR_DB_COLLECTION,
                    points_selector=models.Filter(
                        must=[models.FieldCondition(key="category", match=models.MatchValue(value="race"))]
                    ),
                )
                logger.info("Cleared existing races from collection")
            except Exception as e:
                logger.warning("Failed to clear existing races: %s", e)
        
        points = []
        for i, race in enumerate(races):
            try:
                document = create_race_document(race)
                embedding = encoder.encode(document).tolist()
                
                # Handle None values
                size = race.get("size") or ["M"]
                entries = race.get("entries") or []
                
                point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "category": "race",
                        "title": race.get("name", "Unknown"),
                        "source": race.get("source", "Unknown"),
                        "page": race.get("page"),
                        "size": size,
                        "description": _extract_entries_text(entries),
                        "document": document,
                    },
                )
                points.append(point)
                
                if len(points) >= batch_size:
                    qdrant_client.upload_points(
                        collection_name=settings.VECTOR_DB_COLLECTION,
                        points=points,
                    )
                    results["races"] += len(points)
                    logger.info("Inserted %d races (total: %d)", len(points), results["races"])
                    points = []
                    
            except Exception as e:
                error_msg = f"Error processing race '{race.get('name', 'Unknown')}': {e}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        if points:
            qdrant_client.upload_points(
                collection_name=settings.VECTOR_DB_COLLECTION,
                points=points,
            )
            results["races"] += len(points)
            logger.info("Inserted final %d races (total: %d)", len(points), results["races"])
    
    # Process feats
    if data_type in ("feats", "all"):
        feats = load_feats()
        logger.info("Processing %d feats...", len(feats))
        
        if clear_existing:
            try:
                qdrant_client.delete(
                    collection_name=settings.VECTOR_DB_COLLECTION,
                    points_selector=models.Filter(
                        must=[models.FieldCondition(key="category", match=models.MatchValue(value="feat"))]
                    ),
                )
                logger.info("Cleared existing feats from collection")
            except Exception as e:
                logger.warning("Failed to clear existing feats: %s", e)
        
        points = []
        for i, feat in enumerate(feats):
            try:
                document = create_feat_document(feat)
                embedding = encoder.encode(document).tolist()
                
                point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "category": "feat",
                        "title": feat.get("name", "Unknown"),
                        "source": feat.get("source", "Unknown"),
                        "page": feat.get("page"),
                        "feat_category": feat.get("category", "General"),
                        "description": _extract_entries_text(feat.get("entries") or []),
                        "document": document,
                    },
                )
                points.append(point)
                
                if len(points) >= batch_size:
                    qdrant_client.upload_points(
                        collection_name=settings.VECTOR_DB_COLLECTION,
                        points=points,
                    )
                    results["feats"] += len(points)
                    logger.info("Inserted %d feats (total: %d)", len(points), results["feats"])
                    points = []
                    
            except Exception as e:
                error_msg = f"Error processing feat '{feat.get('name', 'Unknown')}': {e}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        if points:
            qdrant_client.upload_points(
                collection_name=settings.VECTOR_DB_COLLECTION,
                points=points,
            )
            results["feats"] += len(points)
            logger.info("Inserted final %d feats (total: %d)", len(points), results["feats"])
    
    logger.info(
        "Vectorization complete! Spells: %d, Rules: %d, Items: %d, Actions: %d, Backgrounds: %d, Deities: %d, Races: %d, Feats: %d, Errors: %d",
        results["spells"],
        results["rules"],
        results["items"],
        results["actions"],
        results["backgrounds"],
        results["deities"],
        results["races"],
        results["feats"],
        len(results["errors"]),
    )
    
    return results


def search_vector_db(
    query: str,
    category: Literal["spell", "rule", "item", "action", "background", "deity", "race", "feat"] | None = None,
    limit: int = 5,
) -> list[dict]:
    """
    Search the vector database for similar content.
    
    Args:
        query: The search query text
        category: Optional category filter ("spell", "rule", "item", "action", "background", "deity", "race", "feat")
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
        
        item_count = qdrant_client.count(
            collection_name=settings.VECTOR_DB_COLLECTION,
            count_filter=models.Filter(
                must=[models.FieldCondition(key="category", match=models.MatchValue(value="item"))]
            ),
        ).count
        
        action_count = qdrant_client.count(
            collection_name=settings.VECTOR_DB_COLLECTION,
            count_filter=models.Filter(
                must=[models.FieldCondition(key="category", match=models.MatchValue(value="action"))]
            ),
        ).count
        
        background_count = qdrant_client.count(
            collection_name=settings.VECTOR_DB_COLLECTION,
            count_filter=models.Filter(
                must=[models.FieldCondition(key="category", match=models.MatchValue(value="background"))]
            ),
        ).count
        
        deity_count = qdrant_client.count(
            collection_name=settings.VECTOR_DB_COLLECTION,
            count_filter=models.Filter(
                must=[models.FieldCondition(key="category", match=models.MatchValue(value="deity"))]
            ),
        ).count
        
        race_count = qdrant_client.count(
            collection_name=settings.VECTOR_DB_COLLECTION,
            count_filter=models.Filter(
                must=[models.FieldCondition(key="category", match=models.MatchValue(value="race"))]
            ),
        ).count
        
        feat_count = qdrant_client.count(
            collection_name=settings.VECTOR_DB_COLLECTION,
            count_filter=models.Filter(
                must=[models.FieldCondition(key="category", match=models.MatchValue(value="feat"))]
            ),
        ).count
        
        return {
            "total_points": collection_info.points_count,
            "spells": spell_count,
            "rules": rule_count,
            "items": item_count,
            "actions": action_count,
            "backgrounds": background_count,
            "deities": deity_count,
            "races": race_count,
            "feats": feat_count,
            "status": collection_info.status,
            "vectors_config": str(collection_info.config.params.vectors),
        }
    except Exception as e:
        logger.error("Failed to get collection stats: %s", e)
        return {"error": str(e)}


def list_items_by_category(
    category: Literal["spell", "rule", "item", "action", "background", "deity", "race", "feat"] | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """
    List items from the vector database by category with pagination.
    
    Args:
        category: Optional category filter
        limit: Maximum number of results to return (default 20, max 100)
        offset: Number of items to skip for pagination
        
    Returns:
        Dictionary with items and pagination info
    """
    qdrant_client = get_qdrant_client()
    
    # Enforce max limit
    limit = min(limit, 100)
    
    # Build filter if category is specified
    query_filter = None
    if category:
        query_filter = models.Filter(
            must=[models.FieldCondition(key="category", match=models.MatchValue(value=category))]
        )
    
    try:
        # Get total count
        if query_filter:
            total = qdrant_client.count(
                collection_name=settings.VECTOR_DB_COLLECTION,
                count_filter=query_filter,
            ).count
        else:
            collection_info = qdrant_client.get_collection(settings.VECTOR_DB_COLLECTION)
            total = collection_info.points_count
        
        # Scroll through points with pagination
        points, next_offset = qdrant_client.scroll(
            collection_name=settings.VECTOR_DB_COLLECTION,
            scroll_filter=query_filter,
            limit=limit,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        
        items = [
            {
                "id": str(point.id),
                "category": point.payload.get("category"),
                "title": point.payload.get("title"),
                "description": point.payload.get("description"),
                "source": point.payload.get("source"),
                "page": point.payload.get("page"),
            }
            for point in points
        ]
        
        return {
            "items": items,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + len(items) < total,
        }
    except Exception as e:
        logger.error("Failed to list items: %s", e)
        return {"error": str(e), "items": [], "total": 0, "limit": limit, "offset": offset, "has_more": False}


def scroll_all_items(
    category: Literal["spell", "rule", "item", "action", "background", "deity", "race", "feat"] | None = None,
    limit: int = 20,
    offset_id: str | None = None,
) -> dict:
    """
    Scroll through items using Qdrant's native offset (more efficient for large datasets).
    
    Args:
        category: Optional category filter
        limit: Maximum number of results to return
        offset_id: The ID to start from (for cursor-based pagination)
        
    Returns:
        Dictionary with items and next offset
    """
    qdrant_client = get_qdrant_client()
    
    # Enforce max limit
    limit = min(limit, 100)
    
    # Build filter if category is specified
    query_filter = None
    if category:
        query_filter = models.Filter(
            must=[models.FieldCondition(key="category", match=models.MatchValue(value=category))]
        )
    
    try:
        # Use scroll for efficient pagination
        points, next_offset = qdrant_client.scroll(
            collection_name=settings.VECTOR_DB_COLLECTION,
            scroll_filter=query_filter,
            limit=limit,
            offset=offset_id,
            with_payload=True,
            with_vectors=False,
        )
        
        items = [
            {
                "id": str(point.id),
                "category": point.payload.get("category"),
                "title": point.payload.get("title"),
                "description": point.payload.get("description"),
                "source": point.payload.get("source"),
                "page": point.payload.get("page"),
            }
            for point in points
        ]
        
        return {
            "items": items,
            "next_offset": str(next_offset) if next_offset else None,
        }
    except Exception as e:
        logger.error("Failed to scroll items: %s", e)
        return {"error": str(e), "items": [], "next_offset": None}


# CLI entry point for running from command line
if __name__ == "__main__":
    import sys
    
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    
    valid_types = ("spells", "rules", "items", "actions", "backgrounds", "deities", "races", "feats", "all")
    
    if len(sys.argv) > 1:
        data_type = sys.argv[1]
        if data_type not in valid_types:
            print(f"Invalid data type: {data_type}. Use one of: {', '.join(valid_types)}")
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
    print(f"Items processed: {results['items']}")
    print(f"Actions processed: {results['actions']}")
    print(f"Backgrounds processed: {results['backgrounds']}")
    print(f"Deities processed: {results['deities']}")
    print(f"Races processed: {results['races']}")
    print(f"Feats processed: {results['feats']}")
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
