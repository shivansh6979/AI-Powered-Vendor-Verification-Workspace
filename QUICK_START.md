# Quick Start Guide

Get the Vendor Verification Workspace running in 5 minutes.

## Prerequisites
- Node.js 18+
- PostgreSQL (local or Docker)
- API Keys:
  - Google Generative AI (Gemini)
  - Resend (for email service)
- **Note**: GLEIF API is free and requires no API key!

## Option 1: Quick Setup (Without Docker)

### Step 1: Clone & Navigate
```bash
cd lexTigres
```

### Step 2: Database Setup
```bash
# Start PostgreSQL
# For Mac/Linux:
brew services start postgresql

# For Windows:
# Use PostgreSQL installer or Docker:
docker run -d \
  -e POSTGRES_USER=vendor_user \
  -e POSTGRES_PASSWORD=vendor_password \
  -e POSTGRES_DB=vendor_verification \
  -p 5432:5432 \
  postgres:16-alpine
```

### Step 3: Backend Setup
```bash
cd backend

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
# DATABASE_URL=postgresql://vendor_user:vendor_password@localhost:5432/vendor_verification
# GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
# RESEND_API_KEY=your-resend-api-key
# RESEND_FROM_EMAIL=no-reply@yourdomain.com

# Install dependencies
npm install

# Setup database schema
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed demo data
npm run db:seed

# Start backend
npm run dev
```

Backend will be available at `http://localhost:5000`

### Step 4: Frontend Setup (New Terminal)
```bash
cd frontend

# Copy environment variables
cp .env.local.example .env.local

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Option 2: Docker Setup (Recommended)

### Step 1: Create .env file
```bash
cd lexTigres
cat > .env << EOF
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
OPENCORPORATES_API_KEY=your-opencorporates-api-key
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=no-reply@yourdomain.com
EOF
```

### Step 2: Run Docker Compose
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Backend API on port 5000
- Frontend on port 3000

### Step 3: Access the Application
```
Frontend: http://localhost:3000
Backend API: http://localhost:5000/api
Health Check: http://localhost:5000/health
```

## Test Data & Scenarios

### Scenario 1: Create & Verify Vendor

1. Go to `http://localhost:3000`
2. Click "Get Started" or navigate to Vendors
3. Create a new vendor:
   - Company Name: "ABC Technologies Pvt Ltd"
   - Contact: "John Doe"
   - Email: "john@abc.com"
   - Phone: "+91-9876543210"
   - Address: "123 Business Street, Mumbai"
   - Reg Number: "REG123456"
   - GST: "27AABCT1234A1Z0"
4. Upload sample documents (JPG/PDF)
5. System will extract data and check for mismatches
6. Run verification → system returns result
7. Change status to "APPROVED" → confirmation email sent

### Scenario 2: Test Missing Documents

1. Create a vendor without uploading documents
2. Click "Check Missing Documents"
3. System identifies missing documents
4. Email notification sent to vendor
5. Task created automatically

### Scenario 3: Version History & Rollback

1. Create a vendor
2. Edit vendor multiple times
3. Click "View History"
4. Select a previous version
5. Click "Restore" → vendor reverts to that state

## Environment Variables

### Backend (.env)

| Variable | Example | Purpose |
|----------|---------|---------|
| DATABASE_URL | postgresql://... | Database connection |
| GOOGLE_GENERATIVE_AI_API_KEY | AIzaSy... | Google Gemini API |
| GLEIF_SANDBOX_MODE | true | Use mock data for dev (no API calls) |
| RESEND_API_KEY | re_... | Email service |
| RESEND_FROM_EMAIL | no-reply@... | From email address |
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment |
| CORS_ORIGIN | http://localhost:3000 | Frontend origin |

**Note**: GLEIF API is completely free and requires no authentication key!

### Frontend (.env.local)

| Variable | Example | Purpose |
|----------|---------|---------|
| NEXT_PUBLIC_API_URL | http://localhost:5000/api | Backend API URL |

