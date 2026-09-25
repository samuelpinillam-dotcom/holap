CREATE DATABASE IF NOT EXISTS Tienda_Electrodomesticos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Tienda_Electrodomesticos;

CREATE TABLE usuarios (
  id_usuario       INT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(80) NOT NULL,
  apellido         VARCHAR(80) NOT NULL,
  tipo_documento   ENUM('CC','TI','CE') NOT NULL,
  numero_documento VARCHAR(20) NOT NULL UNIQUE,
  email            VARCHAR(120) NOT NULL UNIQUE,
  password         VARCHAR(255) NOT NULL,
  rol              ENUM('Administrador','Empleado','Logística','Cliente') NOT NULL,
  direccion        VARCHAR(160) NOT NULL,
  telefono         VARCHAR(20) NOT NULL,
  estado           ENUM('Activo','Inactivo') DEFAULT 'Activo',
  fecha_registro   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE productos (
  id_producto    INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,
  descripcion    TEXT,
  precio         DECIMAL(12,2) NOT NULL DEFAULT 0,
  costo          DECIMAL(12,2) NOT NULL DEFAULT 0,
  cantidad       INT NOT NULL DEFAULT 0,
  stock_minimo   INT NOT NULL DEFAULT 3,
  estado         ENUM('Activo','Inactivo') DEFAULT 'Activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE clientes (
  id_cliente     INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,
  email          VARCHAR(120),
  telefono       VARCHAR(20),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE proveedores (
  id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(120) NOT NULL,
  contacto     VARCHAR(120),
  productos    TEXT,
  fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE promociones (
  id_promocion INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(120) NOT NULL,
  descuento    TINYINT UNSIGNED NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,
  estado       ENUM('Activa','Inactiva') DEFAULT 'Activa'
) ENGINE=InnoDB;

CREATE TABLE ventas (
  id_venta       INT AUTO_INCREMENT PRIMARY KEY,
  numero         VARCHAR(20) NOT NULL UNIQUE,
  id_cliente     INT NULL,
  id_usuario     INT NULL,
  cliente_nombre VARCHAR(160),
  subtotal       DECIMAL(12,2) DEFAULT 0,
  descuento      DECIMAL(12,2) DEFAULT 0,
  iva            DECIMAL(12,2) DEFAULT 0,
  total          DECIMAL(12,2) DEFAULT 0,
  id_promocion   INT NULL,
  fecha          DATETIME DEFAULT CURRENT_TIMESTAMP,
  estado         ENUM('Activa','Enviada','Anulada') DEFAULT 'Activa'
) ENGINE=InnoDB;

CREATE TABLE venta_items (
  id_item     INT AUTO_INCREMENT PRIMARY KEY,
  id_venta    INT NOT NULL,
  id_producto INT NULL,
  nombre      VARCHAR(120),
  precio      DECIMAL(12,2),
  cantidad    INT,
  FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE devoluciones (
  id_devolucion   INT AUTO_INCREMENT PRIMARY KEY,
  id_venta        INT NOT NULL,
  venta_numero    VARCHAR(20),
  id_item         INT,
  id_producto     INT,
  producto_nombre VARCHAR(120),
  cantidad        INT NOT NULL,
  motivo          VARCHAR(255) NOT NULL,
  estado          ENUM('Pendiente','Validada') DEFAULT 'Pendiente',
  nota_credito    VARCHAR(20) NULL,
  fecha           DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE pedidos (
  id_pedido INT AUTO_INCREMENT PRIMARY KEY,
  cliente   VARCHAR(160),
  direccion VARCHAR(200) NOT NULL,
  estado    ENUM('Preparando','Enviado','Entregado') DEFAULT 'Preparando',
  fecha     DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE actividad (
  id_actividad INT AUTO_INCREMENT PRIMARY KEY,
  texto        VARCHAR(255) NOT NULL,
  fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;