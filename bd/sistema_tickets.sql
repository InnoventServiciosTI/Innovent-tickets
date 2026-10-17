-- ============================================================
-- INNOVENT - SISTEMA DE GESTIÓN DE TICKETS
-- Base de datos: innovent_ticketing
-- MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS innovent_ticketing
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE innovent_ticketing;


-- ============================================================
-- 1. ROLES
-- ============================================================

CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso completo al sistema'),
('Tecnico', 'Gestiona y resuelve tickets'),
('Cliente', 'Crea y consulta sus tickets');


-- ============================================================
-- 2. USUARIOS
-- ============================================================

CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    telefono VARCHAR(30),

    rol_id INT UNSIGNED NOT NULL,

    estado ENUM(
        'Activo',
        'Inactivo',
        'Bloqueado'
    ) DEFAULT 'Activo',

    ultimo_acceso DATETIME NULL,

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_usuario_email (email),
    INDEX idx_usuario_rol (rol_id),
    INDEX idx_usuario_estado (estado)

) ENGINE=InnoDB;


-- ============================================================
-- 3. CATEGORÍAS
-- ============================================================

CREATE TABLE categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL UNIQUE,

    descripcion VARCHAR(255),

    estado ENUM(
        'Activa',
        'Inactiva'
    ) DEFAULT 'Activa',

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;


INSERT INTO categorias
(nombre, descripcion)
VALUES
('Soporte técnico', 'Problemas relacionados con equipos y software'),
('Facturación', 'Consultas relacionadas con facturación y pagos'),
('Consulta', 'Consultas generales'),
('Solicitud', 'Solicitudes de servicios o recursos'),
('Redes', 'Problemas relacionados con conectividad y redes'),
('Seguridad', 'Incidentes relacionados con seguridad informática'),
('Desarrollo web', 'Problemas o solicitudes relacionadas con sitios web');


-- ============================================================
-- 4. PRIORIDADES
-- ============================================================

CREATE TABLE prioridades (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(50) NOT NULL UNIQUE,

    nivel TINYINT UNSIGNED NOT NULL,

    tiempo_respuesta_horas INT UNSIGNED,

    descripcion VARCHAR(255)

) ENGINE=InnoDB;


INSERT INTO prioridades
(nombre, nivel, tiempo_respuesta_horas, descripcion)
VALUES
('Baja', 1, 72, 'Solicitud de baja urgencia'),
('Media', 2, 24, 'Solicitud de prioridad normal'),
('Alta', 3, 8, 'Solicitud que requiere atención prioritaria'),
('Critica', 4, 2, 'Incidente crítico');


-- ============================================================
-- 5. ESTADOS DE TICKETS
-- ============================================================

CREATE TABLE estados_ticket (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(50) NOT NULL UNIQUE,

    descripcion VARCHAR(255)

) ENGINE=InnoDB;


INSERT INTO estados_ticket
(nombre, descripcion)
VALUES
('Abierto', 'Ticket creado y pendiente de atención'),
('En progreso', 'Ticket actualmente en proceso'),
('Resuelto', 'Problema solucionado'),
('Cerrado', 'Ticket finalizado');


-- ============================================================
-- 6. TICKETS
-- ============================================================

CREATE TABLE tickets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    codigo VARCHAR(30) NOT NULL UNIQUE,

    cliente_id INT UNSIGNED NOT NULL,

    tecnico_id INT UNSIGNED NULL,

    categoria_id INT UNSIGNED NOT NULL,

    prioridad_id INT UNSIGNED NOT NULL,

    estado_id INT UNSIGNED NOT NULL,

    titulo VARCHAR(150) NOT NULL,

    descripcion TEXT NOT NULL,

    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion DATETIME
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    fecha_asignacion DATETIME NULL,

    fecha_resolucion DATETIME NULL,

    fecha_cierre DATETIME NULL,

    CONSTRAINT fk_ticket_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ticket_tecnico
        FOREIGN KEY (tecnico_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_ticket_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ticket_prioridad
        FOREIGN KEY (prioridad_id)
        REFERENCES prioridades(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ticket_estado
        FOREIGN KEY (estado_id)
        REFERENCES estados_ticket(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_ticket_cliente (cliente_id),
    INDEX idx_ticket_tecnico (tecnico_id),
    INDEX idx_ticket_estado (estado_id),
    INDEX idx_ticket_prioridad (prioridad_id),
    INDEX idx_ticket_categoria (categoria_id),
    INDEX idx_ticket_fecha (fecha_creacion)

) ENGINE=InnoDB;


-- ============================================================
-- 7. COMENTARIOS
-- ============================================================

CREATE TABLE comentarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    ticket_id BIGINT UNSIGNED NOT NULL,

    usuario_id INT UNSIGNED NOT NULL,

    comentario TEXT NOT NULL,

    interno BOOLEAN DEFAULT FALSE,

    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comentario_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_comentario_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_comentario_ticket (ticket_id),
    INDEX idx_comentario_usuario (usuario_id)

) ENGINE=InnoDB;


-- ============================================================
-- 8. ADJUNTOS
-- ============================================================

CREATE TABLE adjuntos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    ticket_id BIGINT UNSIGNED NOT NULL,

    usuario_id INT UNSIGNED NOT NULL,

    nombre_original VARCHAR(255) NOT NULL,

    nombre_archivo VARCHAR(255) NOT NULL,

    ruta VARCHAR(500) NOT NULL,

    tipo_mime VARCHAR(100),

    tamanio BIGINT UNSIGNED,

    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_adjunto_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_adjunto_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT

) ENGINE=InnoDB;


