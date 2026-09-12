# LawIntel Backend — UK Legal Research AI Agent API

A production-grade, secure Node.js & Express REST API powering the **UK Legal Research AI Agent** (`LawIntel`). The backend provides a guarded, RAG-driven legal research engine strictly isolated to United Kingdom law (England & Wales, Scotland, Northern Ireland, and UK Parliament legislation).

---

## 1. Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Runtime & Framework** | Node.js (v18+) & Express 4 | Pure JavaScript (ESM / CommonJS hybrid, **No TypeScript**) |
| **Primary Database** | MongoDB 6+ with Mongoose | Structured metadata, full text, chunk references, research sessions, audit logs |
| **Vector Database** | Qdrant | Dense vector search (`1024-dim`, Cosine distance, HNSW indexing) |
| **Embedding Model** | `BAAI/bge-m3` | 1024-dimensional dense vectors via Hugging Face Inference API with deterministic local unit-normalized fallback |
| **LLM (Synthesis)** | Groq API (`openai/gpt-oss-120b`) | High-speed inference producing structured IRAC (Issue, Rule, Application, Conclusion) legal opinions |
| **Security Guardrail** | `meta-llama/llama-prompt-guard-2-86m` | Prompt injection and jailbreak screening combined with heuristic regex defenses |
| **File Parsing** | `pdf-parse`, `mammoth`, `file-type` | Multi-format extraction for PDF, DOCX, and TXT with magic-byte verification |
| **Duplicate Detection** | Crypto SHA-256 & 64-bit SimHash | Exact file duplicate detection and near-duplicate text similarity screening (>92% threshold) |
| **Security Middleware** | Helmet, CORS, Express-Rate-Limit | Strict CSP, origin whitelisting, and per-IP endpoint rate limiting |

---

## 2. Models Specification

### 1. Large Language Model (LLM)
- **Model ID**: `openai/gpt-oss-120b` (served via Groq API)
- **Role**: Legal synthesis, statutory interpretation, and IRAC structuring.
- **System Prompt**: Enforces UK Legal Research Expert persona, judicial tone, citation validation against provided context, and explicit IRAC format.
- **Fail-Safe Fallback**: If Groq API keys are absent or rate-limited, the engine utilizes a deterministic rule-based UK legal synthesizer preserving full IRAC format.

### 2. Embeddings Model
- **Model ID**: `BAAI/bge-m3`
- **Vector Dimension**: `1024`
- **Distance Metric**: `Cosine`
- **Role**: Semantic representation of legal paragraphs, holding summaries, statutory sections, and judicial dicta.
- **Dual Mode**:
  1. **Hugging Face Inference API**: Using `@huggingface/inference` when `HF_API_TOKEN` is supplied.
  2. **Deterministic Fallback Engine**: Generates unit-normalized 1024-dim semantic hashes, ensuring end-to-end functionality offline without external token dependencies.

### 3. Security Guardrail Model
- **Model ID**: `meta-llama/llama-prompt-guard-2-86m`
- **Threshold**: Risk score `>= 0.75` triggers rejection.
- **Role**: Screens every user prompt before embedding or retrieval for jailbreaks, prompt injection, role-play bypasses, and unauthorized system prompt exfiltration.

---

## 3. Ingestion Pipeline & Rejection Gates

Every uploaded document must pass through a strict **9-stage ingestion gate**:

```
Upload
 ├── Stage 1: File Integrity & Magic Byte Inspection
 ├── Stage 2: SHA-256 Exact & SimHash Near-Duplicate Detection
 ├── Stage 3: Structured Text & Layout Extraction (PDF, DOCX, TXT)
 ├── Stage 4: Legal Classification (Rejection of Non-Legal Content)
 ├── Stage 5: UK Jurisdiction Detection (Strict Rejection of Non-UK Law)
 ├── Stage 6: Neutral Citation & Legal Metadata Extraction
 ├── Stage 7: Legal-Structure Aware Chunking (Preserving [1], [2] paragraphs)
 ├── Stage 8: BGE-M3 Dense Embedding Generation (1024-dim)
 └── Stage 9: Atomic Storage in MongoDB & Qdrant Points Upsert
```

### Rejection Gate Criteria
Documents violating any gate are immediately rejected with **HTTP 422**, an audit event is logged, and the file is deleted from temporary storage:

| Rejection Code | Description | Trigger Condition |
| :--- | :--- | :--- |
| `CORRUPTED_FILE` | Damaged or spoofed file | MIME type does not match true magic bytes (e.g. text file renamed `.pdf`). |
| `EMPTY_DOCUMENT` | No extractable text | File size is 0 bytes or extracted text has `< 50` characters. |
| `DUPLICATE_DOCUMENT` | Exact duplicate | SHA-256 hash matches an existing indexed document in MongoDB. |
| `NEAR_DUPLICATE_DOCUMENT`| Near-duplicate | 64-bit token SimHash similarity exceeds `92%` against existing documents. |
| `NON_LEGAL_DOCUMENT` | Non-legal content | Text lacks legal indicators, statutes, judicial sections, or parties. |
| `NON_UK_LEGAL_DOCUMENT` | Non-UK jurisdiction | Document contains non-UK jurisdiction markers (e.g., US Code, US Supreme Court, Federal Regulations, Canadian/Australian/Indian court designations). |

