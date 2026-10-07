# System Architecture

## Overview

This is a modern full-stack application with clear separation of concerns between frontend and backend services. The architecture follows industry best practices for scalability, maintainability, and security.

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────────────────────────────┐
│                   NEXT.JS FRONTEND (3000)                       │
│  - React Components (TSX)                                       │
│  - Form Handling (React Hook Form + Zod)                        │
│  - API Communication (Axios)                                    │
│  - UI Components (Tailwind + Radix UI)                          │
└─────────────────┬───────────────────────────────────────────────┘
                  │ REST API (Axios Client)
┌─────────────────▼───────────────────────────────────────────────┐
│                EXPRESS API BACKEND (5000)                       │
│  Routes Layer                                                   │
│  ├─ /api/vendors      (CRUD, verification, status)             │
│  ├─ /api/documents    (upload, extraction, checklist)          │
│  └─ /api/tasks        (CRUD, status management)                │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┼──────────┬──────────────┐
        │         │          │              │
        ▼         ▼          ▼              ▼
    ┌────┐   ┌────────┐  ┌────────┐   ┌─────────┐
    │ DB │   │ Google │  │ OpenCorp│   │ Resend  │
    │    │   │Gemini  │  │orate   │   │ Email   │
    └────┘   │ API    │  │ API     │   └─────────┘
             └────────┘  └────────┘
```

## Component Architecture

### Frontend (Next.js)

#### Directory Structure
```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── vendors/           # Vendor pages
│   ├── documents/         # Document management
│   └── tasks/             # Task management
├── components/            # React Components
│   ├── ui/               # UI Components (button, card, form, etc.)
│   ├── forms/            # Form components
│   ├── pages/            # Page-level components
│   └── common/           # Shared components
├── lib/                  # Utilities
│   ├── api-client.ts    # Axios API client
│   ├── utils.ts         # Helper functions
│   └── validation.ts    # Zod schemas
├── public/              # Static files
└── .env.local          # Environment variables
```

#### Data Flow
```
User Action
    ↓
React Component
    ↓
React Hook Form (Form handling)
    ↓
Zod Validation (Client-side)
    ↓
Axios API Client
    ↓
Express Backend
```

#### Component Patterns
- **Server Components**: Default for data fetching
- **Client Components**: For interactivity (forms, modals)
- **API Routes**: For form submissions and data mutations
- **Custom Hooks**: For reusable logic

### Backend (Express + Node.js)

#### Directory Structure
```
backend/
├── src/
│   ├── config/          # Environment & config
│   │   └── env.ts      # Zod-validated env
│   ├── lib/            # Core utilities
│   │   ├── db.ts       # Prisma client
│   │   └── validation.ts # Zod schemas
│   ├── services/       # Business logic
│   │   ├── ai-extraction.ts  # Gemini integration
│   │   ├── opencorporates.ts # Company verification
│   │   └── email.ts          # Email service
│   ├── routes/         # API routes
│   │   ├── vendors.ts  # Vendor endpoints
│   │   ├── documents.ts # Document endpoints
│   │   └── tasks.ts    # Task endpoints
│   └── index.ts        # Express app setup
├── prisma/
│   └── schema.prisma   # Database schema
└── .env               # Environment variables
```

#### Request Flow
```
HTTP Request (from Frontend)
    ↓
Express Router
    ↓
Route Handler
    ↓
Zod Validation (Server-side)
    ↓
Service Layer
    ├─ Database (Prisma)
    ├─ AI Processing (Google Gemini)
    ├─ External APIs (OpenCorporates)
    └─ Email (Resend)
    ↓
Response JSON
```

## Data Layer

### Database Schema (PostgreSQL + Prisma)

#### Core Entities
```
Vendor
├── id (PK)
├── companyName
├── contactPerson
├── email
├── phone
├── address
├── registrationNumber
├── gstNumber
├── bankAccountNumber
├── ifscCode
└── status (enum)

Document (vendorId FK)
├── id (PK)
├── vendorId (FK)
├── documentType (enum)
├── fileName
├── fileUrl
├── fileSize
└── status (enum)

ExtractedData (documentId FK, unique)
├── id (PK)
├── documentId (FK)
├── companyName
├── registrationNumber
├── gstNumber
├── address
├── bankAccountNumber
├── ifscCode
├── confidence (JSON)
└── rawExtracted (JSON)

