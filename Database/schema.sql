-- BioTrack PostgreSQL & SQLite Database Schema
-- Version 2.0 (Biomedical Tracking, Crowdfunding & Hospital Portal)

-- 1. Organizations / Labs Table
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('biotech', 'pharma', 'academic', 'hospital', 'independent')),
    website TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (with RBAC Role mapping & Authentication)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    title TEXT, -- e.g. Principal Investigator, Research Fellow, Hospital Representative
    role TEXT NOT NULL DEFAULT 'scientist' CHECK (role IN ('pi', 'scientist', 'tech', 'hospital', 'public')),
    tier TEXT NOT NULL DEFAULT 'pro' CHECK (tier IN ('free', 'pro', 'enterprise')),
    api_key TEXT,
    organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Research Projects / Pipelines Table
CREATE TABLE IF NOT EXISTS research_projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT, -- e.g. BT-402-ONC
    summary TEXT NOT NULL,
    abstract TEXT, -- Detailed methodology and background
    status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed')),
    stage TEXT NOT NULL CHECK (stage IN ('discovery', 'preclinical', 'phase_1', 'phase_2', 'phase_3', 'completed')),
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
    domain TEXT NOT NULL DEFAULT 'oncology',
    journal_citation TEXT, -- e.g. Nature Medicine (2026)
    publisher_name TEXT, -- e.g. Nature Publishing Group, Mass. Medical Society (NEJM)
    country_code TEXT DEFAULT 'US', -- e.g. US, UK, DE, JP, FR, CH, SE, IN, CA
    country_name TEXT DEFAULT 'United States',
    publication_year INTEGER DEFAULT 2026,
    source_url TEXT, -- e.g. https://pubmed.ncbi.nlm.nih.gov/...
    doi TEXT, -- e.g. 10.1038/s41587-026-01928-3
    likes_count INTEGER DEFAULT 0,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    crowdfunding_raised REAL DEFAULT 0,
    crowdfunding_target REAL DEFAULT 50000,
    translations_json TEXT, -- Multi-language translations dictionary (ES, FR, DE, JP, HI)
    lead_investigator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Milestones / Progress Logs
CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Research Datasets & Attachments
CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- e.g. 'csv', 'fasta', 'pdf'
    file_size TEXT,
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
    uploaded_by TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Public Crowdfunding Donations Table
CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    donor_name TEXT DEFAULT 'Anonymous Supporter',
    amount REAL NOT NULL,
    payment_status TEXT DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Hospital Anonymized Patient Cohorts Table
CREATE TABLE IF NOT EXISTS hospital_cohorts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    hospital_name TEXT NOT NULL,
    patient_count INTEGER NOT NULL,
    biomarker_target TEXT NOT NULL,
    deidentified_summary TEXT,
    verification_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Hierarchical RBAC Team Members Table
CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_level TEXT NOT NULL CHECK (role_level IN ('pi', 'scientist', 'tech', 'hospital')),
    permissions_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Audit Trail & Activity Ledger Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES research_projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_id TEXT REFERENCES users(id),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
