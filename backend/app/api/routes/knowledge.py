"""
API routes for D&D knowledge base (Qdrant vector database).
"""
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.utils import (
    get_collection_stats,
    list_items_by_category,
    scroll_all_items,
    search_vector_db,
)

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


# Response models
class KnowledgeItem(BaseModel):
    """A single knowledge item from the vector database."""
    id: str | None = None
    category: str | None = None
    title: str | None = None
    description: str | None = None
    source: str | None = None
    page: str | int | None = None
    score: float | None = None
    document: str | None = None


class PaginatedResponse(BaseModel):
    """Paginated list response."""
    items: list[KnowledgeItem]
    total: int
    limit: int
    offset: int
    has_more: bool


class ScrollResponse(BaseModel):
    """Scroll-based pagination response."""
    items: list[KnowledgeItem]
    next_offset: str | None = None


class SearchResponse(BaseModel):
    """Search results response."""
    items: list[KnowledgeItem]
    query: str
    category: str | None = None


class StatsResponse(BaseModel):
    """Collection statistics response."""
    total_points: int | None = None
    spells: int | None = None
    rules: int | None = None
    items: int | None = None
    actions: int | None = None
    backgrounds: int | None = None
    deities: int | None = None
    races: int | None = None
    feats: int | None = None
    status: str | None = None
    vectors_config: str | None = None
    error: str | None = None


# Valid categories
CategoryType = Literal["spell", "rule", "item", "action", "background", "deity", "race", "feat"]


@router.get("/stats", response_model=StatsResponse)
def get_stats() -> StatsResponse:
    """
    Get statistics about the knowledge base.
    
    Returns counts for each category and total documents.
    """
    stats = get_collection_stats()
    return StatsResponse(**stats)


@router.get("/list", response_model=PaginatedResponse)
def list_knowledge_items(
    category: CategoryType | None = Query(
        default=None,
        description="Filter by category (spell, rule, item, action, background, deity, race, feat)"
    ),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return (max 100)"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
) -> PaginatedResponse:
    """
    List knowledge items with pagination.
    
    Supports filtering by category and offset-based pagination.
    """
    result = list_items_by_category(category=category, limit=limit, offset=offset)
    
    if "error" in result and result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return PaginatedResponse(
        items=[KnowledgeItem(**item) for item in result["items"]],
        total=result["total"],
        limit=result["limit"],
        offset=result["offset"],
        has_more=result["has_more"],
    )


@router.get("/scroll", response_model=ScrollResponse)
def scroll_knowledge_items(
    category: CategoryType | None = Query(
        default=None,
        description="Filter by category"
    ),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return"),
    offset_id: str | None = Query(default=None, description="Cursor for pagination (from previous response)"),
) -> ScrollResponse:
    """
    Scroll through knowledge items using cursor-based pagination.
    
    More efficient for large datasets. Use the `next_offset` from the response
    as the `offset_id` parameter for the next page.
    """
    result = scroll_all_items(category=category, limit=limit, offset_id=offset_id)
    
    if "error" in result and result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return ScrollResponse(
        items=[KnowledgeItem(**item) for item in result["items"]],
        next_offset=result.get("next_offset"),
    )


@router.get("/search", response_model=SearchResponse)
def search_knowledge(
    q: str = Query(..., min_length=1, description="Search query"),
    category: CategoryType | None = Query(
        default=None,
        description="Filter by category"
    ),
    limit: int = Query(default=5, ge=1, le=20, description="Number of results to return (max 20)"),
) -> SearchResponse:
    """
    Semantic search across the knowledge base.
    
    Uses vector similarity to find the most relevant items for the query.
    Optionally filter by category.
    """
    results = search_vector_db(query=q, category=category, limit=limit)
    return SearchResponse(
        items=[KnowledgeItem(**item) for item in results],
        query=q,
        category=category,
    )


@router.get("/categories")
def list_categories() -> dict:
    """
    List all available categories.
    """
    return {
        "categories": [
            {"value": "spell", "label": "Magias", "label_en": "Spells"},
            {"value": "rule", "label": "Regras", "label_en": "Rules"},
            {"value": "item", "label": "Itens", "label_en": "Items"},
            {"value": "action", "label": "Ações", "label_en": "Actions"},
            {"value": "background", "label": "Antecedentes", "label_en": "Backgrounds"},
            {"value": "deity", "label": "Divindades", "label_en": "Deities"},
            {"value": "race", "label": "Raças", "label_en": "Races"},
            {"value": "feat", "label": "Talentos", "label_en": "Feats"},
        ]
    }
