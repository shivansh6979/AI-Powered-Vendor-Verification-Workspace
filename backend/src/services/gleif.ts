import axios from 'axios';

interface GleifEntity {
  lei: string;
  entity: {
    legalName: {
      value: string;
    };
    legalAddress?: {
      streetAddress: string;
      city: string;
      region: string;
      postalCode: string;
      country: string;
    };
    businessProcess?: Array<{
      processingDate: string;
      eventType: string;
    }>;
  };
  registration?: {
    initialRegistrationDate?: string;
    lastUpdateDate?: string;
  };
}

interface GleifSearchResponse {
  data: GleifEntity[];
  meta?: {
    pagination?: {
      totalCount: number;
    };
  };
}

export interface CompanyVerificationResult {
  status: 'VERIFIED' | 'MISMATCH' | 'UNABLE_TO_VERIFY';
  lei?: string;
  matchedName?: string;
  details?: {
    country: string;
    registrationDate?: string;
    lastUpdateDate?: string;
    address?: string;
  };
  rawResponse: unknown;
}

const baseUrl = 'https://lei.tools/api/v1';

// Mock function for sandbox/development
function getMockVerificationResult(query: string): CompanyVerificationResult {
  const mockLei = `5ZWQvMGfjMXR${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
  return {
    status: 'VERIFIED',
    lei: mockLei,
    matchedName: query,
    details: {
      country: 'IN',
      registrationDate: '2015-01-15',
      lastUpdateDate: new Date().toISOString().split('T')[0],
      address: 'Mumbai, India',
    },
    rawResponse: { mock: true, query, lei: mockLei },
  };
}

export async function verifyCompanyWithGleif(
  companyName: string,
  registrationNumber?: string,
  useSandboxMode: boolean = true
): Promise<CompanyVerificationResult> {
  try {
    // Use sandbox mode for development
    if (useSandboxMode) {
      return getMockVerificationResult(companyName);
    }

    // Search by company name
    const searchUrl = `${baseUrl}/search/entities`;
    const params = new URLSearchParams({
      q: companyName,
      pageSize: '10',
    });

    const response = await axios.get<GleifSearchResponse>(
      `${searchUrl}?${params.toString()}`,
      {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const entities = response.data.data;

    if (!entities || entities.length === 0) {
      return {
        status: 'UNABLE_TO_VERIFY',
        rawResponse: response.data,
      };
    }

    const entity = entities[0];
    const matchedName = entity.entity.legalName.value;

    // Check if the company name matches (case-insensitive)
    const nameMatch = matchedName.toLowerCase().includes(companyName.toLowerCase());

    if (!nameMatch) {
      return {
        status: 'MISMATCH',
        lei: entity.lei,
        matchedName,
        details: {
          country: entity.entity.legalAddress?.country || 'Unknown',
          registrationDate: entity.registration?.initialRegistrationDate,
          lastUpdateDate: entity.registration?.lastUpdateDate,
          address: entity.entity.legalAddress
            ? `${entity.entity.legalAddress.streetAddress}, ${entity.entity.legalAddress.city}, ${entity.entity.legalAddress.country}`
            : undefined,
        },
        rawResponse: response.data,
      };
    }

    return {
      status: 'VERIFIED',
      lei: entity.lei,
      matchedName,
      details: {
        country: entity.entity.legalAddress?.country || 'Unknown',
        registrationDate: entity.registration?.initialRegistrationDate,
        lastUpdateDate: entity.registration?.lastUpdateDate,
        address: entity.entity.legalAddress
          ? `${entity.entity.legalAddress.streetAddress}, ${entity.entity.legalAddress.city}, ${entity.entity.legalAddress.country}`
          : undefined,
      },
      rawResponse: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('GLEIF API rate limit exceeded. Please try again later.');
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Invalid GLEIF API credentials');
      }
    }

    console.error('GLEIF verification error:', error);
    throw new Error(
      `Failed to verify company: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Helper function to get entity details by LEI
export async function getEntityByLei(lei: string): Promise<GleifEntity | null> {
  try {
    const url = `${baseUrl}/entities/${lei}`;
    const response = await axios.get<GleifEntity>(url, {
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching entity by LEI:', error);
    return null;
  }
}

// Helper function to search entities by registration number
export async function searchByRegistrationNumber(
  registrationNumber: string
): Promise<GleifEntity[]> {
  try {
    const searchUrl = `${baseUrl}/search/entities`;
    const params = new URLSearchParams({
      q: registrationNumber,
      pageSize: '5',
    });

    const response = await axios.get<GleifSearchResponse>(
      `${searchUrl}?${params.toString()}`,
      {
        timeout: 10000,
      }
    );

    return response.data.data || [];
  } catch (error) {
    console.error('Error searching by registration number:', error);
    return [];
  }
}