VerificationResult (vendorId FK, unique)
├── id (PK)
├── vendorId (FK)
├── status (enum)
├── matchedName
├── matchedRegistration
└── rawResponse (JSON)

Task (vendorId FK)
├── id (PK)
├── vendorId (FK)
├── title
├── description
├── priority (enum)
├── status (enum)
├── dueDate
└── completedAt

DocumentMismatch (vendorId FK)
├── id (PK)
├── vendorId (FK)
├── fieldName
├── value1
├── value2
├── source1
├── source2
├── severity (enum)
├── status (enum)
├── resolution
└── resolvedAt

VendorAuditLog (vendorId FK)
├── id (PK)
├── vendorId (FK)
├── fieldName
├── oldValue
├── newValue
├── changeType (enum)
├── changedBy
└── createdAt

EmailLog
├── id (PK)
├── vendorId
├── recipientEmail
├── emailType (enum)
├── status (enum)
├── sentAt
└── failureReason
```

### Relationships
```
Vendor (1) ──→ (M) Document
Vendor (1) ──→ (M) Task
Vendor (1) ──→ (M) VendorAuditLog
Vendor (1) ──→ (M) DocumentMismatch
Vendor (1) ──→ (1) VerificationResult
Document (1) ──→ (1) ExtractedData
```

## Service Layer

### AI Extraction Service
**File**: `backend/src/services/ai-extraction.ts`

**Purpose**: Extract structured data from vendor documents using Google Gemini API

**Key Functions**:
```typescript
extractDataFromDocument(
  fileBuffer: Buffer,
  mimeType: string,
  documentType: DocumentType
): Promise<{ extracted, rawResponse }>

compareExtractedData(
  documents: Array<{ type, extracted }>
): Array<{ field, values, hasMismatch }>
```

**Process**:
1. Convert file to base64
2. Send to Gemini with structured prompt
3. Parse JSON response
4. Validate with Zod schema
5. Return confidence scores

### Verification Service (GLEIF)
**File**: `backend/src/services/gleif.ts`

**Purpose**: Verify company information against Global Legal Entity Identifier Foundation (GLEIF)

**Key Functions**:
```typescript
verifyCompanyWithGleif(
  companyName: string,
  registrationNumber?: string,
  useSandboxMode?: boolean
): Promise<CompanyVerificationResult>

getEntityByLei(lei: string): Promise<GleifEntity | null>

