import { Router, Request, Response } from 'express';
import { db } from '@/lib/db';
import { vendorFormSchema, vendorStatusUpdateSchema } from '@/lib/validation';
import { verifyCompanyWithGleif } from '@/services/gleif';
import { sendEmailNotification } from '@/services/email';
import { VendorStatus, ChangeType } from '@prisma/client';
import { env } from '@/config/env';

const router = Router();

// Create vendor
router.post('/vendors', async (req: Request, res: Response) => {
  try {
    const validated = vendorFormSchema.parse(req.body);

    const vendor = await db.vendor.create({
      data: {
        ...validated,
        status: VendorStatus.DRAFT,
      },
    });

    await db.vendorAuditLog.create({
      data: {
        vendorId: vendor.id,
        changeType: ChangeType.CREATE,
        fieldName: 'vendor',
        newValue: vendor.companyName,
      },
    });

    res.status(201).json({ success: true, vendor });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create vendor',
    });
  }
});

// Get vendor
router.get('/vendors/:id', async (req: Request, res: Response) => {
  try {
    const vendor = await db.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        documents: { include: { extractedData: true } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
        verificationResult: true,
        tasks: { orderBy: { dueDate: 'asc' } },
        mismatches: { where: { status: 'OPEN' } },
      },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    res.json({ success: true, vendor });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch vendor',
    });
  }
});

// Update vendor
router.put('/vendors/:id', async (req: Request, res: Response) => {
  try {
    const validated = vendorFormSchema.parse(req.body);

    const existingVendor = await db.vendor.findUnique({
      where: { id: req.params.id },
    });

    if (!existingVendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    const changes: Array<{ field: string; oldValue: string | null; newValue: string | null }> =
      [];

    const fields = [
      'companyName',
      'contactPerson',
      'email',
      'phone',
      'address',
      'registrationNumber',
      'gstNumber',
      'bankAccountNumber',
      'ifscCode',
    ] as const;

    for (const field of fields) {
      const oldValue = String(existingVendor[field] || '');
      const newValue = String(validated[field] || '');
      if (oldValue !== newValue) {
        changes.push({
          field,
          oldValue: oldValue || null,
          newValue: newValue || null,
        });
      }
    }

    const vendor = await db.vendor.update({
      where: { id: req.params.id },
      data: validated,
    });

    for (const change of changes) {
      await db.vendorAuditLog.create({
        data: {
          vendorId: req.params.id,
          changeType: ChangeType.UPDATE,
          fieldName: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
        },
      });
    }

    res.json({ success: true, vendor });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update vendor',
    });
  }
});

// List vendors
router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;

    const vendors = await db.vendor.findMany({
      where: status && status !== 'all' ? { status: status as VendorStatus } : undefined,
      include: {
        documents: true,
        verificationResult: true,
        tasks: { where: { status: 'PENDING' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, vendors });
  } catch (error) {
    console.error('List vendors error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list vendors',
    });
  }
});

// Update vendor status
router.patch('/vendors/:id/status', async (req: Request, res: Response) => {
  try {
    const validated = vendorStatusUpdateSchema.parse({
      vendorId: req.params.id,
      ...req.body,
    });

    const vendor = await db.vendor.findUnique({
      where: { id: validated.vendorId },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    const updated = await db.vendor.update({
      where: { id: validated.vendorId },
      data: { status: validated.status },
    });

    await db.vendorAuditLog.create({
      data: {
        vendorId: validated.vendorId,
        changeType: ChangeType.UPDATE,
        fieldName: 'status',
        oldValue: vendor.status,
        newValue: validated.status,
      },
    });

    if (validated.status === VendorStatus.APPROVED) {
      await sendEmailNotification({
        vendorName: vendor.companyName,
        recipientEmail: vendor.email,
        emailType: 'APPROVAL_NOTIFICATION',
      });
    }

    res.json({ success: true, vendor: updated });
  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    });
  }
});

