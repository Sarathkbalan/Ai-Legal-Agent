# LawIntel Frontend — UK Legal Research AI Agent UI

The modern, responsive web application interface for the **UK Legal Research AI Agent** (`LawIntel`), engineered exclusively with **React, Vite, JavaScript (No TypeScript)**, and the **Chakra UI Design System** aesthetic.

---

## 1. Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework & Core** | React 19 & Vite 8 | Ultra-fast client-side SPA bundle, **100% JavaScript (No TypeScript)** |
| **Design Language** | Chakra UI Design System | Dark theme utilizing official Chakra UI tokens (`#319795` Teal, `#1A202C` Charcoal, `#171923` Gray, `#2D3748` Borders) |
| **Chakra Primitives** | Custom Modular Components | `Card`, `Badge`, `Button`, `Alert`, `Tabs`, `Stat`, `Modal`, `Input`, `Select` |
| **Iconography** | Lucide React | High-clarity legal, security, and administrative icons |
| **HTTP Client** | Axios | REST client configured for multipart file uploads, JSON research queries, and blob downloads |
| **Styling Engine** | Tailwind CSS & PostCSS | Micro-layout utilities mapped to Chakra UI design tokens |

---

## 2. Key User Interface Features

### 1. Research Workbench (`ResearchWorkbench.jsx`)
- **Interactive Query Input**: Semantic prompt input with pre-configured legal landmark chips (e.g. *Barclays Bank* [2020] UKSC 13 vicarious liability, *Robinson* [2018] UKSC 4 police negligence).
- **Jurisdiction Filter**: Instant filtering across UK jurisdictions (All, England & Wales, Scotland, Northern Ireland, UK Wide).
- **Security & Guardrail Status**: Real-time display of `meta-llama/llama-prompt-guard-2-86m` screening outcome, risk score percentage, and execution latency.
- **Citation Verification Ribbon**: Visual badges indicating whether each cited UK authority was verified in the indexed passages or flagged as an unverified proposition.
- **IRAC Structured Legal Opinion**:
  - **Issue** (Chakra Amber/Orange card)
  - **Rule** (Chakra Blue card)
  - **Application** (Chakra Purple card)
  - **Conclusion** (Chakra Green card)
- **Pinpoint Sources Drawer**: Reranked chunk cards displaying case titles, neutral citations, court tiers, relevance percentages, and specific paragraph numbers (`[1, 2, 24]`).
- **Passage Inspector**: Deep inspection of the selected legal passage with **"Read Full Judgment"** and **"Download"** quick-actions.

### 2. Document Vault (`DocumentVault.jsx` & `DocumentTable.jsx`)
- **Key Metric Stats**: Real-time metric cards (Total Documents, Indexed Chunks, Average Latency, Ingestion Rejections).
- **Filtering & Search**: Live keyword search and dropdown filtering by UK jurisdiction and court tier.
- **Document Management**:
  - **Read**: Opens the in-browser reader modal (`DocumentViewerModal.jsx`).
  - **Download**: Direct one-click download of the original file.
  - **Inspect**: Opens the metadata drawer showing chunks, token counts, and file hashes.
  - **Delete**: Unlinks file and purges data from MongoDB and Qdrant.

### 3. In-Browser Document Viewer (`DocumentViewerModal.jsx`)
- **Full Text Reading**: Read complete judgments, statutory texts, or submissions directly in the browser.
- **Live Search & Highlighting**: Dynamic keyword search across the document text with match counter and match navigation buttons.
- **Serif / Sans Typography Switcher**: Switch between traditional legal book serif font and clean sans-serif.
- **Copy Text**: One-click full text copy to clipboard.
- **Direct Download**: Prominent header button to download the original file.

### 4. 9-Stage Ingestion Upload Modal (`UploadDropzone.jsx`)
- **Drag-and-Drop / File Picker**: Supports `.pdf`, `.docx`, and `.txt` files up to 25MB.
- **Live 9-Stage Progress Tracker**: Animates sequential verification through all 9 ingestion gates.
- **Rejection Diagnostics**: If a non-UK, non-legal, corrupted, empty, or duplicate file is uploaded, a Chakra error modal displays the exact rejection stage, violation code, and remediation advice.