## 🌱 Seeding Demo Data

After setting up the database, you can populate it with demo data to test the application:

```bash
cd backend

# Run the seed script
npm run db:seed
```

This creates 5 demo vendors:
- ✅ **TechCorp Solutions** - APPROVED (all documents verified)
- ⚠️ **Global Enterprises** - ACTION_REQUIRED (document mismatches detected)
- 📄 **Innovation Labs** - DRAFT (missing documents)
- 👀 **DataStream Analytics** - UNDER_REVIEW (pending verification)
- ❌ **Shadow Corp** - REJECTED (vendor rejected)

### What Gets Seeded:
- 5 vendors with different statuses
- 13 sample documents (Registration, GST, Bank docs)
- AI-extracted data with confidence scores
- Mismatches between documents
- Tasks for action items
- Complete audit logs

### Testing After Seed:
1. Backend runs and seeding completes
2. Visit `http://localhost:3000`
3. See all 5 vendors with different statuses
4. Test approval, mismatch resolution, document upload workflows
5. Review version history and audit logs

**⚠️ Important**: Seeding clears all existing data before inserting demo data.

## API Testing

### Using cURL

```bash
# Create Vendor
curl -X POST http://localhost:5000/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Corp",
    "contactPerson": "John Doe",
    "email": "john@testcorp.com",
    "phone": "+919876543210",
    "address": "123 Test St",
    "registrationNumber": "REG123"
  }'

# List Vendors
curl http://localhost:5000/api/vendors

# Get Vendor
curl http://localhost:5000/api/vendors/{id}

# Verify Company
curl -X POST http://localhost:5000/api/vendors/{id}/verify
```

### Using Postman

Import the base URL: `http://localhost:5000/api`

Then use the endpoints listed in README.md

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=5001 npm run dev
```

### Database connection error
```bash
# Check PostgreSQL is running
psql -U vendor_user -d vendor_verification

# Reset database
npx prisma db push --force-reset
```

### Frontend can't reach backend
- Check NEXT_PUBLIC_API_URL in .env.local
- Ensure backend is running on port 5000
- Check CORS_ORIGIN in backend .env

### Email not sending
- Verify RESEND_API_KEY is correct
- Check email is in Resend dashboard
- Look at backend logs for errors

## Getting API Keys

### Google Generative AI
1. Go to https://aistudio.google.com
2. Create API key
3. Copy to GOOGLE_GENERATIVE_AI_API_KEY

### GLEIF API (Company Verification)
✅ **FREE - No setup required!**
- Already integrated in sandbox mode (GLEIF_SANDBOX_MODE=true)
- Uses mock data for development (no network calls)
- For production, set GLEIF_SANDBOX_MODE=false to use real API
- Official GLEIF documentation: https://www.gleif.org/
- Search companies free at: https://lei.tools/

### Resend Email Service
1. Go to https://resend.com
2. Create account and get API key
3. Verify your sender email domain
4. Copy to RESEND_API_KEY and RESEND_FROM_EMAIL
5. Or use a test email for development

## Useful Commands

```bash
# Backend
npm run dev           # Development server
npm run build         # Build for production
npm run start         # Start production server
npm run db:push       # Sync database schema
npm run db:migrate    # Run migrations
npm run type-check    # Check TypeScript

# Frontend
npm run dev           # Development server
npm run build         # Build for production
npm run start         # Start production server
npm run type-check    # Check TypeScript
```

## Next Steps

1. **Explore the Dashboard**: Navigate through vendor list and details
2. **Upload Documents**: Test AI extraction with sample PDFs
3. **Verify Companies**: Run OpenCorporates verification
4. **Create Tasks**: Manually create and assign tasks
5. **Review Audit Log**: Check version history of vendors

## Support

- Check README.md for detailed documentation
- Review backend logs for API errors
- Check browser console for frontend errors
- Verify all environment variables are set correctly

Happy Verifying! 🚀
