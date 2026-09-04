import 'dart:io';
import 'package:mysql1/mysql1.dart';

/// Auto-reconnecting MySQL connection wrapper.
/// Services store a ManagedConnection; on every query it detects stale sockets
/// and transparently reconnects before retrying — no more 500s after idle periods.
class ManagedConnection {
  MySqlConnection? _conn;
  final ConnectionSettings _settings;

  ManagedConnection(this._settings);

  bool _isStaleError(Object e) {
    final s = e.toString().toLowerCase();
    return s.contains('socket') ||
        s.contains('closed') ||
        s.contains('broken pipe') ||
        s.contains('connection');
  }

  Future<MySqlConnection> _live() async {
    if (_conn == null) {
      _conn = await MySqlConnection.connect(_settings);
      print('DB: connection (re)established.');
    }
    return _conn!;
  }

  Future<Results> query(String sql, [List<Object?>? values]) async {
    try {
      return await (await _live()).query(sql, values);
    } catch (e) {
      if (_isStaleError(e)) {
        print('DB: stale connection detected, reconnecting and retrying…');
        try { await _conn?.close(); } catch (_) {}
        _conn = null;
        return await (await _live()).query(sql, values);
      }
      rethrow;
    }
  }

  Future<T?> transaction<T>(Future<T> Function(TransactionContext) fn) async {
    try {
      return await (await _live()).transaction(fn);
    } catch (e) {
      if (_isStaleError(e)) {
        print('DB: stale connection on transaction, reconnecting…');
        try { await _conn?.close(); } catch (_) {}
        _conn = null;
        return await (await _live()).transaction(fn);
      }
      rethrow;
    }
  }

  Future<void> close() async {
    try { await _conn?.close(); } catch (_) {}
    _conn = null;
  }
}

class Database {
  static ManagedConnection? _managed;

  static ConnectionSettings _buildSettings() => ConnectionSettings(
        host: Platform.environment['MYSQLHOST'] ??
            Platform.environment['DB_HOST'] ??
            'localhost',
        port: int.tryParse(Platform.environment['MYSQLPORT'] ??
                Platform.environment['DB_PORT'] ??
                '') ??
            3306,
        user: Platform.environment['MYSQLUSER'] ??
            Platform.environment['DB_USER'] ??
            'root',
        password: Platform.environment['MYSQLPASSWORD'] ??
            Platform.environment['DB_PASSWORD'] ??
            'password',
        db: Platform.environment['MYSQLDATABASE'] ??
            Platform.environment['DB_NAME'] ??
            'nepstyle',
      );

  static Future<ManagedConnection> getConnection() async {
    if (_managed == null) {
      final settings = _buildSettings();
      // Bootstrap: raw connection for first-run table setup
      final raw = await MySqlConnection.connect(settings);
      print('Database connection established.');
      try {
        await _ensureTablesExist(raw);
      } catch (e) {
        await raw.close();
        rethrow;
      }
      _managed = ManagedConnection(settings);
      _managed!._conn = raw; // hand over the bootstrap connection
    }
    return _managed!;
  }

  static Future<void> closeConnection() async {
    if (_managed != null) {
      await _managed!.close();
      _managed = null;
      print('Database connection closed.');
    }
  }

