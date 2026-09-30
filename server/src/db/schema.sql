-- =============================================================
--  Inventory System - Database Schema
--  Running `npm run db:setup` executes this file.
--  WARNING: it drops existing tables, so all data is reset.
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_privileges;
DROP TABLE IF EXISTS privileges;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
--  Access control: roles, privileges and the link between them
-- -------------------------------------------------------------

-- A role groups privileges together (e.g. "Admin", "Staff").
-- System roles (is_system = 1) cannot be deleted and always
-- receive every privilege.
CREATE TABLE roles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  is_system   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- A privilege is a single permission, e.g. "products.manage".
-- The backend checks these names before allowing an action.
CREATE TABLE privileges (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  module      VARCHAR(50)  NOT NULL,
  description VARCHAR(255) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many: which privileges belong to which role.
CREATE TABLE role_privileges (
  role_id      INT NOT NULL,
  privilege_id INT NOT NULL,
  PRIMARY KEY (role_id, privilege_id),
  FOREIGN KEY (role_id)      REFERENCES roles(id)      ON DELETE CASCADE,
  FOREIGN KEY (privilege_id) REFERENCES privileges(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id       INT          NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- -------------------------------------------------------------
--  Product catalog
-- -------------------------------------------------------------

CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- `quantity` is the current stock on hand. It is only changed by
-- the Stock and Order modules so every change is recorded in
-- stock_movements.
CREATE TABLE products (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  sku           VARCHAR(50)    NOT NULL UNIQUE,
  name          VARCHAR(150)   NOT NULL,
  description   TEXT           NULL,
  category_id   INT            NULL,
  price         DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost          DECIMAL(10, 2) NOT NULL DEFAULT 0,
  quantity      INT            NOT NULL DEFAULT 0,
  reorder_level INT            NOT NULL DEFAULT 10,
  is_active     TINYINT(1)     NOT NULL DEFAULT 1,
  -- Optional photo, e.g. 'products/3f2c....webp' inside server/uploads/.
  -- Set by the server (services/productImages.ts), never taken from the browser.
  image_path    VARCHAR(255)   NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- -------------------------------------------------------------
--  Stock tracking
-- -------------------------------------------------------------

-- Every change to a product's quantity is logged here.
--   in         = stock received
--   out        = stock removed (damaged, lost, ...)
--   adjustment = stock count corrected to an exact number
--   sale       = stock used by an order
--   return     = stock returned by a cancelled order
-- `quantity_change` is positive for additions, negative for removals.
CREATE TABLE stock_movements (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  product_id      INT          NOT NULL,
  type            ENUM('in', 'out', 'adjustment', 'sale', 'return') NOT NULL,
  quantity_change INT          NOT NULL,
  quantity_after  INT          NOT NULL,
  note            VARCHAR(255) NULL,
  user_id         INT          NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL
);

-- -------------------------------------------------------------
--  Orders
-- -------------------------------------------------------------

CREATE TABLE orders (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_number  VARCHAR(20)    NULL UNIQUE,
  customer_name VARCHAR(150)   NOT NULL,
  status        ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  total         DECIMAL(12, 2) NOT NULL DEFAULT 0,
  note          VARCHAR(255)   NULL,
  created_by    INT            NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- unit_price is copied from the product when the order is created,
-- so later price changes don't rewrite old orders.
CREATE TABLE order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT            NOT NULL,
  product_id INT            NOT NULL,
  quantity   INT            NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal   DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