-- ============================================================
-- 9. HISTORIAL DE TICKETS
-- ============================================================

CREATE TABLE historial_tickets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    ticket_id BIGINT UNSIGNED NOT NULL,

    usuario_id INT UNSIGNED NOT NULL,

    accion VARCHAR(100) NOT NULL,

    campo VARCHAR(100),

    valor_anterior TEXT,

    valor_nuevo TEXT,

    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historial_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_historial_ticket (ticket_id),
    INDEX idx_historial_fecha (fecha)

) ENGINE=InnoDB;


-- ============================================================
-- 10. NOTIFICACIONES
-- ============================================================

CREATE TABLE notificaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT UNSIGNED NOT NULL,

    ticket_id BIGINT UNSIGNED NULL,

    titulo VARCHAR(150) NOT NULL,

    mensaje TEXT NOT NULL,

    tipo ENUM(
        'ticket',
        'comentario',
        'asignacion',
        'estado',
        'sistema'
    ) DEFAULT 'sistema',

    leida BOOLEAN DEFAULT FALSE,

    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    fecha_lectura DATETIME NULL,

    CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_notificacion_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_notificacion_usuario (usuario_id),
    INDEX idx_notificacion_leida (leida)

) ENGINE=InnoDB;


-- ============================================================
-- 11. SESIONES
-- ============================================================

CREATE TABLE sesiones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT UNSIGNED NOT NULL,

    token VARCHAR(255) NOT NULL UNIQUE,

    ip VARCHAR(45),

    user_agent TEXT,

    fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,

    fecha_expiracion DATETIME NOT NULL,

    activa BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_sesion_token (token),
    INDEX idx_sesion_usuario (usuario_id)

) ENGINE=InnoDB;


-- ============================================================
-- 12. CLIENTES / INFORMACIÓN ADICIONAL
-- ============================================================

CREATE TABLE clientes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT UNSIGNED NOT NULL UNIQUE,

    empresa VARCHAR(150),

    documento VARCHAR(50),

    direccion VARCHAR(255),

    ciudad VARCHAR(100) DEFAULT 'Cartagena',

    departamento VARCHAR(100) DEFAULT 'Bolívar',

    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cliente_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE

) ENGINE=InnoDB;


-- ============================================================
-- 13. TÉCNICOS
-- ============================================================

CREATE TABLE tecnicos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT UNSIGNED NOT NULL UNIQUE,

    especialidad VARCHAR(150),

    disponibilidad ENUM(
        'Disponible',
        'Ocupado',
        'Ausente'
    ) DEFAULT 'Disponible',

    fecha_ingreso DATE,

    CONSTRAINT fk_tecnico_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE

) ENGINE=InnoDB;


-- ============================================================
-- 14. CONFIGURACIÓN DEL SISTEMA
-- ============================================================

CREATE TABLE configuracion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    clave VARCHAR(100) NOT NULL UNIQUE,

    valor TEXT,

    descripcion VARCHAR(255),

    fecha_actualizacion DATETIME
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB;


INSERT INTO configuracion
(clave, valor, descripcion)
VALUES
('empresa_nombre', 'Innovent Servicios TI', 'Nombre de la empresa'),
('empresa_email', 'innoventdesarrollodesoftware@gmail.com', 'Correo principal'),
('empresa_ciudad', 'Cartagena, Bolívar', 'Ubicación principal'),
('tickets_codigo_prefijo', 'INV', 'Prefijo utilizado para tickets');


-- ============================================================
-- 15. DATOS DE PRUEBA
-- ============================================================

-- IMPORTANTE:
-- Estas contraseñas son únicamente para desarrollo.
-- En producción deben almacenarse mediante bcrypt.

INSERT INTO usuarios
(
    nombre,
    apellido,
    email,
    password_hash,
    telefono,
    rol_id
)
VALUES
(
    'Administrador',
    'Innovent',
    'admin@innovent.com',
    '$2b$10$REEMPLAZAR_CON_HASH_BCRYPT',
    '3000000000',
    1
),
(
    'Tecnico',
    'Innovent',
    'tecnico@innovent.com',
    '$2b$10$REEMPLAZAR_CON_HASH_BCRYPT',
    '3000000001',
    2
),
(
    'Cliente',
    'Demo',
    'cliente@innovent.com',
    '$2b$10$REEMPLAZAR_CON_HASH_BCRYPT',
    '3000000002',
    3
);


-- ============================================================
-- 16. VISTA GENERAL DE TICKETS
-- ============================================================

CREATE OR REPLACE VIEW vista_tickets AS

SELECT

    t.id,

    t.codigo,

    t.titulo,

    t.descripcion,

    CONCAT(
        cliente.nombre,
        ' ',
        COALESCE(cliente.apellido, '')
    ) AS cliente,

    cliente.email AS cliente_email,

    CASE
        WHEN tecnico.id IS NULL
        THEN 'Sin asignar'
        ELSE CONCAT(
            tecnico.nombre,
            ' ',
            COALESCE(tecnico.apellido, '')
        )
    END AS tecnico,

    c.nombre AS categoria,

    p.nombre AS prioridad,

    e.nombre AS estado,

    t.fecha_creacion,

    t.fecha_actualizacion,

    t.fecha_resolucion,

    t.fecha_cierre

FROM tickets t

INNER JOIN usuarios cliente
    ON t.cliente_id = cliente.id

LEFT JOIN usuarios tecnico
    ON t.tecnico_id = tecnico.id

INNER JOIN categorias c
    ON t.categoria_id = c.id

INNER JOIN prioridades p
    ON t.prioridad_id = p.id

INNER JOIN estados_ticket e
    ON t.estado_id = e.id;


-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================