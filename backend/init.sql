-- 建立資料庫 (如果不存在的話)
CREATE DATABASE IF NOT EXISTS pet_hotel;
USE pet_hotel;

-- 為了避免重複執行報錯，先刪除舊表 (順序很重要，先刪除有關聯的外鍵表)
DROP TABLE IF EXISTS feeding_tasks;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS owners;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS groomers;

-- 1. 飼主資料表
CREATE TABLE owners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100)
);

-- 2. 寵物資料表 (對應企劃：品種、過敏史、大/中/小型犬)
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

-- 3. 房型資料表 (對應企劃：大/中/小型犬房)
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    room_type VARCHAR(20) NOT NULL -- 房型限制 (Small, Medium, Large)
);

-- 4. 美容師資料表
CREATE TABLE groomers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 5. 預約核心表 (對應企劃：美容排程、房間預訂、衝堂檢核的基礎)
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NOT NULL,
    room_id INT,                  -- 若只有純美容，此欄位可為 NULL
    groomer_id INT,               -- 若只有純住宿，此欄位可為 NULL
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- 狀態 (Pending, Active, Completed)
    FOREIGN KEY (pet_id) REFERENCES pets(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (groomer_id) REFERENCES groomers(id)
);

-- 6. 餵食清單表 (對應企劃：餵食清單管理)
CREATE TABLE feeding_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    feeding_time DATETIME NOT NULL,
    food_info TEXT NOT NULL,      -- 飼料種類或份量說明
    is_fed BOOLEAN DEFAULT FALSE, -- 狀態：是否已餵食 (0=否, 1=是)
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- ==========================================
-- 插入初始測試資料 (方便前端直接有資料可以撈)
-- ==========================================

-- 預設 5 間房間 (2小、2中、1大)
INSERT INTO rooms (room_number, room_type) VALUES 
('S01', 'Small'), ('S02', 'Small'), 
('M01', 'Medium'), ('M02', 'Medium'), 
('L01', 'Large');

-- 預設 2 位美容師
INSERT INTO groomers (name) VALUES ('Alice'), ('Bob');