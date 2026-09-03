"""
Reindex a single product and its reviews.

Usage:
  python -m scripts.reindex_product <product_id>

Safe to run at any time — uses upsert so existing vectors are overwritten.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("reindex_product")


def reindex(product_id: int) -> None:
    import db
    from services.indexer import index_product, index_review

    # Fetch product
    product = db.query_one(
        "SELECT * FROM products WHERE product_id = %s", (product_id,)
    )
    if not product:
        logger.error(f"Product {product_id} not found in database")
        return

    logger.info(f"Reindexing product {product_id}: {product['product_name']}")
    index_product(dict(product))
    logger.info("  ✓ Product vector updated")

    # Fetch and reindex all reviews for this product
    reviews = db.query_all(
        """
        SELECT r.*, p.product_name
        FROM reviews r
        JOIN products p ON r.product_id = p.product_id
        WHERE r.product_id = %s
        """,
        (product_id,),
    )
    for review in reviews:
        review_dict = dict(review)
        index_review(review_dict, product_name=review_dict.get("product_name", ""))
        logger.info(f"  ✓ Review {review_dict['review_id']} updated")

    logger.info(f"Done — {1 + len(reviews)} vectors refreshed for product {product_id}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.reindex_product <product_id>")
        sys.exit(1)
    reindex(int(sys.argv[1]))
