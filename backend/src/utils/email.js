import nodemailer from 'nodemailer';

// Create Transporter
const createTransporter = () => {
  // If SMTP details are not configured, use a mock transporter that logs to console
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'placeholder') {
    console.log('EMAIL SYSTEM: No SMTP credentials configured. Defaulting to console logging transporter.');
    return {
      sendMail: async (mailOptions) => {
        console.log('--- MOCK EMAIL OUTBOX ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body:\n${mailOptions.text || mailOptions.html}`);
        console.log('-------------------------');
        return { messageId: `mock_${Date.now()}` };
      }
    };
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const transporter = createTransporter();
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@shopez.com';

/**
 * Send welcome email to newly registered users
 */
export const sendWelcomeEmail = async (to, name) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Welcome to ShopEZ!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #8a2be2;">Welcome to ShopEZ, ${name}!</h2>
        <p>Thank you for creating an account with us. ShopEZ is a modern e-commerce marketplace built for swift transactions, secure payments, and premium UI designs.</p>
        <p>Get started by browsing products, adding items to your cart, and checking out with ease.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="display: inline-block; background-color: #8a2be2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 16px;">Browse Marketplace</a>
        <p style="margin-top: 24px; color: #718096; fontSize: 12px;">If you did not sign up for this account, you can safely ignore this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    console.error('Email send failed (Welcome):', err.message);
  }
};

/**
 * Send order confirmation to buyer
 */
export const sendOrderConfirmationEmail = async (to, name, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #edf2f7; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #edf2f7; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: `Order Confirmation #${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #10b981;">Order Confirmed!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for your purchase! We've received your order and are processing it. Below are your details:</p>
        
        <h4 style="margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Order Summary (ID: #${order._id})</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="background-color: #f7fafc;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: right; font-weight: bold; font-size: 16px; margin-bottom: 24px;">
          Total Paid: <span style="color: #ff007f;">$${order.totalAmount.toFixed(2)}</span>
        </div>

        <p><strong>Shipping Address:</strong><br/>
        ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}</p>
        
        <p style="margin-top: 24px;">You can track your order status by visiting the dashboard.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" style="display: inline-block; background-color: #8a2be2; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order Status</a>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    console.error('Email send failed (Order Conf):', err.message);
  }
};

/**
 * Send order status update to buyer
 */
export const sendOrderStatusUpdateEmail = async (to, name, orderId, status) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: `Order #${orderId} Update`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #8a2be2;">Order Status Updated</h2>
        <p>Hi ${name},</p>
        <p>Your order <strong>#${orderId}</strong> status has been updated by the seller to:</p>
        <div style="display: inline-block; background-color: #edf2f7; border: 1px solid #cbd5e0; border-radius: 4px; padding: 12px 24px; font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 16px 0; color: #2d3748;">
          ${status}
        </div>
        <p>You can view your order tracking progress anytime in your buyer dashboard.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" style="display: inline-block; background-color: #8a2be2; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Track My Order</a>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    console.error('Email send failed (Status Update):', err.message);
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (to, name, resetUrl) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'ShopEZ Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested a password reset for your ShopEZ account. Please click the button below to set a new password. This link is only active for 10 minutes.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #e53e3e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 16px 0;">Reset Password</a>
        <p>If you did not request a password reset, you can safely ignore this email; your password will remain unchanged.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    console.error('Email send failed (Password Reset):', err.message);
  }
};
