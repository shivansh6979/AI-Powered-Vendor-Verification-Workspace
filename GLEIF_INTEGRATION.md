# GLEIF API Integration Guide

## Overview

This application now uses the **GLEIF (Global Legal Entity Identifier Foundation) API** for company verification instead of OpenCorporates.

### Why GLEIF?

✅ **Free to Use** - No API key required
✅ **Global Coverage** - 1.8+ million legal entities worldwide
✅ **Reliable** - Maintained by official regulatory body
✅ **Open Data** - Freely accessible data
✅ **LEI Standard** - Industry-recognized identifier

## GLEIF API Endpoints

### Base URL
```
https://lei.tools/api/v1
```

### Key Endpoints

#### 1. Search Entities
```
GET /search/entities?q={companyName}&pageSize={number}
```

**Parameters:**
- `q` - Company name to search for
- `pageSize` - Number of results (default: 10)

**Response:**
```json
{
  "data": [
    {
      "lei": "5ZWQvMGfjMXR...",
      "entity": {
        "legalName": {
          "value": "ABC Technologies Pvt Ltd"
        },
        "legalAddress": {
          "streetAddress": "123 Tech Street",
          "city": "Bangalore",
          "region": "Karnataka",
          "postalCode": "560001",
          "country": "IN"
        }
      },
      "registration": {
        "initialRegistrationDate": "2015-01-15",
        "lastUpdateDate": "2024-01-01"
      }
    }
  ]
}
```

#### 2. Get Entity by LEI
```
GET /entities/{lei}
```

**Parameters:**
- `lei` - Legal Entity Identifier (e.g., 5ZWQvMGfjMXR...)

## Implementation

### Service File
**Location:** `backend/src/services/gleif.ts`

**Main Functions:**
```typescript
// Verify company details against GLEIF
verifyCompanyWithGleif(
  companyName: string,
  registrationNumber?: string,
  useSandboxMode?: boolean
): Promise<CompanyVerificationResult>

// Get entity details by LEI
getEntityByLei(lei: string): Promise<GleifEntity | null>

// Search by registration number
searchByRegistrationNumber(registrationNumber: string): Promise<GleifEntity[]>
```

### Verification Workflow

```
1. User enters company name
   ↓
2. API calls GLEIF search endpoint
   ↓
3. Compare response with vendor data
   ↓
4. Return verification result:
   - VERIFIED: Name matches
   - MISMATCH: Name found but differs
   - UNABLE_TO_VERIFY: No match found
```

## Configuration

### Environment Variables
```env
# GLEIF Sandbox Mode (uses mock data for development)
GLEIF_SANDBOX_MODE="true"
```

### Sandbox Mode
When `GLEIF_SANDBOX_MODE=true`, the API returns mock data:
- ✅ Mock LEI generated
- ✅ Mock company name returned
- ✅ No actual API calls made
- ✅ Perfect for local development

To use real GLEIF API:
```env
GLEIF_SANDBOX_MODE="false"
```

## API Response Mapping

### GLEIF Response → Application Fields

| GLEIF Field | App Field | Notes |
|-------------|-----------|-------|
| lei | externalId | Legal Entity Identifier |
| entity.legalName.value | matchedName | Official legal name |
| entity.legalAddress.country | country | 2-letter country code |
| registration.initialRegistrationDate | registrationDate | When entity was registered |
| registration.lastUpdateDate | lastUpdateDate | Last update timestamp |
| entity.legalAddress | address | Full address |

## Verification States

### 1. VERIFIED ✅
**Condition:** Company name matches (case-insensitive)

**Response:**
```json
{
  "status": "VERIFIED",
  "lei": "5ZWQvMGfjMXR...",
  "matchedName": "ABC Technologies Pvt Ltd",
  "details": {
    "country": "IN",
    "registrationDate": "2015-01-15",
    "lastUpdateDate": "2024-01-01",
    "address": "123 Tech Street, Bangalore, India"
  }
}
```

### 2. MISMATCH ⚠️
**Condition:** Company found but name differs significantly

