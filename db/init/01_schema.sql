-- SD (Ddarungi) Insight Database Schema
-- MySQL 8.0

-- 데이터베이스 선택 (중요!)
USE ddarungi_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievement_defs;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS maintenance_orders;
DROP TABLE IF EXISTS fault_reports;
DROP TABLE IF EXISTS rentals;
DROP TABLE IF EXISTS bikes;
DROP TABLE IF EXISTS station_baseline;
DROP TABLE IF EXISTS station_status;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- Users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Areas table
CREATE TABLE areas (
    area_id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL,
    INDEX idx_area_name (area_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stations table
CREATE TABLE stations (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    area_id INT NOT NULL,
    station_name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    docks_total INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(area_id) ON DELETE RESTRICT,
    INDEX idx_area_id (area_id),
    INDEX idx_location (latitude, longitude),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Station status snapshots
CREATE TABLE station_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    snapshot_ts TIMESTAMP NOT NULL,
    bikes_available INT DEFAULT 0,
    docks_available INT DEFAULT 0,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    UNIQUE KEY unique_station_snapshot (station_id, snapshot_ts),
    INDEX idx_station_id (station_id),
    INDEX idx_snapshot_ts (snapshot_ts DESC),
    INDEX idx_station_snapshot (station_id, snapshot_ts DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Station baseline demand
CREATE TABLE station_baseline (
    baseline_id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    dow INT NOT NULL CHECK (dow BETWEEN 0 AND 6),
    hour INT NOT NULL CHECK (hour BETWEEN 0 AND 23),
    baseline_demand DECIMAL(10, 2) DEFAULT 0,
    samples INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    UNIQUE KEY unique_station_dow_hour (station_id, dow, hour),
    INDEX idx_station_id (station_id),
    INDEX idx_dow_hour (dow, hour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bikes table
CREATE TABLE bikes (
    bike_id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT,
    status ENUM('AVAILABLE', 'IN_USE', 'FAULT', 'MAINTENANCE') DEFAULT 'AVAILABLE',
    purchased_at DATE,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE SET NULL,
    INDEX idx_station_id (station_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rentals table
CREATE TABLE rentals (
    rental_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bike_id INT NOT NULL,
    start_station INT NOT NULL,
    end_station INT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    fee DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (bike_id) REFERENCES bikes(bike_id) ON DELETE RESTRICT,
    FOREIGN KEY (start_station) REFERENCES stations(station_id) ON DELETE RESTRICT,
    FOREIGN KEY (end_station) REFERENCES stations(station_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_bike_id (bike_id),
    INDEX idx_start_time (start_time DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fault reports table
CREATE TABLE fault_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    station_id INT NOT NULL,
    bike_id INT,
    category VARCHAR(50),
    content TEXT NOT NULL,
    photo_url VARCHAR(500),
    status ENUM('RECEIVED', 'IN_PROGRESS', 'DONE', 'REJECTED') DEFAULT 'RECEIVED',
    is_valid BOOLEAN,
    validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE RESTRICT,
    FOREIGN KEY (bike_id) REFERENCES bikes(bike_id) ON DELETE SET NULL,
    INDEX idx_reporter_id (reporter_id),
    INDEX idx_station_id (station_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance orders table
CREATE TABLE maintenance_orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT UNIQUE,
    assignee_id INT NOT NULL,
    priority INT DEFAULT 0,
    status ENUM('ASSIGNED', 'WORKING', 'DONE', 'CANCELLED') DEFAULT 'ASSIGNED',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES fault_reports(report_id) ON DELETE SET NULL,
    FOREIGN KEY (assignee_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_assignee_id (assignee_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites table
CREATE TABLE favorites (
    fav_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    station_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_station (user_id, station_id),
    INDEX idx_user_id (user_id),
    INDEX idx_station_id (station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievement definitions
CREATE TABLE achievement_defs (
    achv_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    criteria JSON,
    icon_url VARCHAR(500),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User achievements
CREATE TABLE user_achievements (
    user_id INT NOT NULL,
    achv_id INT NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achv_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (achv_id) REFERENCES achievement_defs(achv_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_awarded_at (awarded_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alerts table
CREATE TABLE alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('STOCK', 'REPORT', 'MAINT', 'SYSTEM') NOT NULL,
    ref_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Posts table
CREATE TABLE posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    author_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    image_url VARCHAR(500),
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at DESC),
    FULLTEXT idx_search (title, body)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments table
CREATE TABLE comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author_id INT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Likes table
CREATE TABLE likes (
    like_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_user (post_id, user_id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View for latest station status
CREATE OR REPLACE VIEW latest_station_status AS
SELECT 
    s1.*
FROM station_status s1
INNER JOIN (
    SELECT station_id, MAX(snapshot_ts) as max_ts
    FROM station_status
    GROUP BY station_id
) s2 ON s1.station_id = s2.station_id AND s1.snapshot_ts = s2.max_ts;

-- Trigger to award achievement when fault report is validated
DELIMITER $$

CREATE TRIGGER award_achievement_on_validation
AFTER UPDATE ON fault_reports
FOR EACH ROW
BEGIN
    DECLARE valid_count INT;
    
    IF NEW.is_valid = TRUE AND (OLD.is_valid IS NULL OR OLD.is_valid = FALSE) THEN
        -- Count valid reports
        SET valid_count = (SELECT COUNT(*) FROM fault_reports WHERE reporter_id = NEW.reporter_id AND is_valid = TRUE);
        
        -- Award achievements based on count (스탬프 형식)
        -- 1회: 첫 신고 기여
        IF valid_count = 1 THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                WHERE ua.user_id = NEW.reporter_id AND ad.code = 'FIRST_REPORT'
            ) THEN
                INSERT INTO user_achievements (user_id, achv_id)
                SELECT NEW.reporter_id, achv_id FROM achievement_defs WHERE code = 'FIRST_REPORT' LIMIT 1;
                
                INSERT INTO alerts (user_id, type, ref_id, message)
                VALUES (NEW.reporter_id, 'REPORT', NEW.report_id, '🎉 첫 신고 기여 배지를 획득했습니다!');
            END IF;
        END IF;
        
        -- 3회: 현장 탐정
        IF valid_count = 3 THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                WHERE ua.user_id = NEW.reporter_id AND ad.code = 'REPORT_DETECTIVE'
            ) THEN
                INSERT INTO user_achievements (user_id, achv_id)
                SELECT NEW.reporter_id, achv_id FROM achievement_defs WHERE code = 'REPORT_DETECTIVE' LIMIT 1;
                
                INSERT INTO alerts (user_id, type, ref_id, message)
                VALUES (NEW.reporter_id, 'REPORT', NEW.report_id, '🔍 현장 탐정 배지를 획득했습니다!');
            END IF;
        END IF;
        
        -- 5회: 정비 파트너
        IF valid_count = 5 THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                WHERE ua.user_id = NEW.reporter_id AND ad.code = 'REPORT_PARTNER'
            ) THEN
                INSERT INTO user_achievements (user_id, achv_id)
                SELECT NEW.reporter_id, achv_id FROM achievement_defs WHERE code = 'REPORT_PARTNER' LIMIT 1;
                
                INSERT INTO alerts (user_id, type, ref_id, message)
                VALUES (NEW.reporter_id, 'REPORT', NEW.report_id, '🤝 정비 파트너 배지를 획득했습니다!');
            END IF;
        END IF;
        
        -- 10회: 신고 전문가
        IF valid_count = 10 THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                WHERE ua.user_id = NEW.reporter_id AND ad.code = 'REPORT_EXPERT'
            ) THEN
                INSERT INTO user_achievements (user_id, achv_id)
                SELECT NEW.reporter_id, achv_id FROM achievement_defs WHERE code = 'REPORT_EXPERT' LIMIT 1;
                
                INSERT INTO alerts (user_id, type, ref_id, message)
                VALUES (NEW.reporter_id, 'REPORT', NEW.report_id, '⭐ 신고 전문가 배지를 획득했습니다!');
            END IF;
        END IF;
        
        -- 20회: 신고 마스터
        IF valid_count = 20 THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                WHERE ua.user_id = NEW.reporter_id AND ad.code = 'REPORT_MASTER'
            ) THEN
                INSERT INTO user_achievements (user_id, achv_id)
                SELECT NEW.reporter_id, achv_id FROM achievement_defs WHERE code = 'REPORT_MASTER' LIMIT 1;
                
                INSERT INTO alerts (user_id, type, ref_id, message)
                VALUES (NEW.reporter_id, 'REPORT', NEW.report_id, '👑 신고 마스터 배지를 획득했습니다!');
            END IF;
        END IF;
    END IF;
END$$

-- Trigger to award achievement on rental (환경 보호자)
CREATE TRIGGER award_achievement_on_rental
AFTER INSERT ON rentals
FOR EACH ROW
BEGIN
    DECLARE rental_count INT;
    
    -- Count total rentals
    SET rental_count = (SELECT COUNT(*) FROM rentals WHERE user_id = NEW.user_id);
    
    -- Award achievements based on count
    -- 5회: 환경 보호자 1단계
    IF rental_count = 5 THEN
        IF NOT EXISTS (
            SELECT 1 FROM user_achievements ua
            INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
            WHERE ua.user_id = NEW.user_id AND ad.code = 'ENV_PROTECTOR_1'
        ) THEN
            INSERT INTO user_achievements (user_id, achv_id)
            SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'ENV_PROTECTOR_1' LIMIT 1;
            
            INSERT INTO alerts (user_id, type, ref_id, message)
            VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '🌱 환경 보호자 1단계 배지를 획득했습니다!');
        END IF;
    END IF;
    
    -- 10회: 환경 보호자 2단계
    IF rental_count = 10 THEN
        IF NOT EXISTS (
            SELECT 1 FROM user_achievements ua
            INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
            WHERE ua.user_id = NEW.user_id AND ad.code = 'ENV_PROTECTOR_2'
        ) THEN
            INSERT INTO user_achievements (user_id, achv_id)
            SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'ENV_PROTECTOR_2' LIMIT 1;
            
            INSERT INTO alerts (user_id, type, ref_id, message)
            VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '🌱 환경 보호자 2단계 배지를 획득했습니다!');
        END IF;
    END IF;
    
    -- 20회: 환경 보호자 3단계
    IF rental_count = 20 THEN
        IF NOT EXISTS (
            SELECT 1 FROM user_achievements ua
            INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
            WHERE ua.user_id = NEW.user_id AND ad.code = 'ENV_PROTECTOR_3'
        ) THEN
            INSERT INTO user_achievements (user_id, achv_id)
            SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'ENV_PROTECTOR_3' LIMIT 1;
            
            INSERT INTO alerts (user_id, type, ref_id, message)
            VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '🌱 환경 보호자 3단계 배지를 획득했습니다!');
        END IF;
    END IF;
END$$

-- Trigger to award achievement on return to low station (균형자)
CREATE TRIGGER award_achievement_on_low_station_return
AFTER UPDATE ON rentals
FOR EACH ROW
BEGIN
    DECLARE return_count INT;
    DECLARE station_load_factor DECIMAL(10, 2);
    DECLARE baseline_demand DECIMAL(10, 2);
    DECLARE current_bikes INT;
    
    -- Only process when rental is completed (end_station is set)
    IF NEW.end_station IS NOT NULL AND OLD.end_station IS NULL THEN
        -- Get current station status
        SELECT bikes_available INTO current_bikes
        FROM station_status
        WHERE station_id = NEW.end_station
        ORDER BY snapshot_ts DESC LIMIT 1;
        
        -- Get baseline for current day/hour
        SELECT baseline_demand INTO baseline_demand
        FROM station_baseline
        WHERE station_id = NEW.end_station
        AND dow = DAYOFWEEK(NOW())
        AND hour = HOUR(NOW())
        LIMIT 1;
        
        -- If no baseline, use default 10
        IF baseline_demand IS NULL THEN
            SET baseline_demand = 10;
        END IF;
        
        -- Calculate load factor
        IF baseline_demand > 0 THEN
            SET station_load_factor = current_bikes / baseline_demand;
        ELSE
            SET station_load_factor = 1;
        END IF;
        
        -- If station is low (load_factor < 0.5), award balancer achievement
        IF station_load_factor < 0.5 THEN
            -- Count low station returns
            SET return_count = (
                SELECT COUNT(*) 
                FROM rentals r
                INNER JOIN station_status ss ON r.end_station = ss.station_id
                INNER JOIN station_baseline sb ON r.end_station = sb.station_id
                WHERE r.user_id = NEW.user_id
                AND r.end_station IS NOT NULL
                AND ss.snapshot_ts = (SELECT MAX(snapshot_ts) FROM station_status WHERE station_id = r.end_station)
                AND sb.dow = DAYOFWEEK(r.end_time)
                AND sb.hour = HOUR(r.end_time)
                AND (ss.bikes_available / NULLIF(sb.baseline_demand, 0)) < 0.5
            );
            
            -- 1회: 균형자 1단계
            IF return_count = 1 THEN
                IF NOT EXISTS (
                    SELECT 1 FROM user_achievements ua
                    INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                    WHERE ua.user_id = NEW.user_id AND ad.code = 'BALANCER_1'
                ) THEN
                    INSERT INTO user_achievements (user_id, achv_id)
                    SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'BALANCER_1' LIMIT 1;
                    
                    INSERT INTO alerts (user_id, type, ref_id, message)
                    VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '⚖️ 균형자 1단계 배지를 획득했습니다!');
                END IF;
            END IF;
            
            -- 5회: 균형자 2단계
            IF return_count = 5 THEN
                IF NOT EXISTS (
                    SELECT 1 FROM user_achievements ua
                    INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                    WHERE ua.user_id = NEW.user_id AND ad.code = 'BALANCER_2'
                ) THEN
                    INSERT INTO user_achievements (user_id, achv_id)
                    SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'BALANCER_2' LIMIT 1;
                    
                    INSERT INTO alerts (user_id, type, ref_id, message)
                    VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '⚖️ 균형자 2단계 배지를 획득했습니다!');
                END IF;
            END IF;
            
            -- 10회: 균형자 3단계
            IF return_count = 10 THEN
                IF NOT EXISTS (
                    SELECT 1 FROM user_achievements ua
                    INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                    WHERE ua.user_id = NEW.user_id AND ad.code = 'BALANCER_3'
                ) THEN
                    INSERT INTO user_achievements (user_id, achv_id)
                    SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'BALANCER_3' LIMIT 1;
                    
                    INSERT INTO alerts (user_id, type, ref_id, message)
                    VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '⚖️ 균형자 3단계 배지를 획득했습니다!');
                END IF;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

