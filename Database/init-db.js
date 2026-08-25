/**
 * AuthRos - Database Initializer & Mock Data Seeder
 * Uses native Node.js SQLite (node:sqlite) or sqlite3 npm fallback
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'authros.db');
const legacyDbPath = path.join(__dirname, 'biotrack.db');

// Remove existing database to re-seed cleanly
if (fs.existsSync(dbPath)) {
  try { fs.unlinkSync(dbPath); } catch(e) {}
}
if (fs.existsSync(legacyDbPath)) {
  try { fs.unlinkSync(legacyDbPath); } catch(e) {}
}

const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

function initNativeSqlite() {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(dbPath);

  console.log('Connected to AuthRos SQLite Database at:', dbPath);

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

  // Default demo password is "password123"
  const defaultHash = '$2a$10$w3U6R7UqyW2q4k9nU7Yw1eO5R9fK8a2w8x1e7y5z3c2b1a0d9e8f7'; // bcrypt hash for password123

  // Seed Administrator Account (You)
  db.exec(`INSERT INTO users (id, email, password_hash, full_name, title, role, tier, api_key, organization_id) VALUES
    ('usr-admin', 'admin@authros.org', '${defaultHash}', 'System Administrator (You)', 'Lead Platform Administrator', 'admin', 'enterprise', 'sk_live_authros_admin_99248201', 'org-1')
  ;`);

  // Seed Landmark Historical and Active Clinical Research Projects (500 Studies)
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
      id: 'proj-hist-4', title: 'Specific Enzymatic Amplification of DNA In Vitro: The Polymerase Chain Reaction (PCR)', code: 'HIST-1985-PCR',
      summary: 'Invention of thermostable DNA polymerase automated thermal cycling for exponential amplification of specific genomic target sequences.',
      abstract: 'A thermostable DNA polymerase from Thermus aquaticus automates the polymerase chain reaction. The method increases the yield and fidelity of DNA target sequence amplification across molecular diagnostics.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Science (1988)', publisher_name: 'AAAS Science',
      country_code: 'US', country_name: 'United States', publication_year: 1985,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/2448875/', doi: '10.1126/science.2448875',
      likes_count: 2650, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-5', title: 'Isolation of a T-Lymphotropic Retrovirus from a Patient at Risk for AIDS (HIV-1)', code: 'HIST-1983-HIV',
      summary: 'Discovery and characterization of the human immunodeficiency virus as the causative retroviral agent of Acquired Immune Deficiency Syndrome.',
      abstract: 'A retrovirus belonging to the human T-cell leukemia virus (HTLV) family, designated lymphadenopathy-associated virus (LAV/HIV), was isolated from lymph node lymphocytes of a patient with pre-AIDS.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'Science (1983)', publisher_name: 'AAAS Science',
      country_code: 'FR', country_name: 'France', publication_year: 1983,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/6189183/', doi: '10.1126/science.6189183',
      likes_count: 2210, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-6', title: 'Potent and Specific Genetic Interference by Double-Stranded RNA in Caenorhabditis elegans (RNAi)', code: 'HIST-1998-RNAI',
      summary: 'Discovery that double-stranded RNA initiates catalytic targeted degradation of homologous mRNA sequences.',
      abstract: 'Injection of double-stranded RNA (dsRNA) resulted in specific sequence gene silencing substantially more potent than either single strand alone. This breakthrough established the field of RNA interference therapeutics.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'Nature (1998)', publisher_name: 'Nature Publishing Group',
      country_code: 'US', country_name: 'United States', publication_year: 1998,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/9486653/', doi: '10.1038/35888',
      likes_count: 2470, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-7', title: 'Initial Sequencing and Analysis of the Human Genome', code: 'HIST-2001-HGP',
      summary: 'The completed draft reference sequence of the 3 billion base pair human genome mapped by an international public consortium.',
      abstract: 'The International Human Genome Sequencing Consortium reports the draft sequence of the human genome. Covering >90% of the euchromatic genome, this landmark provides the blue-print for all human molecular medicine.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Nature (2001)', publisher_name: 'Nature Publishing Group',
      country_code: 'US', country_name: 'United States', publication_year: 2001,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/11237011/', doi: '10.1038/35057062',
      likes_count: 2950, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-8', title: 'Induction of Pluripotent Stem Cells from Mouse Embryonic and Adult Fibroblasts (iPSCs)', code: 'HIST-2006-IPSC',
      summary: 'Reprogramming somatic differentiated adult cells into pluripotent embryonic-like stem cells using four defined transcription factors (Oct3/4, Sox2, Klf4, c-Myc).',
      abstract: 'Differentiated somatic cells can be reprogrammed to a pluripotent state by introducing four transcription factors. Induced pluripotent stem cells (iPS cells) exhibit the morphology, growth properties, and marker gene expression of embryonic stem cells.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Cell (2006)', publisher_name: 'Cell Press',
      country_code: 'JP', country_name: 'Japan', publication_year: 2006,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/16904174/', doi: '10.1016/j.cell.2006.07.024',
      likes_count: 3100, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-9', title: 'A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity (CRISPR-Cas9)', code: 'HIST-2012-CAS9',
      summary: 'Discovery that the Cas9 endonuclease can be programmed with single guide RNA (sgRNA) to cleavage targeted genomic DNA.',
      abstract: 'Bacteria and archaea have evolved adaptive immune systems that rely on CRISPR RNAs (crRNAs) and Cas proteins to silent foreign nucleic acids. We demonstrate that Cas9 can be engineered as a universal two-component genome editing tool.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Science (2012)', publisher_name: 'AAAS Science',
      country_code: 'SE', country_name: 'Sweden', publication_year: 2012,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/22745249/', doi: '10.1126/science.1225829',
      likes_count: 3120, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-10', title: 'Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine', code: 'HIST-2020-MRNA',
      summary: 'Phase 3 multinational randomized clinical trial demonstrating 95% protection against symptomatic infection.',
      abstract: 'A lipid nanoparticle-formulated nucleoside-modified mRNA encoding the prefusion spike protein was evaluated in 43,548 participants. Two doses of 30 µg conferred 95% protection against COVID-19 in persons 16 years of age or older.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'New England Journal of Medicine (2020)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'DE', country_name: 'Germany', publication_year: 2020,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/33301246/', doi: '10.1056/NEJMoa2035389',
      likes_count: 2410, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-11', title: 'Highly Accurate Protein Structure Prediction with AlphaFold2', code: 'HIST-2021-AF2',
      summary: 'AI structural biology system predicting 3D atomic coordinates of proteins with sub-angstrom accuracy.',
      abstract: 'Proteins are essential to life, and understanding their 3D structures is key to understanding function. AlphaFold2 uses novel deep learning attention networks to predict 3D protein structure directly from primary amino acid sequence.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'Nature (2021)', publisher_name: 'Nature Publishing Group',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 2021,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/34265844/', doi: '10.1038/s41586-021-03819-2',
      likes_count: 2890, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
    },
    {
      id: 'proj-hist-12', title: 'Chimeric Antigen Receptor T-Cells in Refractory B-Cell Malignancies (Tisagenlecleucel)', code: 'HIST-2017-CART',
      summary: 'Pivotal multicenter trial establishing anti-CD19 CAR-T cell immunotherapy for acute lymphoblastic leukemia.',
      abstract: 'Patients with relapsed or refractory B-cell acute lymphoblastic leukemia were treated with autologous T cells engineered to express anti-CD19 CAR with 4-1BB costimulatory domains, achieving 81% overall remission rate.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'cell therapy',
      journal_citation: 'New England Journal of Medicine (2018)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'US', country_name: 'United States', publication_year: 2018,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/29385370/', doi: '10.1056/NEJMoa1709866',
      likes_count: 2340, progress_percent: 100, crowdfunding_raised: 0, crowdfunding_target: 0
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
      id: 'proj-3', title: 'In-Vivo Base Editing of PCSK9 for Familial Hypercholesterolemia', code: 'LIP-PCSK9-01',
      summary: 'Single-course in-vivo hepatic base editing of PCSK9 permanently reducing LDL cholesterol and cardiovascular risk.',
      abstract: 'Familial hypercholesterolemia causes premature atherosclerotic cardiovascular disease. We administered adenine base editors targeting the PCSK9 splice donor site packaged in liver-homing LNPs, demonstrating durable 60% LDL reduction.',
      status: 'ongoing', stage: 'phase_1', visibility: 'public', domain: 'cardiology',
      journal_citation: 'New England Journal of Medicine (2025)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'US', country_name: 'United States', publication_year: 2025,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/37962084/', doi: '10.1056/NEJMoa2305000',
      likes_count: 480, progress_percent: 50, crowdfunding_raised: 28000, crowdfunding_target: 50000
    },
    {
      id: 'proj-4', title: 'Lecanemab and Donanemab Clearance of Brain Amyloid in Early Alzheimer’s Disease', code: 'ALZ-LEC-44',
      summary: 'Phase 3 randomized trial confirming cognitive decline deceleration with amyloid-protofibril clearing antibodies.',
      abstract: 'Lecanemab reduced brain amyloid markers and resulted in moderately less decline on clinical measures of cognition and function than placebo at 18 months in patients with early Alzheimer’s disease.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'neurodegeneration',
      journal_citation: 'New England Journal of Medicine (2024)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'US', country_name: 'United States', publication_year: 2024,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/36449413/', doi: '10.1056/NEJMoa2212948',
      likes_count: 890, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
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
      id: 'proj-8', title: 'AAV SERCA2a Gene Delivery for Severe Ischemic Heart Failure', code: 'CARD-AAV-08',
      summary: 'Recombinant AAV9 vector delivering human SERCA2a cDNA into failing ventricular cardiomyocytes to restore calcium cycling.',
      abstract: 'Impaired sarcoplasmic reticulum calcium ATPase (SERCA2a) function is a hallmark of terminal heart failure. This completed Phase II trial verified sustained enhancement of left-ventricular ejection fraction following direct coronary infusion.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'cardiology',
      journal_citation: 'Circulation Research (2025)', publisher_name: 'American Heart Association',
      country_code: 'US', country_name: 'United States', publication_year: 2025,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/38192014/', doi: '10.1161/CIRCRESAHA.124.320491',
      likes_count: 530, progress_percent: 100, crowdfunding_raised: 60000, crowdfunding_target: 60000
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

  // Dynamically generate 10,500+ global research papers
  const countriesList = [
    { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' }, { code: 'JP', name: 'Japan' }, { code: 'CH', name: 'Switzerland' },
    { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' }, { code: 'SE', name: 'Sweden' },
    { code: 'NL', name: 'Netherlands' }, { code: 'IN', name: 'India' }, { code: 'IL', name: 'Israel' },
    { code: 'KR', name: 'South Korea' }, { code: 'SG', name: 'Singapore' }, { code: 'DK', name: 'Denmark' },
    { code: 'NO', name: 'Norway' }, { code: 'FI', name: 'Finland' }, { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' }, { code: 'BE', name: 'Belgium' }, { code: 'AT', name: 'Austria' },
    { code: 'NZ', name: 'New Zealand' }, { code: 'IE', name: 'Ireland' }, { code: 'BR', name: 'Brazil' },
    { code: 'ZA', name: 'South Africa' }, { code: 'PL', name: 'Poland' }, { code: 'CZ', name: 'Czech Republic' },
    { code: 'PT', name: 'Portugal' }, { code: 'HU', name: 'Hungary' }, { code: 'GR', name: 'Greece' },
    { code: 'MX', name: 'Mexico' }, { code: 'AR', name: 'Argentina' }, { code: 'CL', name: 'Chile' },
    { code: 'TW', name: 'Taiwan' }, { code: 'HK', name: 'Hong Kong' }, { code: 'TH', name: 'Thailand' },
    { code: 'MY', name: 'Malaysia' }, { code: 'SA', name: 'Saudi Arabia' }, { code: 'AE', name: 'United Arab Emirates' },
    { code: 'EG', name: 'Egypt' }
  ];

  const publishersList = [
    { name: 'Nature Publishing Group', journal: 'Nature' },
    { name: 'Nature Publishing Group', journal: 'Nature Biotechnology' },
    { name: 'Nature Publishing Group', journal: 'Nature Medicine' },
    { name: 'Nature Publishing Group', journal: 'Nature Genetics' },
    { name: 'Nature Publishing Group', journal: 'Nature Immunology' },
    { name: 'Nature Publishing Group', journal: 'Nature Neuroscience' },
    { name: 'Nature Publishing Group', journal: 'Nature Microbiology' },
    { name: 'AAAS Science', journal: 'Science' },
    { name: 'AAAS Science', journal: 'Science Translational Medicine' },
    { name: 'AAAS Science', journal: 'Science Immunology' },
    { name: 'Massachusetts Medical Society', journal: 'New England Journal of Medicine' },
    { name: 'Cell Press', journal: 'Cell' },
    { name: 'Cell Press', journal: 'Cancer Cell' },
    { name: 'Cell Press', journal: 'Immunity' },
    { name: 'Cell Press', journal: 'Neuron' },
    { name: 'Cell Press', journal: 'Cell Stem Cell' },
    { name: 'Elsevier', journal: 'The Lancet' },
    { name: 'Elsevier', journal: 'The Lancet Oncology' },
    { name: 'Elsevier', journal: 'The Lancet Infectious Diseases' },
    { name: 'National Academy of Sciences', journal: 'PNAS' },
    { name: 'American Society of Hematology', journal: 'Blood' },
    { name: 'American Medical Association', journal: 'JAMA' },
    { name: 'BMJ Publishing Group', journal: 'BMJ' },
    { name: 'American Heart Association', journal: 'Circulation' },
    { name: 'American Heart Association', journal: 'Circulation Research' },
    { name: 'American Chemical Society', journal: 'ACS Central Science' },
    { name: 'Oxford University Press', journal: 'Nucleic Acids Research' },
    { name: 'Rockefeller University Press', journal: 'Journal of Experimental Medicine' },
    { name: 'BioMed Central', journal: 'Genome Biology' },
    { name: 'eLife Sciences', journal: 'eLife' }
  ];

  const domainsList = ['crispr', 'rna oncology', 'cell therapy', 'neurodegeneration', 'infectious diseases', 'cardiology'];
  const stagesList = ['discovery', 'preclinical', 'phase_1', 'phase_2', 'phase_3', 'completed'];

  const modalitiesList = [
    "Targeted Ionizable Lipid Nanoparticle Delivery",
    "Allogeneic Anti-CD19/CD22 CAR-T Cell Therapy",
    "Adenine Base Editing Transition Correction",
    "Prime Editing Flap Insertion & Deletion Correction",
    "CRISPR-Cas13 Ribonuclease Cleavage",
    "PROTAC-Mediated Targeted Protein Degradation",
    "Bispecific T-Cell Engager (BiTE) Engineering",
    "AAV9 Vectorized Transgene Delivery",
    "Synthetic Circular RNA In-Vivo Translation",
    "Cryo-EM Structural Mapping & Conformational Resolution",
    "Targeted Alpha-Particle Radionuclide Therapy",
    "High-Resolution Spatial Transcriptomics Profiling",
    "Heavy-Chain-Only Nanobody Conjugates",
    "Engineered Macrophage Phagocytic Activation",
    "Epigenetic DNA Methylation Silencing",
    "Self-Assembling Biomimetic Peptide Hydrogels",
    "De Novo Machine Learning De Novo Protein Design",
    "Broadly Neutralizing Monoclonal Antibody Neutralization",
    "Intratumoral Oncolytic Virotherapy",
    "Microfluidic Exosome Biomarker Profiling",
    "Antisense Oligonucleotide Splice Correction",
    "Autologous Hematopoietic Stem Cell Gene Editing",
    "Bacterial Ribosomal-Core Small Molecule Inhibitors",
    "Mitochondrial Targeted Antioxidant Therapy",
    "Cellular Reprogramming via Epigenetic Factors",
    "Multi-Omics Single-Cell Deep Phenotyping",
    "Non-Viral Polymer-Inorganic Hybrid Nanocarriers",
    "Antibody-Drug Conjugates (ADCs) with Topoisomerase Inhibitors",
    "Thermostable Synthetic mRNA Formulation",
    "Complement Cascade Factor Cleavage Inhibitors"
  ];

  const targetsList = [
    "Oncogenic KRAS G12D / G12V Mutations",
    "Glioblastoma EGFRvIII / IDH1-R132H Neoantigens",
    "Alpha-1 Antitrypsin PiZ E342K Variant",
    "Sickle Cell Disease HBB Beta-Globin Mutations",
    "Tau Neurofibrillary Tangle Phospho-Epitopes",
    "CFTR F508del Chloride Ion Channel Defects",
    "Dystrophin Exon 51 Frame Shifts",
    "Claudin-18.2 Tight Junction Surface Antigens",
    "PCSK9 Low-Density Lipoprotein Receptors",
    "HER2/neu Extracellular Domain Amplification",
    "PD-L1 / CTLA-4 Immune Checkpoint Ligands",
    "B-Cell Maturation Antigen (BCMA)",
    "Alpha-Synuclein Toxic Oligomeric Species",
    "SOD1 / C9orf72 Hexanucleotide Repeats",
    "Huntingtin Polyglutamine Tract Expansion",
    "Factor VIII / IX Coagulation Glycoproteins",
    "Apolipoprotein E4 (ApoE4) Lipid Aggregates",
    "Mycobacterium Tuberculosis Enoyl-ACP Reductase",
    "SARS-CoV-2 Spike Receptor-Binding Domains",
    "Interleukin-6 Receptor (IL-6R) Transsignaling",
    "TNF-Alpha Pro-Inflammatory Mediators",
    "TP53 DNA-Binding Inactivation Variants",
    "BRAF V600E Oncogenic Kinase Mutations",
    "BRCA1 / BRCA2 Homologous Repair Deficiencies",
    "Amyloid-Beta 42 Oligomeric Aggregates",
    "GLP-1 / GIP Dual Incretin Receptors",
    "VEGF-A / Angiopoietin-2 Vascular Drivers",
    "NLRP3 Inflammasome Multiprotein Complexes",
    "STING / cGAS Innate Immune Pathways",
    "SGLT2 Renal Glucose Transporters",
    "Trop-2 Epithelial Adhesion Glycoproteins",
    "FGFR3 Activating Mutations in Carcinoma",
    "CD38 / SLAMF7 Plasma Cell Markers",
    "Metabolic IDH2 Neomorphic Oncometabolites",
    "Complement Factor H / C3 Cleavage Fragments"
  ];

  const contextsList = [
    "in Refractory Glioblastoma Multiforme",
    "in Metastatic Pancreatic Ductal Adenocarcinoma",
    "in Triple-Negative Breast Cancer Cohorts",
    "in Relapsed Acute Myeloid Leukemia",
    "in Multiple Myeloma Following Proteasome Inhibitors",
    "in Non-Small Cell Lung Carcinoma (NSCLC)",
    "in Early-Stage Alzheimer’s Disease & Dementia",
    "in Advanced Parkinson’s Disease and Synucleinopathies",
    "in Familial Amyotrophic Lateral Sclerosis (ALS)",
    "in Severe Cystic Fibrosis Pulmonary Exacerbations",
    "in Pediatric Duchenne Muscular Dystrophy",
    "in Transfusion-Dependent Beta-Thalassemia",
    "in Atherosclerotic Cardiovascular Disease",
    "in Non-Alcoholic Steatohepatitis (NASH / MASH)",
    "in Severe Combined Immunodeficiency (SCID)",
    "in Severe Autoimmune Rheumatoid Arthritis & Lupus",
    "in Extensively Drug-Resistant Tuberculosis",
    "in Emerging Zoonotic Pandemic Sarbecovirus Invasions",
    "in Neovascular Age-Related Macular Degeneration",
    "in Idiopathic Pulmonary Fibrosis (IPF)",
    "in Moderate-to-Severe Hemophilia A and B",
    "in Diabetic Nephropathy & Cardiometabolic Syndrome",
    "in Metastatic Castration-Resistant Prostate Cancer",
    "in Advanced Cutaneous Melanoma Refractory Tumors",
    "in Synovial Sarcoma and Soft-Tissue Malignancies"
  ];

  const generatedProjects = [];
  const targetTotal = 10500;
  const countToGenerate = targetTotal - baseProjects.length;

  for (let i = 1; i <= countToGenerate; i++) {
    const countryObj = countriesList[i % countriesList.length];
    const pubObj = publishersList[i % publishersList.length];
    const domain = domainsList[i % domainsList.length];
    const isCompleted = (i % 2 === 0);
    const stage = isCompleted ? 'completed' : stagesList[i % (stagesList.length - 1)];
    const status = isCompleted ? 'completed' : 'ongoing';
    const year = isCompleted ? (1940 + (i * 7) % 84) : (2023 + (i % 4));
    
    const mod = modalitiesList[i % modalitiesList.length];
    const tgt = targetsList[(i * 3) % targetsList.length];
    const ctx = contextsList[(i * 5) % contextsList.length];
    const title = `${mod} of ${tgt} ${ctx}`;
    const code = `PUB-${year}-${countryObj.code}-${1000 + i}`;

    generatedProjects.push({
      id: `gen-proj-${i}`,
      title: title,
      code: code,
      summary: `Multinational biomedical research study investigating ${title.toLowerCase()} conducted across verified consortium laboratories in ${countryObj.name}.`,
      abstract: `This official research publication details experimental methodology, clinical assay parameters, and statistical validation for ${title.toLowerCase()}. Conducted in ${countryObj.name} and published via ${pubObj.journal}, findings confirm therapeutic biomarker modulation with p-value < 0.001.`,
      status: status,
      stage: stage,
      visibility: 'public',
      domain: domain,
      journal_citation: `${pubObj.journal} (${year})`,
      publisher_name: pubObj.name,
      country_code: countryObj.code,
      country_name: countryObj.name,
      publication_year: year,
      source_url: `https://pubmed.ncbi.nlm.nih.gov/${35000000 + i}/`,
      doi: `10.1038/s41586-${year}-${20000 + i}`,
      likes_count: 50 + (i * 23) % 950,
      progress_percent: isCompleted ? 100 : (15 + (i * 11) % 80),
      crowdfunding_raised: isCompleted ? 50000 : ((i * 4200) % 48000),
      crowdfunding_target: 50000
    });
  }

  const allProjectsToSeed = [...baseProjects, ...generatedProjects];

  db.exec('BEGIN TRANSACTION;');

  const stmt = db.prepare(`INSERT INTO research_projects 
    (id, title, code, summary, abstract, status, stage, visibility, domain, journal_citation, publisher_name, country_code, country_name, publication_year, source_url, doi, likes_count, progress_percent, crowdfunding_raised, crowdfunding_target, lead_investigator_id, organization_id) VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'usr-admin', 'org-1')
  `);

  for (const p of allProjectsToSeed) {
    stmt.run(
      p.id, p.title, p.code, p.summary, p.abstract, p.status, p.stage, p.visibility, p.domain,
      p.journal_citation, p.publisher_name, p.country_code, p.country_name, p.publication_year,
      p.source_url, p.doi, p.likes_count, p.progress_percent, p.crowdfunding_raised, p.crowdfunding_target
    );
  }

  db.exec('COMMIT;');
  console.log(`Successfully seeded ${allProjectsToSeed.length.toLocaleString()} research projects into database.`);

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
    ('ds-1', 'proj-1', 'LNP_Biodistribution_Cohort_A.csv', '/uploads/LNP_Biodistribution_Cohort_A.csv', 'csv', '14.2 MB', 'public', 'usr-admin'),
    ('ds-2', 'proj-1', 'RNAseq_TumorMicroenvironment_Raw.fastq', '/uploads/RNAseq_TumorMicroenvironment_Raw.fastq', 'fastq', '1.8 GB', 'public', 'usr-admin'),
    ('ds-3', 'proj-1', 'Preclinical_Toxicity_Summary_Phase2.pdf', '/uploads/Preclinical_Toxicity_Summary_Phase2.pdf', 'pdf', '4.1 MB', 'public', 'usr-admin')
  ;`);

  // Seed Donations
  db.exec(`INSERT INTO donations (id, project_id, donor_name, amount) VALUES
    ('don-1', 'proj-1', 'Public Backer', 500),
    ('don-2', 'proj-1', 'Research Supporter', 100),
    ('don-3', 'proj-2', 'Medical Innovation Fund', 2500)
  ;`);

  // Seed Hospital Cohorts
  db.exec(`INSERT INTO hospital_cohorts (id, project_id, hospital_name, patient_count, biomarker_target, deidentified_summary, verification_hash) VALUES
    ('ch-1', 'proj-1', 'Johns Hopkins Oncology Center', 25, 'EGFRvIII / IDH1-R132H', 'Glioblastoma Multiforme Grade IV, aged 18-65, failed standard temozolomide', '0x8849fbc21008472910484729'),
    ('ch-2', 'proj-1', 'Mayo Clinic Neuro-Oncology', 18, 'MGMT Promoter Methylated', 'Recurrent GBM, Karnofsky Performance Score >= 70', '0x194820194829104857291048'),
    ('ch-3', 'proj-2', 'Massachusetts General Hospital', 12, 'SERPINA1 PiZZ Homozygote', 'Severe Alpha-1 Antitrypsin PiZZ genotype with hepatic impairment', '0x992819482019482019482019')
  ;`);

  // Seed Audit Logs
  db.exec(`INSERT INTO audit_logs (id, project_id, action, actor_id, details) VALUES
    ('aud-1', 'proj-1', 'PROJECT_CREATE', 'usr-admin', 'Created protocol BT-402-ONC with public visibility'),
    ('aud-2', 'proj-1', 'DATASET_UPLOAD', 'usr-admin', 'Uploaded 1.8 GB raw FASTQ transcriptomics dataset'),
    ('aud-3', 'proj-1', 'STATUS_CHANGE', 'usr-admin', 'Updated project pipeline status from preclinical to phase_2')
  ;`);

  console.log('AuthRos Database Seeding completed successfully!');
  db.close();
}

initNativeSqlite();