**Response:**
```json
{
  "status": "MISMATCH",
  "lei": "5ZWQvMGfjMXR...",
  "matchedName": "ABC Technology Limited",
  "details": { ... }
}
```

**Action Taken:**
- Task created for reviewer
- Vendor status → ACTION_REQUIRED
- Email notification sent

### 3. UNABLE_TO_VERIFY ❌
**Condition:** No matching company found in GLEIF

**Response:**
```json
{
  "status": "UNABLE_TO_VERIFY",
  "matchedName": null
}
```

## Error Handling

### Rate Limiting
- GLEIF API has no strict rate limits for free access
- Implemented timeout: 10 seconds per request
- Automatic retry not implemented (add if needed)

### Network Errors
- Timeout errors → "Failed to verify company"
- Connection errors → "Service temporarily unavailable"
- Invalid responses → "Failed to parse verification response"

## Testing

### Test with Sandbox Mode (Recommended)
```bash
# Default - uses mock data
GLEIF_SANDBOX_MODE="true" npm run dev

# Verification returns:
# - Random generated LEI
# - Mock company data
# - Instant responses (no network calls)
```

### Test with Real API
```bash
# Uses actual GLEIF API
GLEIF_SANDBOX_MODE="false" npm run dev

# Search for real companies:
# - Apple Inc.
# - Microsoft Corporation
# - Google LLC
# - HSBC Holdings
# - BMW AG
```

### Example Companies to Test

**Indian Companies:**
- TCS (Tata Consultancy Services)
- Infosys Limited
- HDFC Bank
- Reliance Industries

**Global Companies:**
- Apple Inc.
- Microsoft Corporation
- Amazon.com Inc.
- Toyota Motor Corporation

## Database Integration

### VerificationResult Table
```prisma
model VerificationResult {
  id                   String   @id @default(cuid())
  vendorId             String   @unique
  status               VerificationStatus  // VERIFIED, MISMATCH, UNABLE_TO_VERIFY
  externalId           String?  // LEI from GLEIF
  matchedName          String?
  matchedRegistration  String?  // Also stores LEI
  rawResponse          Json     // Full GLEIF response
  verifiedAt           DateTime @default(now())
}
```

## Advantages Over OpenCorporates

| Aspect | GLEIF | OpenCorporates |
|--------|-------|-----------------|
| **Cost** | Free | Paid API |
| **API Key** | Not required | Required |
| **Coverage** | 1.8M+ entities | Variable |
| **Global** | Yes | Yes |
| **Reliability** | Regulatory standard | Community-sourced |
| **LEI** | Official identifier | Not included |
| **Setup Time** | Immediate | Account creation needed |

## Future Enhancements

1. **Advanced Matching**
   - Fuzzy string matching for name variations
   - Alias support
   - Historical name lookups

2. **Enhanced Data**
   - Extract company officers/directors
   - Get parent company information
   - Access historical changes

3. **Caching**
   - Cache GLEIF results locally
   - Reduce API calls for repeated searches
   - TTL-based cache invalidation

4. **Batch Operations**
   - Verify multiple companies in one call
   - Bulk import with verification

## Resources

- **GLEIF Official**: https://www.gleif.org/
- **LEI Tools API**: https://lei.tools/
- **LEI Search**: https://www.gleif.org/en/about-lei/lei-search
- **API Documentation**: https://lei.tools/api/

## Troubleshooting

### Issue: "GLEIF API rate limit exceeded"
**Solution:** Already handled - uses mock data in sandbox mode

### Issue: "Failed to verify company"
**Cause:** Network error or API timeout
**Solution:** Check internet connection, ensure GLEIF API is accessible

### Issue: "Entity not found"
**Cause:** Company not registered in GLEIF or wrong name
**Solution:** Try alternative company names or registration number

### Issue: Want to test with real data
**Solution:** Set `GLEIF_SANDBOX_MODE="false"` in .env

## Support

For GLEIF API issues, visit: https://www.gleif.org/en/about-lei/contact-us
