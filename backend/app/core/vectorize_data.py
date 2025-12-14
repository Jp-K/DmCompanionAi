#!/usr/bin/env python3
"""
Script to vectorize D&D data (spells, rules, items, actions, backgrounds, deities, races, feats) and store in Qdrant.

Usage:
    cd backend && python -m app.core.vectorize_data [type] [--clear]
    
    Or from project root:
    cd backend && python -m app.core.vectorize_data all

Types:
    spells, rules, items, actions, backgrounds, deities, races, feats, all

Examples:
    python -m app.core.vectorize_data all             # Vectorize all data
    python -m app.core.vectorize_data spells          # Vectorize only spells
    python -m app.core.vectorize_data items --clear   # Clear and re-vectorize items
    python -m app.core.vectorize_data feats --clear   # Clear and re-vectorize feats
    python -m app.core.vectorize_data all --test      # Vectorize and test search
"""
import sys
import os
from pathlib import Path

# Add parent directory to path for imports when running as script
current_dir = Path(__file__).parent.parent.parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

from app.core.utils import vectorize_and_store_data, get_collection_stats, search_vector_db

VALID_TYPES = ("spells", "rules", "items", "actions", "backgrounds", "deities", "races", "feats", "all")


def main():
    # Parse arguments
    data_type = None
    clear = False
    test_search = False
    
    for arg in sys.argv[1:]:
        if arg in VALID_TYPES:
            data_type = arg
        elif arg == "--clear":
            clear = True
        elif arg == "--test":
            test_search = True
        elif arg in ("--help", "-h"):
            print(__doc__)
            return
    
    print("=" * 50)
    print("D&D Data Vectorization")
    print("=" * 50)
    print(f"Data type: {data_type}")
    print(f"Clear existing: {clear}")
    print()
    
    # Run vectorization
    if data_type:
        results = vectorize_and_store_data(data_type=data_type, clear_existing=clear)
        
        print("\n" + "=" * 50)
        print("Results")
        print("=" * 50)
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
            print("\nErrors encountered:")
            for error in results["errors"][:10]:
                print(f"  - {error}")
            if len(results["errors"]) > 10:
                print(f"  ... and {len(results['errors']) - 10} more")
        
        # Show collection stats
        print("\n" + "=" * 50)
        print("Collection Statistics")
        print("=" * 50)
        stats = get_collection_stats()
        for key, value in stats.items():
            print(f"  {key}: {value}")
    
    # Optional: test search
    if test_search:
        print("\n" + "=" * 50)
        print("Test Search")
        print("=" * 50)
        
        test_queries = [
            ("fireball", "spell"),
            ("attack roll", "rule"),
            ("longsword", "item"),
            ("dash", "action"),
            ("acolyte", "background"),
            ("Tyr", "deity"),
            ("elf", "race"),
            ("great weapon master", "feat"),
            ("healing", None),
        ]
        
        for query, category in test_queries:
            print(f"\nQuery: '{query}' (category: {category or 'any'})")
            results = search_vector_db(query, category=category, limit=3)
            for i, result in enumerate(results, 1):
                print(f"  {i}. [{result['category']}] {result['title']} (score: {result['score']:.4f})")


if __name__ == "__main__":
    main()
