"""
seed_db.py — NepStyle database seeder + Qdrant vector indexer

Usage:
  python seed_db.py [--reindex-only]

  Without --reindex-only: inserts rich product data into MySQL then indexes.
  With    --reindex-only: skips DB insertion, only triggers Qdrant reindex.

Connects to Railway MySQL via the TCP public proxy.
"""
import sys
import time
import argparse
import pymysql
import pymysql.cursors
import requests

# ── Railway public MySQL connection ───────────────────────────────
DB_HOST = "acela.proxy.rlwy.net"
DB_PORT = 29351
DB_USER = "root"
DB_PASS = "BJpsjKbvDXhNmUZraFFIdyGJAlbwkAOQ"
DB_NAME = "railway"

# ── AI service ────────────────────────────────────────────────────
AI_BASE = "https://ai-service-production-7d9f.up.railway.app"
AI_KEY  = "nepstyle_ai_2024_secret"
HEADERS = {"X-AI-Key": AI_KEY}

def connect():
    return pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER,
        password=DB_PASS, database=DB_NAME,
        charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )

# ── Seed data ─────────────────────────────────────────────────────
# Format: (brand_name, category_name, product_name, description, normal_price, sell_price, stock, thumbnail)
PRODUCTS = [
    # ── Men's Clothing (category_id 1) ────────────────────────────
    ("Nike",          "Men's Clothing", "Nike Air Essential Hoodie",
     "Soft-touch fleece hoodie with brushed interior lining. Features a kangaroo pocket, adjustable drawstring hood, and embroidered Swoosh on the chest. Perfect for casual days and light workouts.",
     3200, 2699, 30, "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500&q=80"),

    ("Adidas",        "Men's Clothing", "Adidas Trefoil Graphic Tee",
     "100% cotton crew-neck tee with iconic Trefoil logo screen-print. Relaxed fit, ribbed collar and double-needle stitching for durability. Available in multiple colour-ways.",
     1500, 1199, 50, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80"),

    ("Levi's",        "Men's Clothing", "Levi's 501 Original Fit Jeans",
     "The original straight-leg jean that started it all. Made from 100% heavyweight denim with iconic button fly. Medium stonewash finish with characteristic fading. A wardrobe essential.",
     5500, 4799, 25, "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80"),

    ("H&M",           "Men's Clothing", "H&M Regular Fit Oxford Shirt",
     "Classic Oxford-weave button-down shirt in a relaxed regular fit. Single chest pocket, button-down collar and curved hem. Ideal for smart-casual office and weekend wear.",
     2200, 1799, 40, "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&q=80"),

    ("Zara",          "Men's Clothing", "Zara Premium Wool Blend Overcoat",
     "Tailored overcoat in a soft wool-polyester blend. Notch lapels, double-breasted button closure, welt pockets and fully lined interior. Sharp silhouette for the modern professional.",
     8900, 7499, 15, "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=500&q=80"),

    ("Puma",          "Men's Clothing", "Puma Essential Logo Sweatshirt",
     "Midweight fleece sweatshirt with crewneck collar and ribbed cuffs and hem. Features bold Puma wordmark across the chest. Relaxed fit makes it perfect for lounging or layering.",
     2800, 2299, 35, "https://images.unsplash.com/photo-1611911813383-67769b37a149?w=500&q=80"),

    ("Tommy Hilfiger","Men's Clothing", "Tommy Hilfiger Slim Chino Trousers",
     "Smart slim-fit chinos in stretch-cotton twill. Low-rise, flat-front styling with side slash pockets and back welt pockets. Clean look that moves from desk to dinner effortlessly.",
     4500, 3699, 30, "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80"),

    ("Calvin Klein",  "Men's Clothing", "Calvin Klein Modern Fit Dress Shirt",
     "Non-iron dress shirt in a modern slim silhouette. Spread collar, French placket and single-button cuffs. Wrinkle-resistant fabric keeps you sharp from 9 to 5 and beyond.",
     4200, 3499, 20, "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=500&q=80"),

    ("Reebok",        "Men's Clothing", "Reebok Identity Fleece Joggers",
     "Cosy fleece jogger pants with elasticated waistband and tapered leg. Side slash pockets and rear zip pocket. Reebok Vector logo embroidered on the left hip. Great for gym and recovery.",
     2600, 2099, 40, "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&q=80"),

    ("Under Armour",  "Men's Clothing", "Under Armour Rival Terry Crew",
     "UA Terry fabric sweatshirt with moisture-wicking properties and ultra-soft hand feel. Brushed inner layer traps warmth. Ribbed collar, cuffs and hem. Embossed UA logo at chest.",
     3500, 2899, 25, "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&q=80"),

    # ── Women's Clothing (category_id 2) ─────────────────────────
    ("Zara",          "Women's Clothing", "Zara Satin Slip Midi Skirt",
     "Elegant slip skirt in lustrous satin with a fluid drape. Elasticated waistband, thigh-high slit and bias-cut hem. Effortlessly transitions from day-to-night styling.",
     3800, 3199, 25, "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&q=80"),

    ("H&M",           "Women's Clothing", "H&M Ribbed Knit Cardigan",
     "Relaxed open-front cardigan in a soft ribbed-knit fabric. Long sleeves, dropped shoulders and fine-rib trim. Versatile layering piece that pairs beautifully with jeans or trousers.",
     2800, 2299, 35, "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&q=80"),

    ("Nike",          "Women's Clothing", "Nike Sportswear Essential Jacket",
     "Lightweight woven jacket with a zip-through front and adjustable cuffs. Side-seam pockets and reflective details. A sporty layering piece for runs, gym sessions or everyday errands.",
     4200, 3499, 20, "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80"),

    ("Adidas",        "Women's Clothing", "Adidas All-Day Comfort Leggings",
     "High-waist 7/8 leggings in a soft 4-way stretch fabric with moisture management. Flatlock seams minimise chafing. Inner waistband pocket for keys. Great for yoga, pilates and everyday wear.",
     3000, 2499, 40, "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&q=80"),

    ("Tommy Hilfiger","Women's Clothing", "Tommy Hilfiger Striped Breton Top",
     "Classic Breton-striped top in a relaxed fit. Crew neckline, long sleeves and signature Tommy Hilfiger flag patch. 100% soft cotton jersey. A nautical-inspired wardrobe staple.",
     2500, 2099, 30, "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&q=80"),

    ("Calvin Klein",  "Women's Clothing", "Calvin Klein Cropped Blazer",
     "Minimalist single-button cropped blazer with notch lapels and welt pockets. Boxy tailored silhouette in a ponte fabric that holds its shape. Smart-casual versatility at its best.",
     6500, 5499, 15, "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=500&q=80"),

    ("Levi's",        "Women's Clothing", "Levi's Ribcage Wide Leg Jeans",
     "Ultra high-rise wide leg jeans with a relaxed, vintage-inspired silhouette. Made from rigid denim that softens with wear. Button fly, five-pocket styling and a clean straight leg opening.",
     5800, 4999, 20, "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80"),

    ("Puma",          "Women's Clothing", "Puma Classics Oversized Tee",
     "Boxy oversized tee in 100% organic cotton. Drop shoulders, crew neckline and rolled-up sleeves. Puma Cat graphic at chest. Effortlessly cool for casual outings or streetwear looks.",
     1800, 1499, 50, "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&q=80"),

    ("Under Armour",  "Women's Clothing", "UA Meridian Seamless Sports Bra",
     "Ultra-soft seamless construction with UA's Meridian fabric that provides 4-way stretch and moisture-wicking comfort. Medium support, removable cups and a wide underband for a secure fit.",
     2200, 1799, 35, "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=500&q=80"),

    ("Reebok",        "Women's Clothing", "Reebok Classics Vector Hoodie",
     "Relaxed fit pullover hoodie in a soft French terry fabric. Features the iconic Reebok Vector logo embroidered on the left chest. Kangaroo pocket and adjustable drawcord hood.",
     3200, 2699, 30, "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80"),

    # ── Footwear (category_id 3) ──────────────────────────────────
    ("Nike",          "Footwear", "Nike Air Max 270",
     "Lifestyle sneaker with the largest Air heel unit yet for all-day cushioning. Engineered mesh upper, foam midsole and a sleek rubber outsole. Bold silhouette for street-ready style.",
     12000, 10499, 20, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80"),

    ("Adidas",        "Footwear", "Adidas Ultraboost 22",
     "Performance running shoe with responsive Boost midsole, Primeknit+ upper and a Linear Energy Push system. Continental rubber outsole for superior grip on wet and dry surfaces.",
     15000, 12999, 15, "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80"),

    ("Puma",          "Footwear", "Puma Suede Classic XXI",
     "Iconic suede upper sneaker first launched in 1968. Low-profile silhouette, padded collar and Puma formstrip detail. A timeless basketball-heritage shoe that suits every casual outfit.",
     6500, 5499, 30, "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=500&q=80"),

    ("Reebok",        "Footwear", "Reebok Classic Leather",
     "Heritage leather upper with die-cut EVA midsole for lightweight cushioning. Encap midsole technology and split-suede overlays. One of the most iconic sneakers since 1983.",
     7500, 6299, 25, "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=500&q=80"),

    ("Under Armour",  "Footwear", "UA HOVR Sonic 5 Running Shoe",
     "Energy Web compression mesh maintains the shape of UA HOVR foam to deliver a 'zero gravity feel'. Connected shoe records run data via MapMyRun app. Engineered mesh upper with external heel counter.",
     11000, 9499, 20, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80"),

    ("H&M",           "Footwear", "H&M Derby Leather Brogues",
     "Lace-up derby brogue in smooth full-grain leather. Brogueing detail on the cap toe and quarter panels. Rubber-blend outsole with stacked leather heel. Smart yet characterful dress shoe.",
     5500, 4699, 20, "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500&q=80"),

    ("Zara",          "Footwear", "Zara Block-Heel Ankle Boots",
     "Sleek ankle boots in premium nappa leather with a square toe and comfortable 6 cm block heel. Side zip fastening and cushioned insole. Elevates both casual and formal ensembles.",
     7800, 6599, 15, "https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=500&q=80"),

    ("Levi's",        "Footwear", "Levi's Hernandez Canvas Sneaker",
     "Casual canvas lace-up sneaker with vulcanised rubber outsole. Cotton twill upper, padded collar and Levi's batwing logo. Lightweight and breathable for everyday casual wear.",
     3500, 2999, 40, "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80"),

    ("Tommy Hilfiger","Footwear", "Tommy Hilfiger TH Monogram Loafer",
     "Slip-on penny loafer in smooth leather with TH monogram jacquard lining. Leather insole and rubber outsole with subtle Tommy flag emboss. Smart-casual essential for effortless style.",
     8500, 7299, 15, "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500&q=80"),

    ("Calvin Klein",  "Footwear", "Calvin Klein Lace-Up Platform Sneaker",
     "Platform sole sneaker with suede and leather upper panelling. Chunky rubber outsole adds 4 cm of height. Padded tongue and collar with embossed CK logo on the side.",
     9000, 7699, 20, "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=500&q=80"),

    # ── Accessories (category_id 4) ───────────────────────────────
    ("Nike",          "Accessories", "Nike Heritage Cross-Body Bag",
     "Compact cross-body bag in durable nylon with a zippered main compartment and front utility pocket. Adjustable webbing strap and reflective Swoosh detail. Perfect size for daily essentials.",
     2500, 2099, 30, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Adidas",        "Accessories", "Adidas Classic 3-Stripe Backpack",
     "25-litre capacity backpack with padded laptop sleeve, front zip organiser pocket and mesh side water-bottle pockets. Padded shoulder straps and back panel for all-day carrying comfort.",
     3800, 3199, 25, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Calvin Klein",  "Accessories", "CK Minimalist Leather Belt",
     "Full-grain leather dress belt with a polished gunmetal CK logo buckle. Single-prong design, 35 mm width and stitched edges. Available in black and brown to complement any outfit.",
     2800, 2299, 40, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Tommy Hilfiger","Accessories", "Tommy Hilfiger TH Plaque Baseball Cap",
     "Classic 6-panel baseball cap in cotton twill with embroidered Tommy flag logo on front. Adjustable metal buckle strap at back. Low-profile structured crown and pre-curved brim.",
     1800, 1499, 50, "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80"),

    ("Zara",          "Accessories", "Zara Leopard Print Silk Scarf",
     "100% silk twill square scarf with a vivid leopard-print design and hand-rolled edges. Versatile accessory — wear as a neck scarf, hair tie, bag charm or wrist accessory.",
     3200, 2699, 20, "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&q=80"),

    ("H&M",           "Accessories", "H&M Knit Beanie Hat",
     "Chunky-knit beanie in a soft acrylic-wool blend with a ribbed body and folded cuff. Fleece-lined interior for extra warmth. One-size fits all with a wide, flexible band.",
     900, 699, 60, "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&q=80"),

    ("Levi's",        "Accessories", "Levi's Leather Card Holder Wallet",
     "Slim bifold wallet in full-grain cowhide leather. Houses 6 card slots, a slip pocket and a full-length bill compartment. Batwing logo emboss on the front. Gets better with age.",
     2200, 1799, 35, "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80"),

    ("Puma",          "Accessories", "Puma Team Gym Duffel Bag",
     "Spacious 45-litre duffel bag with a large main compartment, vented shoe tunnel and front zip pocket. Adjustable shoulder strap and padded haul handles. Puma Cat logo on side panel.",
     4500, 3799, 20, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Under Armour",  "Accessories", "UA Blitzing 3.0 Stretch Fit Cap",
     "UA Stretch-Fit sweatband wicks sweat and dries fast. HeatGear technology keeps you cool. Structured front panels with UA wordmark embroidered at front. Low-profile fit, no adjustment needed.",
     1500, 1199, 45, "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80"),

    ("Reebok",        "Accessories", "Reebok Drawstring Gym Bag",
     "Lightweight drawstring bag in durable nylon with a secondary zip pocket at front. Reinforced base and padded back panel. Reebok logo print on front. Folds flat for easy storage.",
     1200, 999, 50, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    # ── Kids Wear (category_id 5) ─────────────────────────────────
    ("Nike",          "Kids Wear", "Nike Kids Air Tee Set",
     "Two-piece set consisting of a graphic crew-neck tee and matching jogger pants. Soft cotton-blend fabric with moisture-wicking finish. Elastic waistband and drawcord for easy fitting.",
     2200, 1799, 30, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80"),

    ("Adidas",        "Kids Wear", "Adidas Kids 3-Stripes Tracksuit",
     "Full zip jacket and tapered jogger pant set in a soft tricot fabric. Three stripes running down the sleeves and legs. Two side pockets on jacket, elasticated waistband on pants.",
     3500, 2999, 25, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80"),

    ("H&M",           "Kids Wear", "H&M Kids Printed Cotton Dress",
     "Cheerful all-over floral print cotton jersey dress with short puff sleeves and a tiered skirt. Machine-washable, soft and comfortable for all-day play. Available in sizes 2–12 years.",
     1500, 1199, 40, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80"),

    ("Puma",          "Kids Wear", "Puma Kids Essentials Logo Hoodie",
     "Soft-fleece hoodie with adjustable drawstring hood and kangaroo front pocket. Puma Cat logo printed on chest. Ribbed cuffs and hem for a snug fit. Available in sizes 5–14 years.",
     2000, 1699, 35, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80"),

    ("Zara",          "Kids Wear", "Zara Kids Denim Bib Overall",
     "Classic bib-style denim overall with adjustable shoulder straps, front bib pocket and side fastening buttons. Soft stretch denim that grows with active kids. Timeless wardrobe piece.",
     2800, 2299, 25, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80"),

    ("Levi's",        "Kids Wear", "Levi's Kids 501 Slim Jeans",
     "Junior version of the iconic 501 in a slim leg silhouette for kids. Soft stretch denim with adjustable waistband for a comfortable, customisable fit. Classic five-pocket styling.",
     3200, 2699, 20, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80"),

    ("Reebok",        "Kids Wear", "Reebok Kids Classic Crew Sweatshirt",
     "Midweight crew sweatshirt in a soft cotton-polyester blend. Reebok heritage logo embroidered on chest. Ribbed collar, cuffs and hem. Machine washable and easy to care for.",
     1800, 1499, 35, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80"),

    ("Under Armour",  "Kids Wear", "UA Kids Tech 2.0 Graphic Tee",
     "Ultra-soft UA Tech fabric has a more natural feel and superior performance. Charged Cotton-like feel with quick-dry technology. Bold graphic print makes it fun for after-school activities.",
     1500, 1199, 45, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80"),

    ("Tommy Hilfiger","Kids Wear", "Tommy Hilfiger Kids Polo Shirt",
     "Classic short-sleeve polo in 100% piqué cotton. Signature Tommy flag embroidered on chest, ribbed collar and cuffs with two-button placket. Available in assorted colours.",
     2200, 1799, 30, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80"),

    ("Calvin Klein",  "Kids Wear", "Calvin Klein Kids Logo Swimsuit",
     "One-piece swimsuit in UPF 50+ chlorine-resistant fabric. CK monogram print all-over, cross-back straps and adjustable halter tie. Perfect for beach days and pool sessions.",
     1900, 1599, 25, "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80"),

    # ── Sports & Fitness (category_id 6) ──────────────────────────
    ("Nike",          "Sports & Fitness", "Nike Pro Compression Shorts",
     "Tight-fit Dri-FIT compression shorts with a 7-inch inseam. Four-way stretch fabric supports muscles and aids recovery. Internal drawstring waistband and two side hip pockets.",
     2800, 2299, 40, "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80"),

    ("Adidas",        "Sports & Fitness", "Adidas Designed for Training Shorts",
     "Loose-fit woven training shorts with AEROREADY moisture absorption. 9-inch inseam, internal brief with drawstring waistband and two side pockets. Reflective details for visibility.",
     2500, 1999, 35, "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80"),

    ("Under Armour",  "Sports & Fitness", "UA Qualifier Speedpocket Tight",
     "HeatGear® compression fabric with four-way stretch and anti-odour technology. Speedpocket waistband with dedicated media pocket. Reflective elements for low-light visibility.",
     3500, 2899, 30, "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80"),

    ("Puma",          "Sports & Fitness", "Puma Seasons Lightweight Running Jacket",
     "Wind and water-resistant running jacket with a full zip and packable design that stores in its own pocket. Reflective details, thumb holes and a mesh-lined back for ventilation.",
     5500, 4499, 20, "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80"),

    ("Reebok",        "Sports & Fitness", "Reebok Workout Ready Mesh Tank",
     "Lightweight training tank with open-mesh panels for ventilation. Speedwick technology wicks sweat away from skin. Slim fit with dropped armholes for a full range of motion.",
     1800, 1499, 45, "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80"),

    ("Nike",          "Sports & Fitness", "Nike Metcon 8 Training Shoe",
     "Versatile cross-training shoe with a wide, flat heel for heavy lifts. Textured rubber at forefoot and heel for grip on varied surfaces. React foam cushioning in the midfoot for comfort.",
     13500, 11499, 15, "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80"),

    ("Adidas",        "Sports & Fitness", "Adidas Techfit Long Sleeve Tee",
     "Compression long-sleeve tee with TECHFIT fabric that supports muscles during activity. Flatlock seams minimise irritation. climacool technology manages heat and moisture.",
     2800, 2299, 30, "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80"),

    ("Under Armour",  "Sports & Fitness", "UA Vanish Elite Seamless Shorts",
     "Ultra-lightweight seamless shorts with targeted mesh zones for maximum ventilation. Four-way stretch fabric and a secure zip back pocket. 5-inch inseam for unrestricted movement.",
     3000, 2499, 35, "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80"),

    ("Puma",          "Sports & Fitness", "Puma Training Gloves",
     "Full-finger training gloves with gel padding on high-impact zones. Wrist wrap for support, silicone-print grip on palm and fingers. Machine washable and quick-drying.",
     1500, 1199, 40, "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80"),

    ("Reebok",        "Sports & Fitness", "Reebok Lifting Belt 5-inch",
     "5-inch wide leather weight-lifting belt with double-prong steel buckle. Tapered front for comfort during deadlifts and squats. Provides lumbar support for heavy compound lifts.",
     3800, 3199, 20, "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80"),

    # ── Ethnic Wear (category_id 7) ───────────────────────────────
    ("Zara",          "Ethnic Wear", "Block-Print Cotton Kurta",
     "Hand block-printed kurta in soft cotton with traditional geometric motifs. Mandarin collar, side slits and three-quarter sleeves. Pairs beautifully with churidar or straight-cut trousers.",
     3200, 2699, 25, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80"),

    ("H&M",           "Ethnic Wear", "Embroidered Anarkali Suit Set",
     "Three-piece Anarkali suit set with a flared kurta featuring thread embroidery at neckline and hemline, matching churidar pants and a printed dupatta in a complementary tone.",
     5500, 4699, 20, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80"),

    ("Levi's",        "Ethnic Wear", "Linen Nehru Jacket",
     "Tailored Nehru-collar jacket in breathable linen-cotton blend. Subtle texture, concealed button closure and welt pockets. A contemporary ethnic layer for festive and formal occasions.",
     4800, 3999, 15, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80"),

    ("Tommy Hilfiger","Ethnic Wear", "Silk Blend Sherwani Jacket",
     "Festive sherwani-style long jacket in a silk-viscose blend with intricate Jacquard weave. Mandarin collar, concealed closure and flap front pockets. Pair with churidar for complete look.",
     9500, 7999, 10, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80"),

    ("Adidas",        "Ethnic Wear", "Contemporary Dhoti Pants",
     "Modern take on the classic dhoti silhouette in a lightweight cotton-lycra blend. Pre-draped with elasticated waistband for easy wear. Side slip pockets and tapered ankle for a polished look.",
     2800, 2299, 30, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80"),

    ("Puma",          "Ethnic Wear", "Embellished Lehenga Choli",
     "Festive lehenga choli set with a fully flared skirt featuring mirror-work embellishments. Matching crop blouse with hook closure. Soft net dupatta with scalloped embroidered border.",
     12000, 9999, 10, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80"),

    ("Calvin Klein",  "Ethnic Wear", "Bandhani Print Palazzo Suit",
     "Breezy palazzo-suit set featuring a bandhani tie-dye print in vibrant jewel tones. Long kurta top with v-neckline and wide palazzo trousers. Light chiffon fabric ideal for summer festivals.",
     4200, 3499, 20, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80"),

    ("Nike",          "Ethnic Wear", "Chanderi Cotton Saree",
     "Handwoven Chanderi cotton saree in a soft pastel weave with a contrast zari border and small buti motifs across the body. Comes with a matching unstitched blouse piece.",
     6500, 5499, 15, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80"),

    ("Reebok",        "Ethnic Wear", "Geometric Jacquard Kurta",
     "Men's straight-cut kurta in a cotton-jacquard with a subtle geometric weave pattern. Mandarin collar, full button placket and side slits for ease of movement. Ideal for casual ethnic occasions.",
     3500, 2999, 25, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80"),

    ("Under Armour",  "Ethnic Wear", "Festive Phulkari Dupatta",
     "Vibrant Phulkari embroidered dupatta in a silk-cotton blend. Dense floral thread embroidery in contrasting colours on a rich base. A statement accessory for traditional and fusion outfits.",
     2800, 2299, 30, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80"),

    # ── Winter Collection (category_id 8) ─────────────────────────
    ("Nike",          "Winter Collection", "Nike Therma-FIT Pullover Hoodie",
     "Therma-FIT pullover hoodie with brushed-fleece interior that traps body heat and wicks sweat. Kangaroo pocket, adjustable drawstring hood. Ribbed hem and cuffs lock in warmth.",
     4500, 3799, 30, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"),

    ("Adidas",        "Winter Collection", "Adidas Helionic Down Jacket",
     "700-fill-power down jacket with a windproof polyester shell. Elasticated cuffs, adjustable hem, two zip hand pockets and a zip chest pocket. Packable into its own pocket.",
     12000, 9999, 15, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"),

    ("Levi's",        "Winter Collection", "Levi's Sherpa-Lined Trucker Jacket",
     "Iconic denim trucker jacket with a cosy sherpa fleece lining throughout the body. Point collar, button-front closure, two chest pockets and side hand pockets. A cold-weather classic.",
     8500, 7299, 20, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"),

    ("Under Armour",  "Winter Collection", "UA Storm Fleece Gaiter Neck",
     "ColdGear® fleece balaclava with UA Storm technology that repels water. Stretchy rib-knit construction, extended chin and neck coverage. Low-profile, foldable design for easy storage.",
     2200, 1799, 40, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"),

    ("Zara",          "Winter Collection", "Zara Oversized Wool Blend Coat",
     "Elegant longline coat in a 60% wool blend. Wide lapels, double-breasted button closure, welt side pockets and a tie belt at back. Statement outerwear in a classic camel colourway.",
     15000, 12499, 10, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"),

    ("H&M",           "Winter Collection", "H&M Knit Roll-Neck Sweater",
     "Chunky-knit rollneck pullover in a soft lambswool-acrylic blend. Ribbed body, sleeves and hem with a wide turtleneck that folds down. Versatile winter staple that layers easily.",
     3200, 2699, 35, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"),

    ("Puma",          "Winter Collection", "Puma Padded Quilted Gilet",
     "Lightweight padded gilet with a quilted exterior and warm synthetic fill. Zip-through front, elasticated side panels for stretch fit, two zip pockets. Ideal mid-layer for cold weather training.",
     5500, 4599, 25, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"),

    ("Tommy Hilfiger","Winter Collection", "Tommy Hilfiger Cashmere Scarf",
     "Luxuriously soft scarf in 100% pure cashmere with a subtle TH monogram jacquard pattern and fringe trim. Classic oblong shape in versatile neutral tones. Gift-boxed.",
     6500, 5499, 20, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"),

    ("Calvin Klein",  "Winter Collection", "CK Reversible Puffer Jacket",
     "Reversible puffer jacket — one side in a matte nylon shell, the other in a CK monogram-print fabric. Water-resistant, 100g synthetic fill, zip front and interior storm flap.",
     11000, 9299, 15, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"),

    ("Reebok",        "Winter Collection", "Reebok Archive Fleece Jacket",
     "Retro-inspired full-zip fleece jacket with a stand-up collar and two zip pockets. Soft anti-pill fleece fabric with heritage Reebok logo on the chest. Perfect for cold morning runs.",
     4800, 3999, 25, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"),

    # ── Bags & Luggage (category_id 9) ────────────────────────────
    ("Nike",          "Bags & Luggage", "Nike Brasilia Duffel Bag M",
     "Durable 60-litre duffel with large main compartment, zippered shoe compartment and multiple inner pockets. Padded carry handles and removable shoulder strap. Embroidered Swoosh on front.",
     4500, 3799, 25, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Adidas",        "Bags & Luggage", "Adidas Linear 4-Wheel Trolley Bag",
     "28-inch hard-shell suitcase with four double-spinner wheels and TSA-approved lock. Two-compartment main section with packing organisers, telescoping handle and corner bumpers.",
     18000, 14999, 10, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Calvin Klein",  "Bags & Luggage", "CK Jeans Monogram Tote",
     "Large canvas tote in CK Jeans monogram print with leather handles and trim. Snap-button closure, one interior zip pocket and two open pockets. Roomy enough for a laptop and daily essentials.",
     5500, 4699, 20, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Levi's",        "Bags & Luggage", "Levi's L-Pack Slim Backpack",
     "Slim profile backpack in durable polyester with a padded 15-inch laptop sleeve. Front zip pocket, side mesh bottle pocket and padded back panel. Batwing logo and leather pull-tabs.",
     3800, 3199, 30, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Puma",          "Bags & Luggage", "Puma Phase Small Backpack",
     "Lightweight 9-litre backpack with a main zippered compartment and front utility pocket. Adjustable padded shoulder straps and Puma Cat logo heat transfer. Great for day trips and the gym.",
     2200, 1799, 35, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Under Armour",  "Bags & Luggage", "UA Hustle Lite Backpack",
     "Water-repellent backpack with a laptop sleeve, separate shoe pocket and HeatGear-lined front pocket. Abrasion-resistant bottom, sternum strap and padded back panel for comfort.",
     4200, 3499, 25, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Zara",          "Bags & Luggage", "Zara Leather Camera Bag",
     "Compact camera-style crossbody bag in pebbled nappa leather. Front flap with magnetic closure and adjustable chain-leather strap. Inner zip pocket keeps small items secure.",
     6800, 5799, 15, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("H&M",           "Bags & Luggage", "H&M Woven Straw Beach Bag",
     "Oversized woven straw tote with cotton lining, zip top closure and inner pocket. Braided handles and a detachable pouch. Ideal for beach days, markets and summer travel.",
     2500, 1999, 30, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Tommy Hilfiger","Bags & Luggage", "Tommy Hilfiger Prep Weekender",
     "Classic canvas weekender bag with leather trim, a detachable shoulder strap and a trolley sleeve for attaching to suitcase handles. Enough room for a 2-3 day getaway.",
     7500, 6299, 15, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    ("Reebok",        "Bags & Luggage", "Reebok Training Supply Bag",
     "Compact training bag with a large main compartment, separate wet/dry pocket for shoes or wet gear, and a front pocket for smaller items. Padded handle and adjustable strap.",
     2800, 2299, 30, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80"),

    # ── Watches & Jewelry (category_id 10) ────────────────────────
    ("Calvin Klein",  "Watches & Jewelry", "CK Minimalist Mesh Watch",
     "Ultra-thin quartz watch with a 38 mm sunray-brushed dial and stainless-steel mesh bracelet. Minimalist index markers, domed mineral crystal and water resistance to 30m. A wrist essential.",
     12000, 9999, 15, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"),

    ("Tommy Hilfiger","Watches & Jewelry", "Tommy Hilfiger Multifunction Watch",
     "Bold 44 mm stainless-steel case with a blue dial featuring a Tommy flag logo and three sub-dials. Silicone strap with a stainless-steel deployant clasp. 100m water resistance.",
     15000, 12499, 12, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"),

    ("Adidas",        "Watches & Jewelry", "Adidas City Tech Watch",
     "Sports-inspired 43 mm watch with a digital display, chronograph function and 100-lap memory. Shock-resistant case, 50m water resistance and a soft silicone strap for all-day comfort.",
     8500, 7199, 20, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"),

    ("Zara",          "Watches & Jewelry", "Zara Chunky Gold Chain Necklace",
     "Statement chunky link necklace in gold-tone brass with a toggle clasp. 45 cm length, 8 mm chain width. Adds instant polish to a V-neck tee or elevates a classic LBD.",
     2500, 1999, 40, "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80"),

    ("H&M",           "Watches & Jewelry", "H&M Pearl Stud Earrings Set",
     "Set of three pairs of pearl stud earrings in graduated sizes. Shell-pearl beads in ivory, mounted on sterling silver posts with butterfly backs. Classic and versatile.",
     1200, 999, 60, "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80"),

    ("Levi's",        "Watches & Jewelry", "Levi's Batwing Engraved Bracelet",
     "Stainless-steel cuff bracelet with laser-engraved Levi's Batwing logo. Polished finish with brushed inner surface. Adjustable opening for easy on/off. A subtle brand statement piece.",
     1800, 1499, 35, "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80"),

    ("Nike",          "Watches & Jewelry", "Nike Volt Sport Watch",
     "Sporty digital watch with a 38 mm soft-touch resin case in signature Volt yellow. Chronograph, alarm and 100m water resistance. Durable resin strap fits snugly for workouts.",
     6500, 5499, 25, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"),

    ("Puma",          "Watches & Jewelry", "Puma Ultrafresh Quartz Watch",
     "Casual 42 mm quartz watch with a white dial, date window at 3 o'clock and a grey silicone strap. Hardened mineral crystal, 50m water resistance and Puma Cat logo on dial.",
     5800, 4899, 20, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"),

    ("Under Armour",  "Watches & Jewelry", "UA Rival Sport Chronograph Watch",
     "Performance-focused 44 mm chronograph watch with an anti-fog mineral crystal and silicone gaskets. Built-in tachymetre, 100m water resistance and a rugged silicone strap.",
     9500, 7999, 15, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"),

    ("Reebok",        "Watches & Jewelry", "Reebok Active Classic Digital Watch",
     "Classic-inspired 39 mm digital watch with EL backlight and resin case. Chronograph, alarm and daily alarm. Silicone strap with heritage Reebok Vector logo on the dial.",
     4500, 3799, 25, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"),
]


def get_id_maps(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT brand_id, brand_name FROM brands")
        brands = {r["brand_name"]: r["brand_id"] for r in cur.fetchall()}
        cur.execute("SELECT category_id, category_name FROM categories")
        cats = {r["category_name"]: r["category_id"] for r in cur.fetchall()}
    return brands, cats


def already_exists(conn, product_name, brand_name):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM products WHERE product_name=%s AND brand_name=%s LIMIT 1",
            (product_name, brand_name),
        )
        return cur.fetchone() is not None


def seed_products(conn):
    brands, cats = get_id_maps(conn)
    inserted = skipped = 0
    with conn.cursor() as cur:
        for (brand_name, cat_name, prod_name, desc,
             normal_price, sell_price, stock, thumb) in PRODUCTS:
            if already_exists(conn, prod_name, brand_name):
                skipped += 1
                continue
            brand_id = brands.get(brand_name)
            cat_id   = cats.get(cat_name)
            if not brand_id or not cat_id:
                print(f"  SKIP (missing brand/cat): {prod_name}")
                continue
            cur.execute(
                """INSERT INTO products
                   (category_id, brand_id, product_name, category_name, brand_name,
                    product_description, product_thumbnail, normal_price, sell_price,
                    total_product_count)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (cat_id, brand_id, prod_name, cat_name, brand_name,
                 desc, thumb, normal_price, sell_price, stock),
            )
            inserted += 1
    print(f"  DB seed done: {inserted} inserted, {skipped} already existed.")
    return inserted


def wait_for_ai_service(timeout=300):
    print("Waiting for AI service to be online...", end="", flush=True)
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = requests.get(f"{AI_BASE}/ai/health", headers=HEADERS, timeout=10)
            if r.status_code == 200:
                print(" ready!")
                return True
        except Exception:
            pass
        print(".", end="", flush=True)
        time.sleep(8)
    print(" TIMEOUT")
    return False


def trigger_reindex():
    print("Triggering full Qdrant reindex (runs in background on AI service)...")
    r = requests.post(f"{AI_BASE}/ai/admin/reindex/all", headers=HEADERS, timeout=30)
    print(f"  Reindex response: {r.status_code} — {r.text[:200]}")


def check_stats():
    try:
        r = requests.get(f"{AI_BASE}/ai/admin/collection/stats", headers=HEADERS, timeout=15)
        if r.status_code == 200:
            data = r.json()
            print(f"  Qdrant stats: {data}")
    except Exception as e:
        print(f"  Stats check failed: {e}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reindex-only", action="store_true",
                        help="Skip DB seeding, only trigger Qdrant reindex")
    args = parser.parse_args()

    if not args.reindex_only:
        print("Connecting to Railway MySQL...")
        conn = connect()
        print("Seeding products...")
        inserted = seed_products(conn)
        conn.close()
        if inserted == 0:
            print("No new products needed — DB already seeded.")
    else:
        print("--reindex-only: skipping DB seed.")

    if not wait_for_ai_service():
        print("AI service not reachable. Trigger reindex manually later with:")
        print(f"  curl -X POST {AI_BASE}/ai/admin/reindex/all -H 'X-AI-Key: {AI_KEY}'")
        sys.exit(1)

    check_stats()
    trigger_reindex()
    print("\nWaiting 60s for reindex to complete...")
    time.sleep(60)
    check_stats()
    print("\nDone! Test similar products:")
    print(f"  curl -H 'X-AI-Key: {AI_KEY}' {AI_BASE}/ai/products/1/similar")


if __name__ == "__main__":
    main()
