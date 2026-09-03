-- ============================================================
-- NepStyle Database Seeder — comprehensive seed
-- Usage: mysql -u root -ppassword railway < seed.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

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
('Men\'s Clothing',   'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80', 'Stylish and comfortable clothing for men of all ages'),
('Women\'s Clothing', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&q=80', 'Trendy and elegant fashion curated for women'),
('Footwear',          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', 'Sneakers, sandals and formal shoes for every occasion'),
('Accessories',       'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 'Bags, belts, hats, scarves and more'),
('Kids Wear',         'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80', 'Cute and durable clothing for children aged 2–14'),
('Sports & Fitness',  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80', 'Activewear and sportswear for an active lifestyle'),
('Ethnic Wear',       'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80', 'Traditional Nepali and South Asian ethnic clothing'),
('Winter Collection', 'https://images.unsplash.com/photo-1580331451062-99ff652288d7?w=500&q=80', 'Cosy jackets, hoodies and knitwear for cold days'),
('Bags & Luggage',    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80', 'Backpacks, handbags, wallets and travel luggage'),
('Watches & Jewelry', 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80', 'Elegant watches and jewelry for every occasion');

-- ============================================================
-- BRANDS (10)
-- ============================================================
INSERT INTO brands (brand_name, brand_thumbnail, brand_description) VALUES
('Adidas',         'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/400px-Adidas_Logo.svg.png',         'Global sportswear brand known for quality and innovation'),
('Nike',           'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/400px-Logo_NIKE.svg.png',             'Just Do It — world\'s leading athletic brand'),
('Puma',           'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Puma_Logo.svg/400px-Puma_Logo.svg.png',             'Sport lifestyle brand for fashion and performance'),
('Levi\'s',        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Levi%27s_Logo.svg/400px-Levi%27s_Logo.svg.png',    'Iconic American denim brand since 1853'),
('H&M',            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/H%26M-Logo.svg/400px-H%26M-Logo.svg.png',          'Affordable and trendy fashion for everyone'),
('Zara',           'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Zara_Logo.svg/400px-Zara_Logo.svg.png',             'Fast fashion with a luxury feel'),
('Reebok',         'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Reebok_2019_logo.svg/400px-Reebok_2019_logo.svg.png','Classic sports and lifestyle brand'),
('Under Armour',   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Under_armour_logo.svg/400px-Under_armour_logo.svg.png','Performance apparel, footwear and accessories'),
('Calvin Klein',   'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Calvin_Klein_Logo.svg/400px-Calvin_Klein_Logo.svg.png','Minimalist and modern American fashion house'),
('Tommy Hilfiger', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Tommy_Hilfiger_logo.svg/400px-Tommy_Hilfiger_logo.svg.png','Premium American lifestyle brand with classic style');

-- ============================================================
-- USERS (10)  — passwords stored as plain text for seeding only
-- ============================================================
INSERT INTO users (fullname, email_address, password, contact_number, otp, email_verified, address) VALUES
('Aarav Sharma',        'aarav.sharma@gmail.com',        'password123', '9841234567', '123456', '1', 'Thamel, Kathmandu'),
('Priya Thapa',         'priya.thapa@gmail.com',         'password123', '9852345678', '234567', '1', 'Lalitpur, Patan'),
('Bikram Rai',          'bikram.rai@gmail.com',          'password123', '9863456789', '345678', '1', 'Boudha, Kathmandu'),
('Sita Gurung',         'sita.gurung@gmail.com',         'password123', '9874567890', '456789', '1', 'Pokhara, Gandaki'),
('Rohan Karki',         'rohan.karki@gmail.com',         'password123', '9885678901', '567890', '1', 'Bhaktapur'),
('Anita Maharjan',      'anita.maharjan@gmail.com',      'password123', '9896789012', '678901', '1', 'Patan, Lalitpur'),
('Suresh Tamang',       'suresh.tamang@gmail.com',       'password123', '9807890123', '789012', '1', 'Baneshwor, Kathmandu'),
('Kavita Shrestha',     'kavita.shrestha@gmail.com',     'password123', '9818901234', '890123', '1', 'Kopundol, Lalitpur'),
('Dipesh Adhikari',     'dipesh.adhikari@gmail.com',     'password123', '9829012345', '901234', '1', 'Chabahil, Kathmandu'),
('Manisha Bajracharya', 'manisha.bajracharya@gmail.com', 'password123', '9830123456', '012345', '1', 'Sanepa, Lalitpur');

-- ============================================================
-- PRODUCTS (50) — 5 per category
-- category_id 1=Men's, 2=Women's, 3=Footwear, 4=Accessories,
--             5=Kids, 6=Sports, 7=Ethnic, 8=Winter, 9=Bags, 10=Watches
-- brand_id    1=Adidas, 2=Nike, 3=Puma, 4=Levi's, 5=H&M,
--             6=Zara, 7=Reebok, 8=Under Armour, 9=CK, 10=Tommy
-- ============================================================
INSERT INTO products (category_id, brand_id, product_name, category_name, brand_name, product_description, product_thumbnail, normal_price, sell_price, total_product_count) VALUES

-- Men's Clothing (cat 1)
(1, 1,  'Adidas Classic Track Jacket',
 'Men\'s Clothing', 'Adidas',
 'A timeless three-stripe track jacket crafted from lightweight polyester. Perfect for casual outings or a quick trip to the gym. Zip pockets keep essentials secure.',
 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80', 3500.00, 2799.00, 50),

(1, 2,  'Nike Dri-FIT Training T-Shirt',
 'Men\'s Clothing', 'Nike',
 'Sweat-wicking Dri-FIT fabric keeps you dry during intense workouts. Lightweight and breathable with a relaxed crew-neck fit. Great for gym, running or everyday wear.',
 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80', 2200.00, 1699.00, 80),

(1, 4,  'Levi\'s 511 Slim Fit Jeans',
 'Men\'s Clothing', 'Levi\'s',
 'The iconic 511 slim fit sits below the waist with a slim leg from hip to ankle. Made from flexible stretch denim for all-day comfort. A wardrobe essential.',
 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80', 5500.00, 4299.00, 40),

(1, 5,  'H&M Slim Linen Shirt',
 'Men\'s Clothing', 'H&M',
 'Relaxed slim-fit shirt in breathable linen blend. Button-down front, chest pocket and curved hem. Ideal for both formal and casual occasions in the Nepali heat.',
 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80', 2800.00, 1999.00, 60),

(1, 10, 'Tommy Hilfiger Classic Polo Shirt',
 'Men\'s Clothing', 'Tommy Hilfiger',
 'Premium piqué polo with signature flag embroidery on the chest. Two-button placket, ribbed collar and cuffs. A versatile piece for smart-casual occasions.',
 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80', 4500.00, 3499.00, 45),

-- Women's Clothing (cat 2)
(2, 6,  'Zara Floral Midi Dress',
 'Women\'s Clothing', 'Zara',
 'Breezy floral-print midi dress with a relaxed silhouette and adjustable straps. Made from 100% viscose for a soft, flowing feel. Perfect for summer days.',
 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80', 4200.00, 3299.00, 35),

(2, 5,  'H&M Wrap Midi Dress',
 'Women\'s Clothing', 'H&M',
 'Flattering wrap-style midi dress with a V-neck and tie waist. Soft jersey fabric drapes beautifully and suits all body types. Available in multiple solid colours.',
 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80', 3500.00, 2499.00, 45),

(2, 9,  'Calvin Klein Modern Blazer',
 'Women\'s Clothing', 'Calvin Klein',
 'Tailored slim-fit blazer in a refined stretch fabric. Notch lapel, two-button front and welt pockets. Effortlessly transitions from office to evening.',
 'https://images.unsplash.com/photo-1594938298603-c8148c4b2d7f?w=500&q=80', 8500.00, 6999.00, 20),

(2, 1,  'Adidas Women\'s Training Tights',
 'Women\'s Clothing', 'Adidas',
 'High-waisted compression tights with moisture-absorbing fabric. Four-way stretch for full range of motion. Flatlock seams prevent chafing during intense sessions.',
 'https://images.unsplash.com/photo-1539794830467-1f1755804d13?w=500&q=80', 3800.00, 2999.00, 50),

(2, 10, 'Tommy Hilfiger Striped Shirt Dress',
 'Women\'s Clothing', 'Tommy Hilfiger',
 'Classic blue-and-white stripe shirt dress with button-down front and belted waist. Knee-length fit with a collar and chest pockets. Smart-casual perfection.',
 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&q=80', 6500.00, 4999.00, 25),

-- Footwear (cat 3)
(3, 2,  'Nike Air Max 270 Sneakers',
 'Footwear', 'Nike',
 'Iconic Air Max 270 with the tallest heel Air unit yet. Lightweight mesh upper and foam midsole deliver ultimate all-day comfort. A lifestyle sneaker icon.',
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', 14000.00, 11499.00, 25),

(3, 1,  'Adidas Ultraboost 22 Running Shoes',
 'Footwear', 'Adidas',
 'Responsive Boost midsole with a Primeknit+ upper that moves with your foot. Continental rubber outsole for reliable grip in wet and dry conditions.',
 'https://images.unsplash.com/photo-1607522370275-f6d4d01b1405?w=500&q=80', 18000.00, 14999.00, 20),

(3, 3,  'Puma RS-X3 Puzzle Sneakers',
 'Footwear', 'Puma',
 'Bold retro-running RS-X3 with a thick, chunky sole and multi-panel upper. Lightweight mesh and synthetic overlays in striking colourways. Turn heads on every street.',
 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&q=80', 10000.00, 7999.00, 30),

(3, 7,  'Reebok Classic Leather Sneakers',
 'Footwear', 'Reebok',
 'The timeless Reebok Classic Leather in clean, low-profile style. Soft leather upper with EVA midsole. Versatile enough to pair with jeans, chinos or shorts.',
 'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=500&q=80', 9500.00, 7499.00, 35),

(3, 8,  'Under Armour HOVR Phantom 3 Running Shoes',
 'Footwear', 'Under Armour',
 'UA HOVR technology compresses and then returns energy back to your foot. Engineered mesh upper for breathability. MapMyRun sensor tracks your runs automatically.',
 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500&q=80', 16000.00, 12999.00, 15),

-- Accessories (cat 4)
(4, 9,  'Calvin Klein Reversible Leather Belt',
 'Accessories', 'Calvin Klein',
 'Full-grain genuine leather belt with a classic CK logo buckle. Smooth finish, reversible design — black on one side, tan on the other. Fits 28–42 inch waist.',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 2500.00, 1999.00, 60),

(4, 10, 'Tommy Hilfiger Bifold Leather Wallet',
 'Accessories', 'Tommy Hilfiger',
 'Slim bifold wallet in genuine leather with contrast flag detail. 6 card slots, 2 note compartments and 1 coin pocket. Compact enough for front-pocket carry.',
 'https://images.unsplash.com/photo-1627123424574-724758594785?w=500&q=80', 3200.00, 2499.00, 75),

(4, 1,  'Adidas Trefoil Snapback Cap',
 'Accessories', 'Adidas',
 'Structured six-panel cap with flat brim and embroidered Trefoil logo. Snapback closure fits most head sizes. Great for workouts, travel or casual streetwear.',
 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80', 1800.00, 1299.00, 100),

(4, 2,  'Nike Polarised Wraparound Sunglasses',
 'Accessories', 'Nike',
 'Lightweight wraparound frame with polarised UV400 lenses. Rubber nose pads and temple tips prevent slipping during outdoor activities. Style meets protection.',
 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80', 4500.00, 3499.00, 40),

(4, 3,  'Puma Knit Beanie & Gloves Set',
 'Accessories', 'Puma',
 'Cosy ribbed-knit beanie and matching gloves set for cold Himalayan mornings. Soft fleece lining inside. Embroidered Puma Cat logo. One size fits most.',
 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500&q=80', 1500.00, 1099.00, 80),

-- Kids Wear (cat 5)
(5, 5,  'H&M Kids Denim Overalls',
 'Kids Wear', 'H&M',
 'Playful dungaree-style overalls in soft stretch denim. Adjustable shoulder straps, front bib pocket and roomy fit for active little ones aged 2–8.',
 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80', 1800.00, 1399.00, 40),

(5, 2,  'Nike Kids Dri-FIT Tracksuit',
 'Kids Wear', 'Nike',
 'Two-piece tracksuit in Dri-FIT fabric for active kids aged 4–14. Zip-up jacket with hood and elasticated trousers. Machine washable and durable for daily play.',
 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=500&q=80', 3500.00, 2799.00, 30),

(5, 1,  'Adidas Kids Tiro 21 Training Jacket',
 'Kids Wear', 'Adidas',
 'Slim-fit training jacket in recycled polyester for eco-conscious families. Three-stripe detail on sleeves. Full zip with stand-up collar. Ages 5–15.',
 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500&q=80', 2800.00, 2199.00, 35),

(5, 3,  'Puma Kids Essential Logo Tee',
 'Kids Wear', 'Puma',
 'Soft cotton crew-neck tee with large Puma Cat graphic print. Relaxed fit for all-day comfort. Pre-washed for extra softness. Available ages 4–16.',
 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=500&q=80', 1200.00, 899.00, 60),

(5, 4,  'Levi\'s Kids 511 Slim Stretch Jeans',
 'Kids Wear', 'Levi\'s',
 'The same classic 511 slim fit scaled for kids. Super-soft stretch denim with adjustable waist tab. Five-pocket styling and reinforced knees for durability. Ages 4–16.',
 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80', 2500.00, 1899.00, 45),

-- Sports & Fitness (cat 6)
(6, 8,  'Under Armour HeatGear T-Shirt',
 'Sports & Fitness', 'Under Armour',
 'Ultra-soft HeatGear fabric wicks sweat and dries fast. Anti-odor technology and four-way stretch keep you moving freely through any workout.',
 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500&q=80', 2200.00, 1699.00, 55),

(6, 2,  'Nike Pro 5-Inch Running Shorts',
 'Sports & Fitness', 'Nike',
 'Lightweight Dri-FIT running shorts with 5-inch inseam and built-in briefs. Side vents improve airflow. Internal waistband pocket holds keys or cards.',
 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&q=80', 2800.00, 2199.00, 50),

(6, 1,  'Adidas Tiro 21 Training Pants',
 'Sports & Fitness', 'Adidas',
 'Slim-fitting training pants with three-stripe detail on the side seams. Zip leg openings for easy on/off over boots. Deep side pockets and elastic waistband.',
 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80', 3200.00, 2499.00, 45),

(6, 3,  'Puma Evostripe Hoodie',
 'Sports & Fitness', 'Puma',
 'Comfortable mid-layer hoodie in moisture-wicking fabric with an athletic silhouette. Kangaroo pocket and drawcord hood. Perfect for warm-up and cool-down sessions.',
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80', 3800.00, 2999.00, 40),

(6, 7,  'Reebok Nano X1 Cross-Training Shoes',
 'Sports & Fitness', 'Reebok',
 'Built for high-intensity training with a wide toe box and low-to-the-ground design. Flexweave upper for breathability. Stable enough for lifting, agile enough for cardio.',
 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80', 12000.00, 9499.00, 20),

-- Ethnic Wear (cat 7)
(7, 10, 'Tommy Hilfiger Festive Kurta Set',
 'Ethnic Wear', 'Tommy Hilfiger',
 'Elegant block-print kurta set blending traditional Nepali aesthetics with a modern slim cut. Includes kurta and matching churidar. Ideal for Dashain or Tihar.',
 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80', 5500.00, 4299.00, 20),

(7, 6,  'Zara Embroidered Ethnic Kurti',
 'Ethnic Wear', 'Zara',
 'Contemporary A-line kurti with intricate floral embroidery at the neckline and sleeves. Light cotton fabric, side slits for ease of movement. Pairs with leggings or jeans.',
 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80', 4200.00, 3299.00, 30),

(7, 5,  'H&M Printed Cotton Salwar Suit',
 'Ethnic Wear', 'H&M',
 'Printed three-piece salwar suit in soft breathable cotton. Includes dupatta. Relaxed fit with traditional block print patterns. Perfect for festivals and family gatherings.',
 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80', 3800.00, 2999.00, 25),

(7, 4,  'Levi\'s Ethnic Print Dhoti Pants',
 'Ethnic Wear', 'Levi\'s',
 'Modern dhoti pants with a contemporary slim-drape silhouette. Traditional weave pattern in earthy tones. Elastic waist with adjustable drawcord. Versatile and comfortable.',
 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80', 2800.00, 2199.00, 35),

(7, 9,  'Calvin Klein Premium Silk Dupatta',
 'Ethnic Wear', 'Calvin Klein',
 'Luxurious pure-silk dupatta with zari border and delicate embroidery at both ends. Drapes elegantly. Available in rich jewel tones for wedding and festive season.',
 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80', 6500.00, 5299.00, 15),

-- Winter Collection (cat 8)
(8, 3,  'Puma Fleece Pullover Hoodie',
 'Winter Collection', 'Puma',
 'Midweight fleece hoodie with kangaroo pocket and adjustable drawstring hood. Ribbed cuffs and hem seal in warmth on cold Himalayan evenings.',
 'https://images.unsplash.com/photo-1580331451062-99ff652288d7?w=500&q=80', 3800.00, 2999.00, 30),

(8, 2,  'Nike Therma-FIT Training Jacket',
 'Winter Collection', 'Nike',
 'Therma-FIT technology traps warm air to protect you from the cold. Full-zip design with pockets. Standard fit that works over layers on freezing training days.',
 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&q=80', 6500.00, 5199.00, 25),

(8, 1,  'Adidas Essentials 3-Stripe Fleece Jacket',
 'Winter Collection', 'Adidas',
 'Warm fleece jacket with iconic three-stripe design down the sleeves. Full zip, two hand pockets and ribbed hem and cuffs. A cold-weather essential for the mountains.',
 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&q=80', 5500.00, 4299.00, 35),

(8, 8,  'Under Armour Storm ColdGear Jacket',
 'Winter Collection', 'Under Armour',
 'UA Storm technology repels water without sacrificing breathability. ColdGear lining keeps you warm in sub-zero conditions. Zip pockets and drawcord hem for a secure fit.',
 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&q=80', 9500.00, 7499.00, 15),

(8, 10, 'Tommy Hilfiger Wool Blend Overcoat',
 'Winter Collection', 'Tommy Hilfiger',
 'Classic double-breasted overcoat in a premium wool blend. Notch lapel, two-button front and structured shoulders. The ultimate smart-casual winter statement piece.',
 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&q=80', 14500.00, 11999.00, 10),

-- Bags & Luggage (cat 9)
(9, 4,  'Levi\'s Waxed Canvas Backpack 25L',
 'Bags & Luggage', 'Levi\'s',
 'Sturdy waxed-canvas backpack with a padded 15″ laptop sleeve, front organiser pocket and adjustable padded shoulder straps. Ideal for daily commute.',
 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80', 3200.00, 2499.00, 55),

(9, 2,  'Nike Brasilia 9.5 Training Duffel Bag',
 'Bags & Luggage', 'Nike',
 'Spacious main compartment with a zippered shoe compartment at the bottom. Padded handles and detachable shoulder strap. Durable polyester with bold Nike branding.',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 4500.00, 3499.00, 40),

(9, 1,  'Adidas Linear Essential Backpack',
 'Bags & Luggage', 'Adidas',
 'Versatile 24L backpack with a large main compartment and front zipped pocket. Padded back panel and adjustable straps. Suitable for school, gym or weekend travel.',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 3500.00, 2699.00, 50),

(9, 3,  'Puma Phase Backpack 18L',
 'Bags & Luggage', 'Puma',
 'Compact everyday backpack with two compartments and mesh side pockets for bottles. Padded shoulder straps. Embossed Puma Cat logo. Great for school or gym.',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 2200.00, 1699.00, 65),

(9, 10, 'Tommy Hilfiger Chain-Strap Crossbody Bag',
 'Bags & Luggage', 'Tommy Hilfiger',
 'Structured faux-leather crossbody bag with detachable gold-tone chain strap. One main compartment with interior zip pocket. Perfect for outings and evening events.',
 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80', 5500.00, 4299.00, 25),

-- Watches & Jewelry (cat 10)
(10, 7,  'Reebok Classic Chronograph Watch',
 'Watches & Jewelry', 'Reebok',
 '42mm stainless-steel case with genuine leather strap. Chronograph sub-dials, date window and 50m water resistance. Timeless everyday style meets sporty functionality.',
 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80', 8500.00, 6999.00, 15),

(10, 1,  'Adidas Sport Digital Watch',
 'Watches & Jewelry', 'Adidas',
 'Bold digital sport watch with stopwatch, countdown timer and dual time zone. Water resistant to 100m. Silicone strap with easy-release pin buckle. Built for active lifestyles.',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', 5500.00, 4299.00, 20),

(10, 9,  'Calvin Klein Stainless Steel Bangle',
 'Watches & Jewelry', 'Calvin Klein',
 'Polished stainless-steel bangle with engraved Calvin Klein logo. Minimalist and modern. Suitable for daily wear or special occasions. Fits standard wrist sizes.',
 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80', 4200.00, 3299.00, 30),

(10, 10, 'Tommy Hilfiger Double-Strap Leather Watch',
 'Watches & Jewelry', 'Tommy Hilfiger',
 'Two-tone case with a dual-strap design — leather and mesh — for a unique layered look. Quartz movement, mineral glass, 30m water resistance. Includes gift box.',
 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500&q=80', 12000.00, 9499.00, 12),

(10, 2,  'Nike Futura Sport Watch',
 'Watches & Jewelry', 'Nike',
 'Sporty quartz watch with a 42mm case and silicone strap. Chronograph function, date window and scratch-resistant mineral glass. Lightweight for active wearers.',
 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&q=80', 6500.00, 4999.00, 18);

-- ============================================================
-- FLASH SALE PRODUCTS (20) — varying discounts 20–50%
-- sell_price   = flash sale final price
-- discounted_price = amount saved (normal_price - flash_sell_price)
-- ============================================================
INSERT INTO flash_sale_products (product_id, category_id, brand_id, product_name, category_name, brand_name, product_description, product_thumbnail, normal_price, sell_price, total_product_count, discount_percentage, discounted_price) VALUES

-- 50% off
(3,  3,  2,  'Nike Air Max 270 Sneakers',
 'Footwear', 'Nike',
 'Iconic Air Max 270 with the tallest heel Air unit yet. Ultimate all-day comfort.',
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
 14000.00, 7000.00, 25, 50.00, 7000.00),

(12, 3,  1,  'Adidas Ultraboost 22 Running Shoes',
 'Footwear', 'Adidas',
 'Responsive Boost midsole with a Primeknit+ upper that moves with your foot.',
 'https://images.unsplash.com/photo-1607522370275-f6d4d01b1405?w=500&q=80',
 18000.00, 9000.00, 20, 50.00, 9000.00),

-- 40% off
(1,  1,  1,  'Adidas Classic Track Jacket',
 'Men\'s Clothing', 'Adidas',
 'A timeless three-stripe track jacket crafted from lightweight polyester.',
 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80',
 3500.00, 2100.00, 50, 40.00, 1400.00),

(7,  2,  9,  'Calvin Klein Modern Blazer',
 'Women\'s Clothing', 'Calvin Klein',
 'Tailored slim-fit blazer in a refined stretch fabric. Effortlessly transitions from office to evening.',
 'https://images.unsplash.com/photo-1594938298603-c8148c4b2d7f?w=500&q=80',
 8500.00, 5100.00, 20, 40.00, 3400.00),

(40, 8,  10, 'Tommy Hilfiger Wool Blend Overcoat',
 'Winter Collection', 'Tommy Hilfiger',
 'Classic double-breasted overcoat in a premium wool blend. The ultimate winter statement.',
 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&q=80',
 14500.00, 8700.00, 10, 40.00, 5800.00),

(50, 10, 2,  'Nike Futura Sport Watch',
 'Watches & Jewelry', 'Nike',
 'Sporty quartz watch with chronograph function and scratch-resistant glass.',
 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&q=80',
 6500.00, 3900.00, 18, 40.00, 2600.00),

-- 30% off
(2,  1,  2,  'Nike Dri-FIT Training T-Shirt',
 'Men\'s Clothing', 'Nike',
 'Sweat-wicking Dri-FIT fabric keeps you dry during intense workouts.',
 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
 2200.00, 1540.00, 80, 30.00, 660.00),

(6,  2,  6,  'Zara Floral Midi Dress',
 'Women\'s Clothing', 'Zara',
 'Breezy floral-print midi dress with a relaxed silhouette and adjustable straps.',
 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80',
 4200.00, 2940.00, 35, 30.00, 1260.00),

(21, 5,  5,  'H&M Kids Denim Overalls',
 'Kids Wear', 'H&M',
 'Playful dungaree-style overalls in soft stretch denim for active little ones.',
 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&q=80',
 1800.00, 1260.00, 40, 30.00, 540.00),

(36, 8,  3,  'Puma Fleece Pullover Hoodie',
 'Winter Collection', 'Puma',
 'Midweight fleece hoodie with kangaroo pocket and drawstring hood.',
 'https://images.unsplash.com/photo-1580331451062-99ff652288d7?w=500&q=80',
 3800.00, 2660.00, 30, 30.00, 1140.00),

(27, 6,  2,  'Nike Pro 5-Inch Running Shorts',
 'Sports & Fitness', 'Nike',
 'Lightweight Dri-FIT running shorts with built-in briefs and side vents.',
 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&q=80',
 2800.00, 1960.00, 50, 30.00, 840.00),

(45, 9,  10, 'Tommy Hilfiger Chain-Strap Crossbody Bag',
 'Bags & Luggage', 'Tommy Hilfiger',
 'Structured crossbody bag with detachable gold-tone chain strap.',
 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',
 5500.00, 3850.00, 25, 30.00, 1650.00),

-- 25% off
(5,  1,  10, 'Tommy Hilfiger Classic Polo Shirt',
 'Men\'s Clothing', 'Tommy Hilfiger',
 'Premium piqué polo with signature flag embroidery. A versatile smart-casual piece.',
 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80',
 4500.00, 3375.00, 45, 25.00, 1125.00),

(10, 2,  10, 'Tommy Hilfiger Striped Shirt Dress',
 'Women\'s Clothing', 'Tommy Hilfiger',
 'Classic stripe shirt dress with button-down front and belted waist.',
 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&q=80',
 6500.00, 4875.00, 25, 25.00, 1625.00),

(17, 4,  1,  'Adidas Trefoil Snapback Cap',
 'Accessories', 'Adidas',
 'Structured six-panel cap with flat brim and embroidered Trefoil logo.',
 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80',
 1800.00, 1350.00, 100, 25.00, 450.00),

(31, 7,  10, 'Tommy Hilfiger Festive Kurta Set',
 'Ethnic Wear', 'Tommy Hilfiger',
 'Elegant block-print kurta set for Dashain and festive occasions.',
 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=80',
 5500.00, 4125.00, 20, 25.00, 1375.00),

-- 20% off
(4,  1,  4,  'Levi\'s 511 Slim Fit Jeans',
 'Men\'s Clothing', 'Levi\'s',
 'The iconic 511 slim fit in flexible stretch denim for all-day comfort.',
 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
 5500.00, 4400.00, 40, 20.00, 1100.00),

(15, 3,  8,  'Under Armour HOVR Phantom 3 Shoes',
 'Footwear', 'Under Armour',
 'UA HOVR technology returns energy back to your foot with every stride.',
 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500&q=80',
 16000.00, 12800.00, 15, 20.00, 3200.00),

(29, 6,  3,  'Puma Evostripe Hoodie',
 'Sports & Fitness', 'Puma',
 'Comfortable mid-layer hoodie in moisture-wicking fabric for warm-ups.',
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80',
 3800.00, 3040.00, 40, 20.00, 760.00),

(48, 10, 10, 'Tommy Hilfiger Double-Strap Leather Watch',
 'Watches & Jewelry', 'Tommy Hilfiger',
 'Two-tone case with dual-strap design — leather and mesh. Includes gift box.',
 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500&q=80',
 12000.00, 9600.00, 12, 20.00, 2400.00);

-- ============================================================
-- REVIEWS (30) — varied products and users
-- ============================================================
INSERT INTO reviews (user_id, product_id, rating, user_name, comment) VALUES
(1,  1,  5, 'Aarav Sharma',        'Excellent jacket! The quality is top-notch and the fit is perfect. Highly recommend NepStyle for branded clothing.'),
(2,  2,  4, 'Priya Thapa',         'Great Dri-FIT tee — stays dry even during heavy workouts. Wish it came in more colours but very happy overall.'),
(3,  3,  5, 'Bikram Rai',          'These jeans are incredibly comfortable. The stretch denim is perfect for all-day wear. True to size as well.'),
(4,  4,  4, 'Sita Gurung',         'Lovely linen shirt for the Kathmandu heat. Feels premium and the slim fit looks very sharp.'),
(5,  5,  5, 'Rohan Karki',         'The Tommy polo is worth every paisa. Fabric is thick, colour hasn\'t faded after 5 washes. Very impressed.'),
(6,  6,  5, 'Anita Maharjan',      'Beautiful floral dress, exactly as shown in pictures. Fabric is light and comfortable. Delivery was fast too!'),
(7,  7,  4, 'Suresh Tamang',       'The wrap dress fits amazingly. Got so many compliments at the office. Will definitely order more from NepStyle.'),
(8,  8,  5, 'Kavita Shrestha',     'The Calvin Klein blazer is stunning. Tailoring is excellent and it looks far more expensive than it was!'),
(9,  9,  4, 'Dipesh Adhikari',     'Good compression tights. Keeps everything in place during runs. Dries very quickly which I appreciate.'),
(10, 10, 5, 'Manisha Bajracharya', 'Shirt dress is perfect. The belt gives it a polished look. I wore it to a work event and felt amazing.'),
(1,  11, 5, 'Aarav Sharma',        'Nike never disappoints! These Air Max 270s are incredibly comfortable. Worth every paisa for the quality.'),
(2,  12, 4, 'Priya Thapa',         'Ultraboosts live up to the hype. Running feels effortless. Delivery was quicker than expected.'),
(3,  13, 5, 'Bikram Rai',          'Puma RS-X3 is a real head-turner. Very comfortable sole and the build quality is solid.'),
(4,  14, 4, 'Sita Gurung',         'Classic Reeboks are timeless. Clean white looks great with everything. Good quality leather upper.'),
(5,  16, 5, 'Rohan Karki',         'The Calvin Klein belt is superb. Reversible design means I get two looks for the price of one. Highly recommend.'),
(6,  17, 4, 'Anita Maharjan',      'Tommy wallet is slim and well-made. Plenty of card slots and the leather quality is noticeably good.'),
(7,  21, 5, 'Suresh Tamang',       'My kids love these overalls! Very durable and the denim is soft. Zero complaints after 2 months of daily use.'),
(8,  22, 4, 'Kavita Shrestha',     'The Nike tracksuit for my son is great quality. Zips up nicely and the Dri-FIT keeps him comfortable during sport.'),
(9,  26, 5, 'Dipesh Adhikari',     'HeatGear really does work! Stayed cool and dry during my morning runs. Will buy more colours.'),
(10, 30, 4, 'Manisha Bajracharya', 'Nano X1 shoes are brilliant for CrossFit. Stable during lifting and flexible for box jumps. Very happy with the purchase.'),
(1,  31, 5, 'Aarav Sharma',        'Wore the kurta set for Dashain and got so many compliments! Fits true to size and stitching is excellent.'),
(2,  32, 4, 'Priya Thapa',         'The Zara kurti is beautiful. Embroidery looks handmade quality. Paired it with my white palazzo and looked stunning.'),
(3,  36, 5, 'Bikram Rai',          'Perfect hoodie for Kathmandu winters. Soft fleece inside, not too bulky. Looks stylish too, not just functional.'),
(4,  37, 5, 'Sita Gurung',         'Nike Therma-FIT jacket is excellent. Warm without being heavy, and it fits perfectly over a base layer.'),
(5,  38, 4, 'Rohan Karki',         'Adidas fleece jacket is very cosy. The three stripes are subtle and it looks clean. Would buy again.'),
(6,  41, 5, 'Anita Maharjan',      'Very sturdy backpack. My 15-inch laptop fits easily. I commute daily and it shows no wear after 3 months.'),
(7,  42, 4, 'Suresh Tamang',       'Nike duffel bag is massive and well-built. Separate shoe compartment is a game changer for the gym.'),
(8,  46, 5, 'Kavita Shrestha',     'Elegant chronograph watch with a classic look. Accurate timekeeping and the leather strap is genuine quality.'),
(9,  47, 4, 'Dipesh Adhikari',     'Adidas digital watch is great value. Easy to read display and the 100m water resistance is reassuring.'),
(10, 49, 5, 'Manisha Bajracharya', 'The Tommy double-strap watch is stunning. Came beautifully boxed — bought it as a gift and everyone loved it.');

-- ============================================================
-- Summary
-- ============================================================
SELECT 'Seeding complete!' AS status;
SELECT COUNT(*) AS total_categories     FROM categories;
SELECT COUNT(*) AS total_brands         FROM brands;
SELECT COUNT(*) AS total_users          FROM users;
SELECT COUNT(*) AS total_products       FROM products;
SELECT COUNT(*) AS total_flash_products FROM flash_sale_products;
SELECT COUNT(*) AS total_reviews        FROM reviews;