// Verify company with GLEIF
router.post('/vendors/:id/verify', async (req: Request, res: Response) => {
  try {
    const vendor = await db.vendor.findUnique({
      where: { id: req.params.id },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    // Use sandbox mode based on environment
    const useSandbox = true; // You can make this configurable via env variable
    const result = await verifyCompanyWithGleif(
      vendor.companyName,
      vendor.registrationNumber || undefined,
      useSandbox
    );

    const verification = await db.verificationResult.upsert({
      where: { vendorId: req.params.id },
      create: {
        vendorId: req.params.id,
        status: result.status as any,
        externalId: result.lei,
        matchedName: result.matchedName,
        matchedRegistration: result.lei,
        rawResponse: result.rawResponse as object,
      },
      update: {
        status: result.status as any,
        externalId: result.lei,
        matchedName: result.matchedName,
        matchedRegistration: result.lei,
        rawResponse: result.rawResponse as object,
      },
    });

    if (result.status === 'MISMATCH') {
      const existingTask = await db.task.findFirst({
        where: {
          vendorId: req.params.id,
          title: { contains: 'Company Verification Mismatch' },
        },
      });

      if (!existingTask) {
        await db.task.create({
          data: {
            vendorId: req.params.id,
            title: 'Company Verification Mismatch',
            description: `GLEIF Verification Mismatch: Expected "${result.matchedName}", got "${vendor.companyName}". LEI: ${result.lei || 'Not found'}`,
            priority: 'HIGH',
            status: 'PENDING',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        });

        await db.vendor.update({
          where: { id: req.params.id },
          data: { status: VendorStatus.ACTION_REQUIRED },
        });
      }
    }

    res.json({ success: true, verification });
  } catch (error) {
    console.error('Verify company error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify company with GLEIF',
    });
  }
});

// Get vendor audit log / version history
router.get('/vendors/:id/history', async (req: Request, res: Response) => {
  try {
    const auditLogs = await db.vendorAuditLog.findMany({
      where: { vendorId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, auditLogs });
  } catch (error) {
    console.error('Get vendor history error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch history',
    });
  }
});

// Restore vendor to a previous version (based on an audit log entry)
router.post('/vendors/:id/restore/:auditLogId', async (req: Request, res: Response) => {
  try {
    const { id: vendorId, auditLogId } = req.params;

    const targetLog = await db.vendorAuditLog.findUnique({ where: { id: auditLogId } });

    if (!targetLog || targetLog.vendorId !== vendorId) {
      return res.status(404).json({ success: false, error: 'Audit log entry not found' });
    }

    const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    // Reconstruct field values as of (and including) the target log entry,
    // by replaying field-level UPDATE/CREATE events in chronological order.
    const historyUpToTarget = await db.vendorAuditLog.findMany({
      where: {
        vendorId,
        createdAt: { lte: targetLog.createdAt },
      },
      orderBy: { createdAt: 'asc' },
    });

    const reconstructed: Record<string, string | null> = {
      companyName: vendor.companyName,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      registrationNumber: vendor.registrationNumber,
      gstNumber: vendor.gstNumber,
      bankAccountNumber: vendor.bankAccountNumber,
      ifscCode: vendor.ifscCode,
    };

    const fieldNames = Object.keys(reconstructed);

    for (const log of historyUpToTarget) {
      if (fieldNames.includes(log.fieldName)) {
        reconstructed[log.fieldName] = log.newValue;
      }
    }

    const updated = await db.vendor.update({
      where: { id: vendorId },
      data: {
        companyName: reconstructed.companyName || vendor.companyName,
        contactPerson: reconstructed.contactPerson || vendor.contactPerson,
        email: reconstructed.email || vendor.email,
        phone: reconstructed.phone || vendor.phone,
        address: reconstructed.address || vendor.address,
        registrationNumber: reconstructed.registrationNumber,
        gstNumber: reconstructed.gstNumber,
        bankAccountNumber: reconstructed.bankAccountNumber,
        ifscCode: reconstructed.ifscCode,
      },
    });

    await db.vendorAuditLog.create({
      data: {
        vendorId,
        changeType: ChangeType.RESTORE,
        fieldName: 'vendor',
        oldValue: vendor.companyName,
        newValue: `Restored to version as of ${targetLog.createdAt.toISOString()}`,
      },
    });

    res.json({ success: true, vendor: updated });
  } catch (error) {
    console.error('Restore vendor version error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore vendor version',
    });
  }
});

export default router;
