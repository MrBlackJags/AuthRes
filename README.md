# 🧬 BioTrack — Centralized Biomedical Research & Crowdfunding Platform

**BioTrack** is a centralized biomedical research tracking, crowdfunding, and hospital clinical portal. It provides a transparent, verifiable ecosystem connecting three primary user groups: **the General Public**, **Hospitals**, and **Scientific Research Institutions**.

---

## 🌟 Key Platform Features & Ecosystem Architecture

```
                       +-----------------------------------+
                       |    BioTrack Unified Platform      |
                       +-----------------------------------+
                                         |
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
┌────▼──────────────────────┐   ┌────────▼───────────────────┐   ┌───────────▼──────────────────┐
│   1. GENERAL PUBLIC       │   │   2. HOSPITALS & CLINICS   │   │  3. RESEARCH INSTITUTIONS    │
├───────────────────────────┤   ├────────────────────────────┤   ├──────────────────────────────┤
│ • Public Open Science     │   │ • Verified Trial Data      │   │ • Hierarchical RBAC Model    │
│ • Direct Pipeline Donations│  │ • Anonymized Cohort Vault  │   │ • Preclinical Data Storage   │
│ • Transparent Milestone   │   │ • Clinical Partnerships    │   │ • Grant & Milestone Logging  │
│   Tracking & Updates      │   │ • HIPAA/GDPR Compliance    │   │ • Cryptographic Audit Log    │
└───────────────────────────┘   └────────────────────────────┘   └──────────────────────────────┘
```

---

## 👥 Three Primary User Group Pathways

### 1. General Public & Donors
- **Open-Science Discovery**: Explore active preclinical pipelines and clinical trial breakthroughs.
- **Direct Crowdfunding**: Donate directly to specific medical fields or clinical pipelines with real-time goal progress tracking.
- **Transparent Updates**: Track completion metrics and receive verifiable milestone logs.

### 2. Hospitals & Clinical Partners
- **Verified Clinical Data**: Access authenticated trial progress data and protocol specifications.
- **Anonymized Patient Cohort Records**: Upload HIPAA & GDPR compliant de-identified patient data with 256-bit cryptographic verification hashes.
- **Clinical Trial Partnerships**: Request site partnerships and joint trial participation directly through trial protocols.

### 3. Scientific Research Institutions & PIs
- **Hierarchical Role-Based Access Control (RBAC)**:
  - **Principal Investigator (PI)**: Full publication rights, privacy controls, grant management, and RBAC policy administration.
  - **Senior Scientist**: Access confidential preclinical data, log milestone progress, review lab technician uploads.
  - **Lab Technician**: Upload raw experimental datasets (FastQ/CSV), log daily assay results.
  - **Hospital Partner**: Read-only clinical data access and cohort record submission.
- **Encrypted Data Vault**: Secure raw sequencing data and pre-publication manuscripts.

---

## 🗄️ Database Architecture & Schema

BioTrack uses an SQL engine (SQLite3 embedded out-of-the-box, with full PostgreSQL/Supabase migration scripts in [`Database/schema.sql`](Database/schema.sql)).

### Entity Relationship Structure
- **`organizations`**: Academic labs, biotech firms, and partner hospital centers.
- **`users`**: Platform users mapped to organizational IDs and RBAC roles (`pi`, `scientist`, `tech`, `hospital`, `public`).
- **`research_projects`**: Clinical protocols containing stage, visibility, progress %, crowdfunding targets, and raised totals.
- **`milestones`**: Sequenced trial checkpoints linked to projects.
- **`datasets`**: FastQ sequencing outputs, CSV assay measurements, and signed pathology reports.
- **`donations`**: Public crowdfunding donation transactions ledger.
- **`hospital_cohorts`**: De-identified patient cohort submissions with verification hashes.
- **`project_members`**: Hierarchical RBAC mappings governing per-project user capabilities.
- **`audit_logs`**: Immutable activity trail.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Tailwind CSS CDN (Custom Modern Green Aesthetic), FontAwesome 6, Vanilla ES6 JavaScript (`app.js`).
- **Backend API**: Node.js & Express.js ([`server.js`](server.js)).
- **Database Engine**: SQLite3 ([`Database/biotrack.db`](Database/biotrack.db)) + PostgreSQL/Supabase schema ([`Database/schema.sql`](Database/schema.sql)).
- **Data Transport**: RESTful JSON API over HTTP/CORS.

---

## ⚡ Quickstart & Installation Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher

### 1. Initialize Database & Seed Mock Data
Run the database seeder to create `Database/biotrack.db` and populate initial protocols:
```bash
npm run seed
```

### 2. Start the REST API Backend & Web Server
Launch the Express backend server on port 5000:
```bash
npm start
```

Once running, access the platform in your browser at:
👉 **`http://localhost:5000/index.html`**

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | System health check & API status |
| `/api/stats` | `GET` | Ecosystem aggregate metrics (Studies, Datasets, Raised Funds) |
| `/api/projects` | `GET` | Filter projects by `q`, `stage`, `visibility`, `domain` |
| `/api/projects/:id` | `GET` | Fetch protocol details with milestones, datasets, cohorts, & RBAC |
| `/api/projects` | `POST` | Register a new research protocol |
| `/api/projects/:id/milestones/:mId` | `PATCH` | Update milestone completion & recalculate progress % |
| `/api/projects/:id/donate` | `POST` | Process public crowdfunding donation |
| `/api/projects/:id/cohorts` | `POST` | Submit anonymized hospital patient cohort record |
| `/api/auth/login` | `POST` | User authentication endpoint |

---

## 📁 Repository Directory Structure

```
AuthRos/
├── index.html            # Home Dashboard & Ecosystem Overview
├── research.html         # Research & Crowdfunding Hub (Filters & Directory)
├── study-detail.html     # Protocol Details, Milestones & RBAC Matrix
├── publish.html          # New Study Registration Wizard & Live Preview
├── profile.html          # User & Lab Profile (Grants & Managed Studies)
├── auth.html             # Split Authentication (Sign In & Register Lab)
├── app.js                # Frontend API Bridge & Interactivity Manager
├── styles.css            # Custom Modern Green Design System & Glassmorphism
├── server.js             # Node.js + Express REST API Server
├── package.json          # Project dependencies & npm scripts
├── README.md             # Platform Documentation & Architecture Guide
└── Database/
    ├── schema.sql        # Database DDL for PostgreSQL/SQLite
    ├── init-db.js        # Database Initializer & Mock Data Seeder
    └── biotrack.db       # Embedded SQLite Database File
```

---

© 2026 **BioTrack Platform**. Open Science, Crowdfunding & Hospital Clinical Integrity.
