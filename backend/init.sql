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
    avatar LONGTEXT NULL,
    role ENUM('Admin', 'Staff') DEFAULT 'Staff',
    is_reservable TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 預設帳號：
-- 管理員：admin / 密碼：admin123
-- 員工：alice, bob, charlie, diana / 密碼：pawnest123
INSERT INTO employees (username, password_hash, name, role, is_reservable) VALUES 
('admin', '$2b$10$Av.KcKDFSGjFPZa2bFycJOn/BS3E3vz6cgnbDdz3eoeakZ.3IX68u', '老闆', 'Admin', 0),
('alice', '$2b$10$1MFCCrOcswW8Uvv2QyiF9OSsJkm0JrRxXL/Qaxe5oNBC5aDWhu5mu', 'Alice', 'Staff', 1),
('bob', '$2b$10$1MFCCrOcswW8Uvv2QyiF9OSsJkm0JrRxXL/Qaxe5oNBC5aDWhu5mu', 'Bob', 'Staff', 1),
('charlie', '$2b$10$1MFCCrOcswW8Uvv2QyiF9OSsJkm0JrRxXL/Qaxe5oNBC5aDWhu5mu', 'Charlie', 'Staff', 1),
('diana', '$2b$10$1MFCCrOcswW8Uvv2QyiF9OSsJkm0JrRxXL/Qaxe5oNBC5aDWhu5mu', 'Diana', 'Staff', 1);

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
    room_type VARCHAR(20) NOT NULL, -- 房型限制 (Small, Medium, Large)
    daily_rate INT NOT NULL DEFAULT 0
);

-- 6. 美容師資料表
CREATE TABLE groomers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    specialty VARCHAR(100) NULL,
    experience_years INT NULL,
    rating DECIMAL(2,1) NULL DEFAULT 5.0,
    service_count INT NOT NULL DEFAULT 0,
    service_rate INT NOT NULL DEFAULT 0
);

-- 7. 預約核心表 (對應美容排程、房間預訂、衝堂檢核的基礎)
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NOT NULL,
    room_id INT,                  -- 若只有純美容，此欄位可為 NULL
    groomer_id INT,               -- 被指派的服務人員美容師 ID，此欄位可為 NULL
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- 狀態 (Pending, Confirmed, Cancelled, Completed)
    payment_status VARCHAR(20) DEFAULT 'Unpaid', -- 付款狀態 (Unpaid, Held, Released, Refunded)
    needs_feeding TINYINT(1) DEFAULT 1,
    needs_walking TINYINT(1) DEFAULT 0,
    needs_medication TINYINT(1) DEFAULT 0,
    needs_grooming TINYINT(1) DEFAULT 0,
    fed_completed TINYINT(1) DEFAULT 0,
    walk_completed TINYINT(1) DEFAULT 0,
    medication_completed TINYINT(1) DEFAULT 0,
    grooming_completed TINYINT(1) DEFAULT 0,
    room_rate INT NULL,
    grooming_rate INT NULL,
    total_amount INT NULL,
    payment_method VARCHAR(20) NULL,
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
    is_walked BOOLEAN DEFAULT FALSE, -- 狀態：是否已散步
    is_medicated BOOLEAN DEFAULT FALSE, -- 狀態：是否已給藥
    is_groomed BOOLEAN DEFAULT FALSE, -- 狀態：是否已美容
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
INSERT INTO rooms (room_number, room_type, daily_rate) VALUES 
('S01', 'Small', 400), ('S02', 'Small', 400), 
('M01', 'Medium', 600), ('M02', 'Medium', 600), 
('L01', 'Large', 800);

-- 預設 4 位美容師
INSERT INTO groomers (name, specialty, experience_years, rating, service_count, service_rate) VALUES 
('Alice', '大型犬安撫、高齡犬照護', 5, 4.9, 127, 800), 
('Bob', '貓咪照護、特殊毛髮修剪', 3, 4.7, 89, 700), 
('Charlie', '基礎洗沐、剪甲護理', 1, 4.5, 43, 500), 
('Diana', '皮毛精油理療養護', 4, 4.8, 96, 900);