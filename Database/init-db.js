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
    (id, title, code, summary, abstract, status, stage, visibility, domain, journal_citation, source_url, doi, likes_count, progress_percent, crowdfunding_raised, crowdfunding_target, lead_investigator_id, organization_id) VALUES
    ('proj-1', 'Targeted mRNA Delivery for Solid Tumors', 'BT-402-ONC', 
     'Investigating ionizable lipid nanoparticle formulations to facilitate targeted tissue accumulation and mRNA translation inside glioblastoma multiforme microenvironments.',
     'Glioblastoma multiforme (GBM) remains one of the most aggressive primary brain tumors. This study evaluates engineered ionizable lipid nanoparticles (LNPs) capable of traversing the blood-brain tumor barrier (BBTB) to deliver mRNA encodings for tumor suppressor p53 and anti-angiogenic factors.',
     'ongoing', 'phase_2', 'public', 'rna oncology', 'Nature Biotechnology (2026)', 'https://pubmed.ncbi.nlm.nih.gov/38910245/', '10.1038/s41587-026-01928-3', 342, 65, 32500, 50000, 'usr-1', 'org-1'),

    ('proj-2', 'CRISPR Editing for Alpha-1 Antitrypsin Deficiency', 'AAT-901-GEN', 
     'In-vivo gene editing therapeutic targeting AATD liver expression through high-precision AAV9 vector delivery.',
     'Alpha-1 antitrypsin deficiency (AATD) causes severe liver disease and emphysema. Using adenine base editors (ABEs) packaged inside adeno-associated virus serotype 9 (AAV9), this study achieves precise correction of the PiZ mutation (E342K) in human primary hepatocytes.',
     'ongoing', 'preclinical', 'public', 'crispr', 'Cell Stem Cell (2025)', 'https://pubmed.ncbi.nlm.nih.gov/37628109/', '10.1016/j.stem.2025.11.004', 219, 40, 18200, 40000, 'usr-2', 'org-2'),

    ('proj-3', 'Small Molecule Kinase Inhibitor (Project Orion)', 'ORION-KIN-09', 
     'High-throughput screening of selective kinase compounds targeting mutated EGFR resistant pathways.',
     'Acquired resistance to third-generation EGFR inhibitors (e.g. osimertinib) via C797S point mutations is a crucial clinical bottleneck in non-small cell lung cancer (NSCLC). Project Orion uses molecular dynamics and high-throughput crystallography to synthesize allosteric kinase inhibitors.',
     'ongoing', 'discovery', 'private', 'kinase oncology', 'Journal of Medicinal Chemistry (2026)', 'https://pubmed.ncbi.nlm.nih.gov/39102847/', '10.1021/acs.jmedchem.5b02194', 185, 18, 0, 100000, 'usr-1', 'org-1'),

    ('proj-4', 'Personalized Neoantigen Peptide Vaccine', 'NEO-VAX-77', 
     'Machine learning selection of patient tumor neoepitopes formulated with adjuvant alum for T-cell priming.',
     'Personalized cancer vaccines rely on precise identification of somatic mutations. We present a deep learning pipeline trained on mass spectrometry immunopeptidomics that selects high-affinity MHC-I binding peptides for autologous T-cell expansion.',
     'ongoing', 'phase_1', 'public', 'rna oncology', 'Lancet Oncology (2026)', 'https://pubmed.ncbi.nlm.nih.gov/38491024/', '10.1016/S1470-2045(25)00412-X', 512, 52, 24000, 60000, 'usr-2', 'org-4'),

    ('proj-5', 'Dual-Targeted CAR-T Cell Efficacy in Refractory B-Cell Lymphoma', 'CAR-LYM-100', 
     'Multi-center clinical trial demonstrating 82% complete remission rate in patients receiving CD19/CD22 targeted CAR-T therapy.',
     'Relapsed or refractory diffuse large B-cell lymphoma (DLBCL) often escapes single-target CAR-T therapies through antigen loss. This completed multi-center Phase III study presents long-term clinical data on bispecific CD19/CD22 chimeric antigen receptor T-cells with humanized scFv domains.',
     'completed', 'completed', 'public', 'cell therapy', 'New England Journal of Medicine (2025)', 'https://pubmed.ncbi.nlm.nih.gov/38201948/', '10.1056/NEJMoa2408192', 890, 100, 75000, 75000, 'usr-1', 'org-1'),

    ('proj-6', 'Monoclonal Antibody Clearance of Amyloid-Beta Plaques in Early Alzheimer’s', 'ALZ-NEURO-55', 
     'Pivotal study proving 38% slowing of cognitive decline over 18 months following bi-weekly monoclonal antibody infusions.',
     'Alzheimer’s disease pathogenesis is strongly linked to soluble amyloid-beta (Aβ) oligomers. This completed Phase III randomized double-blind trial verified significant plaque reduction via amyloid-PET imaging and measurable slowing of Clinical Dementia Rating-Sum of Boxes (CDR-SB).',
     'completed', 'completed', 'public', 'neurodegeneration', 'Science Translational Medicine (2025)', 'https://pubmed.ncbi.nlm.nih.gov/37910284/', '10.1126/scitranslmed.abd8102', 640, 100, 90000, 90000, 'usr-2', 'org-4'),

    ('proj-7', 'Synthetic Antimicrobial Peptides Targeting MDR Pseudomonas aeruginosa', 'AMP-MDR-03', 
     'Design and structural characterization of helical cationic peptides exhibiting rapid membrane disruption against superbugs.',
     'Multi-drug resistant (MDR) Gram-negative bacterial pathogens represent a global public health crisis. This research engineered a novel class of amphipathic alpha-helical cationic peptides that disrupt outer membrane integrity without toxicity to mammalian erythrocytes.',
     'completed', 'completed', 'public', 'infectious diseases', 'Nature Microbiology (2024)', 'https://pubmed.ncbi.nlm.nih.gov/38102941/', '10.1038/s41564-024-01642-1', 425, 100, 45000, 45000, 'usr-2', 'org-2'),

    ('proj-8', 'AAV-Mediated Cardiac Gene Delivery of SERCA2a for Severe Heart Failure', 'CARDIO-GEN-12', 
     'Long-term 36-month cohort evaluation of sarcoplasmic reticulum calcium ATPase gene transfer restoring cardiac contractility.',
     'Impaired calcium handling due to down-regulated SERCA2a expression is a hallmark of ischemic cardiomyopathy. This finished 3-year clinical cohort study confirmed sustained vector genome persistence and improved left ventricular ejection fraction in gene therapy recipients.',
     'completed', 'completed', 'public', 'cardiology', 'Circulation Research (2025)', 'https://pubmed.ncbi.nlm.nih.gov/38302194/', '10.1161/CIRCRESAHA.124.320491', 310, 100, 60000, 60000, 'usr-1', 'org-3')
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
