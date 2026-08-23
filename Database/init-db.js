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
  const baseProjects = [
    {
      id: 'proj-hist-1', title: 'On the Antibacterial Action of Cultures of a Penicillium (Discovery of Penicillin)', code: 'HIST-1928-PEN',
      summary: 'Landmark historical paper detailing the isolation and bactericidal properties of penicillin against Staphylococcus and Gram-positive pathogens.',
      abstract: 'While working with Staphylococcus variants at St. Mary’s Hospital, London, a mold contaminant was observed to inhibit bacterial colony growth. This pioneer paper proved that penicillin broth possesses powerful non-toxic antibacterial activity.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'British Journal of Experimental Pathology (1929)', publisher_name: 'BMJ Publishing Group',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 1928,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/20421034/', doi: '10.1016/S0140-6736(00)52899-7',
      likes_count: 1540, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-2', title: 'Molecular Structure of Nucleic Acids: A Structure for Deoxyribose Nucleic Acid (DNA)', code: 'HIST-1953-DNA',
      summary: 'The seminal double-helix structural model of DNA held by hydrogen bonds between complementary purine and pyrimidine bases.',
      abstract: 'We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has two helical chains each coiled round the same axis. The novel feature of the structure is the manner in which the two chains are held together by purine and pyrimidine bases.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Nature (1953)', publisher_name: 'Nature Publishing Group',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 1953,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/13054692/', doi: '10.1038/171737a0',
      likes_count: 2180, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-3', title: 'DNA Sequencing with Chain-Terminating Inhibitors (Sanger Method)', code: 'HIST-1977-SEQ',
      summary: 'Development of dideoxynucleotide chain-termination technology allowing rapid precise decoding of nucleotide sequences.',
      abstract: 'A method using 2’3’-dideoxy and arabinonucleoside triphosphates to terminate enzymatic elongation by DNA polymerase I. This historic breakthrough laid the foundational chemistry for modern genomics.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Proceedings of the National Academy of Sciences (1977)', publisher_name: 'National Academy of Sciences',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 1977,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/271968/', doi: '10.1073/pnas.74.12.5463',
      likes_count: 1890, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-4', title: 'Initial Sequencing and Analysis of the Human Genome', code: 'HIST-2003-HGP',
      summary: 'The completed draft reference sequence of the 3 billion base pair human genome mapped by an international public consortium.',
      abstract: 'The International Human Genome Sequencing Consortium reports the draft sequence of the human genome. Covering >90% of the euchromatic genome, this landmark provides the blue-print for all human molecular medicine.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Nature (2003)', publisher_name: 'Nature Publishing Group',
      country_code: 'US', country_name: 'United States', publication_year: 2003,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/11237011/', doi: '10.1038/35057062',
      likes_count: 2950, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-5', title: 'A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity (CRISPR-Cas9)', code: 'HIST-2012-CAS9',
      summary: 'Discovery that the Cas9 endonuclease can be programmed with single guide RNA (sgRNA) to cleavage targeted genomic DNA.',
      abstract: 'Bacteria and archaea have evolved adaptive immune systems that rely on CRISPR RNAs (crRNAs) and Cas proteins to silent foreign nucleic acids. We demonstrate that Cas9 can be engineered as a universal two-component genome editing tool.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Science (2012)', publisher_name: 'AAAS Science',
      country_code: 'SE', country_name: 'Sweden', publication_year: 2012,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/22745249/', doi: '10.1126/science.1225829',
      likes_count: 3120, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-6', title: 'Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine', code: 'HIST-2020-MRNA',
      summary: 'Phase 3 multinational randomized clinical trial demonstrating 95% protection against symptomatic infection.',
      abstract: 'A lipid nanoparticle-formulated nucleoside-modified mRNA encoding the prefusion spike protein was evaluated in 43,548 participants. Two doses of 30 µg conferred 95% protection against COVID-19 in persons 16 years of age or older.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'New England Journal of Medicine (2020)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'DE', country_name: 'Germany', publication_year: 2020,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/33301246/', doi: '10.1056/NEJMoa2035389',
      likes_count: 2410, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-7', title: 'Highly Accurate Protein Structure Prediction with AlphaFold2', code: 'HIST-2021-AF2',
      summary: 'AI structural biology system predicting 3D atomic coordinates of proteins with sub-angstrom accuracy.',
      abstract: 'Proteins are essential to life, and understanding their 3D structures is key to understanding function. AlphaFold2 uses novel deep learning attention networks to predict 3D protein structure directly from primary amino acid sequence.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'Nature (2021)', publisher_name: 'Nature Publishing Group',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 2021,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/34265844/', doi: '10.1038/s41586-021-03819-2',
      likes_count: 2890, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-1', title: 'Targeted mRNA Delivery for Solid Tumors', code: 'BT-402-ONC', 
      summary: 'Investigating ionizable lipid nanoparticle formulations to facilitate targeted tissue accumulation and mRNA translation inside glioblastoma multiforme microenvironments.',
      abstract: 'Glioblastoma multiforme (GBM) remains one of the most aggressive primary brain tumors. This study evaluates engineered ionizable lipid nanoparticles (LNPs) capable of traversing the blood-brain tumor barrier (BBTB) to deliver mRNA encodings for tumor suppressor p53 and anti-angiogenic factors.',
      status: 'ongoing', stage: 'phase_2', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'Nature Biotechnology (2026)', publisher_name: 'Nature Publishing Group',
      country_code: 'US', country_name: 'United States', publication_year: 2026,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/38910245/', doi: '10.1038/s41587-026-01928-3',
      likes_count: 342, progress_percent: 65, crowdfunding_raised: 32500, crowdfunding_target: 50000
    },
    {
      id: 'proj-2', title: 'CRISPR Editing for Alpha-1 Antitrypsin Deficiency', code: 'AAT-901-GEN', 
      summary: 'In-vivo gene editing therapeutic targeting AATD liver expression through high-precision AAV9 vector delivery.',
      abstract: 'Alpha-1 antitrypsin deficiency (AATD) causes severe liver disease and emphysema. Using adenine base editors (ABEs) packaged inside adeno-associated virus serotype 9 (AAV9), this study achieves precise correction of the PiZ mutation (E342K) in human primary hepatocytes.',
      status: 'ongoing', stage: 'preclinical', visibility: 'public', domain: 'crispr',
      journal_citation: 'Cell Stem Cell (2025)', publisher_name: 'Cell Press',
      country_code: 'US', country_name: 'United States', publication_year: 2025,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/37628109/', doi: '10.1016/j.stem.2025.11.004',
      likes_count: 219, progress_percent: 40, crowdfunding_raised: 18200, crowdfunding_target: 40000
    },
    {
      id: 'proj-5', title: 'Dual-Targeted CAR-T Cell Efficacy in Refractory B-Cell Lymphoma', code: 'CAR-LYM-100', 
      summary: 'Multi-center clinical trial demonstrating 82% complete remission rate in patients receiving CD19/CD22 targeted CAR-T therapy.',
      abstract: 'Relapsed or refractory diffuse large B-cell lymphoma (DLBCL) often escapes single-target CAR-T therapies through antigen loss. This completed multi-center Phase III study presents long-term clinical data on bispecific CD19/CD22 chimeric antigen receptor T-cells with humanized scFv domains.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'cell therapy',
      journal_citation: 'New England Journal of Medicine (2025)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'US', country_name: 'United States', publication_year: 2025,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/38201948/', doi: '10.1056/NEJMoa2408192',
      likes_count: 890, progress_percent: 100, crowdfunding_raised: 75000, crowdfunding_target: 75000
    },
    {
      id: 'proj-6', title: 'Monoclonal Antibody Clearance of Amyloid-Beta Plaques in Early Alzheimer’s', code: 'ALZ-NEURO-55', 
      summary: 'Pivotal study proving 38% slowing of cognitive decline over 18 months following bi-weekly monoclonal antibody infusions.',
      abstract: 'Alzheimer’s disease pathogenesis is strongly linked to soluble amyloid-beta (Aβ) oligomers. This completed Phase III randomized double-blind trial verified significant plaque reduction via amyloid-PET imaging and measurable slowing of Clinical Dementia Rating-Sum of Boxes (CDR-SB).',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'neurodegeneration',
      journal_citation: 'Science Translational Medicine (2025)', publisher_name: 'AAAS Science',
      country_code: 'CH', country_name: 'Switzerland', publication_year: 2025,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/37910284/', doi: '10.1126/scitranslmed.abd8102',
      likes_count: 640, progress_percent: 100, crowdfunding_raised: 90000, crowdfunding_target: 90000
    },
    {
      id: 'proj-7', title: 'Synthetic Antimicrobial Peptides Targeting MDR Pseudomonas aeruginosa', code: 'AMP-MDR-03', 
      summary: 'Design and structural characterization of helical cationic peptides exhibiting rapid membrane disruption against superbugs.',
      abstract: 'Multi-drug resistant (MDR) Gram-negative bacterial pathogens represent a global public health crisis. This research engineered a novel class of amphipathic alpha-helical cationic peptides that disrupt outer membrane integrity without toxicity to mammalian erythrocytes.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'Nature Microbiology (2024)', publisher_name: 'Nature Publishing Group',
      country_code: 'DE', country_name: 'Germany', publication_year: 2024,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/38102941/', doi: '10.1038/s41564-024-01642-1',
      likes_count: 425, progress_percent: 100, crowdfunding_raised: 45000, crowdfunding_target: 45000
    },
    {
      id: 'proj-10', title: 'Alpha-Synuclein PET Radiotracer for Early Detection of Parkinson’s Disease', code: 'PARK-PET-22',
      summary: 'First-in-human fluorine-18 PET molecular radiotracer binding pathological alpha-synuclein aggregates in basal ganglia.',
      abstract: 'Early neuroimaging diagnosis of Parkinson’s disease and Multiple System Atrophy (MSA) has historically lacked fibrillar synuclein specificity. This completed clinical study validated binding kinetics of [18F]SYN-304 in idiopathic Parkinson’s cohorts.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'neurodegeneration',
      journal_citation: 'Brain (2025)', publisher_name: 'Oxford University Press',
      country_code: 'JP', country_name: 'Japan', publication_year: 2025,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/38190241/', doi: '10.1093/brain/awad401',
      likes_count: 480, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-12', title: 'iPSC-Derived Functional Islet Cell Transplants for Type 1 Diabetes', code: 'DIAB-STEM-04',
      summary: 'Encapsulated human induced pluripotent stem cell derived beta-like clusters delivering glucose-responsive insulin.',
      abstract: 'Autoimmune Type 1 Diabetes necessitates lifelong exocrine insulin administration. This ongoing Phase I/II protocol evaluates macro-encapsulation devices holding patient-derived iPSC beta cells to protect against allo-rejection.',
      status: 'ongoing', stage: 'phase_1', visibility: 'public', domain: 'crispr',
      journal_citation: 'Nature Medicine (2026)', publisher_name: 'Nature Publishing Group',
      country_code: 'JP', country_name: 'Japan', publication_year: 2026,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/38910482/', doi: '10.1038/s41591-026-02901-w',
      likes_count: 510, progress_percent: 35, crowdfunding_raised: 21000, crowdfunding_target: 60000
    },
    {
      id: 'proj-13', title: 'R21/Matrix-M Malaria Vaccine Phase III Global Efficacy Trial', code: 'MAL-R21-99',
      summary: 'Phase 3 trial in African children demonstrating 75% vaccine efficacy against clinical malaria.',
      abstract: 'Malaria remains a major cause of pediatric mortality in sub-Saharan Africa. The R21 vaccine combined with Matrix-M adjuvant met the WHO target of >75% efficacy across seasonal transmission sites.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'The Lancet (2024)', publisher_name: 'Elsevier',
      country_code: 'IN', country_name: 'India', publication_year: 2024,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/38102984/', doi: '10.1016/S0140-6736(24)00812-4',
      likes_count: 1120, progress_percent: 100, crowdfunding_raised: 100000, crowdfunding_target: 100000
    }
  ];

  // Dynamically generate 90 additional global research papers (Total = 105 papers)
  const countriesList = [
    { code: 'IN', name: 'India' }, { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' }, { code: 'JP', name: 'Japan' }, { code: 'CH', name: 'Switzerland' },
    { code: 'SE', name: 'Sweden' }, { code: 'FR', name: 'France' }, { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' }, { code: 'IL', name: 'Israel' }, { code: 'CN', name: 'China' }
  ];

  const publishersList = [
    { name: 'Nature Publishing Group', journal: 'Nature' },
    { name: 'AAAS Science', journal: 'Science' },
    { name: 'Massachusetts Medical Society', journal: 'New England Journal of Medicine' },
    { name: 'Cell Press', journal: 'Cell' },
    { name: 'Elsevier', journal: 'The Lancet' },
    { name: 'National Academy of Sciences', journal: 'PNAS' },
    { name: 'Oxford University Press', journal: 'Brain' },
    { name: 'BMJ Publishing Group', journal: 'BMJ' }
  ];

  const domainsList = ['crispr', 'rna oncology', 'cell therapy', 'neurodegeneration', 'infectious diseases', 'cardiology'];
  const stagesList = ['discovery', 'preclinical', 'phase_1', 'phase_2', 'phase_3', 'completed'];

  const generatedProjects = [];
  const titlesTemplates = [
    "AAV Gene Therapy Vector Optimization for Neuromuscular Regeneration",
    "Single-Cell RNA Sequencing of Intestinal Epithelial Stem Cell Niches",
    "Cryo-EM Structure of Multidrug Efflux Pump Complex in Enteric Bacilli",
    "Allogeneic Off-the-Shelf CAR-NK Cell Immunotherapy for Acute Myeloid Leukemia",
    "CRISPR-Cas13 Ribonuclease Cleavage of Viral Transcripts in Respiratory Infections",
    "Small Molecule Inhibition of Oncogenic KRAS G12D in Pancreatic Ductal Carcinoma",
    "Machine Learning Prediction of Protein-Ligand Binding Kinetics in Drug Discovery",
    "Patient iPSC Organoid Platform for High-Throughput Neurotoxicity Screening",
    "Epigenetic Remodeling via HDAC Inhibitors in Refractory Triple-Negative Breast Cancer",
    "Antibody-Drug Conjugates (ADCs) Targeting Trop-2 Epithelial Cell Adhesion",
    "Systemic Adenine Base Editing Restoring Dystrophin in Duchenne Muscular Dystrophy",
    "Long-Read Nanopore Genome Assemblies Revealing Structural Variants in Rare Diseases",
    "T-Cell Receptor (TCR) Engineered Adoptive Transfer in Synovial Sarcoma",
    "Bi-Functional Fusion Proteins Blocking TGF-Beta Transsignaling in Tissue Fibrosis"
  ];

  for (let i = 1; i <= 90; i++) {
    const countryObj = countriesList[i % countriesList.length];
    const pubObj = publishersList[i % publishersList.length];
    const domain = domainsList[i % domainsList.length];
    const isCompleted = (i % 2 === 0);
    const stage = isCompleted ? 'completed' : stagesList[i % (stagesList.length - 1)];
    const status = isCompleted ? 'completed' : 'ongoing';
    const year = isCompleted ? (1985 + (i * 3) % 40) : (2024 + (i % 3));
    const title = `${titlesTemplates[i % titlesTemplates.length]} (${countryObj.name} Cohort ${i})`;
    const code = `PUB-${year}-${countryObj.code}-${100 + i}`;

    generatedProjects.push({
      id: `gen-proj-${i}`,
      title: title,
      code: code,
      summary: `Multinational biomedical research study investigating ${title.toLowerCase()} conducted across lead institutes in ${countryObj.name}.`,
      abstract: `This study presents comprehensive empirical trial data on ${title.toLowerCase()}. Using high-throughput structural validation, molecular assays, and verified cohort data from ${countryObj.name}, the protocol demonstrates significant statistical efficacy.`,
      status: status,
      stage: stage,
      visibility: 'public',
      domain: domain,
      journal_citation: `${pubObj.journal} (${year})`,
      publisher_name: pubObj.name,
      country_code: countryObj.code,
      country_name: countryObj.name,
      publication_year: year,
      source_url: `https://pubmed.ncbi.nlm.nih.gov/3800${1000 + i}/`,
      doi: `10.1038/s41586-${year}-${1000 + i}`,
      likes_count: 100 + (i * 17) % 800,
      progress_percent: isCompleted ? 100 : (20 + (i * 7) % 75),
      crowdfunding_raised: isCompleted ? 50000 : ((i * 3500) % 45000),
      crowdfunding_target: 50000
    });
  }

  const allProjectsToSeed = [...baseProjects, ...generatedProjects];

  const stmt = db.prepare(`INSERT INTO research_projects 
    (id, title, code, summary, abstract, status, stage, visibility, domain, journal_citation, publisher_name, country_code, country_name, publication_year, source_url, doi, likes_count, progress_percent, crowdfunding_raised, crowdfunding_target, lead_investigator_id, organization_id) VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'usr-1', 'org-1')
  `);

  for (const p of allProjectsToSeed) {
    stmt.run(
      p.id, p.title, p.code, p.summary, p.abstract, p.status, p.stage, p.visibility, p.domain,
      p.journal_citation, p.publisher_name, p.country_code, p.country_name, p.publication_year,
      p.source_url, p.doi, p.likes_count, p.progress_percent, p.crowdfunding_raised, p.crowdfunding_target
    );
  }

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
