-- ==========================================
-- Database Migration: Separate Web2/Web3 Tables
-- ==========================================
-- This migration separates dashboard_entries and dashboard_goals
-- into mode-specific tables to eliminate race conditions

-- ==========================================
-- PHASE 1: Create New Tables
-- ==========================================

-- Web2 Entries Table
CREATE TABLE IF NOT EXISTS web2_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  date TEXT NOT NULL,
  project TEXT NOT NULL,
  earned DECIMAL(20, 8) DEFAULT 0,
  saved DECIMAL(20, 8) DEFAULT 0,
  given DECIMAL(20, 8) DEFAULT 0,
  givenTo TEXT DEFAULT '',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Web3 Entries Table
CREATE TABLE IF NOT EXISTS web3_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  date TEXT NOT NULL,
  project TEXT NOT NULL,
  walletAddress TEXT,
  walletName TEXT,
  walletMeta JSONB,
  investmentAmount DECIMAL(20, 8),
  currentValue DECIMAL(20, 8),
  earned DECIMAL(20, 8) DEFAULT 0,
  saved DECIMAL(20, 8) DEFAULT 0,
  given DECIMAL(20, 8) DEFAULT 0,
  givenTo TEXT DEFAULT '',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Web2 Goals Table
CREATE TABLE IF NOT EXISTS web2_goals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  amount DECIMAL(20, 8),
  currency TEXT DEFAULT 'USD',
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Web3 Goals Table
CREATE TABLE IF NOT EXISTS web3_goals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  amount DECIMAL(20, 8),
  currency TEXT DEFAULT 'USD',
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Web2 Performance Data Table
CREATE TABLE IF NOT EXISTS web2_performance_data (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  month TEXT NOT NULL UNIQUE,
  earned DECIMAL(20, 8) DEFAULT 0,
  saved DECIMAL(20, 8) DEFAULT 0,
  given DECIMAL(20, 8) DEFAULT 0,
  roi DECIMAL(10, 2) DEFAULT 0,
  categoryBreakdown JSONB DEFAULT '{}',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Web3 Performance Data Table
CREATE TABLE IF NOT EXISTS web3_performance_data (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  month TEXT NOT NULL UNIQUE,
  investmentAmount DECIMAL(20, 8) DEFAULT 0,
  currentValue DECIMAL(20, 8) DEFAULT 0,
  roi DECIMAL(10, 2) DEFAULT 0,
  walletBreakdown JSONB DEFAULT '{}',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- PHASE 2: Create Indexes for Performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_web2_entries_date ON web2_entries(date);
CREATE INDEX IF NOT EXISTS idx_web2_entries_project ON web2_entries(project);
CREATE INDEX IF NOT EXISTS idx_web2_entries_createdAt ON web2_entries(createdAt);

CREATE INDEX IF NOT EXISTS idx_web3_entries_date ON web3_entries(date);
CREATE INDEX IF NOT EXISTS idx_web3_entries_walletAddress ON web3_entries(walletAddress);
CREATE INDEX IF NOT EXISTS idx_web3_entries_createdAt ON web3_entries(createdAt);

CREATE INDEX IF NOT EXISTS idx_web2_performance_month ON web2_performance_data(month);
CREATE INDEX IF NOT EXISTS idx_web3_performance_month ON web3_performance_data(month);

-- ==========================================
-- PHASE 3: Migrate Existing Data
-- ==========================================

-- Migrate web2 entries
INSERT INTO web2_entries (id, date, project, earned, saved, given, givenTo, createdAt, updatedAt)
SELECT id, date, project, earned, saved, given, givenTo, createdAt, updatedAt
FROM dashboard_entries
WHERE mode = 'web2' OR mode NOT IN ('web2', 'web3')
ON CONFLICT (id) DO NOTHING;

-- Migrate web3 entries
INSERT INTO web3_entries (id, date, project, walletAddress, walletName, walletMeta, investmentAmount, currentValue, earned, saved, given, givenTo, createdAt, updatedAt)
SELECT id, date, project, walletAddress, walletName, walletMeta, investmentAmount, currentValue, earned, saved, given, givenTo, createdAt, updatedAt
FROM dashboard_entries
WHERE mode = 'web3'
ON CONFLICT (id) DO NOTHING;

-- Migrate web2 goals
INSERT INTO web2_goals (id, amount, currency, updatedAt)
SELECT id, amount, currency, updatedAt
FROM dashboard_goals
WHERE mode = 'web2' OR mode NOT IN ('web2', 'web3')
ON CONFLICT (id) DO NOTHING;

-- Migrate web3 goals
INSERT INTO web3_goals (id, amount, currency, updatedAt)
SELECT id, amount, currency, updatedAt
FROM dashboard_goals
WHERE mode = 'web3'
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- PHASE 4: Add Comments for Documentation
-- ==========================================

COMMENT ON TABLE web2_entries IS 'Dashboard entries for web2 (traditional finance) users. Stores income, savings, and giving data.';
COMMENT ON TABLE web3_entries IS 'Dashboard entries for web3 (crypto) users. Stores wallet data, investments, and portfolio changes.';
COMMENT ON TABLE web2_goals IS 'Financial goals for web2 users.';
COMMENT ON TABLE web3_goals IS 'Investment goals for web3 users.';
COMMENT ON TABLE web2_performance_data IS 'Monthly performance metrics for web2 users including ROI and category breakdown.';
COMMENT ON TABLE web3_performance_data IS 'Monthly performance metrics for web3 users including ROI and wallet breakdown.';

-- ==========================================
-- PHASE 5: Verify Migration (Check Row Counts)
-- ==========================================

-- Run these SELECT statements to verify the migration:
-- SELECT COUNT(*) as web2_entries_count FROM web2_entries;
-- SELECT COUNT(*) as web3_entries_count FROM web3_entries;
-- SELECT COUNT(*) as web2_goals_count FROM web2_goals;
-- SELECT COUNT(*) as web3_goals_count FROM web3_goals;
-- SELECT COUNT(*) as original_entries FROM dashboard_entries;
-- SELECT COUNT(*) as original_goals FROM dashboard_goals;
