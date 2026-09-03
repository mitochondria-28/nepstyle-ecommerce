"""
Phase 2 — Full vector index seeding script.

Fetches all products, reviews, categories, and store policies from MariaDB,
generates Gemini text-embedding-004 embeddings, and upserts into Qdrant.

Run locally:
  cd ai_service
  source .venv/bin/activate
  python -m scripts.seed_vectors

Run on Railway shell (after Phase 2 is deployed):
  python -m scripts.seed_vectors

Progress is printed to stdout. Failed items are logged and skipped
so a single API error doesn't abort the entire seeding process.

Idempotent: safe to run multiple times — Qdrant upsert overwrites
existing vectors with the same point ID.
"""
import sys
import os
import time
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("seed_vectors")


def _progress(label: str, current: int, total: int, errors: int) -> None:
    pct = int(current / total * 100) if total else 0
    bar = "█" * (pct // 5) + "░" * (20 - pct // 5)
    print(f"\r  {label} [{bar}] {current}/{total} ({pct}%)  errors={errors}", end="", flush=True)


def seed() -> None:
    # ── Imports (after sys.path is set) ─────────────────────────
    from config import settings
    from qdrant_setup import ensure_collection, get_qdrant
    import db
    from services.indexer import (
        index_product,
        index_review,
        index_category,
        index_policy,
    )
    from services.policies import get_all_policies

    print("\n" + "═" * 60)
    print("  NepStyle AI — Vector Index Seeding")
    print("═" * 60)
    print(f"  DB        : {settings.db_host}:{settings.db_port}/{settings.db_name}")
    print(f"  Qdrant    : {settings.qdrant_url}")
    print(f"  Collection: {settings.qdrant_collection}")
    print(f"  Embed dim : {settings.embedding_dim}")
    print("═" * 60 + "\n")

    # ── Step 0: Ensure Qdrant collection exists ──────────────────
    print("[0/4] Ensuring Qdrant collection exists...")
    ensure_collection()
    print("      ✓ Collection ready\n")

    t_start = time.perf_counter()
    total_indexed = 0
    total_errors = 0

    # ── Step 1: Products ─────────────────────────────────────────
    print("[1/4] Indexing products...")
    products = db.query_all("SELECT * FROM products")
    p_errors = 0
    for i, product in enumerate(products, 1):
        try:
            index_product(dict(product))
            total_indexed += 1
        except Exception as e:
            p_errors += 1
            total_errors += 1
            logger.warning(f"Failed product {product.get('product_id')}: {e}")
        _progress("Products", i, len(products), p_errors)
        time.sleep(0.05)  # gentle rate limiting for Gemini embedding API
    print(f"\n      ✓ {len(products) - p_errors}/{len(products)} products indexed ({p_errors} errors)\n")

    # ── Step 2: Categories ───────────────────────────────────────
    print("[2/4] Indexing categories...")
    categories = db.query_all("SELECT * FROM categories")
    c_errors = 0
    for i, category in enumerate(categories, 1):
        try:
            index_category(dict(category))
            total_indexed += 1
        except Exception as e:
            c_errors += 1
            total_errors += 1
            logger.warning(f"Failed category {category.get('category_id')}: {e}")
        _progress("Categories", i, len(categories), c_errors)
        time.sleep(0.05)
    print(f"\n      ✓ {len(categories) - c_errors}/{len(categories)} categories indexed ({c_errors} errors)\n")

    # ── Step 3: Reviews (with product name join) ─────────────────
    print("[3/4] Indexing reviews...")
    reviews = db.query_all(
        """
        SELECT r.*, p.product_name
        FROM reviews r
        JOIN products p ON r.product_id = p.product_id
        """
    )
    r_errors = 0
    for i, review in enumerate(reviews, 1):
        try:
            review_dict = dict(review)
            index_review(review_dict, product_name=review_dict.get("product_name", ""))
            total_indexed += 1
        except Exception as e:
            r_errors += 1
            total_errors += 1
            logger.warning(f"Failed review {review.get('review_id')}: {e}")
        _progress("Reviews", i, len(reviews), r_errors)
        time.sleep(0.05)
    print(f"\n      ✓ {len(reviews) - r_errors}/{len(reviews)} reviews indexed ({r_errors} errors)\n")

    # ── Step 4: Store policies ───────────────────────────────────
    print("[4/4] Indexing store policies...")
    policies = get_all_policies()
    pol_errors = 0
    for i, pol in enumerate(policies, 1):
        try:
            index_policy(pol["slug"], pol["name"], pol["content"])
            total_indexed += 1
        except Exception as e:
            pol_errors += 1
            total_errors += 1
            logger.warning(f"Failed policy '{pol['slug']}': {e}")
        _progress("Policies", i, len(policies), pol_errors)
        time.sleep(0.1)
    print(f"\n      ✓ {len(policies) - pol_errors}/{len(policies)} policies indexed ({pol_errors} errors)\n")

    # ── Summary ──────────────────────────────────────────────────
    elapsed = round(time.perf_counter() - t_start, 1)

    # Get collection info
    try:
        info = get_qdrant().get_collection(settings.qdrant_collection)
        vector_count = info.points_count
    except Exception:
        vector_count = "unknown"

    print("═" * 60)
    print(f"  Seeding complete in {elapsed}s")
    print(f"  Documents indexed : {total_indexed}")
    print(f"  Errors skipped    : {total_errors}")
    print(f"  Vectors in Qdrant : {vector_count}")
    print("═" * 60 + "\n")

    if total_errors > 0:
        print(f"  ⚠  {total_errors} items failed. Check logs above for details.")
        print("     Re-run the script to retry — upsert is idempotent.\n")
    else:
        print("  ✅ All documents indexed successfully!\n")


if __name__ == "__main__":
    seed()
