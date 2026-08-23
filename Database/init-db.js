/**
 * BioTrack - Database Initializer & Mock Data Seeder
 * Uses native Node.js SQLite (node:sqlite) or sqlite3 npm fallback
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'biotrack.db');

// Remove existing database to re-seed cleanly
if (fs.existsSync(dbPath)) {
  try { fs.unlinkSync(dbPath); } catch(e) {}
}

const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

function initNativeSqlite() {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(dbPath);

  console.log('Connected to SQLite Database at:', dbPath);

  // Execute schema.sql
  db.exec(schemaSql);
  console.log('Schema DDL tables successfully created.');

  // Seed Organizations
  db.exec(`INSERT INTO organizations (id, name, type, website) VALUES
    ('org-1', 'GenVault Therapeutics', 'biotech', 'https://genvault.com'),
    ('org-2', 'Synthego Genetics', 'academic', 'https://synthego.com'),
    ('org-3', 'Johns Hopkins Medicine', 'hospital', 'https://hopkinsmedicine.org'),
    ('org-4', 'BioNeura Institute', 'independent', 'https://bioneura.org')
  ;`);

  // Seed Users
  db.exec(`INSERT INTO users (id, email, full_name, title, role, organization_id) VALUES
    ('usr-1', 'dr.raman@genvault.org', 'Dr. Sarah Raman, PhD', 'Principal Investigator', 'pi', 'org-1'),
    ('usr-2', 'm.vance@synthego.com', 'Dr. M. Vance, PhD', 'Senior Scientist', 'scientist', 'org-2'),
    ('usr-3', 'alex.chen@genvault.org', 'Alex Chen, MSc', 'Lab Technician', 'tech', 'org-1'),
    ('usr-4', 'clinical@hopkinsmedicine.org', 'Dr. E. Zhang, MD', 'Hospital Partner Representative', 'hospital', 'org-3'),
    ('usr-5', 'supporter@gmail.com', 'Jane Public', 'Public Supporter', 'public', NULL)
  ;`);

  // Seed Projects
  db.exec(`INSERT INTO research_projects 
    (id, title, code, summary, stage, visibility, domain, progress_percent, crowdfunding_raised, crowdfunding_target, lead_investigator_id, organization_id) VALUES
    ('proj-1', 'Targeted mRNA Delivery for Solid Tumors', 'BT-402-ONC', 
     'Investigating ionizable lipid nanoparticle formulations to facilitate targeted tissue accumulation and mRNA translation inside glioblastoma multiforme microenvironments.', 
     'phase_2', 'public', 'rna oncology', 65, 32500, 50000, 'usr-1', 'org-1'),

    ('proj-2', 'CRISPR Editing for Alpha-1 Antitrypsin', 'AAT-901-GEN', 
     'In-vivo gene editing therapeutic targeting AATD liver expression through high-precision AAV9 vector delivery.', 
     'preclinical', 'public', 'crispr', 40, 18200, 40000, 'usr-2', 'org-2'),

    ('proj-3', 'Small Molecule Kinase Inhibitor (Project Orion)', 'ORION-KIN-09', 
     'High-throughput screening of selective kinase compounds targeting mutated EGFR resistant pathways.', 
     'discovery', 'private', 'kinase oncology', 18, 0, 100000, 'usr-1', 'org-1'),

    ('proj-4', 'Personalized Neoantigen Peptide Vaccine', 'NEO-VAX-77', 
     'Machine learning selection of patient tumor neoepitopes formulated with adjuvant alum for T-cell priming.', 
     'preclinical', 'public', 'rna oncology', 52, 24000, 60000, 'usr-2', 'org-4')
  ;`);

  // Seed Milestones
  db.exec(`INSERT INTO milestones (id, project_id, title, description, order_index, is_completed) VALUES
    ('ms-1', 'proj-1', 'Stage 1: Formulation & In-Vitro Transfection', 'Target cell uptake confirmed >85% in murine tumor cell line assays.', 1, 1),
    ('ms-2', 'proj-1', 'Stage 2: Preclinical Animal Cohort Testing', 'Tracking biodistribution and systemic toxicity profiles over a 16-week window.', 2, 1),
    ('ms-3', 'proj-1', 'Stage 3: IND Filing & Phase I Human Safety', 'Scheduled for Q1 2027 pending final animal cohort safety reports.', 3, 0),

    ('ms-4', 'proj-2', 'Stage 1: Guide RNA Selection & Vector Packaging', 'Synthesized 12 gRNA candidates targeting Exon 3.', 1, 1),
    ('ms-5', 'proj-2', 'Stage 2: Mouse Model Gene Knock-in Validation', 'Measuring circulating AAT protein restoration in vivo.', 2, 0)
  ;`);

  // Seed Datasets
  db.exec(`INSERT INTO datasets (id, project_id, file_name, file_url, file_type, file_size, visibility, uploaded_by) VALUES
    ('ds-1', 'proj-1', 'LNP_Biodistribution_Cohort_A.csv', '/uploads/LNP_Biodistribution_Cohort_A.csv', 'csv', '14.2 MB', 'public', 'usr-3'),
    ('ds-2', 'proj-1', 'RNAseq_TumorMicroenvironment_Raw.fastq', '/uploads/RNAseq_TumorMicroenvironment_Raw.fastq', 'fastq', '1.8 GB', 'public', 'usr-3'),
    ('ds-3', 'proj-1', 'Preclinical_Toxicity_Summary_Phase2.pdf', '/uploads/Preclinical_Toxicity_Summary_Phase2.pdf', 'pdf', '4.1 MB', 'public', 'usr-1')
  ;`);

  // Seed Donations
  db.exec(`INSERT INTO donations (id, project_id, donor_name, amount) VALUES
    ('don-1', 'proj-1', 'Public Supporter John D.', 500),
    ('don-2', 'proj-1', 'Jane Public', 100),
    ('don-3', 'proj-2', 'Medical Innovation Fund', 2500)
  ;`);

  // Seed Hospital Cohorts
  db.exec(`INSERT INTO hospital_cohorts (id, project_id, hospital_name, patient_count, biomarker_target, deidentified_summary, verification_hash) VALUES
    ('hc-1', 'proj-1', 'Johns Hopkins Medicine', 45, 'EGFR T790M Mutation', 'High tolerance observed across 45 de-identified patient cohorts.', '0x99482a7f019b'),
    ('hc-2', 'proj-1', 'Mayo Clinic Clinical Oncology', 30, 'Glioblastoma Microenvironment', 'T-cell accumulation verified post 4-week protocol window.', '0x88371c6e402a')
  ;`);

  // Seed Project Members (RBAC)
  db.exec(`INSERT INTO project_members (id, project_id, user_id, role_level, permissions_json) VALUES
    ('pm-1', 'proj-1', 'usr-1', 'pi', '{"publish":true,"privacy":true,"grants":true,"milestones":true,"datasets":true,"rbac":true}'),
    ('pm-2', 'proj-1', 'usr-2', 'scientist', '{"publish":false,"privacy":false,"grants":false,"milestones":true,"datasets":true,"rbac":false}'),
    ('pm-3', 'proj-1', 'usr-3', 'tech', '{"publish":false,"privacy":false,"grants":false,"milestones":false,"datasets":true,"rbac":false}'),
    ('pm-4', 'proj-1', 'usr-4', 'hospital', '{"publish":false,"privacy":false,"grants":false,"milestones":false,"datasets":false,"cohorts":true}')
  ;`);

  console.log('Database biotrack.db initialized & seeded successfully with mock data!');
}

try {
  initNativeSqlite();
} catch(e) {
  console.error('Error initializing database:', e.message);
}
