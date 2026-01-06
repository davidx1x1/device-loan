import { Resend } from 'resend';
import { createContextLogger } from '../logging/logger';
import { DeviceModel, User } from '../types/database';

// Resend client configuration
const resend = new Resend(process.env.RESEND_API_KEY);

const fromAddress = process.env.SMTP_FROM || 'Device Loans <noreply@deviceloans.edu>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface ReservationConfirmationData {
  user: User;
  deviceModel: DeviceModel;
  serialNumber: string;
  reservedAt: string;
  dueDate: string;
  loanId: string;
}

export interface CollectionConfirmationData {
  user: User;
  deviceModel: DeviceModel;
  serialNumber: string;
  collectedAt: string;
  dueDate: string;
  loanId: string;
}

export interface ReturnConfirmationData {
  user: User;
  deviceModel: DeviceModel;
  serialNumber: string;
  returnedAt: string;
  loanId: string;
}

export interface DeviceAvailableNotificationData {
  user: User;
  deviceModel: DeviceModel;
}

/**
 * Send reservation confirmation email
 */
export async function sendReservationConfirmation(
  data: ReservationConfirmationData,
  correlationId: string
): Promise<void> {
  const logger = createContextLogger({ correlation_id: correlationId });

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Device Reservation Confirmed</h1>
    </div>
    <div class="content">
      <p>Hi ${data.user.name},</p>
      <p>Your device reservation has been confirmed!</p>

      <div class="details">
        <h3>Reservation Details</h3>
        <p><strong>Device:</strong> ${data.deviceModel.brand} ${data.deviceModel.model}</p>
        <p><strong>Serial Number:</strong> ${data.serialNumber}</p>
        <p><strong>Reserved:</strong> ${new Date(data.reservedAt).toLocaleString()}</p>
        <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleString()}</p>
        <p><strong>Loan ID:</strong> ${data.loanId}</p>
      </div>

      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Visit the Campus IT office to collect your device</li>
        <li>Bring your student ID for verification</li>
        <li>Remember to return the device by ${new Date(data.dueDate).toLocaleDateString()}</li>
      </ol>

      <center>
        <a href="${appUrl}/reservations" class="button">View My Reservations</a>
      </center>
    </div>
    <div class="footer">
      <p>This is an automated message from Campus IT Device Loan System</p>
      <p>Correlation ID: ${correlationId}</p>
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: fromAddress,
      to: data.user.email,
      subject: `Device Reservation Confirmed - ${data.deviceModel.brand} ${data.deviceModel.model}`,
      html,
    });

    logger.info({ user_id: data.user.id, loan_id: data.loanId }, 'Reservation confirmation email sent');
  } catch (error) {
    logger.error({ error, user_id: data.user.id, loan_id: data.loanId }, 'Failed to send reservation confirmation email');
    // Don't throw - email failures shouldn't break the main flow
  }
}

/**
 * Send collection confirmation email
 */
export async function sendCollectionConfirmation(
  data: CollectionConfirmationData,
  correlationId: string
): Promise<void> {
  const logger = createContextLogger({ correlation_id: correlationId });

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .warning { background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Device Collected</h1>
    </div>
    <div class="content">
      <p>Hi ${data.user.name},</p>
      <p>You have successfully collected your device.</p>

      <div class="details">
        <h3>Loan Details</h3>
        <p><strong>Device:</strong> ${data.deviceModel.brand} ${data.deviceModel.model}</p>
        <p><strong>Serial Number:</strong> ${data.serialNumber}</p>
        <p><strong>Collected:</strong> ${new Date(data.collectedAt).toLocaleString()}</p>
        <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleString()}</p>
      </div>

      <div class="warning">
        <strong>⚠️ Important Reminder:</strong>
        <p>Please return this device by <strong>${new Date(data.dueDate).toLocaleString()}</strong> to avoid late fees.</p>
      </div>

      <p><strong>Care Instructions:</strong></p>
      <ul>
        <li>Handle the device with care</li>
        <li>Report any damage immediately</li>
        <li>Return the device in the same condition</li>
        <li>Do not share or lend the device to others</li>
      </ul>
    </div>
    <div class="footer">
      <p>This is an automated message from Campus IT Device Loan System</p>
      <p>Correlation ID: ${correlationId}</p>
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: fromAddress,
      to: data.user.email,
      subject: `Device Collected - Return by ${new Date(data.dueDate).toLocaleDateString()}`,
      html,
    });

    logger.info({ user_id: data.user.id, loan_id: data.loanId }, 'Collection confirmation email sent');
  } catch (error) {
    logger.error({ error, user_id: data.user.id, loan_id: data.loanId }, 'Failed to send collection confirmation email');
  }
}

