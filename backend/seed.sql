-- ============================================================
-- NepStyle Database Seeder — 10 records per table
-- Usage: mysql -u root -ppassword nepstyle < seed.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Clear all tables in dependency order
TRUNCATE TABLE reviews;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE user_activity;
TRUNCATE TABLE wishlist;
TRUNCATE TABLE cart;
TRUNCATE TABLE flash_sale_products;
TRUNCATE TABLE products;
TRUNCATE TABLE categorized_products;
TRUNCATE TABLE brands;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- CATEGORIES (10)
-- ============================================================
INSERT INTO categories (category_name, category_thumbnail, category_description) VALUES
('Men\'s Clothing',     'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80', 'Stylish and comfortable clothing for men of all ages'),
('Women\'s Clothing',   'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&q=80', 'Trendy and elegant fashion curated for women'),
('Footwear',            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', 'Sneakers, sandals and formal shoes for every occasion'),
('Accessories',         'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 'Bags, belts, hats, scarves and more'),
('Kids Wear',           'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80', 'Cute and durable clothing for children aged 2–14'),
('Sports & Fitness',    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80', 'Activewear and sportswear for an active lifestyle'),
('Ethnic Wear',         'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80', 'Traditional Nepali and South Asian ethnic clothing'),
('Winter Collection',   'https://images.unsplash.com/photo-1580331451062-99ff652288d7?w=500&q=80', 'Cosy jackets, hoodies and knitwear for cold days'),
('Bags & Luggage',      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80', 'Backpacks, handbags, wallets and travel luggage'),
('Watches & Jewelry',   'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80', 'Elegant watches and jewelry for every occasion');

-- ============================================================
-- BRANDS (10)
-- ============================================================
INSERT INTO brands (brand_name, brand_thumbnail, brand_description) VALUES
('Adidas',         'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/400px-Adidas_Logo.svg.png',         'Global sportswear brand known for quality and innovation'),
('Nike',           'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/400px-Logo_NIKE.svg.png',           'Just Do It — world\'s leading athletic brand'),
('Puma',           'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Puma_Logo.svg/400px-Puma_Logo.svg.png',           'Sport lifestyle brand for fashion and performance'),
('Levi\'s',        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Levi%27s_Logo.svg/400px-Levi%27s_Logo.svg.png',  'Iconic American denim brand since 1853'),
('H&M',            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/H%26M-Logo.svg/400px-H%26M-Logo.svg.png',        'Affordable and trendy fashion for everyone'),
('Zara',           'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Zara_Logo.svg/400px-Zara_Logo.svg.png',           'Fast fashion with a luxury feel'),
('Reebok',         'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Reebok_2019_logo.svg/400px-Reebok_2019_logo.svg.png','Classic sports and lifestyle brand'),
('Under Armour',   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Under_armour_logo.svg/400px-Under_armour_logo.svg.png','Performance apparel, footwear and accessories'),
('Calvin Klein',   'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Calvin_Klein_Logo.svg/400px-Calvin_Klein_Logo.svg.png','Minimalist and modern American fashion house'),
('Tommy Hilfiger', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Tommy_Hilfiger_logo.svg/400px-Tommy_Hilfiger_logo.svg.png','Premium American lifestyle brand with classic style');

-- ============================================================
-- USERS (10)  — password stored as plain text for seeding
-- ============================================================
INSERT INTO users (fullname, email_address, password, contact_number, otp, email_verified, address) VALUES
('Aarav Sharma',         'aarav.sharma@gmail.com',         'password123', '9841234567', '123456', '1', 'Thamel, Kathmandu'),
('Priya Thapa',          'priya.thapa@gmail.com',          'password123', '9852345678', '234567', '1', 'Lalitpur, Patan'),
('Bikram Rai',           'bikram.rai@gmail.com',           'password123', '9863456789', '345678', '1', 'Boudha, Kathmandu'),
('Sita Gurung',          'sita.gurung@gmail.com',          'password123', '9874567890', '456789', '1', 'Pokhara, Gandaki'),
('Rohan Karki',          'rohan.karki@gmail.com',          'password123', '9885678901', '567890', '1', 'Bhaktapur'),
('Anita Maharjan',       'anita.maharjan@gmail.com',       'password123', '9896789012', '678901', '1', 'Patan, Lalitpur'),
('Suresh Tamang',        'suresh.tamang@gmail.com',        'password123', '9807890123', '789012', '1', 'Baneshwor, Kathmandu'),
('Kavita Shrestha',      'kavita.shrestha@gmail.com',      'password123', '9818901234', '890123', '1', 'Kopundol, Lalitpur'),
('Dipesh Adhikari',      'dipesh.adhikari@gmail.com',      'password123', '9829012345', '901234', '1', 'Chabahil, Kathmandu'),
('Manisha Bajracharya',  'manisha.bajracharya@gmail.com',  'password123', '9830123456', '012345', '1', 'Sanepa, Lalitpur');

-- ============================================================
-- PRODUCTS (10)
-- ============================================================
INSERT INTO products (category_id, brand_id, product_name, category_name, brand_name, product_description, product_thumbnail, normal_price, sell_price, total_product_count) VALUES
(1,  1,  'Adidas Classic Track Jacket',       'Men\'s Clothing',    'Adidas',         'A timeless three-stripe track jacket crafted from lightweight polyester. Perfect for casual outings or a trip to the gym.',                             'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80', 3500.00, 2800.00, 50),
(2,  6,  'Zara Floral Summer Dress',          'Women\'s Clothing',  'Zara',           'Breezy floral-print midi dress with a relaxed silhouette and adjustable straps. Made from 100% viscose for a soft, flowing feel.',                       'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80', 4200.00, 3500.00, 35),
(3,  2,  'Nike Air Max 270 Sneakers',         'Footwear',           'Nike',           'Iconic Air Max 270 with the tallest heel Air unit yet. Lightweight mesh upper and foam midsole deliver ultimate all-day comfort.',                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',   12000.00, 9999.00, 25),
(4,  9,  'Calvin Klein Leather Belt',         'Accessories',        'Calvin Klein',   'Full-grain genuine leather belt with a classic CK logo buckle. Smooth finish, reversible design — black on one side, tan on the other.',                 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',   2500.00, 1999.00, 60),
(5,  5,  'H&M Kids Denim Overalls',           'Kids Wear',          'H&M',            'Playful dungaree-style overalls in soft stretch denim. Adjustable shoulder straps, front bib pocket and roomy fit for active little ones aged 2–8.',      'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80', 1800.00, 1400.00, 40),
(6,  8,  'Under Armour HeatGear T-Shirt',     'Sports & Fitness',   'Under Armour',   'Ultra-soft HeatGear fabric wicks sweat and dries fast. Anti-odor technology and four-way stretch keep you moving freely through any workout.',           'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80', 2200.00, 1750.00, 45),
(7,  10, 'Tommy Hilfiger Festive Kurta Set',  'Ethnic Wear',        'Tommy Hilfiger', 'Elegant block-print kurta set blending traditional Nepali aesthetics with a modern slim cut. Includes kurta and matching churidar. Perfect for Dashain.', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80', 5500.00, 4500.00, 20),
(8,  3,  'Puma Fleece Pullover Hoodie',       'Winter Collection',  'Puma',           'Midweight fleece hoodie with kangaroo pocket and adjustable drawstring hood. Ribbed cuffs and hem seal in warmth on cold Himalayan evenings.',            'https://images.unsplash.com/photo-1580331451062-99ff652288d7?w=500&q=80', 3800.00, 2999.00, 30),
(9,  4,  'Levi\'s Canvas Backpack 25L',       'Bags & Luggage',     'Levi\'s',        'Sturdy waxed-canvas backpack with a padded 15″ laptop sleeve, front organiser pocket and adjustable padded shoulder straps. Ideal for daily commute.',    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',   3200.00, 2500.00, 55),
(10, 7,  'Reebok Classic Chronograph Watch',  'Watches & Jewelry',  'Reebok',         '42mm stainless-steel case with genuine leather strap. Chronograph sub-dials, date window, and 50m water resistance. Timeless everyday style.',           'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80', 8500.00, 6999.00, 15);

-- ============================================================
-- FLASH SALE PRODUCTS (10) — 40% off all products
-- product_ids are 1-10 matching the products inserted above
-- discounted_price = savings amount (normal_price - sell_price)
-- ============================================================
INSERT INTO flash_sale_products (product_id, category_id, brand_id, product_name, category_name, brand_name, product_description, product_thumbnail, normal_price, sell_price, total_product_count, discount_percentage, discounted_price) VALUES
(1,  1,  1,  'Adidas Classic Track Jacket',       'Men\'s Clothing',    'Adidas',         'A timeless three-stripe track jacket crafted from lightweight polyester.',                   'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80', 3500.00, 2100.00, 50, 40.00, 1400.00),
(2,  2,  6,  'Zara Floral Summer Dress',          'Women\'s Clothing',  'Zara',           'Breezy floral-print midi dress with a relaxed silhouette and adjustable straps.',            'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80', 4200.00, 2520.00, 35, 40.00, 1680.00),
(3,  3,  2,  'Nike Air Max 270 Sneakers',         'Footwear',           'Nike',           'Iconic Air Max 270 with the tallest heel Air unit yet.',                                     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',  12000.00, 7200.00, 25, 40.00, 4800.00),
(4,  4,  9,  'Calvin Klein Leather Belt',         'Accessories',        'Calvin Klein',   'Full-grain genuine leather belt with a classic CK logo buckle.',                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',   2500.00, 1500.00, 60, 40.00, 1000.00),
(5,  5,  5,  'H&M Kids Denim Overalls',           'Kids Wear',          'H&M',            'Playful dungaree-style overalls in soft stretch denim.',                                     'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80', 1800.00, 1080.00, 40, 40.00,  720.00),
(6,  6,  8,  'Under Armour HeatGear T-Shirt',     'Sports & Fitness',   'Under Armour',   'Ultra-soft HeatGear fabric wicks sweat and dries fast.',                                    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80', 2200.00, 1320.00, 45, 40.00,  880.00),
(7,  7,  10, 'Tommy Hilfiger Festive Kurta Set',  'Ethnic Wear',        'Tommy Hilfiger', 'Elegant block-print kurta set blending traditional Nepali aesthetics with a modern slim cut.','https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80', 5500.00, 3300.00, 20, 40.00, 2200.00),
(8,  8,  3,  'Puma Fleece Pullover Hoodie',       'Winter Collection',  'Puma',           'Midweight fleece hoodie with kangaroo pocket and adjustable drawstring hood.',               'https://images.unsplash.com/photo-1580331451062-99ff652288d7?w=500&q=80', 3800.00, 2280.00, 30, 40.00, 1520.00),
(9,  9,  4,  'Levi\'s Canvas Backpack 25L',       'Bags & Luggage',     'Levi\'s',        'Sturdy waxed-canvas backpack with a padded 15″ laptop sleeve.',                             'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',   3200.00, 1920.00, 55, 40.00, 1280.00),
(10, 10, 7,  'Reebok Classic Chronograph Watch',  'Watches & Jewelry',  'Reebok',         '42mm stainless-steel case with genuine leather strap and chronograph dials.',               'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80', 8500.00, 5100.00, 15, 40.00, 3400.00);

-- ============================================================
-- REVIEWS (10)
-- ============================================================
INSERT INTO reviews (user_id, product_id, rating, user_name, comment) VALUES
(1,  1,  5, 'Aarav Sharma',        'Excellent jacket! The quality is top-notch and the fit is perfect. Highly recommend NepStyle for branded clothing.'),
(2,  2,  4, 'Priya Thapa',         'Beautiful dress, exactly as shown in pictures. Fabric is light and comfortable. Delivery was fast too!'),
(3,  3,  5, 'Bikram Rai',          'Nike never disappoints! These sneakers are incredibly comfortable and look great. Worth every paisa.'),
(4,  4,  4, 'Sita Gurung',         'Good quality leather belt. Looks premium and the reversible design is very handy. Bought two colours already.'),
(5,  5,  5, 'Rohan Karki',         'My kids love these overalls! Very durable and the denim is soft. Zero complaints after 2 months of daily use.'),
(6,  6,  4, 'Anita Maharjan',      'Great workout shirt. Keeps me cool during intense sessions. The HeatGear technology is no joke — really works!'),
(7,  7,  5, 'Suresh Tamang',       'Wore this for Dashain and got so many compliments! Fits true to size and the stitching quality is excellent.'),
(8,  8,  4, 'Kavita Shrestha',     'Perfect hoodie for Kathmandu winters. Soft fleece inside, not too bulky. Looks stylish too, not just functional.'),
(9,  9,  5, 'Dipesh Adhikari',     'Very sturdy backpack. My 15 inch laptop fits easily. I commute daily and it shows no wear after 3 months.'),
(10, 10, 4, 'Manisha Bajracharya', 'Elegant watch with a classic look. Accurate timekeeping and the leather strap is genuine quality. Happy customer!');

-- ============================================================
-- Summary
-- ============================================================
SELECT 'Seeding complete!' AS status;
SELECT COUNT(*) AS total_categories       FROM categories;
SELECT COUNT(*) AS total_brands           FROM brands;
SELECT COUNT(*) AS total_users            FROM users;
SELECT COUNT(*) AS total_products         FROM products;
SELECT COUNT(*) AS total_flash_products   FROM flash_sale_products;
SELECT COUNT(*) AS total_reviews          FROM reviews;