  static Future<void> _ensureTablesExist(MySqlConnection connection) async {
    try {
      await connection.query('''
 CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(255) NOT NULL,
  email_address VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  otp VARCHAR(6),
  email_verified ENUM('0', '1') DEFAULT '0',
  address VARCHAR(500),
  profile_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
      ''');
      print('Ensured "users" table exists.');

      await connection.query('''
        CREATE TABLE IF NOT EXISTS categories (
          category_id INT AUTO_INCREMENT PRIMARY KEY,
          category_name VARCHAR(255) NOT NULL,
          category_thumbnail VARCHAR(255),
          category_description VARCHAR(255),
          FULLTEXT (category_name, category_description),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      ''');
      print('Ensured "categories" table exists.');

      await connection.query('''
CREATE TABLE IF NOT EXISTS categorized_products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  product_description VARCHAR(500),
  product_thumbnail VARCHAR(500),
  normal_price DECIMAL(10, 2) NOT NULL,
  sell_price DECIMAL(10, 2) NOT NULL,
  total_product_count INT NOT NULL,
  category_id INT NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);
''');
      print('Ensured "categorized_products" table exists.');

      await connection.query('''
  CREATE TABLE IF NOT EXISTS brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL,
    brand_thumbnail VARCHAR(500),
    brand_description  VARCHAR(500),
    FULLTEXT (brand_name, brand_description),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
''');
      print('Ensured "brands" table exists.');

      await connection.query('''
  CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    brand_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    product_description VARCHAR(500),
    product_thumbnail VARCHAR(500),
    FULLTEXT (product_name, product_description),
    normal_price DECIMAL(10, 2) NOT NULL,
    sell_price DECIMAL(10, 2) NOT NULL,
    total_product_count INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id)
  );
''');
      print('Ensured "products" table exists.');

      await connection.query('''
  CREATE TABLE IF NOT EXISTS flash_sale_products (
    flash_sale_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    brand_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    product_description VARCHAR(500),
    product_thumbnail VARCHAR(500),
    normal_price DECIMAL(10, 2) NOT NULL,
    sell_price DECIMAL(10, 2) NOT NULL,
    total_product_count INT NOT NULL,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    discounted_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id)
  );
''');
      print('Ensured "flash_sale_products" table exists.');

      await connection.query('''
  CREATE TABLE IF NOT EXISTS cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_thumbnail VARCHAR(500),
    product_description  VARCHAR(1000),
    normal_price DECIMAL(10, 2) NOT NULL,
    sell_price DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2),
    discounted_price DECIMAL(10, 2),
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) AS (quantity * COALESCE(discounted_price, sell_price)) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
  );
''');
      print('Ensured "carts" table exists.');

      await connection.query('''
  CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_thumbnail VARCHAR(500),
    product_description  VARCHAR(500),
    normal_price DECIMAL(10, 2) NOT NULL,
    sell_price DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2),
    discounted_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
  );
''');
      print('Ensured "wishlists" table exists.');

      await connection.query('''
CREATE TABLE IF NOT EXISTS user_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    action_type ENUM('view', 'purchase', 'wishlist', 'cart'),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
''');
      print('Ensured "user_activity" table exists.');

      await connection.query('''
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    guest_name VARCHAR(255) NULL,
    guest_phone VARCHAR(20) NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash_on_delivery',
    delivery_location VARCHAR(80) NOT NULL,
    order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
''');
      try { await connection.query('ALTER TABLE orders MODIFY COLUMN user_id INT NULL'); } catch (_) {}
      try { await connection.query('ALTER TABLE orders ADD COLUMN guest_name VARCHAR(255) NULL AFTER user_id'); } catch (_) {}
      try { await connection.query('ALTER TABLE orders ADD COLUMN guest_phone VARCHAR(20) NULL AFTER guest_name'); } catch (_) {}
      print('Ensured "order" table exists.');

      await connection.query('''
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * price) STORED,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
''');
      print('Ensured "order item" table exists.');

      await connection.query('''
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    comment VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
''');
      print('Ensured "reviews" table exists.');

      await connection.query('''
        CREATE TABLE IF NOT EXISTS admin_users (
          admin_id INT AUTO_INCREMENT PRIMARY KEY,
          fullname VARCHAR(255) NOT NULL,
          email_address VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      ''');
      print('Ensured "admin_users" table exists.');

      await connection.query(
        "INSERT IGNORE INTO admin_users (fullname, email_address, password) "
        "VALUES ('Super Admin', 'admin@nepstyle.com', SHA2('admin123', 256))",
      );
      print('✅ Admin credentials ready — email: admin@nepstyle.com  password: admin123');
    } catch (e) {
      print('Error ensuring tables exist: $e');
      rethrow;
    }
  }
}
