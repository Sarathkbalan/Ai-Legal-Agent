# LawIntel — Production UK Legal Research AI Agent

**LawIntel** is a production-style, secure, RAG-powered legal research platform engineered specifically for **United Kingdom Law** (covering England & Wales, Scotland, Northern Ireland, and UK Parliament legislation). 

The platform enables solicitors, barristers, and legal researchers to upload authentic UK legal authorities (judgments, statutes, statutory instruments), enforces strict rejection gates for foreign or non-legal documents, stores vector embeddings in Qdrant, and synthesizes structured legal opinions adhering strictly to the **IRAC** (Issue, Rule, Application, Conclusion) method with verified pinpoint citations.

---

## 1. Technology Requirements Matrix

| Layer | Requirement | Implemented Technology | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + Vite | React 19 + Vite 8 | Built & Verified |
| **Frontend Language** | JavaScript Only | Pure JavaScript (**No TypeScript**) | 100% JS Compliant |
| **Frontend UI Design** | Chakra UI Design System | Custom Chakra UI Design System Components (`#319795` Teal, `#1A202C` Charcoal, `#171923` Gray) | Fully Implemented |
| **Backend Framework** | Node.js + Express | Node.js (v18+) + Express 4 REST API | Built & Running |
| **Backend Language** | JavaScript | Pure JavaScript (CommonJS / ESM hybrid) | 100% JS Compliant |
| **Primary Database** | MongoDB | MongoDB 6+ with Mongoose ODM | Connected |
| **Vector Database** | Qdrant | Qdrant (1024-dimension Cosine distance, HNSW indexes) | Running on port 6333 |
| **Embedding Model** | `BAAI/bge-m3` | 1024-dimensional dense vectors via Hugging Face Inference API / Deterministic unit-normalized local engine | Integrated |
| **Large Language Model** | Groq API | `openai/gpt-oss-120b` enforcing judicial tone & IRAC structuring | Integrated |
| **Security Guardrail** | Prompt Guard 2 | `meta-llama/llama-prompt-guard-2-86m` screening + Regex heuristic defense | Integrated |
| **Document Reader** | View & Download | Full in-browser viewer with keyword search & direct attachment downloads | Verified |

---

## 2. System Architecture

```
                                  USER BROWSER
                         (React 19 + Vite + Chakra UI)
                                       │
                         HTTP REST API │ (Port 5173 -> 5000)
                                       ▼
                       NODE.JS / EXPRESS REST BACKEND
                 (Helmet, Rate-Limiting, Multer Disk Storage)
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
 9-STAGE INGESTION PIPELINE                                  RESEARCH & SYNTHESIS
 ├── Stage 1: File Integrity & Magic Bytes                   ├── Security Guardrail
 │   └── Reject Corrupted (`CORRUPTED_FILE`)                 │   └── Llama Prompt Guard 2
 ├── Stage 2: Exact & Near-Duplicate Detection               ├── Query Planning & Expansion
 │   ├── SHA-256 (`DUPLICATE_DOCUMENT`)                      │   └── Neutral citation extraction
 │   └── 64-bit SimHash >92% (`NEAR_DUP`)                    ├── BGE-M3 Dense Embedding
 ├── Stage 3: Text & Layout Extraction                       │   └── 1024-dim Query Vector
 │   └── PDF (`pdf-parse`), DOCX (`mammoth`), TXT            ├── Hybrid Retrieval (Qdrant)
 ├── Stage 4: Legal Classification Gate                      │   └── Cosine vector search & filters
 │   └── Reject Non-Legal (`NON_LEGAL_DOCUMENT`)             ├── Cross-Encoder Reranking
 ├── Stage 5: UK Jurisdiction Detection                      │   └── Pinpoint paragraph relevance
 │   └── Reject Non-UK Law (`NON_UK_LEGAL_DOCUMENT`)         ├── Groq LLM Synthesis
 ├── Stage 6: Neutral Citation & Metadata Extraction         │   └── `openai/gpt-oss-120b` (IRAC)
 ├── Stage 7: Pinpoint Paragraph Aware Chunking              └── Citation Verification Engine
 ├── Stage 8: BGE-M3 Embedding Generation (1024-dim)             └── In-context truth verification
 └── Stage 9: Atomic Storage (MongoDB & Qdrant)                       │
        │                                                             │
        ▼                                                             ▼
  MONGODB (Port 27017)                                       QDRANT (Port 6333)
  - Raw Document Content & File Paths                         - 1024-dim Vector Points
  - Structured Legal Metadata                                 - Full Text & Metadata Payload
  - Pinpoint Paragraph Chunks                                 - HNSW Payload Indices
  - Research Sessions & Audit Logs                            - Jurisdiction & Court Tier Filter
```

---

## 3. Detailed Model Specifications

### 1. Large Language Model (LLM)
- **Model**: `openai/gpt-oss-120b`
- **Provider**: Groq API
- **Purpose**: Generates high-authority legal opinions structured in strict **IRAC** (Issue, Rule, Application, Conclusion) format.
- **UK Judicial Tone**: Synthesizes ratios of binding UK appellate judgments, distinguishing *obiter dicta* from *ratio decidendi*.
- **Local Fallback**: Includes a built-in deterministic legal synthesis fallback that guarantees functional responses even when external API keys are omitted or rate-limited.

