import { Resend } from 'resend';
import { env } from '@/config/env';
import { EmailType } from '@prisma/client';

const resend = new Resend(env.RESEND_API_KEY);

export interface EmailNotificationPayload {
  vendorName: string;
  recipientEmail: string;
  emailType: EmailType;
  metadata?: Record<string, unknown>;
}

function generateMissingDocumentEmail(payload: {
  vendorName: string;
  missingDocuments: string[];
}): { subject: string; html: string } {
  return {
    subject: `Action Required: Missing Documents for ${payload.vendorName}`,
    html: `
      <h2>Missing Documents</h2>
      <p>Dear ${payload.vendorName},</p>
      <p>We are processing your vendor onboarding request. However, we need the following documents to proceed:</p>
      <ul>
        ${payload.missingDocuments.map((doc) => `<li>${doc}</li>`).join('')}
      </ul>
      <p>Please upload these documents at your earliest convenience to avoid delays in your approval.</p>
      <p>Thank you,<br/>Vendor Verification Team</p>
    `,
  };
}

function generateMismatchAlertEmail(payload: {
  vendorName: string;
  mismatches: string[];
}): { subject: string; html: string } {
  return {
    subject: `Information Mismatch Detected: ${payload.vendorName}`,
    html: `
      <h2>Information Mismatch Detected</h2>
      <p>Dear ${payload.vendorName},</p>
      <p>During our verification process, we detected mismatches in the following information:</p>
      <ul>
        ${payload.mismatches.map((mismatch) => `<li>${mismatch}</li>`).join('')}
      </ul>
      <p>Please review and correct this information as soon as possible.</p>
      <p>Thank you,<br/>Vendor Verification Team</p>
    `,
  };
}

function generateApprovalEmail(payload: {
  vendorName: string;
}): { subject: string; html: string } {
  return {
    subject: `Vendor Approval Confirmed: ${payload.vendorName}`,
    html: `
      <h2>Vendor Approval Confirmed</h2>
      <p>Dear ${payload.vendorName},</p>
      <p>Congratulations! Your vendor profile has been approved and verified.</p>
      <p>You can now proceed with business operations. If you have any questions, please contact our support team.</p>
      <p>Thank you,<br/>Vendor Verification Team</p>
    `,
  };
}

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    let emailContent: { subject: string; html: string };

    switch (payload.emailType) {
      case 'MISSING_DOCUMENT':
        emailContent = generateMissingDocumentEmail({
          vendorName: payload.vendorName,
          missingDocuments: (payload.metadata?.missingDocuments as string[]) || [],
        });
        break;

      case 'MISMATCH_ALERT':
        emailContent = generateMismatchAlertEmail({
          vendorName: payload.vendorName,
          mismatches: (payload.metadata?.mismatches as string[]) || [],
        });
        break;

      case 'APPROVAL_NOTIFICATION':
        emailContent = generateApprovalEmail({
          vendorName: payload.vendorName,
        });
        break;

      case 'ACTION_REQUIRED':
        emailContent = generateMissingDocumentEmail({
          vendorName: payload.vendorName,
          missingDocuments: ['Additional verification required'],
        });
        break;

      default:
        throw new Error(`Unknown email type: ${payload.emailType}`);
    }

    const response = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: payload.recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (response.error) {
      return {
        success: false,
        error: response.error.message,
      };
    }

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