---

## 4. In-Browser Document Viewing & File Downloads

The backend provides complete support for viewing and downloading uploaded documents:
- **Disk Persistence**: Uploaded files are saved to `backend/uploads/` with timestamp prefixes.
- **Database Storage**: The raw text is saved in MongoDB (`Document.rawContent`) and file path (`Document.filePath`).
- **Dynamic Fallback**: If a legacy document lacks a saved file on disk, `GET /api/v1/documents/:id/content` and `download` reconstruct the full original text dynamically from ordered MongoDB chunks.
- **Cleanup**: `DELETE /api/v1/documents/:id` deletes the document from MongoDB, unlinks the file from `backend/uploads/`, and purges all vector points from Qdrant.

---

## 5. REST API Documentation

Base URL: `http://localhost:5000/api/v1`

### 1. System & Health

#### `GET /health`
Returns health status of the API, MongoDB, and Qdrant.
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-09-07T12:13:47.479Z",
  "services": {
    "mongodb": "connected",
    "qdrant": "connected"
  }
}
```

---

### 2. Document Management

#### `POST /documents/upload`
Uploads a legal document (`multipart/form-data`) through the 9-stage pipeline.
- **Form Field**: `file` (PDF, DOCX, or TXT, max 25MB).
- **Success Response**: `201 Created`
```json
{
  "success": true,
  "message": "UK legal document successfully validated, classified, and indexed.",
  "data": {
    "document": {
      "_id": "6a9ea9e5811ccc5ed76911d8",
      "originalName": "Barclays_Bank_v_Various_Claimants_2020_UKSC_13.txt",
      "mimeType": "text/plain",
      "fileSize": 2452,
      "legalMetadata": {
        "title": "Barclays Bank plc v Various Claimants",
        "neutralCitation": "[2020] UKSC 13",
        "court": "UK Supreme Court",
        "courtTier": 1,
        "jurisdiction": "UK Wide",
        "year": 2020
      },
      "stats": {
        "chunkCount": 3,
        "wordCount": 393
      }
    }
  }
}
```
- **Rejection Response**: `422 Unprocessable Entity`
```json
{
  "success": false,
  "error": {
    "code": "NON_UK_LEGAL_DOCUMENT",
    "message": "Document rejected: Detected non-UK jurisdiction (United States). Only UK legal authorities are permitted.",
    "stage": 5
  }
}
```

#### `GET /documents`
Lists indexed documents with pagination and metadata filtering.
- **Query Params**: `page=1`, `limit=20`, `jurisdiction`, `courtTier`, `search`
- **Response**: `200 OK`

#### `GET /documents/:id`
Returns document record with chunk summaries and extraction stats.
- **Response**: `200 OK`

#### `GET /documents/:id/content`
Fetches complete raw text and metadata for in-browser reading.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "documentId": "6a9ea9e5811ccc5ed76911d8",
    "title": "Barclays Bank plc v Various Claimants",
    "neutralCitation": "[2020] UKSC 13",
    "court": "UK Supreme Court",
    "jurisdiction": "UK Wide",
    "content": "[Authority: Barclays Bank plc...]"
  }
}
```

#### `GET /documents/:id/download`
Downloads the original document file.
- **Response**: `200 OK` with header `Content-Disposition: attachment; filename="<filename>"`

#### `DELETE /documents/:id`
Deletes document, unlinks uploaded file from disk, deletes MongoDB records, and deletes vectors from Qdrant.
- **Response**: `200 OK`

---

### 3. Legal Research Engine

#### `POST /research/query`
Executes guarded hybrid legal research query with IRAC synthesis.
- **Request Body**:
```json
{
  "prompt": "What is the two-stage test for vicarious liability in Barclays Bank [2020] UKSC 13?",
  "sessionId": "optional-uuid",
  "filters": {
    "jurisdiction": "England & Wales"
  }
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "c6a2569f-442a-43c3-8822-2624a0d9eb47",
    "guardrail": {
      "passed": true,
      "riskScore": 0.05
    },
    "structuredAnswer": {
      "irac": {
        "issue": "Whether Barclays Bank plc is vicariously liable...",
        "rule": "The two-stage test reaffirmed in Cox and Mohamud...",
        "application": "Dr Bates was an independent contractor in business on his own account...",
        "conclusion": "The Supreme Court allowed the appeal; the bank is not vicariously liable."
      },
      "model": "openai/gpt-oss-120b"
    },
    "citations": [
      {
        "citation": "[2020] UKSC 13",
        "isVerifiedInContext": true,
        "paragraph": "27"
      }
    ],
    "retrievedChunks": [
      {
        "id": "1535b070-8850-4633-9318-eddc2567a59d",
        "documentId": "6a9e96cfd89543c108f300ed",
        "score": 0.89,
        "metadata": {
          "case_title": "Barclays Bank plc v Various Claimants",
          "neutral_citation": "[2020] UKSC 13",
          "court": "UK Supreme Court"
        },
        "text": "..."
      }
    ],
    "metrics": {
      "totalDurationMs": 185,
      "retrievalMs": 18,
      "synthesisMs": 140
    }
  }
}
```

