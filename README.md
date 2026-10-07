# AI-Powered Vendor Verification Workspace

A full-stack application for onboarding and verifying vendors/companies using AI-powered document extraction, external API verification, and automated workflow management.

## 🏗️ Architecture Overview

This is a **monorepo** with a complete separation of concerns:

```
lexTigres/
├── backend/          # Node.js + Express + Prisma
│   └── src/
│       ├── config/   # Environment & configuration
│       ├── lib/      # Database & utilities
│       ├── services/ # Business logic (AI, Email, Verification)
│       ├── routes/   # API routes
│       └── index.ts  # Express server
├── frontend/         # Next.js 15 + React 19
│   ├── app/          # App Router pages
│   ├── components/   # React components
│   └── lib/          # Utilities & API client
└── prisma/           # Shared database schema
```

## 🚀 Features

### 1. Vendor Management
- **CRUD Operations**: Create, read, update, delete vendor information
- **Audit Logging**: Complete version history with rollback capability
- **Status Workflow**: Draft → Under Review → Action Required → Approved/Rejected
- **Real-time Status Updates**: Automatic status transitions based on verification results

### 2. Document Upload & AI Extraction
- **Multi-Document Upload**: Support for Registration Certificate, GST Certificate, Bank Documents
- **AI-Powered Extraction**: Uses Google Gemini API to extract data from documents
- **Auto Comparison**: Detects mismatches across documents
- **Manual Override**: Reviewers can correct extracted data
- **Confidence Scores**: AI provides confidence levels for extracted fields

### 3. Cross-Document Verification
- **Mismatch Detection**: Identifies inconsistencies between documents
- **Field-Level Comparison**: Compares specific fields across all uploaded documents
- **Severity Tracking**: Categorizes mismatches by severity (INFO, WARNING, ERROR)
- **Resolution Tracking**: Maintains history of how mismatches were resolved

### 4. External API Integration
- **GLEIF Verification**: Validates company information against Global Legal Entity Identifier Foundation (free, no key required)
- **Verification States**: Verified, Mismatch, Unable to Verify
- **Automatic Task Creation**: Creates tasks when mismatches are detected
- **Sandbox Mode**: Development-friendly mock API responses (no network calls needed)

### 5. Email Automation
- **Missing Document Alerts**: Automatically emails clients when documents are missing
- **Mismatch Notifications**: Alerts about detected inconsistencies
- **Approval Notifications**: Confirms vendor approval
- **Template-Based**: Customizable email templates
- **Email Logging**: Tracks all sent emails and delivery status

### 6. Workflow & Task Management
- **Automated Tasks**: Creates tasks when action is required
- **Priority Levels**: HIGH, MEDIUM, LOW
- **Due Date Tracking**: Tasks with deadlines
- **Status Management**: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- **Vendor-Task Linking**: Each task is tied to a specific vendor

### 7. Audit & Compliance
- **Complete Audit Trail**: Tracks all changes to vendor data
- **Change History**: Who changed what, when, and why
- **Version Restoration**: Ability to restore vendor to previous state
- **Immutable Logs**: Tamper-proof audit logs

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Google Generative AI (Gemini Flash)
- **External APIs**: GLEIF API (Global Legal Entity Identifier Foundation)
- **Email**: Resend (transactional email service)
- **Validation**: Zod
- **File Handling**: Multer

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod
- **API Client**: Axios
- **Notifications**: Sonner Toast
- **Date Handling**: date-fns

### Infrastructure
- **Database**: PostgreSQL (local or cloud)
- **API Architecture**: REST
- **CORS**: Enabled for frontend-backend communication

## 📋 Project Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Google API key for Gemini
- GLEIF API (free, no key required - sandbox mode available for development)
- Resend API key for email service

### 1. Environment Setup

**Backend (.env)**
```bash
cd backend
cp .env.example .env
```

Fill in the required variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/vendor_verification"
GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key"
# GLEIF API (no key required - free service)
GLEIF_SANDBOX_MODE="true"
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="no-reply@yourdomain.com"
PORT="5000"
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

**Frontend (.env.local)**
```bash
cd frontend
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

### 2. Database Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:push
```

### 3. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📖 API Endpoints

### Vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors` - List vendors
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor
- `PATCH /api/vendors/:id/status` - Update vendor status
- `POST /api/vendors/:id/verify` - Verify company with OpenCorporates

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/vendors/:vendorId/documents` - List documents
- `PATCH /api/documents/:documentId/extracted` - Update extracted data
- `GET /api/vendors/:vendorId/checklist` - Get document checklist
- `POST /api/vendors/:vendorId/check-missing` - Check and notify missing documents

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/vendors/:vendorId/tasks` - List vendor tasks
- `PATCH /api/tasks/:id/status` - Update task status
- `GET /api/tasks/pending` - Get all pending tasks
- `DELETE /api/tasks/:id` - Delete task

