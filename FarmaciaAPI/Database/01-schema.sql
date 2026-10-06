-- ============================================================================
--  Proyecto : FarmaciaAPI - Web API con ASP.NET Core
--  Motor    : MySQL 8.4
--  Archivo  : 01-schema.sql
--
--  Crea la base de datos, las tablas, el usuario de la aplicacion y los datos
--  de prueba. El script es idempotente: se puede ejecutar varias veces sin
--  duplicar informacion.
--
--  Ejecutar con:
--      mysql -u root -p < Database/01-schema.sql
--
--  O desde MySQL Workbench: abrir el archivo y pulsar el rayo (Execute).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Base de datos
-- ---------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS farmacia
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE farmacia;

-- ---------------------------------------------------------------------------
-- 2. Usuario dedicado para la aplicacion
--    Buena practica: la API no se conecta como root, sino con un usuario que
--    solo tiene permisos sobre la base de datos farmacia.
--    Cambia la contrasena si lo deseas, pero recuerda actualizarla tambien en
--    appsettings.json.
-- ---------------------------------------------------------------------------
CREATE USER IF NOT EXISTS 'farmacia_app'@'localhost'
    IDENTIFIED BY 'Farmacia2026*';

GRANT SELECT, INSERT, UPDATE, DELETE ON farmacia.* TO 'farmacia_app'@'localhost';
FLUSH PRIVILEGES;

-- ---------------------------------------------------------------------------
-- 3. Tabla MEDICAMENTOS (CRUD del MedicamentosController)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicamentos (
    id                 INT             NOT NULL AUTO_INCREMENT,
    nombre             VARCHAR(150)    NOT NULL,
    laboratorio        VARCHAR(100)    NOT NULL,
    descripcion        TEXT            NULL,
    precio             DECIMAL(10,2)   NOT NULL,
    stock              INT             NOT NULL DEFAULT 0,
    requiere_receta    BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha_vencimiento  DATE            NULL,
    activo             BOOLEAN         NOT NULL DEFAULT TRUE,
    fecha_registro     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_medicamentos_nombre (nombre),
    CONSTRAINT ck_medicamentos_precio CHECK (precio >= 0),
    CONSTRAINT ck_medicamentos_stock  CHECK (stock  >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ---------------------------------------------------------------------------
-- 4. Tabla CLIENTES (CRUD del ClientesController)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    id                 INT             NOT NULL AUTO_INCREMENT,
    nombres            VARCHAR(100)    NOT NULL,
    apellidos          VARCHAR(100)    NOT NULL,
    documento          VARCHAR(20)     NOT NULL,
    telefono           VARCHAR(20)     NULL,
    email              VARCHAR(150)    NULL,
    direccion          VARCHAR(250)    NULL,
    fecha_nacimiento   DATE            NULL,
    activo             BOOLEAN         NOT NULL DEFAULT TRUE,
    fecha_registro     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_clientes_documento (documento)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ---------------------------------------------------------------------------
-- 5. Tabla AUDITORIA
--    La escribe nuestro servicio propio IAuditoriaServicio cada vez que un
--    controlador crea, modifica o elimina un registro.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
    id          INT           NOT NULL AUTO_INCREMENT,
    entidad     VARCHAR(50)   NOT NULL,
    operacion   VARCHAR(20)   NOT NULL,
    id_registro INT           NULL,
    detalle     VARCHAR(500)  NULL,
    usuario     VARCHAR(100)  NULL,
    fecha       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_auditoria_fecha (fecha)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ---------------------------------------------------------------------------
-- 6. Datos de prueba
--    Usamos INSERT IGNORE con ids explicitos: si el script se ejecuta de nuevo
--    las filas choquan con la llave primaria y MySQL simplemente las ignora.
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO medicamentos
    (id, nombre, laboratorio, descripcion, precio, stock, requiere_receta, fecha_vencimiento)
VALUES
    (1, 'Paracetamol 500mg', 'Genfar',       'Analgesico y antipiretico, caja por 20 tabletas',  4500.00, 150, FALSE, '2027-06-30'),
    (2, 'Ibuprofeno 400mg',  'MK',           'Antiinflamatorio no esteroideo, caja por 10',      6800.00,  90, FALSE, '2027-01-15'),
    (3, 'Amoxicilina 500mg', 'La Sante',     'Antibiotico de amplio espectro, 12 capsulas',     12300.00,  40, TRUE,  '2026-11-20'),
    (4, 'Loratadina 10mg',   'Tecnoquimicas','Antihistaminico para alergias, 10 tabletas',       5200.00, 120, FALSE, '2028-03-10'),
    (5, 'Omeprazol 20mg',    'Genfar',       'Protector gastrico, caja por 14 capsulas',         9900.00,  75, FALSE, '2027-09-01'),
    (6, 'Losartan 50mg',     'Procaps',      'Antihipertensivo, caja por 30 tabletas',          18500.00,  30, TRUE,  '2027-04-25');

INSERT IGNORE INTO clientes
    (id, nombres, apellidos, documento, telefono, email, direccion, fecha_nacimiento)
VALUES
    (1, 'Luis',    'Calderon', '22-1392', '3101234567', 'luis.calderon@correo.com', 'Calle 45 # 12-30',   '1998-05-14'),
    (2, 'Rafael',  'Urena',    '22-1836', '3115558899', 'rafael.urena@correo.com',  'Carrera 7 # 80-21',  '1999-11-02'),
    (3, 'Maria',   'Gomez',    '1020304051','3124447788','maria.gomez@correo.com',  'Av. 68 # 25-10',     '1992-02-28'),
    (4, 'Sofia',   'Martinez', '1020304053','3139996655','sofia.martinez@correo.com','Diagonal 50 # 9-14','2000-08-19');

-- ---------------------------------------------------------------------------
-- 7. Verificacion
-- ---------------------------------------------------------------------------
SELECT 'medicamentos' AS tabla, COUNT(*) AS registros FROM medicamentos
UNION ALL
SELECT 'clientes',               COUNT(*) FROM clientes
UNION ALL
SELECT 'auditoria',              COUNT(*) FROM auditoria;
