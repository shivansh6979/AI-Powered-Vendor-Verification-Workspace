import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/config/env';
import { ExtractedData, extractedDataSchema } from '@/lib/validation';
import { DocumentType } from '@prisma/client';

const client = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);

const extractionPrompts: Record<DocumentType, string> = {
  REGISTRATION_CERTIFICATE: `Extract the following information from this Company Registration Certificate:
- Company Name
- Registration Number
- Address
- Date of Incorporation (if available)

Return ONLY valid JSON with these fields (use null for missing data):
{
  "companyName": string | null,
  "registrationNumber": string | null,
  "address": string | null,
  "confidence": {
    "companyName": number between 0-1,
    "registrationNumber": number between 0-1,
    "address": number between 0-1
  }
}`,

  GST_CERTIFICATE: `Extract the following information from this GST Certificate:
- Company Name
- GST Number (GSTIN)
- Business Address
- Registration Status

Return ONLY valid JSON with these fields (use null for missing data):
{
  "companyName": string | null,
  "gstNumber": string | null,
  "address": string | null,
  "confidence": {
    "companyName": number between 0-1,
    "gstNumber": number between 0-1,
    "address": number between 0-1
  }
}`,

  BANK_DOCUMENT: `Extract the following information from this Bank Document/Statement:
- Bank Account Number (last 4 digits visible or full)
- IFSC Code
- Account Holder Name
- Bank Name

Return ONLY valid JSON with these fields (use null for missing data):
{
  "companyName": string | null,
  "bankAccountNumber": string | null,
  "ifscCode": string | null,
  "confidence": {
    "companyName": number between 0-1,
    "bankAccountNumber": number between 0-1,
    "ifscCode": number between 0-1
  }
}`,
};

export async function extractDataFromDocument(
  fileBuffer: Buffer,
  mimeType: string,
  documentType: DocumentType
): Promise<{ extracted: ExtractedData; rawResponse: unknown }> {
  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const base64Data = fileBuffer.toString('base64');

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType as
            | 'image/jpeg'
            | 'image/png'
            | 'application/pdf'
            | 'image/webp',
        },
      },
      {
        text: extractionPrompts[documentType],
      },
    ]);

    const responseText = response.response.text();

    let parsedResponse: unknown;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      throw new Error('Failed to parse AI extraction response');
    }

    const validated = extractedDataSchema.parse(parsedResponse);

    return {
      extracted: validated,
      rawResponse: parsedResponse,
    };
  } catch (error) {
    console.error('Document extraction error:', error);
    throw new Error(
      `Failed to extract data from document: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function compareExtractedData(
  documents: Array<{
    type: DocumentType;
    extracted: ExtractedData;
  }>
): Array<{
  field: string;
  values: Record<string, string | undefined>;
  hasMismatch: boolean;
}> {
  if (documents.length < 2) {
    return [];
  }

  const fields = [
    'companyName',
    'registrationNumber',
    'gstNumber',
    'address',
    'bankAccountNumber',
    'ifscCode',
  ] as const;

  const mismatches: Array<{
    field: string;
    values: Record<string, string | undefined>;
    hasMismatch: boolean;
  }> = [];

  for (const field of fields) {
    const values: Record<string, string | undefined> = {};
    const nonNullValues: string[] = [];

    documents.forEach((doc, idx) => {
      const value = doc.extracted[field as keyof ExtractedData];
      values[`doc_${idx}`] = value as string | undefined;
      if (value) {
        nonNullValues.push(String(value));
      }
    });

    const normalizedValues = nonNullValues.map((v) => v.toLowerCase().trim());
    const hasMismatch =
      normalizedValues.length > 1 &&
      !normalizedValues.every((v) => v === normalizedValues[0]);

    if (hasMismatch || nonNullValues.length > 0) {
      mismatches.push({
        field,
        values,
        hasMismatch,
      });
    }
  }

  return mismatches;
}