## 🔄 Data Flow & Workflow

### Vendor Onboarding Flow
```
1. User creates vendor with basic info (DRAFT)
2. User uploads required documents
3. AI extracts data from documents
4. System compares extracted data across documents
5. If mismatches found → Creates task, sets status to ACTION_REQUIRED
6. If no mismatches → Status becomes UNDER_REVIEW
7. Reviewer can verify against OpenCorporates API
8. If verified → Approval email sent, status = APPROVED
9. If mismatch → Task created, status = ACTION_REQUIRED
```

### Document Verification Flow
```
1. Document uploaded → AI extracts data (confidence scores included)
2. Extracted data compared against:
   - Form data
   - Previously extracted documents
3. If mismatch detected:
   - DocumentMismatch record created
   - Task auto-generated
   - Vendor status → ACTION_REQUIRED
4. Reviewer can manually override extracted fields
5. Once resolved → Mismatch status → RESOLVED
```

### Email Notification Triggers
- Missing required document → Email sent to vendor
- Mismatch detected → Email sent to vendor
- Vendor approved → Approval email sent
- Task action required → Email sent

## 🗄️ Database Schema

### Core Models
- **Vendor**: Main vendor entity with status tracking
- **Document**: Uploaded documents with metadata
- **ExtractedData**: AI-extracted information with confidence scores
- **DocumentMismatch**: Tracks inconsistencies between documents
- **VerificationResult**: OpenCorporates verification results
- **Task**: Action items with priority and due dates
- **VendorAuditLog**: Complete audit trail of all changes
- **EmailLog**: Tracking of all sent emails

### Key Relationships
```
Vendor (1) ──→ (M) Document
Vendor (1) ──→ (M) Task
Vendor (1) ──→ (M) VendorAuditLog
Vendor (1) ──→ (1) VerificationResult
Document (1) ──→ (1) ExtractedData
Vendor (1) ──→ (M) DocumentMismatch
```

## 🔐 Security Considerations

1. **API Key Management**: All API keys stored in environment variables
2. **CORS Configuration**: Restricted to frontend origin
3. **Input Validation**: Zod schemas for all inputs
4. **Type Safety**: Strict TypeScript throughout
5. **Audit Logging**: All changes tracked for compliance
6. **File Upload Limits**: Max 10MB per file
7. **Email Logging**: All emails logged for audit trail

## 🧪 Testing Scenarios

### Test Case 1: Happy Path (Vendor Approved)
1. Create vendor with complete information
2. Upload all three required documents
3. AI extracts matching data
4. Run verification → Returns VERIFIED
5. Change status to APPROVED
6. ✅ Verify approval email sent

### Test Case 2: Document Mismatch
1. Create vendor
2. Upload Registration Doc with Company Name: "ABC Technologies Pvt Ltd"
3. Upload GST Doc with Company Name: "ABC Technologies Ltd"
4. ✅ System detects mismatch, creates task, changes status to ACTION_REQUIRED

### Test Case 3: Missing Document
1. Create vendor
2. Upload only 2 of 3 documents
3. Run missing document check
4. ✅ System identifies missing document, sends email, creates task

### Test Case 4: Version Rollback
1. Create vendor with Company Name: "ABC"
2. Update to: "ABC Technologies Pvt Ltd"
3. Access audit history
4. Restore to previous version
5. ✅ Verify company name reverted to "ABC"

## 📊 Performance Considerations

- **Database Indexes**: Indexes on status, createdAt for fast queries
- **Pagination**: Can be added for large vendor lists
- **Caching**: Can implement Redis for frequently accessed data
- **AI Model**: Uses Gemini Flash (faster, suitable for quick extraction)
- **File Processing**: Async processing with proper error handling

## 🚀 Deployment

### Backend Deployment
```bash
npm run build
npm start
```

### Frontend Deployment
```bash
npm run build
npm start
```

Ensure environment variables are set in production environment.

## 📝 Environment Variables Summary

| Variable | Backend | Frontend | Purpose |
|----------|---------|----------|---------|
| DATABASE_URL | ✅ | - | PostgreSQL connection |
| GOOGLE_GENERATIVE_AI_API_KEY | ✅ | - | Gemini API |
| OPENCORPORATES_API_KEY | ✅ | - | Company verification |
| RESEND_API_KEY | ✅ | - | Email service |
| PORT | ✅ | - | Server port |
| CORS_ORIGIN | ✅ | - | Allowed frontend origin |
| NEXT_PUBLIC_API_URL | - | ✅ | Backend API endpoint |

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use Zod for validation
3. Write clear commit messages
4. Update audit logs for data changes
5. Add appropriate error handling

## 📄 License

Project submitted as technical assessment for Full-Stack Developer position.

## 📞 Support

For issues or questions, refer to the technical documentation or submit an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error logs
