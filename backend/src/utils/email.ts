import nodemailer from 'nodemailer';
import logger from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Marketplace'}" <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

// ─── Email Templates ──────────────────────────────────────────────────────────

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
    .header span { color: #f59e0b; }
    .body { padding: 40px; color: #333; line-height: 1.6; }
    .btn { display: inline-block; background: #f59e0b; color: #1a1a2e; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 24px; text-align: center; color: #888; font-size: 14px; }
    .divider { height: 1px; background: #eee; margin: 24px 0; }
    .highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MARKET<span>PLACE</span></h1>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
      <p>You received this email because you have an account with us.</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  welcomeEmail: (name: string, verificationLink: string) => ({
    subject: 'Welcome to Marketplace! Verify Your Email',
    html: baseTemplate(`
      <h2>Welcome, ${name}! 🎉</h2>
      <p>Thank you for joining Marketplace. We're excited to have you on board!</p>
      <p>Please verify your email address to get started:</p>
      <a href="${verificationLink}" class="btn">Verify Email Address</a>
      <div class="divider"></div>
      <p style="color:#888; font-size:13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    `),
  }),

  passwordReset: (name: string, resetLink: string) => ({
    subject: 'Reset Your Password',
    html: baseTemplate(`
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <a href="${resetLink}" class="btn">Reset Password</a>
      <div class="divider"></div>
      <div class="highlight">
        <strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request a password reset, please contact support immediately.
      </div>
    `),
  }),

  orderConfirmation: (name: string, orderNumber: string, orderDetails: string, total: number) => ({
    subject: `Order Confirmed - #${orderNumber}`,
    html: baseTemplate(`
      <h2>Order Confirmed! ✅</h2>
      <p>Hi ${name},</p>
      <p>Your order has been confirmed and is being processed.</p>
      <div class="highlight">
        <strong>Order Number:</strong> #${orderNumber}<br>
        <strong>Total:</strong> $${total.toFixed(2)}
      </div>
      ${orderDetails}
      <p>You'll receive another email when your order ships.</p>
      <a href="${process.env.FRONTEND_URL}/orders/${orderNumber}" class="btn">Track Your Order</a>
    `),
  }),

  orderShipped: (name: string, orderNumber: string, trackingNumber: string) => ({
    subject: `Your Order #${orderNumber} Has Shipped!`,
    html: baseTemplate(`
      <h2>Your Order is On The Way! 🚚</h2>
      <p>Hi ${name},</p>
      <p>Great news! Your order <strong>#${orderNumber}</strong> has been shipped.</p>
      <div class="highlight">
        <strong>Tracking Number:</strong> ${trackingNumber}
      </div>
      <a href="${process.env.FRONTEND_URL}/orders/${orderNumber}" class="btn">Track Shipment</a>
    `),
  }),

  vendorApproved: (storeName: string, email: string) => ({
    subject: 'Your Vendor Account Has Been Approved!',
    html: baseTemplate(`
      <h2>Congratulations! Your Store is Live 🏪</h2>
      <p>Your vendor application for <strong>${storeName}</strong> has been approved!</p>
      <p>You can now start adding products and selling on Marketplace.</p>
      <a href="${process.env.FRONTEND_URL}/vendor/dashboard" class="btn">Go to Vendor Dashboard</a>
    `),
  }),

  vendorRejected: (storeName: string, reason: string) => ({
    subject: 'Vendor Application Update',
    html: baseTemplate(`
      <h2>Application Status Update</h2>
      <p>We've reviewed your vendor application for <strong>${storeName}</strong>.</p>
      <p>Unfortunately, we're unable to approve your application at this time.</p>
      <div class="highlight">
        <strong>Reason:</strong> ${reason}
      </div>
      <p>You're welcome to reapply after addressing the above concerns.</p>
    `),
  }),

  lowStockAlert: (vendorName: string, products: { name: string; stock: number }[]) => ({
    subject: '⚠️ Low Stock Alert',
    html: baseTemplate(`
      <h2>Low Stock Alert ⚠️</h2>
      <p>Hi ${vendorName},</p>
      <p>The following products are running low on stock:</p>
      ${products.map(p => `
        <div class="highlight">
          <strong>${p.name}</strong> — Only ${p.stock} units remaining
        </div>
      `).join('')}
      <a href="${process.env.FRONTEND_URL}/vendor/products" class="btn">Manage Inventory</a>
    `),
  }),
};
