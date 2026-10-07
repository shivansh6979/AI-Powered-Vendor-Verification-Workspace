import { Router, Request, Response } from 'express';
import multer from 'multer';
import { db } from '@/lib/db';
import { extractDataFromDocument, compareExtractedData } from '@/services/ai-extraction';
import { sendEmailNotification } from '@/services/email';
import { DocumentStatus, DocumentType, VendorStatus } from '@prisma/client';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload document
router.post('/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { vendorId, documentType } = req.body;
    const file = req.file;

    if (!file || !vendorId || !documentType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    const fileUrl = `/documents/${vendorId}/${file.originalname}`;

    const document = await db.document.create({
      data: {
        vendorId,
        documentType: documentType as DocumentType,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        status: DocumentStatus.PENDING,
      },
    });

    try {
      const { extracted, rawResponse } = await extractDataFromDocument(
        file.buffer,
        file.mimetype,
        documentType as DocumentType
      );

      await db.extractedData.create({
        data: {
          documentId: document.id,
          companyName: extracted.companyName,
          registrationNumber: extracted.registrationNumber,
          gstNumber: extracted.gstNumber,
          address: extracted.address,
          bankAccountNumber: extracted.bankAccountNumber,
          ifscCode: extracted.ifscCode,
          confidence: extracted.confidence || {},
          rawExtracted: rawResponse as object,
        },
      });

      await db.document.update({
        where: { id: document.id },
        data: { status: DocumentStatus.EXTRACTED },
      });

      // Check for mismatches
      const allDocs = await db.document.findMany({
        where: { vendorId },
        include: { extractedData: true },
      });

      if (allDocs.length > 1) {
        const allExtracted = allDocs
          .filter((d) => d.extractedData)
          .map((d) => ({
            type: d.documentType,
            extracted: {
              companyName: d.extractedData?.companyName ?? undefined,
              registrationNumber: d.extractedData?.registrationNumber ?? undefined,
              gstNumber: d.extractedData?.gstNumber ?? undefined,
              address: d.extractedData?.address ?? undefined,
              bankAccountNumber: d.extractedData?.bankAccountNumber ?? undefined,
              ifscCode: d.extractedData?.ifscCode ?? undefined,
            },
          }));

        const mismatches = compareExtractedData(allExtracted);

        for (const mismatch of mismatches) {
          if (mismatch.hasMismatch) {
            await db.documentMismatch.create({
              data: {
                vendorId,
                fieldName: mismatch.field,
                value1: Object.values(mismatch.values)[0] || '',
                value2: Object.values(mismatch.values)[1] || '',
                source1: 'doc_0',
                source2: 'doc_1',
                severity: 'WARNING',
                status: 'OPEN',
              },
            });
          }
        }

        if (mismatches.some((m) => m.hasMismatch)) {
          await db.vendor.update({
            where: { id: vendorId },
            data: { status: VendorStatus.ACTION_REQUIRED },
          });

          await db.task.create({
            data: {
              vendorId,
              title: 'Review Document Mismatches',
              description: 'Inconsistencies detected between uploaded documents.',
              priority: 'HIGH',
              status: 'PENDING',
              dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    } catch (extractError) {
      console.error('AI extraction failed:', extractError);
    }

    res.status(201).json({ success: true, document });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document',
    });
  }
});

// Get vendor documents
router.get('/vendors/:vendorId/documents', async (req: Request, res: Response) => {
  try {
    const documents = await db.document.findMany({
      where: { vendorId: req.params.vendorId },
      include: { extractedData: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch documents',
    });
  }
});

// Update extracted data
router.patch('/documents/:documentId/extracted', async (req: Request, res: Response) => {
  try {
    const extracted = await db.extractedData.findUnique({
      where: { documentId: req.params.documentId },
    });

    if (!extracted) {
      return res.status(404).json({ success: false, error: 'Extracted data not found' });
    }

    const updated = await db.extractedData.update({
      where: { documentId: req.params.documentId },
      data: {
        companyName: req.body.companyName ?? extracted.companyName,
        registrationNumber: req.body.registrationNumber ?? extracted.registrationNumber,
        gstNumber: req.body.gstNumber ?? extracted.gstNumber,
        address: req.body.address ?? extracted.address,
        bankAccountNumber: req.body.bankAccountNumber ?? extracted.bankAccountNumber,
        ifscCode: req.body.ifscCode ?? extracted.ifscCode,
      },
    });

    res.json({ success: true, extracted: updated });
  } catch (error) {
    console.error('Update extracted data error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update extracted data',
    });
  }
});

// Get document checklist
router.get('/vendors/:vendorId/checklist', async (req: Request, res: Response) => {
  try {
    const vendor = await db.vendor.findUnique({
      where: { id: req.params.vendorId },
      include: {
        documents: { include: { extractedData: true } },
        mismatches: { where: { status: 'OPEN' } },
      },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    const requiredDocuments = Object.values(DocumentType);
    const documentStatus: Record<string, { status: string; uploadedAt?: Date }> = {};

    for (const docType of requiredDocuments) {
      const uploaded = vendor.documents.find((d) => d.documentType === docType);
      documentStatus[docType] = {
        status: uploaded
          ? uploaded.status === DocumentStatus.EXTRACTED
            ? 'VERIFIED'
            : 'AVAILABLE'
          : 'MISSING',
        uploadedAt: uploaded?.createdAt,
      };
    }

    res.json({
      success: true,
      checklist: {
        documentStatus,
        hasOpenMismatches: vendor.mismatches.length > 0,
        mismatchCount: vendor.mismatches.length,
      },
    });
  } catch (error) {
    console.error('Get checklist error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch checklist',
    });
  }
});

// Check missing documents and notify
router.post('/vendors/:vendorId/check-missing', async (req: Request, res: Response) => {
  try {
    const vendor = await db.vendor.findUnique({
      where: { id: req.params.vendorId },
      include: { documents: true },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    const requiredDocuments = [
      DocumentType.REGISTRATION_CERTIFICATE,
      DocumentType.GST_CERTIFICATE,
      DocumentType.BANK_DOCUMENT,
    ];

    const missingDocuments = requiredDocuments.filter(
      (type) => !vendor.documents.some((d) => d.documentType === type)
    );

    if (missingDocuments.length > 0) {
      const result = await sendEmailNotification({
        vendorName: vendor.companyName,
        recipientEmail: vendor.email,
        emailType: 'MISSING_DOCUMENT',
        metadata: {
          missingDocuments: missingDocuments.map((d) => d.replace(/_/g, ' ').toLowerCase()),
        },
      });

      const existingTask = await db.task.findFirst({
        where: {
          vendorId: req.params.vendorId,
          title: { contains: 'Missing Documents' },
        },
      });

      if (!existingTask) {
        await db.task.create({
          data: {
            vendorId: req.params.vendorId,
            title: 'Missing Documents',
            description: `Missing: ${missingDocuments.join(', ')}`,
            priority: 'HIGH',
            status: 'PENDING',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    res.json({ success: true, missingDocuments });
  } catch (error) {
    console.error('Check missing documents error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check documents',
    });
  }
});

// Get mismatches for a vendor
router.get('/vendors/:vendorId/mismatches', async (req: Request, res: Response) => {
  try {
    const mismatches = await db.documentMismatch.findMany({
      where: { vendorId: req.params.vendorId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, mismatches });
  } catch (error) {
    console.error('Get mismatches error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch mismatches',
    });
  }
});

// Resolve a mismatch
router.patch('/mismatches/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { resolution } = req.body;

    const mismatch = await db.documentMismatch.update({
      where: { id: req.params.id },
      data: {
        status: 'RESOLVED',
        resolution: resolution || 'Manually resolved by reviewer',
        resolvedAt: new Date(),
        resolvedBy: 'reviewer',
      },
    });

    // If no more open mismatches for this vendor, move status back to UNDER_REVIEW
    const openMismatches = await db.documentMismatch.count({
      where: { vendorId: mismatch.vendorId, status: 'OPEN' },
    });

    const openTasks = await db.task.count({
      where: { vendorId: mismatch.vendorId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    });

    if (openMismatches === 0 && openTasks === 0) {
      const vendor = await db.vendor.findUnique({ where: { id: mismatch.vendorId } });
      if (vendor && vendor.status === 'ACTION_REQUIRED') {
        await db.vendor.update({
          where: { id: mismatch.vendorId },
          data: { status: 'UNDER_REVIEW' },
        });
      }
    }

    res.json({ success: true, mismatch });
  } catch (error) {
    console.error('Resolve mismatch error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve mismatch',
    });
  }
});

export default router;
