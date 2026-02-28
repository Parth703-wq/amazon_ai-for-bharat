-- ======================================================
-- JanSahayak AI - MySQL Database Schema
-- Import this file via phpMyAdmin SQL tab
-- ======================================================

CREATE DATABASE IF NOT EXISTS jansahayak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jansahayak;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    aadhaar_last4 VARCHAR(4),
    preferred_language VARCHAR(10) DEFAULT 'hi',
    state VARCHAR(100),
    district VARCHAR(100),
    annual_income FLOAT,
    caste_category VARCHAR(50),
    land_holdings_hectares FLOAT,
    role ENUM('citizen','admin','officer') DEFAULT 'citizen',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Family Members
CREATE TABLE IF NOT EXISTS family_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    age INT,
    gender VARCHAR(10),
    occupation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schemes
CREATE TABLE IF NOT EXISTS schemes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    name_hindi VARCHAR(500),
    category ENUM('Agriculture','Health','Housing','Education','Employment','Women & Child','Disability','Senior Citizen','Other') NOT NULL,
    ministry VARCHAR(300),
    description TEXT,
    description_simple TEXT,
    benefits TEXT,
    benefit_amount FLOAT,
    benefit_type VARCHAR(100),
    eligibility_criteria JSON,
    required_documents JSON,
    application_url VARCHAR(500),
    deadline DATETIME,
    state_specific VARCHAR(100),
    max_income FLOAT,
    min_age INT,
    max_age INT,
    gender_eligibility VARCHAR(20) DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_state (state_specific)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scheme Matches
CREATE TABLE IF NOT EXISTS scheme_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scheme_id INT NOT NULL,
    match_percentage FLOAT DEFAULT 0.0,
    match_reasons JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_scheme (user_id, scheme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Applications
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scheme_id INT NOT NULL,
    status ENUM('Draft','Submitted','Under Review','Approved','Rejected') DEFAULT 'Draft',
    current_step INT DEFAULT 1,
    completed_steps JSON,
    notes TEXT,
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grievances
CREATE TABLE IF NOT EXISTS grievances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ticket_id VARCHAR(20) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Submitted','Under Review','Actioned','Resolved','Closed') DEFAULT 'Submitted',
    resolution_notes TEXT,
    assigned_to VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Documents
CREATE TABLE IF NOT EXISTS user_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size_kb INT,
    ocr_extracted_data JSON,
    ai_summary TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Office Locations
CREATE TABLE IF NOT EXISTS office_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    office_type VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100),
    latitude FLOAT,
    longitude FLOAT,
    phone VARCHAR(20),
    operating_hours VARCHAR(100),
    services JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_state_district (state, district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(100) NOT NULL,
    role VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deadline Alerts
CREATE TABLE IF NOT EXISTS deadline_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scheme_id INT NOT NULL,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================
-- SEED DATA - Government Schemes
-- ======================================================

INSERT INTO schemes (name, name_hindi, category, ministry, description_simple, benefits, benefit_amount, benefit_type, eligibility_criteria, required_documents, max_income, gender_eligibility) VALUES
('PM Kisan Samman Nidhi', 'प्रधानमंत्री किसान सम्मान निधि', 'Agriculture', 'Ministry of Agriculture', 'Financial support for small and marginal farmers', 'Direct cash transfer of ₹6000 per year in 3 equal instalments', 6000, 'Annual Cash Transfer', '{"land_holdings": "less than 2 hectares", "must_be_farmer": true}', '["Aadhaar Card", "Bank Passbook", "Land Record (Khatauni)"]', 200000, 'all'),
('Ayushman Bharat - PMJAY', 'आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना', 'Health', 'Ministry of Health', 'Health insurance for poor and vulnerable families', 'Up to ₹5 lakh health insurance per family per year', 500000, 'Annual Health Insurance', '{"income_category": "BPL or low income", "secc_listed": true}', '["Aadhaar Card", "Ration Card", "Income Certificate"]', 100000, 'all'),
('PM Awas Yojana (Gramin)', 'प्रधानमंत्री ग्रामीण आवास योजना', 'Housing', 'Ministry of Rural Development', 'Housing assistance for homeless rural families', 'Financial assistance to build pucca house - ₹1.2 lakh in plains, ₹1.3 lakh in hilly areas', 120000, 'One-time Grant', '{"homeless_or_kutcha": true, "rural_area": true}', '["Aadhaar Card", "Bank Passbook", "BPL Certificate"]', 150000, 'all'),
('National Scholarship Portal Schemes', 'राष्ट्रीय छात्रवृत्ति पोर्टल', 'Education', 'Ministry of Education', 'Scholarship support for students from economically weaker sections', 'Up to ₹75,000 annual scholarship for professional courses', 75000, 'Annual Scholarship', '{"student": true, "institution_registered": true}', '["Aadhaar Card", "Income Certificate", "Previous Marksheet", "Bank Passbook"]', 250000, 'all'),
('Mahatma Gandhi NREGA', 'महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी', 'Employment', 'Ministry of Rural Development', 'Guarantee 100 days of wage employment to rural households', '100 days of guaranteed wage employment at minimum wages', 0, 'Employment Guarantee', '{"rural_household": true, "willing_to_do_manual_work": true}', '["Aadhaar Card", "Job Card", "Bank Passbook"]', 0, 'all'),
('Sukanya Samriddhi Yojana', 'सुकन्या समृद्धि योजना', 'Women & Child', 'Ministry of Finance', 'Savings scheme for girl child with high interest rate', 'High interest rate savings account for girl child (8.2% p.a.)', 0, 'Savings Scheme', '{"girl_child": true, "age_limit": "below 10 years"}', '["Aadhaar Card (Guardian)", "Birth Certificate of Girl", "Bank Account"]', 0, 'female');

-- Admin user (password: admin@123)
INSERT INTO users (full_name, phone, email, hashed_password, role, is_active, is_verified, profile_complete) VALUES
('JanSahayak Admin', '9999999999', 'admin@jansahayak.ai', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', TRUE, TRUE, TRUE);

-- Sample Office Locations
INSERT INTO office_locations (name, office_type, address, district, state, latitude, longitude, phone, operating_hours, services) VALUES
('Jan Seva Kendra - Lucknow Central', 'csc', 'Shop 4, Hazratganj Main Market, Lucknow', 'Lucknow', 'Uttar Pradesh', 26.8467, 80.9462, '1800-111-555', '9:00 AM - 6:00 PM (Mon-Sat)', '["Scheme Applications", "Document Verification", "Pension Registration"]'),
('Gram Panchayat Office - Kakori', 'panchayat', 'Village Secretariat, Kakori, Lucknow', 'Lucknow', 'Uttar Pradesh', 26.8567, 80.9012, '1800-111-556', '10:00 AM - 5:00 PM (Mon-Fri)', '["NREGA Registration", "Ration Card", "Birth Certificate"]'),
('Common Service Centre - Malihabad', 'csc', 'Near Bus Stand, Malihabad, Lucknow', 'Lucknow', 'Uttar Pradesh', 26.9012, 80.8234, '1800-111-557', '9:30 AM - 5:30 PM (Mon-Sat)', '["DigiLocker", "Scheme Applications", "Document Upload"]');