### 5. Compliance & Security Audit Logs (`AuditLogViewer.jsx`)
- Chronological inspection of system actions, prompt guard assessments, upload acceptances, and gate rejections.

---

## 3. Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── chakra/                 # Reusable Chakra UI primitives
│   │   │   ├── Alert.jsx           # Chakra Alert, AlertIcon, AlertTitle
│   │   │   ├── Badge.jsx           # ColorScheme badges (teal, blue, purple, etc.)
│   │   │   ├── Button.jsx          # Chakra active-scale & isLoading buttons
│   │   │   ├── Card.jsx            # Card, CardHeader, CardBody, CardFooter
│   │   │   ├── Input.jsx           # Chakra Input & Select controls
│   │   │   ├── Modal.jsx           # Accessible dialog backdrop & container
│   │   │   ├── Stat.jsx            # Chakra Stat, StatLabel, StatNumber
│   │   │   └── Tabs.jsx            # Line-style active indicator tabs
│   │   ├── documents/              # Document Vault views
│   │   │   ├── DocumentTable.jsx   # Document inventory table with actions
│   │   │   ├── DocumentDetailModal.jsx # Metadata & chunk inspector drawer
│   │   │   ├── DocumentViewerModal.jsx # In-browser full text reader & search
│   │   │   ├── UploadDropzone.jsx  # Drag-and-drop 9-stage upload modal
│   │   │   └── DocumentVault.jsx   # Vault container & metric cards
│   │   ├── research/               # Legal research engine views
│   │   │   ├── ResearchWorkbench.jsx # Prompt bar, IRAC opinion, source drawer
│   │   │   └── ResearchHistory.jsx # Past research sessions
│   │   ├── audit/                  # Compliance views
│   │   │   └── AuditLogViewer.jsx  # System audit trail table
│   │   └── layout/                 # Shell & navigation
│   │       └── Header.jsx          # Top navigation bar with active tab & badges
│   ├── services/                   # REST API client services
│   │   ├── api.js                  # Axios instance with baseUrl & error handling
│   │   ├── documentService.js      # Upload, view, download, list, delete
│   │   ├── researchService.js      # Research queries & session retrieval
│   │   └── auditService.js         # Audit log fetching
│   ├── App.jsx                     # Root application container & tab router
│   ├── index.css                   # Tailwind imports & Chakra CSS variables
│   └── main.jsx                    # React 19 root bootstrap
├── index.html                      # HTML entry with LawIntel title
├── vite.config.js                  # Vite configuration & proxy
├── tailwind.config.js              # Tailwind custom colors & tokens
└── package.json                    # Dependencies & build scripts
```

---

## 4. Setup & Running the Frontend

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Backend API**: Running at `http://localhost:5000/api/v1`

### Installation
```powershell
cd frontend
npm install
```

### Environment Configuration (Optional)
By default, the frontend points to `http://localhost:5000/api/v1`. To customize, create a `.env` file in `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Run Development Server
```powershell
npm run dev
```
Accessible at: `http://localhost:5173/` (with Hot Module Replacement).

### Build for Production
```powershell
npm run build
```
Creates an optimized production bundle in `frontend/dist/`.

### Preview Production Build
```powershell
npm run preview
```
Runs Vite's preview server serving the production build on port `5173`.

---

## 5. Backend REST API Endpoints Consumed

| User Action | HTTP Method & Path | Payload / Query |
| :--- | :--- | :--- |
| **Execute Legal Query** | `POST /api/v1/research/query` | `{ prompt, jurisdictionFilter }` |
| **Upload Document** | `POST /api/v1/documents/upload` | `multipart/form-data` with `file` |
| **Fetch Document Content** | `GET /api/v1/documents/:id/content` | None |
| **Download Document** | `GET /api/v1/documents/:id/download` | Direct browser download |
| **List Documents** | `GET /api/v1/documents` | `page`, `limit`, `jurisdiction`, `search` |
| **Delete Document** | `DELETE /api/v1/documents/:id` | None |
| **Fetch Audit Logs** | `GET /api/v1/audit/logs` | `limit=50` |
| **Health Check** | `GET /api/v1/health` | None |