searchByRegistrationNumber(registrationNumber: string): Promise<GleifEntity[]>
```

**Returns**:
- `VERIFIED`: Company name matches in GLEIF database
- `MISMATCH`: Company found but name differs
- `UNABLE_TO_VERIFY`: Company not found in GLEIF

**Features**:
- ✅ Free API (no key required)
- ✅ Sandbox mode for development (mock responses)
- ✅ No rate limiting for free tier
- ✅ Official LEI identifiers
- ✅ Global coverage (1.8M+ entities)

### Email Service
**File**: `backend/src/services/email.ts`

**Purpose**: Send transactional emails via Resend

**Key Functions**:
```typescript
sendEmailNotification(
  payload: EmailNotificationPayload
): Promise<{ success, messageId?, error? }>
```

**Email Types**:
1. `MISSING_DOCUMENT`: Lists missing documents
2. `MISMATCH_ALERT`: Lists detected mismatches
3. `APPROVAL_NOTIFICATION`: Vendor approved
4. `ACTION_REQUIRED`: Action needed from vendor

## API Specifications

### Vendor Endpoints

#### POST /api/vendors
Create new vendor
```json
{
  "companyName": "ABC Corp",
  "contactPerson": "John Doe",
  "email": "john@abc.com",
  "phone": "+919876543210",
  "address": "123 Business St",
  "registrationNumber": "REG123",
  "gstNumber": "27ABCDE1234F1Z5",
  "bankAccountNumber": "1234567890",
  "ifscCode": "ABCD0000001"
}
```

#### GET /api/vendors
List vendors with optional status filter
```
?status=DRAFT
?status=UNDER_REVIEW
?status=ACTION_REQUIRED
?status=APPROVED
?status=REJECTED
```

#### GET /api/vendors/:id
Detailed vendor with relations (documents, tasks, audit logs)

#### PUT /api/vendors/:id
Update vendor information (creates audit log)

#### PATCH /api/vendors/:id/status
Update vendor status
```json
{ "status": "APPROVED" }
```

#### POST /api/vendors/:id/verify
Verify company with GLEIF (Global Legal Entity Identifier Foundation)
- Free API, no authentication required
- Returns LEI and company details from official registry
- Supports sandbox mode for development

### Document Endpoints

#### POST /api/documents/upload
Multipart form upload
```
vendorId: string
documentType: REGISTRATION_CERTIFICATE | GST_CERTIFICATE | BANK_DOCUMENT
file: File (max 10MB)
```

**Returns**: Document with extracted data

#### GET /api/vendors/:vendorId/documents
List vendor's documents with extracted data

#### PATCH /api/documents/:documentId/extracted
Update extracted data (manual correction)

#### GET /api/vendors/:vendorId/checklist
Document checklist with status

#### POST /api/vendors/:vendorId/check-missing
Check missing documents and trigger notifications

### Task Endpoints

#### POST /api/tasks
Create new task
```json
{
  "vendorId": "...",
  "title": "Review mismatches",
  "description": "...",
  "priority": "HIGH",
  "dueDate": "2024-10-15T00:00:00Z"
}
```

#### GET /api/vendors/:vendorId/tasks
List vendor's tasks

#### PATCH /api/tasks/:id/status
Update task status
```json
{ "status": "COMPLETED" }
```

#### DELETE /api/tasks/:id
Delete task

## Error Handling

### Frontend
- Try-catch blocks wrap API calls
- Toast notifications for user feedback
- Graceful degradation for failed operations
- Form validation before submission

### Backend
- Zod schema validation on all inputs
- Express error middleware
- Detailed error logging
- Appropriate HTTP status codes
- JSON error responses

## Security Considerations

### Input Validation
- Zod schemas on frontend and backend
- Type-safe throughout
- No unvalidated data processing

### API Security
- CORS restricted to frontend origin
- Environment variables for sensitive data
- No credentials in logs
- File upload size limits

### Database
- Prisma prevents SQL injection
- Immutable audit logs
- Relational integrity (foreign keys)
- Indexes on frequently queried fields

### File Handling
- MIME type validation
- Size limits (10MB)
- Secure file storage

## Scalability Considerations

### Database
- Indexes on status, createdAt
- Can add pagination for large datasets
- Connection pooling ready
- Horizontal scaling with read replicas

### API
- Stateless design
- Can scale horizontally
- Load balancer compatible
- Async processing ready

### Frontend
- Static site generation possible
- Incremental Static Regeneration (ISR)
- Code splitting per route
- Image optimization

## Monitoring & Logging

### Backend Logging
- Request logging (route, method, status)
- Error logging with stack traces
- Database query logging (dev only)
- Email delivery tracking

### Frontend Monitoring
- Browser console errors
- API error tracking
- Form submission tracking
- User action logging (optional)

## Deployment Architecture

### Production Setup
```
                    Frontend CDN/Vercel
                           ↓
Load Balancer (Nginx/HAProxy)
        ↓               ↓
    Backend1       Backend2
        ↓               ↓
      ┌─────────────────┐
      │  PostgreSQL DB  │
      │  (with replicas)│
      └─────────────────┘
        ↓               ↓
    S3/Blob      External APIs
  (File Storage)
```

## Development Workflow

1. **Frontend Dev**: `npm run dev` in frontend/
2. **Backend Dev**: `npm run dev` in backend/
3. **Database Changes**: Update schema.prisma, run `npm run db:push`
4. **Type Safety**: `npm run type-check` in both
5. **Testing**: Set up Jest for unit/integration tests

## Performance Optimization

### Frontend
- Code splitting (automatic with App Router)
- Image lazy loading
- CSS-in-JS optimization (Tailwind)
- API request debouncing

### Backend
- Database indexes on frequent queries
- Connection pooling
- Response compression
- Caching headers

## Future Enhancements

1. **WebSocket Support**: Real-time updates
2. **Webhook Integration**: Third-party integrations
3. **Advanced Reporting**: Analytics dashboard
4. **Bulk Operations**: Import/export features
5. **Advanced Permissions**: Role-based access control
6. **Audit Dashboard**: Visualization of changes
7. **Integration Testing**: Comprehensive test suite
8. **CI/CD Pipeline**: Automated deployments

---

This architecture provides a solid foundation for a scalable, maintainable vendor verification platform.
