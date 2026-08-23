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

  // Seed Projects with Global Country Metadata, Publishers & Years (1928 - 2026)
  db.exec(`INSERT INTO research_projects 
    (id, title, code, summary, abstract, status, stage, visibility, domain, journal_citation, publisher_name, country_code, country_name, publication_year, source_url, doi, likes_count, progress_percent, crowdfunding_raised, crowdfunding_target, lead_investigator_id, organization_id) VALUES
    ('proj-hist-1', 'On the Antibacterial Action of Cultures of a Penicillium (Discovery of Penicillin)', 'HIST-1928-PEN',
     'Landmark historical paper detailing the isolation and bactericidal properties of penicillin against Staphylococcus and Gram-positive pathogens.',
     'While working with Staphylococcus variants at St. Mary’s Hospital, London, a mold contaminant was observed to inhibit bacterial colony growth. This pioneer paper proved that penicillin broth possesses powerful non-toxic antibacterial activity.',
     'completed', 'completed', 'public', 'infectious diseases', 'British Journal of Experimental Pathology (1929)', 'BMJ Publishing Group', 'GB', 'United Kingdom', 1928, 'https://pubmed.ncbi.nlm.nih.gov/20421034/', '10.1016/S0140-6736(00)52899-7', 1540, 100, 0, 0, 'usr-2', 'org-2'),

    ('proj-hist-2', 'Molecular Structure of Nucleic Acids: A Structure for Deoxyribose Nucleic Acid (DNA)', 'HIST-1953-DNA',
     'The seminal double-helix structural model of DNA held by hydrogen bonds between complementary purine and pyrimidine bases.',
     'We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has two helical chains each coiled round the same axis. The novel feature of the structure is the manner in which the two chains are held together by purine and pyrimidine bases.',
     'completed', 'completed', 'public', 'crispr', 'Nature (1953)', 'Nature Publishing Group', 'GB', 'United Kingdom', 1953, 'https://pubmed.ncbi.nlm.nih.gov/13054692/', '10.1038/171737a0', 2180, 100, 0, 0, 'usr-1', 'org-2'),

    ('proj-hist-3', 'DNA Sequencing with Chain-Terminating Inhibitors (Sanger Method)', 'HIST-1977-SEQ',
     'Development of dideoxynucleotide chain-termination technology allowing rapid precise decoding of nucleotide sequences.',
     'A method using 2’3’-dideoxy and arabinonucleoside triphosphates to terminate enzymatic elongation by DNA polymerase I. This historic breakthrough laid the foundational chemistry for modern genomics.',
     'completed', 'completed', 'public', 'crispr', 'Proceedings of the National Academy of Sciences (1977)', 'National Academy of Sciences', 'GB', 'United Kingdom', 1977, 'https://pubmed.ncbi.nlm.nih.gov/271968/', '10.1073/pnas.74.12.5463', 1890, 100, 0, 0, 'usr-2', 'org-2'),

    ('proj-hist-4', 'Initial Sequencing and Analysis of the Human Genome', 'HIST-2003-HGP',
     'The completed draft reference sequence of the 3 billion base pair human genome mapped by an international public consortium.',
     'The International Human Genome Sequencing Consortium reports the draft sequence of the human genome. Covering >90% of the euchromatic genome, this landmark provides the blue-print for all human molecular medicine.',
     'completed', 'completed', 'public', 'crispr', 'Nature (2003)', 'Nature Publishing Group', 'US', 'United States', 2003, 'https://pubmed.ncbi.nlm.nih.gov/11237011/', '10.1038/35057062', 2950, 100, 0, 0, 'usr-1', 'org-1'),

    ('proj-hist-5', 'A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity (CRISPR-Cas9)', 'HIST-2012-CAS9',
     'Discovery that the Cas9 endonuclease can be programmed with single guide RNA (sgRNA) to cleavage targeted genomic DNA.',
     'Bacteria and archaea have evolved adaptive immune systems that rely on CRISPR RNAs (crRNAs) and Cas proteins to silent foreign nucleic acids. We demonstrate that Cas9 can be engineered as a universal two-component genome editing tool.',
     'completed', 'completed', 'public', 'crispr', 'Science (2012)', 'AAAS', 'SE', 'Sweden', 2012, 'https://pubmed.ncbi.nlm.nih.gov/22745249/', '10.1126/science.1225829', 3120, 100, 0, 0, 'usr-2', 'org-2'),

    ('proj-hist-6', 'Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine', 'HIST-2020-MRNA',
     'Phase 3 multinational randomized clinical trial demonstrating 95% protection against symptomatic infection.',
     'A lipid nanoparticle-formulated nucleoside-modified mRNA encoding the prefusion spike protein was evaluated in 43,548 participants. Two doses of 30 µg conferred 95% protection against COVID-19 in persons 16 years of age or older.',
     'completed', 'completed', 'public', 'rna oncology', 'New England Journal of Medicine (2020)', 'Massachusetts Medical Society', 'DE', 'Germany', 2020, 'https://pubmed.ncbi.nlm.nih.gov/33301246/', '10.1056/NEJMoa2035389', 2410, 100, 0, 0, 'usr-1', 'org-1'),

    ('proj-hist-7', 'Highly Accurate Protein Structure Prediction with AlphaFold2', 'HIST-2021-AF2',
     'AI structural biology system predicting 3D atomic coordinates of proteins with sub-angstrom accuracy.',
     'Proteins are essential to life, and understanding their 3D structures is key to understanding function. AlphaFold2 uses novel deep learning attention networks to predict 3D protein structure directly from primary amino acid sequence.',
     'completed', 'completed', 'public', 'infectious diseases', 'Nature (2021)', 'Nature Publishing Group', 'GB', 'United Kingdom', 2021, 'https://pubmed.ncbi.nlm.nih.gov/34265844/', '10.1038/s41586-021-03819-2', 2890, 100, 0, 0, 'usr-2', 'org-2'),

    ('proj-1', 'Targeted mRNA Delivery for Solid Tumors', 'BT-402-ONC', 
     'Investigating ionizable lipid nanoparticle formulations to facilitate targeted tissue accumulation and mRNA translation inside glioblastoma multiforme microenvironments.',
     'Glioblastoma multiforme (GBM) remains one of the most aggressive primary brain tumors. This study evaluates engineered ionizable lipid nanoparticles (LNPs) capable of traversing the blood-brain tumor barrier (BBTB) to deliver mRNA encodings for tumor suppressor p53 and anti-angiogenic factors.',
     'ongoing', 'phase_2', 'public', 'rna oncology', 'Nature Biotechnology (2026)', 'Nature Publishing Group', 'US', 'United States', 2026, 'https://pubmed.ncbi.nlm.nih.gov/38910245/', '10.1038/s41587-026-01928-3', 342, 65, 32500, 50000, 'usr-1', 'org-1'),

    ('proj-2', 'CRISPR Editing for Alpha-1 Antitrypsin Deficiency', 'AAT-901-GEN', 
     'In-vivo gene editing therapeutic targeting AATD liver expression through high-precision AAV9 vector delivery.',
     'Alpha-1 antitrypsin deficiency (AATD) causes severe liver disease and emphysema. Using adenine base editors (ABEs) packaged inside adeno-associated virus serotype 9 (AAV9), this study achieves precise correction of the PiZ mutation (E342K) in human primary hepatocytes.',
     'ongoing', 'preclinical', 'public', 'crispr', 'Cell Stem Cell (2025)', 'Cell Press', 'US', 'United States', 2025, 'https://pubmed.ncbi.nlm.nih.gov/37628109/', '10.1016/j.stem.2025.11.004', 219, 40, 18200, 40000, 'usr-2', 'org-2'),

    ('proj-5', 'Dual-Targeted CAR-T Cell Efficacy in Refractory B-Cell Lymphoma', 'CAR-LYM-100', 
     'Multi-center clinical trial demonstrating 82% complete remission rate in patients receiving CD19/CD22 targeted CAR-T therapy.',
     'Relapsed or refractory diffuse large B-cell lymphoma (DLBCL) often escapes single-target CAR-T therapies through antigen loss. This completed multi-center Phase III study presents long-term clinical data on bispecific CD19/CD22 chimeric antigen receptor T-cells with humanized scFv domains.',
     'completed', 'completed', 'public', 'cell therapy', 'New England Journal of Medicine (2025)', 'Massachusetts Medical Society', 'US', 'United States', 2025, 'https://pubmed.ncbi.nlm.nih.gov/38201948/', '10.1056/NEJMoa2408192', 890, 100, 75000, 75000, 'usr-1', 'org-1'),

    ('proj-6', 'Monoclonal Antibody Clearance of Amyloid-Beta Plaques in Early Alzheimer’s', 'ALZ-NEURO-55', 
     'Pivotal study proving 38% slowing of cognitive decline over 18 months following bi-weekly monoclonal antibody infusions.',
     'Alzheimer’s disease pathogenesis is strongly linked to soluble amyloid-beta (Aβ) oligomers. This completed Phase III randomized double-blind trial verified significant plaque reduction via amyloid-PET imaging and measurable slowing of Clinical Dementia Rating-Sum of Boxes (CDR-SB).',
     'completed', 'completed', 'public', 'neurodegeneration', 'Science Translational Medicine (2025)', 'AAAS', 'CH', 'Switzerland', 2025, 'https://pubmed.ncbi.nlm.nih.gov/37910284/', '10.1126/scitranslmed.abd8102', 640, 100, 90000, 90000, 'usr-2', 'org-4'),

    ('proj-7', 'Synthetic Antimicrobial Peptides Targeting MDR Pseudomonas aeruginosa', 'AMP-MDR-03', 
     'Design and structural characterization of helical cationic peptides exhibiting rapid membrane disruption against superbugs.',
     'Multi-drug resistant (MDR) Gram-negative bacterial pathogens represent a global public health crisis. This research engineered a novel class of amphipathic alpha-helical cationic peptides that disrupt outer membrane integrity without toxicity to mammalian erythrocytes.',
     'completed', 'completed', 'public', 'infectious diseases', 'Nature Microbiology (2024)', 'Nature Publishing Group', 'DE', 'Germany', 2024, 'https://pubmed.ncbi.nlm.nih.gov/38102941/', '10.1038/s41564-024-01642-1', 425, 100, 45000, 45000, 'usr-2', 'org-2'),

    ('proj-10', 'Alpha-Synuclein PET Radiotracer for Early Detection of Parkinson’s Disease', 'PARK-PET-22',
     'First-in-human fluorine-18 PET molecular radiotracer binding pathological alpha-synuclein aggregates in basal ganglia.',
     'Early neuroimaging diagnosis of Parkinson’s disease and Multiple System Atrophy (MSA) has historically lacked fibrillar synuclein specificity. This completed clinical study validated binding kinetics of [18F]SYN-304 in idiopathic Parkinson’s cohorts.',
     'completed', 'completed', 'public', 'neurodegeneration', 'Brain (2025)', 'Oxford University Press', 'JP', 'Japan', 2025, 'https://pubmed.ncbi.nlm.nih.gov/38190241/', '10.1093/brain/awad401', 480, 100, 50000, 50000, 'usr-2', 'org-4'),

    ('proj-12', 'iPSC-Derived Functional Islet Cell Transplants for Type 1 Diabetes', 'DIAB-STEM-04',
     'Encapsulated human induced pluripotent stem cell derived beta-like clusters delivering glucose-responsive insulin.',
     'Autoimmune Type 1 Diabetes necessitates lifelong exocrine insulin administration. This ongoing Phase I/II protocol evaluates macro-encapsulation devices holding patient-derived iPSC beta cells to protect against allo-rejection.',
     'ongoing', 'phase_1', 'public', 'crispr', 'Nature Medicine (2026)', 'Nature Publishing Group', 'JP', 'Japan', 2026, 'https://pubmed.ncbi.nlm.nih.gov/38910482/', '10.1038/s41591-026-02901-w', 510, 35, 21000, 60000, 'usr-4', 'org-3'),

    ('proj-13', 'R21/Matrix-M Malaria Vaccine Phase III Global Efficacy Trial', 'MAL-R21-99',
     'Phase 3 trial in African children demonstrating 75% vaccine efficacy against clinical malaria.',
     'Malaria remains a major cause of pediatric mortality in sub-Saharan Africa. The R21 vaccine combined with Matrix-M adjuvant met the WHO target of >75% efficacy across seasonal transmission sites.',
     'completed', 'completed', 'public', 'infectious diseases', 'The Lancet (2024)', 'Elsevier', 'IN', 'India', 2024, 'https://pubmed.ncbi.nlm.nih.gov/38102984/', '10.1016/S0140-6736(24)00812-4', 1120, 100, 100000, 100000, 'usr-1', 'org-3')
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