### 2. Embeddings Model
- **Model**: `BAAI/bge-m3`
- **Provider**: Hugging Face Inference API / Local Dense Engine
- **Vector Dimension**: `1024`
- **Metric**: Cosine Distance
- **Purpose**: Encodes full semantic meaning of legal text across complex multi-paragraph UK legal judgments, statutory provisions, and judicial arguments.

### 3. Security Guardrail Model
- **Model**: `meta-llama/llama-prompt-guard-2-86m`
- **Threshold**: Risk score `>= 0.75`
- **Purpose**: Screens every query for adversarial injections, jailbreaks, persona overrides, and unauthorized system prompt exfiltration.

---

## 4. In-Browser Document Viewing & Downloading

The platform allows users to view and download all uploaded authorities directly in the web application:

1. **In-Browser Document Reader (`DocumentViewerModal.jsx`)**:
   - Accessible via the **"Read"** action in the Document Vault table, or the **"Read Full Judgment"** button on any retrieved research chunk.
   - **Live Substring Search**: Type to highlight all occurrences in the judgment with match count and match navigation controls.
   - **Typography Selector**: Toggle between **Serif** (legal report style) and **Sans-Serif** formats.
   - **Copy-to-Clipboard**: Instantly copy full text with visual feedback.
   - **Direct Download Button**: Download original file directly from within the viewer modal.

2. **File Downloads (`/api/v1/documents/:id/download`)**:
   - Files are stored on the server filesystem (`backend/uploads/`) with sanitized unique timestamp filenames.
   - Served with `Content-Disposition: attachment; filename="<original_name>"` and appropriate MIME headers.
   - Seamless dynamic fallback: If a legacy document record lacked a saved physical file, the backend dynamically reconstructs the complete document from ordered chunks in MongoDB.

---

## 5. Quickstart Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **MongoDB**: Running locally at `mongodb://localhost:27017`
- **Docker**: For running Qdrant

---

### Step 1: Start Qdrant Vector Database
Run Qdrant in a Docker container:
```powershell
docker run -d --name qdrant_uk_legal -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```
Verify Qdrant is healthy:
```powershell
curl http://localhost:6333/readyz
```

---

### Step 2: Configure & Start Backend
Navigate to `backend/` and install dependencies:
```powershell
cd backend
npm install
```

Configure your environment:
```powershell
copy .env.example .env
```
*(Optional)* Add your `GROQ_API_KEY` and `HF_API_TOKEN` to `.env`. If left blank, the backend automatically uses robust built-in mock/deterministic engines for offline development.

Seed landmark UK cases into Qdrant & MongoDB (*Barclays Bank* [2020] UKSC 13, *Robinson* [2018] UKSC 4, *Human Rights Act 1998*):
```powershell
npm run seed
```

Start the backend server:
```powershell
npm start
```
The REST API is now live at: `http://localhost:5000/api/v1`

---

### Step 3: Start Frontend
Open a new terminal, navigate to `frontend/`, and install dependencies:
```powershell
cd frontend
npm install
```

Start the development server:
```powershell
npm run dev
```
Or build and preview the production bundle:
```powershell
npm run build
npm run preview
```
Open your browser at: **`http://localhost:5173/`**

---

### Step 4: Run Automated Verification Tests
Run the test suite in `backend/`:
```powershell
cd backend
npm test
```
All 10 test cases will execute and verify:
- Rejection of empty documents (`EMPTY_DOCUMENT`)
- Rejection of corrupted files (`CORRUPTED_FILE`)
- Rejection of non-legal files (`NON_LEGAL_DOCUMENT`)
- Rejection of foreign non-UK law (`NON_UK_LEGAL_DOCUMENT`)
- Acceptance of authentic UK Supreme Court judgments
- Prompt Guard 2 adversarial injection defense
- Pinpoint citation validation

---

## 6. Live Service Ports & URLs

| Service | Port | Endpoint | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI (React + Vite)** | 5173 | `http://localhost:5173/` | Web Application (Chakra UI) |
| **Backend REST API** | 5000 | `http://localhost:5000/api/v1` | Express REST API |
| **API Health Check** | 5000 | `http://localhost:5000/api/v1/health` | Health Check Endpoint |
| **Qdrant Vector Database** | 6333 | `http://localhost:6333/dashboard` | Qdrant Web UI & REST API |
| **MongoDB Database** | 27017 | `mongodb://localhost:27017` | Document Store |

---

## 7. Project Repositories & Sub-Documentation

- For in-depth backend architecture, API request/response schemas, and pipeline services, see [**`backend/README.md`**](backend/README.md).
- For frontend components, Chakra design tokens, and UI features, see [**`frontend/README.md`**](frontend/README.md).
- For the full verification and test log, see [**`walkthrough.md`**](walkthrough.md).
