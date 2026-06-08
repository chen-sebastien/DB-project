DROP DATABASE IF EXISTS pet_hotel;
CREATE DATABASE pet_hotel;
USE pet_hotel;

-- 1. 系統設定表 (用來存營業時間等設定)
CREATE TABLE settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` VARCHAR(255) NOT NULL
);

-- 預設營業時間為 09:00 ~ 21:00
INSERT INTO settings (`key`, `value`) VALUES 
('business_start_time', '09:00'),
('business_end_time', '21:00');

-- 2. 員工帳號表 (用來做登入驗證與權限管理)
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('Admin', 'Staff') DEFAULT 'Staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 預設一個管理員帳號：admin / 密碼：admin123
-- 雜湊值是用 bcrypt 對 'admin123' 加密產生的
INSERT INTO employees (username, password_hash, name, role) VALUES 
('admin', '$2b$10$EpYnVKjxt1K30x5sLpykpeC7Dfe4QWn00hW9Lz3x9v2BvJqCqCqCq', '老闆', 'Admin');

-- 3. 飼主資料表
CREATE TABLE owners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100)
);

-- 4. 寵物資料表 (對應品種、過敏史、大/中/小型犬)
CREATE TABLE pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    species VARCHAR(20) NOT NULL,
    breed VARCHAR(50),            -- 品種
    size VARCHAR(20) NOT NULL,    -- 體型 (Small, Medium, Large)
    medical_history TEXT,         -- 過敏史
    notes TEXT,                   -- 行為備註 (如：需戴頭套)
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

-- 5. 房型資料表 (對應大/中/小型犬房)
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    room_type VARCHAR(20) NOT NULL -- 房型限制 (Small, Medium, Large)
);

-- 6. 美容師資料表
CREATE TABLE groomers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 7. 預約核心表 (對應美容排程、房間預訂、衝堂檢核的基礎)
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NOT NULL,
    room_id INT,                  -- 若只有純美容，此欄位可為 NULL
    groomer_id INT,               -- 若只有純住宿，此欄位可為 NULL
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- 狀態 (Pending, Confirmed, Cancelled, Completed)
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (groomer_id) REFERENCES groomers(id) ON DELETE SET NULL
);

-- 8. 餵食清單表 (對應餵食清單管理)
CREATE TABLE feeding_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    feeding_time DATETIME NOT NULL,
    food_info TEXT NOT NULL,      -- 飼料種類或份量說明
    is_fed BOOLEAN DEFAULT FALSE, -- 狀態：是否已餵食 (0=否, 1=是)
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- 9. 操作軌跡記錄表 (Audit Log)
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    action VARCHAR(100) NOT NULL, -- 'CREATE_RESERVATION', 'DELETE_RESERVATION', 'UPDATE_SETTINGS'
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ==========================================
-- 插入初始測試資料 (方便前端直接有資料可以撈)
-- ==========================================

-- 預設 5 間房間 (2小、2中、1大)
INSERT INTO rooms (room_number, room_type) VALUES 
('S01', 'Small'), ('S02', 'Small'), 
('M01', 'Medium'), ('M02', 'Medium'), 
('L01', 'Large');

-- 預設 4 位美容師
INSERT INTO groomers (name) VALUES ('Alice'), ('Bob'), ('Charlie'), ('Diana');