---

### 4. Audit Trail

#### `GET /audit/logs`
Returns chronologically ordered audit logs (upload events, rejections, queries, security alerts).
- **Query Params**: `limit=50`, `severity`, `eventType`
- **Response**: `200 OK`

---

## 6. Directory Structure

```
backend/
├── src/
│   ├── config/             # DB & client configurations
│   │   ├── database.js     # MongoDB Mongoose connection
│   │   ├── qdrant.js       # Qdrant client & collection init
│   │   └── env.js          # Validated environment variables
│   ├── controllers/        # REST API route controllers
│   │   ├── documentController.js  # Upload, view, download, list, delete
│   │   ├── researchController.js  # Guardrail, retrieval, IRAC synthesis
│   │   └── auditController.js     # System compliance & security logs
│   ├── middlewares/        # Express middlewares
│   │   ├── errorHandler.js # Central error & rejection handler
│   │   ├── rateLimiter.js  # Endpoint rate limiting
│   │   └── uploader.js     # Multer disk upload handler
│   ├── models/             # Mongoose ODM schemas
│   │   ├── Document.js     # Master document schema + rawContent & filePath
│   │   ├── DocumentChunk.js# Pinpoint paragraph chunks
│   │   ├── ResearchSession.js # User query history & sessions
│   │   └── AuditLog.js     # Compliance & security event logs
│   ├── routes/             # Express API routes
│   │   ├── documentRoutes.js
│   │   ├── researchRoutes.js
│   │   └── auditRoutes.js
│   ├── services/           # Core business logic
│   │   ├── extraction/     # Text & metadata extraction
│   │   │   ├── textExtractor.js       # PDF/DOCX/TXT text extraction
│   │   │   ├── metadataExtractor.js   # Neutral citations & courts
│   │   │   └── paragraphChunker.js    # Pinpoint [1], [2] paragraph chunker
│   │   ├── validation/     # Ingestion rejection gates
│   │   │   ├── fileValidator.js       # Magic bytes & corruption check
│   │   │   ├── duplicateDetector.js   # SHA-256 & SimHash duplicate detection
│   │   │   ├── legalClassifier.js     # Non-legal document gate
│   │   │   └── ukJurisdictionGate.js  # Non-UK law rejection gate
│   │   ├── vector/         # Vector DB & Embeddings
│   │   │   ├── embeddingService.js    # BAAI/bge-m3 dense vectors
│   │   │   └── qdrantService.js       # Qdrant upsert & query client
│   │   ├── llm/            # LLM Synthesis & Security
│   │   │   ├── groqService.js         # Groq openai/gpt-oss-120b
│   │   │   └── promptGuardService.js  # Llama Prompt Guard 2
│   │   ├── ingestionService.js        # 9-stage orchestrator
│   │   ├── researchService.js         # Retrieval & Reranker orchestrator
│   │   └── auditService.js            # Audit logger
│   ├── utils/              # Utilities & structured Winston logger
│   │   ├── logger.js
│   │   └── simhash.js
│   └── server.js           # Express app bootstrap
├── scripts/
│   ├── init_qdrant.js      # Creates Qdrant collection & indexes
│   └── seed_sample_uk_cases.js # Seeds landmark UK authorities
├── tests/
│   ├── rejectionGates.test.js # Unit tests for all 6 rejection gates
│   └── researchAgent.test.js  # Integration tests for IRAC & guardrails
├── uploads/                # Disk directory for uploaded documents
├── .env.example            # Environment template
└── package.json            # Node.js dependencies & scripts
```

---

## 7. Setup & Execution Guide

### Prerequisites
1. **Node.js**: v18.0.0 or higher
2. **MongoDB**: Running locally at `mongodb://localhost:27017` or via MongoDB Atlas
3. **Qdrant**: Running in Docker on port `6333`

#### Start Qdrant in Docker
```powershell
docker run -d --name qdrant_uk_legal -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```

### Installation
```powershell
cd backend
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```

Set the following variables (all have safe local defaults):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/uk_legal_research
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=uk_legal_documents

# Optional API Keys (app runs in mock/local mode if omitted)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

HF_API_TOKEN=your_huggingface_token
BGE_M3_MODEL=BAAI/bge-m3
PROMPT_GUARD_MODEL=meta-llama/llama-prompt-guard-2-86m
```

### Seed Landmark UK Authorities
Initializes Qdrant indexes and seeds landmark authorities (*Barclays Bank* [2020] UKSC 13, *Robinson* [2018] UKSC 4, *Human Rights Act 1998*):
```powershell
npm run seed
```

### Run Server
```powershell
# Production start
npm start

# Development with hot-watch
npm run dev
```
Backend API will be accessible at: `http://localhost:5000/api/v1`

### Run Automated Tests
```powershell
npm test
```
Executes all 10 automated test cases verifying rejection gates, prompt injection security, and citation verification.
