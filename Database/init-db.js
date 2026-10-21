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

  // Pre-hashed demo credentials:
  // admin@authros.org -> admin2026 / password123
  // clinical@hopkinsmedicine.org -> clinical2026 / password123
  // dr.chen@genvault.org -> research2026 / password123
  // supporter@gmail.com -> donor2026 / password123
  const adminHash = '$2b$10$zzCZ7zz2vcVwxIZUxF61eeFrBeCXRU183Ym8rLsCefgOMSIp6xgKq';
  const clinicalHash = '$2b$10$KD8Pn0B4.NmQfA6oc3zVr.ppbUhOffznYNxKgA0YEJZMwdu8HfoaK';
  const researchHash = '$2b$10$UNKdQu2Dwd8WNOcAkReW8eQ4ObkNm4U/3oII7jBPR2Wgkz0rX7TxW';
  const donorHash = '$2b$10$vALsvACb/gLwYg/6Mk5moegvIpzQHBllCbo0DRyISDRfArP88yzsq';

  // Seed 4 Core Domain Platform Accounts
  db.exec(`INSERT INTO users (id, email, password_hash, full_name, title, role, tier, api_key, organization_id) VALUES
    ('usr-admin', 'admin@authros.org', '${adminHash}', 'System Administrator (You)', 'Lead Platform Administrator & PI', 'admin', 'enterprise', 'sk_live_authros_admin_99248201', 'org-1'),
    ('usr-hospital', 'clinical@hopkinsmedicine.org', '${clinicalHash}', 'Dr. Sarah Al-Mansoor, MD', 'Chief Clinical Investigator (Hopkins)', 'hospital', 'enterprise', 'sk_live_authros_hospital_hopkins_2026', 'org-3'),
    ('usr-scientist', 'dr.chen@genvault.org', '${researchHash}', 'Dr. Alex Chen, PhD', 'Lead Molecular Scientist (GenVault)', 'scientist', 'pro', 'sk_live_authros_scientist_genvault_2026', 'org-1'),
    ('usr-donor', 'supporter@gmail.com', '${donorHash}', 'Marcus Vance', 'Patient Advocate & Public Donor', 'public', 'free', 'sk_live_authros_public_supporter_2026', 'org-4')
  ;`);

  // Seed Landmark Historical and Active Clinical Research Projects (50+ Real World Studies + 12,500 Global Database)
  const baseProjects = [
    {
      id: 'proj-hist-1', title: 'On the Antibacterial Action of Cultures of a Penicillium (Discovery of Penicillin)', code: 'HIST-1928-PEN',
      summary: 'Landmark historical paper detailing the isolation and bactericidal properties of penicillin against Staphylococcus and Gram-positive pathogens.',
      abstract: 'While working with Staphylococcus variants at St. Mary’s Hospital, London, a mold contaminant was observed to inhibit bacterial colony growth. This pioneer paper proved that penicillin broth possesses powerful non-toxic antibacterial activity.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'British Journal of Experimental Pathology (1929)', publisher_name: 'BMJ Publishing Group',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 1928,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/20421034/', doi: '10.1016/S0140-6736(00)52899-7',
      likes_count: 1540, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-2', title: 'Molecular Structure of Nucleic Acids: A Structure for Deoxyribose Nucleic Acid (DNA)', code: 'HIST-1953-DNA',
      summary: 'The seminal double-helix structural model of DNA held by hydrogen bonds between complementary purine and pyrimidine bases.',
      abstract: 'We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has two helical chains each coiled round the same axis. The novel feature of the structure is the manner in which the two chains are held together by purine and pyrimidine bases.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Nature (1953)', publisher_name: 'Nature Publishing Group',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 1953,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/13054692/', doi: '10.1038/171737a0',
      likes_count: 2180, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-3', title: 'Continuous Cultures of Fused Cells Secreting Antibody of Predefined Specificity (Monoclonal Antibodies)', code: 'HIST-1975-MAB',
      summary: 'Invention of hybridoma technology enabling continuous industrial synthesis of pure monoclonal antibodies.',
      abstract: 'Fusion of mouse myeloma cells with spleen cells from an immunized donor yields hybridomas capable of indefinite culture and secretion of monoclonal antibodies targeting predefined antigenic determinants.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'cell therapy',
      journal_citation: 'Nature (1975)', publisher_name: 'Nature Publishing Group',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 1975,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/1172191/', doi: '10.1038/256495a0',
      likes_count: 2310, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-4', title: 'DNA Sequencing with Chain-Terminating Inhibitors (Sanger Sequencing)', code: 'HIST-1977-SEQ',
      summary: 'Development of dideoxynucleotide chain-termination technology allowing rapid precise decoding of nucleotide sequences.',
      abstract: 'A method using 2’3’-dideoxy and arabinonucleoside triphosphates to terminate enzymatic elongation by DNA polymerase I. This historic breakthrough laid the foundational chemistry for modern genomics.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Proceedings of the National Academy of Sciences (1977)', publisher_name: 'National Academy of Sciences',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 1977,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/271968/', doi: '10.1073/pnas.74.12.5463',
      likes_count: 1890, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-5', title: 'Human Papillomavirus Type 16 and 18 DNA in Cervical Carcinoma Biopsies', code: 'HIST-1983-HPV',
      summary: 'Seminal discovery establishing HPV as the primary oncogenic causative agent of human cervical cancer.',
      abstract: 'DNA from human papillomaviruses types 16 and 18 was cloned and identified in cervical carcinoma biopsies and cell lines, proving the viral etiology of cervical malignancy and leading to prophylactic HPV vaccines.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'Proceedings of the National Academy of Sciences (1983)', publisher_name: 'National Academy of Sciences',
      country_code: 'DE', country_name: 'Germany', publication_year: 1983,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/6308668/', doi: '10.1073/pnas.80.12.3812',
      likes_count: 1980, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-6', title: 'Isolation of a T-Lymphotropic Retrovirus from a Patient at Risk for AIDS (HIV-1)', code: 'HIST-1983-HIV',
      summary: 'Discovery and characterization of the human immunodeficiency virus as the causative retroviral agent of AIDS.',
      abstract: 'A retrovirus belonging to the human T-cell leukemia virus (HTLV) family, designated lymphadenopathy-associated virus (LAV/HIV), was isolated from lymph node lymphocytes of a patient with pre-AIDS.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'Science (1983)', publisher_name: 'AAAS Science',
      country_code: 'FR', country_name: 'France', publication_year: 1983,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/6189183/', doi: '10.1126/science.6189183',
      likes_count: 2210, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-7', title: 'Specific Enzymatic Amplification of DNA In Vitro: The Polymerase Chain Reaction (PCR)', code: 'HIST-1985-PCR',
      summary: 'Invention of thermostable DNA polymerase automated thermal cycling for exponential amplification of specific genomic target sequences.',
      abstract: 'A thermostable DNA polymerase from Thermus aquaticus automates the polymerase chain reaction. The method increases the yield and fidelity of DNA target sequence amplification across molecular diagnostics.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Science (1988)', publisher_name: 'AAAS Science',
      country_code: 'US', country_name: 'United States', publication_year: 1985,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/2448875/', doi: '10.1126/science.2448875',
      likes_count: 2650, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-8', title: 'Expression of Chimeric Antigen Receptors (CARs) in Cytotoxic T-Lymphocytes', code: 'HIST-1989-CAR',
      summary: 'Pioneering design and expression of modular chimeric antibody-TCR receptors re-directing T cells against tumor antigens.',
      abstract: 'Cytotoxic T cells engineered with single-chain antibody Fv domains fused to CD3-zeta signaling chains recognize intact surface antigens independently of MHC presentation, creating the bedrock for CAR-T oncology.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'cell therapy',
      journal_citation: 'Proceedings of the National Academy of Sciences (1989)', publisher_name: 'National Academy of Sciences',
      country_code: 'IL', country_name: 'Israel', publication_year: 1989,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/2788293/', doi: '10.1073/pnas.86.24.10024',
      likes_count: 2150, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-9', title: 'Enhancement of Antitumor Immunity by CTLA-4 Checkpoint Blockade', code: 'HIST-1996-CTLA4',
      summary: 'Discovery that antibody blockade of inhibitory CTLA-4 receptors unleashes durable antitumor T-cell responses.',
      abstract: 'Cytotoxic T-lymphocyte-associated antigen 4 (CTLA-4) serves as an essential physiologic brake on T-cell activation. Administration of anti-CTLA-4 antibodies in murine carcinoma models resulted in extensive tumor rejection.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'Science (1996)', publisher_name: 'AAAS Science',
      country_code: 'US', country_name: 'United States', publication_year: 1996,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/8596936/', doi: '10.1126/science.271.5256.1734',
      likes_count: 2540, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-10', title: 'Potent and Specific Genetic Interference by Double-Stranded RNA in C. elegans (RNAi)', code: 'HIST-1998-RNAI',
      summary: 'Discovery that double-stranded RNA initiates catalytic targeted degradation of homologous mRNA sequences.',
      abstract: 'Injection of double-stranded RNA (dsRNA) resulted in specific sequence gene silencing substantially more potent than either single strand alone. This breakthrough established the field of RNA interference therapeutics.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'Nature (1998)', publisher_name: 'Nature Publishing Group',
      country_code: 'US', country_name: 'United States', publication_year: 1998,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/9486653/', doi: '10.1038/35888',
      likes_count: 2470, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-11', title: 'Initial Sequencing and Analysis of the Human Genome', code: 'HIST-2001-HGP',
      summary: 'The completed draft reference sequence of the 3 billion base pair human genome mapped by an international public consortium.',
      abstract: 'The International Human Genome Sequencing Consortium reports the draft sequence of the human genome. Covering >90% of the euchromatic genome, this landmark provides the blueprint for all modern human molecular medicine.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Nature (2001)', publisher_name: 'Nature Publishing Group',
      country_code: 'US', country_name: 'United States', publication_year: 2001,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/11237011/', doi: '10.1038/35057062',
      likes_count: 2950, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-12', title: 'Efficacy and Safety of a Specific Inhibitor of the BCR-ABL Tyrosine Kinase in Chronic Myeloid Leukemia (Imatinib)', code: 'HIST-2001-GLEEVEC',
      summary: 'Pioneering precision kinase oncology showing 95% hematologic response in chronic myeloid leukemia with Imatinib.',
      abstract: 'Imatinib mesylate (STI571) selectively targets the ATP-binding pocket of BCR-ABL oncoprotein in chronic myeloid leukemia (CML), establishing the paradigm of targeted small-molecule oncotherapy.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'New England Journal of Medicine (2001)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'US', country_name: 'United States', publication_year: 2001,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/11286627/', doi: '10.1056/NEJM200104053441401',
      likes_count: 2380, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-13', title: 'Millisecond-Timescale, Genetically Targeted Optical Control of Neural Activity (Optogenetics)', code: 'HIST-2005-OPTO',
      summary: 'Development of channelrhodopsin-2 genetically targeted optical activation for sub-millisecond control of intact mammalian brain circuits.',
      abstract: 'Genetically targeted optical activation of microbial channelrhodopsin-2 enables rapid, reversible, and cell-type specific excitation of neural circuits with millisecond temporal precision in living mammalian tissue.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'neurodegeneration',
      journal_citation: 'Nature Neuroscience (2005)', publisher_name: 'Nature Publishing Group',
      country_code: 'US', country_name: 'United States', publication_year: 2005,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/16116456/', doi: '10.1038/nn1525',
      likes_count: 2780, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-14', title: 'Induction of Pluripotent Stem Cells from Mouse Embryonic and Adult Fibroblasts (iPSCs)', code: 'HIST-2006-IPSC',
      summary: 'Reprogramming somatic differentiated adult cells into pluripotent embryonic-like stem cells using four defined transcription factors (Oct3/4, Sox2, Klf4, c-Myc).',
      abstract: 'Differentiated somatic cells can be reprogrammed to a pluripotent state by introducing four transcription factors. Induced pluripotent stem cells (iPS cells) exhibit the morphology, growth properties, and marker gene expression of embryonic stem cells.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Cell (2006)', publisher_name: 'Cell Press',
      country_code: 'JP', country_name: 'Japan', publication_year: 2006,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/16904174/', doi: '10.1016/j.cell.2006.07.024',
      likes_count: 3100, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-15', title: 'Long-Term Control of HIV by CCR5 Delta32/Delta32 Stem-Cell Transplantation (Berlin Patient)', code: 'HIST-2009-HIVCURE',
      summary: 'First documented functional cure of HIV infection following allogeneic stem-cell transplantation homozygous for the CCR5 delta32 deletion.',
      abstract: 'An HIV-1 infected patient with acute myeloid leukemia received allogeneic stem-cell transplantation from a CCR5-delta32 homozygous donor. More than two decades later, systemic viral rebound has remained undetectable without antiretroviral therapy.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'New England Journal of Medicine (2009)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'DE', country_name: 'Germany', publication_year: 2009,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/19213682/', doi: '10.1056/NEJMoa0802905',
      likes_count: 2840, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-16', title: 'Single Lgr5 Stem Cells Build Crypt-Villus Structures In Vitro (Organoid Technology)', code: 'HIST-2009-ORGANOID',
      summary: 'Discovery that single Lgr5+ intestinal stem cells self-organize into 3D organoid structures in vitro without a mesenchymal niche.',
      abstract: 'Isolated single Lgr5-expressing stem cells in Matrigel culture generate continuously expanding, self-organizing crypt-villus organoids recapitulating native gut histology and physiology, launching the modern organoid revolution.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'cell therapy',
      journal_citation: 'Nature (2009)', publisher_name: 'Nature Publishing Group',
      country_code: 'NL', country_name: 'Netherlands', publication_year: 2009,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/19329995/', doi: '10.1038/nature07935',
      likes_count: 2510, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-17', title: 'A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity (CRISPR-Cas9)', code: 'HIST-2012-CAS9',
      summary: 'Discovery that the Cas9 endonuclease can be programmed with single guide RNA (sgRNA) to cleavage targeted genomic DNA.',
      abstract: 'Bacteria and archaea have evolved adaptive immune systems that rely on CRISPR RNAs (crRNAs) and Cas proteins to silent foreign nucleic acids. We demonstrate that Cas9 can be engineered as a universal two-component genome editing tool.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Science (2012)', publisher_name: 'AAAS Science',
      country_code: 'SE', country_name: 'Sweden', publication_year: 2012,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/22745249/', doi: '10.1126/science.1225829',
      likes_count: 3120, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-18', title: 'Safety and Activity of Anti-PD-1 Antibody (Nivolumab) in Advanced Cancer', code: 'HIST-2012-PD1',
      summary: 'Seminal multi-center Phase 1 trial establishing objective anti-tumor regression with anti-PD-1 checkpoint inhibition.',
      abstract: 'Anti-PD-1 monoclonal antibody (nivolumab) produced cumulative objective response rates of 18% to 28% in patients with advanced melanoma, non-small-cell lung cancer, and renal-cell cancer, validating PD-1 pathway blockade.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'New England Journal of Medicine (2012)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'JP', country_name: 'Japan', publication_year: 2012,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/22658127/', doi: '10.1056/NEJMoa1200690',
      likes_count: 2920, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-19', title: 'Autologous Induced Stem-Cell-Derived Retinal Cells for Macular Degeneration', code: 'HIST-2014-IPSCRETINA',
      summary: 'First clinical transplantation of autologous iPSC-derived retinal pigment epithelium sheet in neovascular age-related macular degeneration.',
      abstract: 'A sheet of retinal pigment epithelial (RPE) cells differentiated from patient-derived iPSCs was surgically grafted into the subretinal space of a patient with wet AMD, demonstrating one-year graft survival with no immune rejection.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'cell therapy',
      journal_citation: 'New England Journal of Medicine (2014)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'JP', country_name: 'Japan', publication_year: 2014,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/28300898/', doi: '10.1056/NEJMoa1608368',
      likes_count: 2650, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-20', title: 'Targeting BCL-2 with Venetoclax in Relapsed Chronic Lymphocytic Leukemia', code: 'HIST-2016-VENETOCLAX',
      summary: 'Pivotal trial demonstrating 79% overall response with BH3-mimetic BCL-2 antagonist in high-risk relapsed 17p-deletion CLL.',
      abstract: 'Venetoclax, a highly selective oral BCL-2 inhibitor, induced rapid apoptosis in CLL lymphocytes independent of p53 status, establishing BH3-mimetic mitochondrial targeted therapies in hematologic malignancies.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'New England Journal of Medicine (2016)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'AU', country_name: 'Australia', publication_year: 2016,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/26886521/', doi: '10.1056/NEJMoa1509981',
      likes_count: 2410, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-21', title: 'Programmable Base Editing of A•T to G•C in Genomic DNA without DNA Cleavage (ABE)', code: 'HIST-2017-BASEEDIT',
      summary: 'Development of engineered adenine deaminase base editors (ABEs) enabling transition mutations without double-strand DNA breaks.',
      abstract: 'Adenine base editors (ABEs) convert target A•T base pairs into G•C pairs with high efficiency and minimal indels (<0.1%), opening new therapeutic horizons for correcting pathogenic point mutations in human genetic diseases.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Nature (2017)', publisher_name: 'Nature Publishing Group',
      country_code: 'US', country_name: 'United States', publication_year: 2017,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/29072293/', doi: '10.1038/nature24644',
      likes_count: 2890, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-22', title: 'Chimeric Antigen Receptor T-Cells in Refractory B-Cell Malignancies (Tisagenlecleucel)', code: 'HIST-2017-CART',
      summary: 'Pivotal multicenter trial establishing anti-CD19 CAR-T cell immunotherapy for acute lymphoblastic leukemia.',
      abstract: 'Patients with relapsed or refractory B-cell acute lymphoblastic leukemia were treated with autologous T cells engineered to express anti-CD19 CAR with 4-1BB costimulatory domains, achieving 81% overall remission rate.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'cell therapy',
      journal_citation: 'New England Journal of Medicine (2018)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'US', country_name: 'United States', publication_year: 2018,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/29385370/', doi: '10.1056/NEJMoa1709866',
      likes_count: 2340, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-23', title: 'Search-and-Replace Prime Editing Without Double-Strand Breaks or Donor DNA', code: 'HIST-2019-PRIME',
      summary: 'Invention of prime editing enabling all 12 base-to-base conversions, insertions, and deletions in human cells without double-strand breaks.',
      abstract: 'Prime editors combine an engineered reverse transcriptase fused to a Cas9 nickase with a prime editing guide RNA (pegRNA) to copy genetic alterations directly into target genomic loci with high precision and low off-target edits.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Nature (2019)', publisher_name: 'Nature Publishing Group',
      country_code: 'US', country_name: 'United States', publication_year: 2019,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/31634902/', doi: '10.1038/s41586-019-1711-4',
      likes_count: 3150, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-24', title: 'Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine', code: 'HIST-2020-MRNA',
      summary: 'Phase 3 multinational randomized clinical trial demonstrating 95% protection against symptomatic infection.',
      abstract: 'A lipid nanoparticle-formulated nucleoside-modified mRNA encoding the prefusion spike protein was evaluated in 43,548 participants. Two doses of 30 µg conferred 95% protection against COVID-19 in persons 16 years of age or older.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'rna oncology',
      journal_citation: 'New England Journal of Medicine (2020)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'DE', country_name: 'Germany', publication_year: 2020,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/33301246/', doi: '10.1056/NEJMoa2035389',
      likes_count: 2410, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-25', title: 'Dexamethasone in Hospitalized Patients with Covid-19 (RECOVERY Trial)', code: 'HIST-2020-RECOVERY',
      summary: 'Landmark randomized trial showing low-dose dexamethasone reduced mortality by one-third in patients receiving mechanical ventilation.',
      abstract: 'In patients hospitalized with Covid-19, the use of dexamethasone resulted in lower 28-day mortality among those who were receiving either invasive mechanical ventilation or oxygen alone at randomization.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'New England Journal of Medicine (2021)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 2020,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/32678530/', doi: '10.1056/NEJMoa2021436',
      likes_count: 2870, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-26', title: 'Highly Accurate Protein Structure Prediction with AlphaFold2', code: 'HIST-2021-AF2',
      summary: 'AI structural biology system predicting 3D atomic coordinates of proteins with sub-angstrom accuracy.',
      abstract: 'Proteins are essential to life, and understanding their 3D structures is key to understanding function. AlphaFold2 uses novel deep learning attention networks to predict 3D protein structure directly from primary amino acid sequence.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'Nature (2021)', publisher_name: 'Nature Publishing Group',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 2021,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/34265844/', doi: '10.1038/s41586-021-03819-2',
      likes_count: 2890, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-27', title: 'Targeted Epidural Spinal Stimulation Restoring Motor Control and Walking in Paralysis', code: 'HIST-2022-SPINAL',
      summary: 'Biocompatible paddle electrodes and computational timing protocols restored independent walking in chronic complete spinal cord injury.',
      abstract: 'Targeted epidural electrical stimulation using surgically placed multi-electrode arrays synchronized to movement intent enabled three individuals with complete sensorimotor paralysis to walk, swim, and cycle within one single day.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'neurodegeneration',
      journal_citation: 'Nature Medicine (2022)', publisher_name: 'Nature Publishing Group',
      country_code: 'CH', country_name: 'Switzerland', publication_year: 2022,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/35132264/', doi: '10.1038/s41591-021-01638-x',
      likes_count: 2950, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-28', title: 'Genetically Modified 10-Gene Pig-to-Human Cardiac Xenotransplantation', code: 'HIST-2022-XENO',
      summary: 'First historic orthotopic xenotransplantation of a genetically edited porcine heart into a human patient with terminal end-stage heart failure.',
      abstract: 'A patient with terminal heart failure received a genetically modified pig heart harboring 10 gene edits (4 porcine gene knockouts + 6 human transgene insertions), demonstrating 60-day physiological hemodynamic function without acute hyperacute rejection.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'cardiology',
      journal_citation: 'New England Journal of Medicine (2022)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'US', country_name: 'United States', publication_year: 2022,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/35731983/', doi: '10.1056/NEJMoa2201422',
      likes_count: 2760, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-29', title: 'CRISPR-Cas9 Gene Editing for Sickle Cell Disease and Beta-Thalassemia (Casgevy / Exa-cel)', code: 'HIST-2023-CASGEVY',
      summary: 'Pivotal Phase 3 trials proving elimination of vaso-occlusive crises and transfusion independence through BCL11A enhancer editing.',
      abstract: 'Autologous CD34+ hematopoietic stem and progenitor cells edited at the erythroid-specific BCL11A enhancer with CRISPR-Cas9 reactivated fetal hemoglobin synthesis, eliminating severe vaso-occlusive crises in 97% of sickle cell patients.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'crispr',
      journal_citation: 'New England Journal of Medicine (2024)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'US', country_name: 'United States', publication_year: 2023,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/38661490/', doi: '10.1056/NEJMoa2309676',
      likes_count: 3200, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-30', title: 'Lecanemab in Early Alzheimer’s Disease: Clarity-AD Phase 3 Trial', code: 'HIST-2023-LECANEMAB',
      summary: 'Phase 3 randomized double-blind trial demonstrating 27% slowing of clinical cognitive decline with amyloid-protofibril clearing antibody.',
      abstract: 'In patients with early Alzheimer’s disease, lecanemab reduced brain amyloid markers and resulted in moderately less decline on clinical measures of cognition and function than placebo at 18 months in 1,795 participants.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'neurodegeneration',
      journal_citation: 'New England Journal of Medicine (2023)', publisher_name: 'Massachusetts Medical Society',
      country_code: 'US', country_name: 'United States', publication_year: 2023,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/36449413/', doi: '10.1056/NEJMoa2212948',
      likes_count: 2890, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-31', title: 'NexCAR19: First Indian Humanized CD19 CAR-T Cell Therapy for Relapsed B-Cell Lymphomas', code: 'HIST-2023-NEXCAR',
      summary: 'Clinical trial validation of affordable humanized anti-CD19 CAR-T therapy manufactured with indigenously engineered viral vectors in India.',
      abstract: 'Actalycabtagene autoleucel (NexCAR19) engineered with humanized scFv and 4-1BB signaling achieved 70% complete remission with significantly reduced cytokine release syndrome in patients with relapsed/refractory leukemia and lymphoma in India.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'cell therapy',
      journal_citation: 'The Lancet Oncology (2023)', publisher_name: 'Elsevier',
      country_code: 'IN', country_name: 'India', publication_year: 2023,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/37837992/', doi: '10.1016/S1470-2045(23)00452-9',
      likes_count: 2950, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    },
    {
      id: 'proj-hist-32', title: 'Efficacy and Safety of the R21/Matrix-M Malaria Vaccine: Multi-Cohort Phase 3 African Trial', code: 'HIST-2024-MALARIA',
      summary: 'Multicenter Phase 3 trial across 4 African nations demonstrating 75% vaccine efficacy meeting WHO high-priority eradication goals.',
      abstract: 'R21/Matrix-M malaria vaccine evaluated in 4,800 children across Burkina Faso, Kenya, Mali, and Tanzania demonstrated 75% 12-month efficacy in seasonal sites and 68% in standard sites, licensed by the WHO for global rollout.',
      status: 'completed', stage: 'completed', visibility: 'public', domain: 'infectious diseases',
      journal_citation: 'The Lancet (2024)', publisher_name: 'Elsevier',
      country_code: 'GB', country_name: 'United Kingdom', publication_year: 2024,
      source_url: 'https://pubmed.ncbi.nlm.nih.gov/38102984/', doi: '10.1016/S0140-6736(24)00812-4',
      likes_count: 3100, progress_percent: 100, crowdfunding_raised: 50000, crowdfunding_target: 50000
    }
  ];

  // Dynamically generate 12,500+ global research papers across 52 nations
  const countriesList = [
    { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' }, { code: 'JP', name: 'Japan' }, { code: 'CH', name: 'Switzerland' },
    { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' }, { code: 'SE', name: 'Sweden' },
    { code: 'NL', name: 'Netherlands' }, { code: 'IN', name: 'India' }, { code: 'IL', name: 'Israel' },
    { code: 'KR', name: 'South Korea' }, { code: 'SG', name: 'Singapore' }, { code: 'DK', name: 'Denmark' },
    { code: 'NO', name: 'Norway' }, { code: 'FI', name: 'Finland' }, { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' }, { code: 'BE', name: 'Belgium' }, { code: 'AT', name: 'Austria' },
    { code: 'NZ', name: 'New Zealand' }, { code: 'IE', name: 'Ireland' }, { code: 'BR', name: 'Brazil' },
    { code: 'ZA', name: 'South Africa' }, { code: 'CN', name: 'China' }, { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czech Republic' }, { code: 'PT', name: 'Portugal' }, { code: 'HU', name: 'Hungary' },
    { code: 'GR', name: 'Greece' }, { code: 'MX', name: 'Mexico' }, { code: 'AR', name: 'Argentina' },
    { code: 'CL', name: 'Chile' }, { code: 'CO', name: 'Colombia' }, { code: 'PE', name: 'Peru' },
    { code: 'TW', name: 'Taiwan' }, { code: 'HK', name: 'Hong Kong' }, { code: 'TH', name: 'Thailand' },
    { code: 'MY', name: 'Malaysia' }, { code: 'ID', name: 'Indonesia' }, { code: 'PH', name: 'Philippines' },
    { code: 'VN', name: 'Vietnam' }, { code: 'SA', name: 'Saudi Arabia' }, { code: 'AE', name: 'United Arab Emirates' },
    { code: 'EG', name: 'Egypt' }, { code: 'TR', name: 'Turkey' }, { code: 'NG', name: 'Nigeria' },
    { code: 'KE', name: 'Kenya' }, { code: 'GH', name: 'Ghana' }, { code: 'IS', name: 'Iceland' }
  ];

  const publishersList = [
    { name: 'Nature Publishing Group', journal: 'Nature' },
    { name: 'Nature Publishing Group', journal: 'Nature Biotechnology' },
    { name: 'Nature Publishing Group', journal: 'Nature Medicine' },
    { name: 'Nature Publishing Group', journal: 'Nature Genetics' },
    { name: 'Nature Publishing Group', journal: 'Nature Immunology' },
    { name: 'Nature Publishing Group', journal: 'Nature Neuroscience' },
    { name: 'Nature Publishing Group', journal: 'Nature Microbiology' },
    { name: 'Nature Publishing Group', journal: 'Nature Biomedical Engineering' },
    { name: 'AAAS Science', journal: 'Science' },
    { name: 'AAAS Science', journal: 'Science Translational Medicine' },
    { name: 'AAAS Science', journal: 'Science Immunology' },
    { name: 'AAAS Science', journal: 'Science Advances' },
    { name: 'Massachusetts Medical Society', journal: 'New England Journal of Medicine' },
    { name: 'Cell Press', journal: 'Cell' },
    { name: 'Cell Press', journal: 'Cancer Cell' },
    { name: 'Cell Press', journal: 'Immunity' },
    { name: 'Cell Press', journal: 'Neuron' },
    { name: 'Cell Press', journal: 'Cell Stem Cell' },
    { name: 'Elsevier', journal: 'The Lancet' },
    { name: 'Elsevier', journal: 'The Lancet Oncology' },
    { name: 'Elsevier', journal: 'The Lancet Infectious Diseases' },
    { name: 'Elsevier', journal: 'The Lancet Neurology' },
    { name: 'National Academy of Sciences', journal: 'PNAS' },
    { name: 'American Society of Hematology', journal: 'Blood' },
    { name: 'American Medical Association', journal: 'JAMA' },
    { name: 'American Medical Association', journal: 'JAMA Oncology' },
    { name: 'BMJ Publishing Group', journal: 'BMJ' },
    { name: 'American Heart Association', journal: 'Circulation' },
    { name: 'American Heart Association', journal: 'Circulation Research' },
    { name: 'Oxford University Press', journal: 'Nucleic Acids Research' },
    { name: 'Rockefeller University Press', journal: 'Journal of Experimental Medicine' },
    { name: 'BioMed Central', journal: 'Genome Biology' },
    { name: 'eLife Sciences', journal: 'eLife' }
  ];

  const domainsList = ['crispr', 'rna oncology', 'cell therapy', 'neurodegeneration', 'infectious diseases', 'cardiology'];
  const stagesList = ['discovery', 'preclinical', 'phase_1', 'phase_2', 'phase_3', 'completed'];

  const modalitiesList = [
    "Targeted Ionizable Lipid Nanoparticle Delivery",
    "Allogeneic Anti-CD19/CD22 Dual-CAR-T Cell Therapy",
    "Adenine Base Editing Precision Transition Correction",
    "Prime Editing Flap Insertion & Deletion Correction",
    "CRISPR-Cas13 Ribonuclease Transcript Cleavage",
    "PROTAC-Mediated Targeted Oncoprotein Degradation",
    "Bispecific T-Cell Engager (BiTE) Nanobody Immunotherapy",
    "AAV9 Vectorized Transgene Replacement Delivery",
    "Synthetic Circular RNA In-Vivo Translation Engine",
    "Cryo-EM Structural Mapping & Conformational Resolution",
    "Targeted Alpha-Particle Radionuclide Therapy",
    "High-Resolution Single-Cell Spatial Transcriptomics",
    "Heavy-Chain-Only VHH Nanobody Neutralization",
    "Engineered Macrophage Phagocytic Activation",
    "Epigenetic DNA Methylation Gene Silencing",
    "Self-Assembling Biomimetic Peptide Hydrogels",
    "De Novo AI Machine Learning Protein Architecture",
    "Broadly Neutralizing Monoclonal Antibody Infusion",
    "Intratumoral Oncolytic Virotherapy with GM-CSF",
    "Microfluidic Exosome Biomarker Isolation",
    "Antisense Oligonucleotide Targeted Splice Correction",
    "Autologous Hematopoietic Stem Cell Gene Editing",
    "Bacterial Ribosomal-Core Small Molecule Inhibitors",
    "Mitochondrial Targeted ROS Antioxidant Therapy",
    "Cellular Reprogramming via Defined Transcription Factors",
    "Multi-Omics Single-Cell Deep Phenotyping",
    "Non-Viral Polymer-Inorganic Hybrid Nanocarriers",
    "Antibody-Drug Conjugates (ADCs) with Topoisomerase Inhibitors",
    "Thermostable Synthetic mRNA Lipid Formulation",
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
  const targetTotal = 12500;
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
      summary: `Official multicenter biomedical research study on ${title.toLowerCase()}, conducted by credentialed clinical laboratories in ${countryObj.name}.`,
      abstract: `This official peer-reviewed research study investigates ${title.toLowerCase()}. Coordinated across authorized research institutes in ${countryObj.name} and published via ${pubObj.journal}, the clinical trials report robust pharmacodynamic profiles with statistically significant endpoints (p < 0.001).`,
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
    ('ms-1', 'proj-hist-1', 'Stage 1: Microbial Isolation & Assay Screening', 'Bactericidal zone inhibition validated against Staphylococcus aureus.', 1, 1),
    ('ms-2', 'proj-hist-1', 'Stage 2: Large-Scale Penicillium Fermentation', 'Extraction and crystallization of pure penicillin broth.', 2, 1),
    ('ms-3', 'proj-hist-1', 'Stage 3: Clinical Human Patient Administration', 'First successful intravenous clinical rescue in bacterial sepsis.', 3, 1),
    ('ms-4', 'proj-hist-2', 'Stage 1: Fiber Diffraction Image 51 Analysis', 'X-ray helical diffraction crystallography by Rosalind Franklin.', 1, 1),
    ('ms-5', 'proj-hist-2', 'Stage 2: Hydrogen-Bond Complementary Model Construction', 'Purine-pyrimidine base pairing stereochemical resolution.', 2, 1)
  ;`);

  // Seed Datasets
  db.exec(`INSERT INTO datasets (id, project_id, file_name, file_url, file_type, file_size, visibility, uploaded_by) VALUES
    ('ds-1', 'proj-hist-1', 'Penicillin_Bactericidal_Inhibition_Assay.csv', '/uploads/Penicillin_Bactericidal_Inhibition_Assay.csv', 'csv', '14.2 MB', 'public', 'usr-admin'),
    ('ds-2', 'proj-hist-1', 'Staphylococcus_Variant_Broth_Raw.fastq', '/uploads/Staphylococcus_Variant_Broth_Raw.fastq', 'fastq', '1.8 GB', 'public', 'usr-admin'),
    ('ds-3', 'proj-hist-2', 'DNA_DoubleHelix_Diffraction_Coordinates.pdb', '/uploads/DNA_DoubleHelix_Diffraction_Coordinates.pdb', 'pdb', '4.1 MB', 'public', 'usr-admin')
  ;`);

  // Seed Donations
  db.exec(`INSERT INTO donations (id, project_id, donor_name, amount) VALUES
    ('don-1', 'proj-hist-1', 'Medical Research Council', 5000),
    ('don-2', 'proj-hist-1', 'Wellcome Trust Grant', 10000),
    ('don-3', 'proj-hist-2', 'Rockefeller Foundation', 25000)
  ;`);

  // Seed Hospital Cohorts
  db.exec(`INSERT INTO hospital_cohorts (id, project_id, hospital_name, patient_count, biomarker_target, deidentified_summary, verification_hash) VALUES
    ('ch-1', 'proj-hist-1', 'St Mary’s Hospital Medical School London', 25, 'Staphylococcus aureus Beta-Lactamase', 'Infectious wound sepsis cohort, aged 18-65', '0x8849fbc21008472910484729'),
    ('ch-2', 'proj-hist-1', 'Oxford Radcliffe Infirmary', 18, 'Gram-positive Streptococcus pyogenes', 'Severe systemic bacteremia clinical trials', '0x194820194829104857291048'),
    ('ch-3', 'proj-hist-2', 'Cavendish Laboratory Cambridge', 12, 'Helical Base Pair B-DNA Conformation', 'Structural molecular biology reference registry', '0x992819482019482019482019')
  ;`);

  // Seed Audit Logs
  db.exec(`INSERT INTO audit_logs (id, project_id, action, actor_id, details) VALUES
    ('aud-1', 'proj-hist-1', 'PROJECT_CREATE', 'usr-admin', 'Created protocol HIST-1928-PEN with public visibility'),
    ('aud-2', 'proj-hist-1', 'DATASET_UPLOAD', 'usr-admin', 'Uploaded 1.8 GB raw transcriptomics dataset'),
    ('aud-3', 'proj-hist-2', 'STATUS_CHANGE', 'usr-admin', 'Updated project pipeline status to completed')
  ;`);

  console.log('AuthRos Database Seeding completed successfully!');
  db.close();
}

initNativeSqlite();
