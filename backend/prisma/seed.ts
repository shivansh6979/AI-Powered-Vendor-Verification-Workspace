import { PrismaClient, VendorStatus, DocumentType, DocumentStatus, Priority, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo data...');

  // Clear existing data
  await prisma.emailLog.deleteMany();
  await prisma.vendorAuditLog.deleteMany();
  await prisma.documentMismatch.deleteMany();
  await prisma.extractedData.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.verificationResult.deleteMany();
  await prisma.vendor.deleteMany();

  console.log('✓ Cleared existing data');

  // Vendor 1: Complete verified vendor
  const vendor1 = await prisma.vendor.create({
    data: {
      companyName: 'TechCorp Solutions Pvt Ltd',
      contactPerson: 'Rajesh Kumar',
      email: 'rajesh@techcorp.com',
      phone: '+919876543210',
      address: '456 Tech Park, Bangalore, Karnataka 560001',
      registrationNumber: 'REG2021001',
      gstNumber: '27AABCT1234A1Z0',
      bankAccountNumber: '1234567890123456',
      ifscCode: 'HDFC0001234',
      status: VendorStatus.APPROVED,
    },
  });

  console.log('✓ Created Vendor 1: TechCorp Solutions (APPROVED)');

  // Add audit log for vendor 1
  await prisma.vendorAuditLog.create({
    data: {
      vendorId: vendor1.id,
      fieldName: 'vendor',
      oldValue: null,
      newValue: vendor1.companyName,
      changeType: 'CREATE',
      changedBy: 'admin@system.com',
    },
  });

  // Add verification result for vendor 1
  await prisma.verificationResult.create({
    data: {
      vendorId: vendor1.id,
      status: 'VERIFIED',
      matchedName: 'TechCorp Solutions Pvt Ltd',
      matchedRegistration: 'REG2021001',
      rawResponse: {
        success: true,
        jurisdiction: 'IN',
        verified: true,
      },
    },
  });

  // Add documents for vendor 1
  const doc1_1 = await prisma.document.create({
    data: {
      vendorId: vendor1.id,
      documentType: DocumentType.REGISTRATION_CERTIFICATE,
      fileName: 'registration_techcorp.pdf',
      fileUrl: '/documents/vendor1/registration.pdf',
      fileSize: 245000,
      status: DocumentStatus.EXTRACTED,
    },
  });

  await prisma.extractedData.create({
    data: {
      documentId: doc1_1.id,
      companyName: 'TechCorp Solutions Pvt Ltd',
      registrationNumber: 'REG2021001',
      address: '456 Tech Park, Bangalore, Karnataka 560001',
      confidence: {
        companyName: 0.99,
        registrationNumber: 0.98,
        address: 0.95,
      },
      rawExtracted: {
        source: 'gemini',
        model: 'gemini-1.5-flash',
        extractedAt: new Date().toISOString(),
      },
    },
  });

  const doc1_2 = await prisma.document.create({
    data: {
      vendorId: vendor1.id,
      documentType: DocumentType.GST_CERTIFICATE,
      fileName: 'gst_techcorp.pdf',
      fileUrl: '/documents/vendor1/gst.pdf',
      fileSize: 198000,
      status: DocumentStatus.EXTRACTED,
    },
  });

  await prisma.extractedData.create({
    data: {
      documentId: doc1_2.id,
      companyName: 'TechCorp Solutions Pvt Ltd',
      gstNumber: '27AABCT1234A1Z0',
      address: '456 Tech Park, Bangalore, Karnataka 560001',
      confidence: {
        companyName: 0.98,
        gstNumber: 0.99,
        address: 0.94,
      },
      rawExtracted: {
        source: 'gemini',
        model: 'gemini-1.5-flash',
      },
    },
  });

  // Vendor 2: Vendor with mismatches
  const vendor2 = await prisma.vendor.create({
    data: {
      companyName: 'Global Enterprises Ltd',
      contactPerson: 'Priya Sharma',
      email: 'priya@globalent.com',
      phone: '+919123456789',
      address: '123 Business Avenue, Mumbai, Maharashtra 400001',
      registrationNumber: 'REG2022002',
      gstNumber: '27AABCE5678B1Z1',
      bankAccountNumber: '9876543210987654',
      ifscCode: 'ICIC0005678',
      status: VendorStatus.ACTION_REQUIRED,
    },
  });

  console.log('✓ Created Vendor 2: Global Enterprises (ACTION_REQUIRED)');

  await prisma.vendorAuditLog.create({
    data: {
      vendorId: vendor2.id,
      fieldName: 'vendor',
      oldValue: null,
      newValue: vendor2.companyName,
      changeType: 'CREATE',
      changedBy: 'admin@system.com',
    },
  });

  // Add mismatched documents for vendor 2
  const doc2_1 = await prisma.document.create({
    data: {
      vendorId: vendor2.id,
      documentType: DocumentType.REGISTRATION_CERTIFICATE,
      fileName: 'registration_global.pdf',
      fileUrl: '/documents/vendor2/registration.pdf',
      fileSize: 267000,
      status: DocumentStatus.EXTRACTED,
    },
  });

  await prisma.extractedData.create({
    data: {
      documentId: doc2_1.id,
      companyName: 'Global Enterprises Limited',
      registrationNumber: 'REG2022002',
      address: '123 Business Avenue, Mumbai, Maharashtra 400001',
      confidence: {
        companyName: 0.92,
        registrationNumber: 0.97,
        address: 0.96,
      },
      rawExtracted: {
        source: 'gemini',
        model: 'gemini-1.5-flash',
      },
    },
  });

  const doc2_2 = await prisma.document.create({
    data: {
      vendorId: vendor2.id,
      documentType: DocumentType.GST_CERTIFICATE,
      fileName: 'gst_global.pdf',
      fileUrl: '/documents/vendor2/gst.pdf',
      fileSize: 219000,
      status: DocumentStatus.EXTRACTED,
    },
  });

  await prisma.extractedData.create({
    data: {
      documentId: doc2_2.id,
      companyName: 'Global Enterprises Ltd',
      gstNumber: '27AABCE5678B1Z1',
      address: '123 Business Avenue, Mumbai, Maharashtra 400001',
      confidence: {
        companyName: 0.88,
        gstNumber: 0.99,
        address: 0.95,
      },
      rawExtracted: {
        source: 'gemini',
        model: 'gemini-1.5-flash',
      },
    },
  });

  // Add mismatch record
  await prisma.documentMismatch.create({
    data: {
      vendorId: vendor2.id,
      fieldName: 'companyName',
      value1: 'Global Enterprises Limited',
      value2: 'Global Enterprises Ltd',
      source1: 'REGISTRATION_CERTIFICATE',
      source2: 'GST_CERTIFICATE',
      severity: 'WARNING',
      status: 'OPEN',
    },
  });

  // Add task for vendor 2
  await prisma.task.create({
    data: {
      vendorId: vendor2.id,
      title: 'Review Company Name Mismatch',
      description:
        'Company name differs between registration certificate and GST certificate. Verify which is the correct legal name.',
      priority: Priority.HIGH,
      status: TaskStatus.PENDING,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Vendor 3: Draft vendor - missing documents
  const vendor3 = await prisma.vendor.create({
    data: {
      companyName: 'Innovation Labs India',
      contactPerson: 'Amit Patel',
      email: 'amit@innovlabs.com',
      phone: '+919988776655',
      address: '789 Innovation Drive, Pune, Maharashtra 411001',
      registrationNumber: 'REG2023003',
      gstNumber: null,
      bankAccountNumber: null,
      ifscCode: null,
      status: VendorStatus.DRAFT,
    },
  });

  console.log('✓ Created Vendor 3: Innovation Labs (DRAFT - missing documents)');

  await prisma.vendorAuditLog.create({
    data: {
      vendorId: vendor3.id,
      fieldName: 'vendor',
      oldValue: null,
      newValue: vendor3.companyName,
      changeType: 'CREATE',
      changedBy: 'sales@system.com',
    },
  });

  // Add only registration document
  const doc3_1 = await prisma.document.create({
    data: {
      vendorId: vendor3.id,
      documentType: DocumentType.REGISTRATION_CERTIFICATE,
      fileName: 'registration_innovation.pdf',
      fileUrl: '/documents/vendor3/registration.pdf',
      fileSize: 156000,
      status: DocumentStatus.EXTRACTED,
    },
  });

  await prisma.extractedData.create({
    data: {
      documentId: doc3_1.id,
      companyName: 'Innovation Labs India',
      registrationNumber: 'REG2023003',
      address: '789 Innovation Drive, Pune, Maharashtra 411001',
      confidence: {
        companyName: 0.96,
        registrationNumber: 0.99,
        address: 0.93,
      },
      rawExtracted: {
        source: 'gemini',
        model: 'gemini-1.5-flash',
      },
    },
  });

  // Add task for missing documents
  await prisma.task.create({
    data: {
      vendorId: vendor3.id,
      title: 'Upload Missing Documents',
      description: 'GST Certificate and Bank Document are required to proceed with verification.',
      priority: Priority.HIGH,
      status: TaskStatus.PENDING,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Vendor 4: Under review
  const vendor4 = await prisma.vendor.create({
    data: {
      companyName: 'DataStream Analytics Pvt Ltd',
      contactPerson: 'Neha Singh',
      email: 'neha@datastream.com',
      phone: '+919765432100',
      address: '321 Analytics Plaza, Hyderabad, Telangana 500001',
      registrationNumber: 'REG2024004',
      gstNumber: '36AABDU7890C1Z2',
      bankAccountNumber: '5555666677778888',
      ifscCode: 'AXAB0001234',
      status: VendorStatus.UNDER_REVIEW,
    },
  });

  console.log('✓ Created Vendor 4: DataStream Analytics (UNDER_REVIEW)');

  await prisma.vendorAuditLog.create({
    data: {
      vendorId: vendor4.id,
      fieldName: 'vendor',
      oldValue: null,
      newValue: vendor4.companyName,
      changeType: 'CREATE',
      changedBy: 'admin@system.com',
    },
  });

  // Add all documents for vendor 4
  const doc4_1 = await prisma.document.create({
    data: {
      vendorId: vendor4.id,
      documentType: DocumentType.REGISTRATION_CERTIFICATE,
      fileName: 'registration_datastream.pdf',
      fileUrl: '/documents/vendor4/registration.pdf',
      fileSize: 234000,
      status: DocumentStatus.EXTRACTED,
    },
  });

  await prisma.extractedData.create({
    data: {
      documentId: doc4_1.id,
      companyName: 'DataStream Analytics Pvt Ltd',
      registrationNumber: 'REG2024004',
      address: '321 Analytics Plaza, Hyderabad, Telangana 500001',
      confidence: {
        companyName: 0.97,
        registrationNumber: 0.99,
        address: 0.96,
      },
      rawExtracted: {
        source: 'gemini',
        model: 'gemini-1.5-flash',
      },
    },
  });

  const doc4_2 = await prisma.document.create({
    data: {
      vendorId: vendor4.id,
      documentType: DocumentType.GST_CERTIFICATE,
      fileName: 'gst_datastream.pdf',
      fileUrl: '/documents/vendor4/gst.pdf',
      fileSize: 187000,
      status: DocumentStatus.EXTRACTED,
    },
  });

  await prisma.extractedData.create({
    data: {
      documentId: doc4_2.id,
      companyName: 'DataStream Analytics Pvt Ltd',
      gstNumber: '36AABDU7890C1Z2',
      address: '321 Analytics Plaza, Hyderabad, Telangana 500001',
      confidence: {
        companyName: 0.97,
        gstNumber: 0.99,
        address: 0.97,
      },
      rawExtracted: {
        source: 'gemini',
        model: 'gemini-1.5-flash',
      },
    },
  });

  const doc4_3 = await prisma.document.create({
    data: {
      vendorId: vendor4.id,
      documentType: DocumentType.BANK_DOCUMENT,
      fileName: 'bank_statement_datastream.pdf',
      fileUrl: '/documents/vendor4/bank.pdf',
      fileSize: 312000,
      status: DocumentStatus.EXTRACTED,
    },
  });

  await prisma.extractedData.create({
    data: {
      documentId: doc4_3.id,
      companyName: 'DataStream Analytics Pvt Ltd',
      bankAccountNumber: '5555666677778888',
      ifscCode: 'AXAB0001234',
      confidence: {
        companyName: 0.95,
        bankAccountNumber: 0.99,
        ifscCode: 0.98,
      },
      rawExtracted: {
        source: 'gemini',
        model: 'gemini-1.5-flash',
      },
    },
  });

  // Add verification for vendor 4
  await prisma.verificationResult.create({
    data: {
      vendorId: vendor4.id,
      status: 'PENDING',
      rawResponse: {
        pending: true,
        lastChecked: new Date().toISOString(),
      },
    },
  });

  // Vendor 5: Rejected vendor
  const vendor5 = await prisma.vendor.create({
    data: {
      companyName: 'Shadow Corp',
      contactPerson: 'Unknown Person',
      email: 'contact@shadowcorp.com',
      phone: '+919111222333',
      address: '999 Unknown Street, City, State 000000',
      registrationNumber: null,
      gstNumber: null,
      bankAccountNumber: null,
      ifscCode: null,
      status: VendorStatus.REJECTED,
    },
  });

  console.log('✓ Created Vendor 5: Shadow Corp (REJECTED)');

  await prisma.vendorAuditLog.create({
    data: {
      vendorId: vendor5.id,
      fieldName: 'vendor',
      oldValue: null,
      newValue: vendor5.companyName,
      changeType: 'CREATE',
      changedBy: 'compliance@system.com',
    },
  });

  await prisma.vendorAuditLog.create({
    data: {
      vendorId: vendor5.id,
      fieldName: 'status',
      oldValue: 'DRAFT',
      newValue: 'REJECTED',
      changeType: 'UPDATE',
      changedBy: 'compliance@system.com',
    },
  });

  console.log('\n✅ Demo data seeded successfully!\n');
  console.log('📊 Summary:');
  console.log('   - Vendor 1: TechCorp Solutions (APPROVED) ✓');
  console.log('   - Vendor 2: Global Enterprises (ACTION_REQUIRED) ⚠️');
  console.log('   - Vendor 3: Innovation Labs (DRAFT - Missing docs) 📄');
  console.log('   - Vendor 4: DataStream Analytics (UNDER_REVIEW) 👀');
  console.log('   - Vendor 5: Shadow Corp (REJECTED) ❌');
  console.log('\n💡 Test the application with this demo data!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