/**
 * Send return confirmation email
 */
export async function sendReturnConfirmation(
  data: ReturnConfirmationData,
  correlationId: string
): Promise<void> {
  const logger = createContextLogger({ correlation_id: correlationId });

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Device Returned</h1>
    </div>
    <div class="content">
      <p>Hi ${data.user.name},</p>
      <p>Thank you for returning your device!</p>

      <div class="details">
        <h3>Return Details</h3>
        <p><strong>Device:</strong> ${data.deviceModel.brand} ${data.deviceModel.model}</p>
        <p><strong>Serial Number:</strong> ${data.serialNumber}</p>
        <p><strong>Returned:</strong> ${new Date(data.returnedAt).toLocaleString()}</p>
      </div>

      <p>Your loan has been successfully closed. You can now reserve other devices if needed.</p>

      <p>Thank you for using the Campus IT Device Loan System!</p>
    </div>
    <div class="footer">
      <p>This is an automated message from Campus IT Device Loan System</p>
      <p>Correlation ID: ${correlationId}</p>
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: fromAddress,
      to: data.user.email,
      subject: `Device Return Confirmed - ${data.deviceModel.brand} ${data.deviceModel.model}`,
      html,
    });

    logger.info({ user_id: data.user.id, loan_id: data.loanId }, 'Return confirmation email sent');
  } catch (error) {
    logger.error({ error, user_id: data.user.id, loan_id: data.loanId }, 'Failed to send return confirmation email');
  }
}

/**
 * Send device available notification to waitlist
 */
export async function sendDeviceAvailableNotification(
  data: DeviceAvailableNotificationData,
  correlationId: string
): Promise<void> {
  const logger = createContextLogger({ correlation_id: correlationId });

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Device Now Available!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.user.name},</p>
      <p>Great news! The device you've been waiting for is now available.</p>

      <div class="details">
        <h3>Available Device</h3>
        <p><strong>Device:</strong> ${data.deviceModel.brand} ${data.deviceModel.model}</p>
        <p><strong>Category:</strong> ${data.deviceModel.category}</p>
        ${data.deviceModel.description ? `<p>${data.deviceModel.description}</p>` : ''}
      </div>

      <p>Reserve it now before it's gone!</p>

      <center>
        <a href="${appUrl}/devices" class="button">Reserve Now</a>
      </center>

      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        <em>Note: This notification was sent because you subscribed to the waitlist for this device model.</em>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message from Campus IT Device Loan System</p>
      <p>Correlation ID: ${correlationId}</p>
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: fromAddress,
      to: data.user.email,
      subject: `Device Available: ${data.deviceModel.brand} ${data.deviceModel.model}`,
      html,
    });

    logger.info(
      { user_id: data.user.id, device_model_id: data.deviceModel.id },
      'Device available notification sent'
    );
  } catch (error) {
    logger.error(
      { error, user_id: data.user.id, device_model_id: data.deviceModel.id },
      'Failed to send device available notification'
    );
  }
}

// Verify email configuration on startup
export async function verifyEmailConfig(): Promise<boolean> {
  const logger = createContextLogger({});

  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not configured');
      return false;
    }

    logger.info('Email service configured with Resend');
    return true;
  } catch (error) {
    logger.error({ error }, 'Email service configuration failed');
    return false;
  }
}
