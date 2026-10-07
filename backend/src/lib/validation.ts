import { z } from 'zod';
import { DocumentType } from '@prisma/client';

export const vendorFormSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(255),
  contactPerson: z.string().min(2, 'Contact person is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  address: z.string().min(5, 'Address is required').max(500),
  registrationNumber: z.string().max(100).optional().or(z.literal('')),
  gstNumber: z.string().max(15).optional().or(z.literal('')),
  bankAccountNumber: z.string().max(20).optional().or(z.literal('')),
  ifscCode: z.string().max(11).optional().or(z.literal('')),
});

export type VendorFormData = z.infer<typeof vendorFormSchema>;

export const extractedDataSchema = z.object({
  companyName: z.string().optional(),
  registrationNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  confidence: z.record(z.number().min(0).max(1)).optional(),
});

export type ExtractedData = z.infer<typeof extractedDataSchema>;

export const taskCreateSchema = z.object({
  vendorId: z.string().cuid(),
  title: z.string().min(3, 'Task title is required').max(255),
  description: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
});

export type TaskCreateData = z.infer<typeof taskCreateSchema>;

export const vendorStatusUpdateSchema = z.object({
  vendorId: z.string().cuid(),
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'APPROVED', 'REJECTED']),
});

export type VendorStatusUpdateData = z.infer<typeof vendorStatusUpdateSchema>;

export const documentUploadSchema = z.object({
  vendorId: z.string().cuid(),
  documentType: z.nativeEnum(DocumentType),
});

export type DocumentUploadData = z.infer<typeof documentUploadSchema>;
