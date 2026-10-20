/**
 * NexaSocial Email Template Builder
 * Generates beautiful, responsive, brand-aligned HTML and plain-text emails.
 */

export interface EmailRenderOutput {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplateBuilder {
  private static escapeHtml(str: string | undefined | null): string {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Reusable Modern Dark SaaS Layout
   */
  private static wrapLayout(params: {
    title: string;
    previewText: string;
    contentHtml: string;
    ctaText?: string;
    ctaUrl?: string;
    userEmail?: string;
    unsubscribeCategory?: string;
    appUrl?: string;
  }): string {
    const {
      title,
      previewText,
      contentHtml,
      ctaText,
      ctaUrl,
      userEmail,
      unsubscribeCategory,
      appUrl = process.env.FRONTEND_URL || 'http://localhost:3000',
    } = params;

    const currentYear = new Date().getFullYear();
    const unsubLink = unsubscribeCategory
      ? `${appUrl}/settings?tab=notifications&unsub=${encodeURIComponent(unsubscribeCategory)}`
      : `${appUrl}/settings?tab=notifications`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0b0f19;
      padding: 40px 15px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #131b2e;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px;
      text-align: center;
      border-bottom: 1px solid #1e293b;
      background: linear-gradient(180deg, #182238 0%, #131b2e 100%);
    }
    .logo-badge {
      display: inline-block;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
    }
    .content {
      padding: 32px;
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .h1 {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .card-box {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .data-table td {
      padding: 8px 0;
      border-bottom: 1px solid #334155;
    }
    .data-table tr:last-child td {
      border-bottom: none;
    }
    .data-label {
      color: #94a3b8;
      font-weight: 500;
    }
    .data-value {
      text-align: right;
      color: #f1f5f9;
      font-weight: 600;
      font-family: monospace;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0 10px;
    }
    .btn {
      display: inline-block;
      padding: 13px 28px;
      background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
    }
    .security-note {
      background-color: rgba(245, 158, 11, 0.1);
      border-left: 3px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 12px;
      color: #fbbf24;
      margin-top: 24px;
    }
    .footer {
      padding: 24px 32px;
      background-color: #0d121f;
      border-top: 1px solid #1e293b;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#0b0f19;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${this.escapeHtml(previewText)}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-badge">NexaSocial</div>
        <div class="subtitle">AI-Powered Social & Live Streaming</div>
      </div>
      <div class="content">
        ${contentHtml}
        ${ctaText && ctaUrl
        ? `<div class="btn-container">
                 <a href="${this.escapeHtml(ctaUrl)}" class="btn">${this.escapeHtml(ctaText)}</a>
               </div>`
        : ''
      }
      </div>
      <div class="footer">
        <p>© ${currentYear} NexaSocial Platform. All rights reserved.</p>
        <p>This message was sent to ${this.escapeHtml(userEmail || 'you')} regarding your NexaSocial account.</p>
        <p>
          <a href="${this.escapeHtml(appUrl)}">Platform Dashboard</a> · 
          <a href="${this.escapeHtml(unsubLink)}">Notification Preferences</a> · 
          <a href="${this.escapeHtml(appUrl)}/support">Contact Support</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // ──────────────────────────────────────────
  // 1. AUTH & REGISTRATION
  // ──────────────────────────────────────────

  static welcomeUser(data: {
    name: string;
    email: string;
    dashboardUrl?: string;
  }): EmailRenderOutput {
    const dashboardUrl =
      data.dashboardUrl ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    const subject = `Welcome to NexaSocial, ${data.name}!`;
    const preview =
      'Your unified social media & live streaming journey begins here.';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Open Your Dashboard',
      ctaUrl: dashboardUrl,
      contentHtml: `
        <h1 class="h1">Welcome aboard, ${this.escapeHtml(data.name)}! 🎉</h1>
        <p>Thank you for joining <strong>NexaSocial</strong> — the unified platform that lets you manage social media accounts, broadcast multi-platform live streams, and leverage AI content generation from a single dashboard.</p>
        <div class="card-box">
          <p style="margin:0 0 10px; font-weight:600; color:#f1f5f9;">Getting Started:</p>
          <ul style="margin:0; padding-left:20px; color:#94a3b8; font-size:13px; line-height:1.8;">
            <li>Connect your YouTube, Facebook, Twitch, and other social channels.</li>
            <li>Launch or schedule ultra-low latency live streams.</li>
            <li>Explore our AI caption and content generation tools.</li>
          </ul>
        </div>
        <p style="font-size:12px; color:#94a3b8;"><em>Note: NexaSocial offers flexible subscription plans to match your broadcasting and workspace capacity. You can browse and activate plans directly from your dashboard.</em></p>
      `,
    });

    const text = `Welcome to NexaSocial, ${data.name}!\n\nThank you for joining NexaSocial — your unified social media & live streaming platform.\n\nOpen your dashboard to get started:\n${dashboardUrl}\n\n© NexaSocial`;

    return { subject, html, text };
  }

  static verifyEmail(data: {
    name: string;
    email: string;
    verificationLink: string;
    tokenExpiryHours?: number;
  }): EmailRenderOutput {
    const hours = data.tokenExpiryHours || 24;
    const subject = 'Verify your NexaSocial email address';
    const preview = 'Confirm your email address to secure your account.';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Verify Email Address',
      ctaUrl: data.verificationLink,
      contentHtml: `
        <h1 class="h1">Confirm your email address</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Please click the button below to verify that this is your email address and unlock all platform features.</p>
        <div class="card-box" style="text-align:center;">
          <p style="margin:0; font-size:12px; color:#94a3b8;">This verification link is valid for <strong>${hours} hours</strong> and can only be used once.</p>
        </div>
        <p style="font-size:12px; color:#64748b;">If the button does not work, copy and paste this link into your browser:<br/><a href="${this.escapeHtml(data.verificationLink)}" style="color:#818cf8; word-break:break-all;">${this.escapeHtml(data.verificationLink)}</a></p>
      `,
    });

    const text = `Hi ${data.name},\n\nPlease verify your NexaSocial email address by visiting:\n${data.verificationLink}\n\nThis link will expire in ${hours} hours.\n\nIf you did not register for NexaSocial, please ignore this email.`;

    return { subject, html, text };
  }

  static passwordReset(data: {
    name: string;
    email: string;
    resetLink: string;
    tokenExpiryHours?: number;
  }): EmailRenderOutput {
    const hours = data.tokenExpiryHours || 1;
    const subject = 'Reset your NexaSocial password';
    const preview = 'Instructions to reset your NexaSocial account password.';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Reset Password',
      ctaUrl: data.resetLink,
      contentHtml: `
        <h1 class="h1">Password Reset Request</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>We received a request to reset the password for your NexaSocial account. Click the button below to choose a new password:</p>
        <div class="security-note">
          <strong>Security Notice:</strong> This single-use link expires in <strong>${hours} hour(s)</strong>. If you did not request a password reset, please ignore this email — your account remains completely secure.
        </div>
        <p style="font-size:12px; color:#64748b; margin-top:20px;">Direct link:<br/><a href="${this.escapeHtml(data.resetLink)}" style="color:#818cf8; word-break:break-all;">${this.escapeHtml(data.resetLink)}</a></p>
      `,
    });

    const text = `Hi ${data.name},\n\nA password reset was requested for your NexaSocial account. Use this link to reset it:\n${data.resetLink}\n\nThis link expires in ${hours} hour(s). If you did not request this, you can safely ignore this email.`;

    return { subject, html, text };
  }

  static passwordChanged(data: {
    name: string;
    email: string;
    timestamp?: Date;
    ipAddress?: string;
  }): EmailRenderOutput {
    const timeStr = (data.timestamp || new Date()).toUTCString();
    const subject = 'Security Alert: Your NexaSocial password was changed';
    const preview = 'Your password was recently modified.';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Review Account Security',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings`,
      contentHtml: `
        <h1 class="h1">Your password was successfully updated</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>This is a confirmation that the password for your NexaSocial account was recently changed.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Date & Time</td>
              <td class="data-value">${this.escapeHtml(timeStr)}</td>
            </tr>
            ${data.ipAddress
          ? `<tr>
                    <td class="data-label">IP Address</td>
                    <td class="data-value">${this.escapeHtml(data.ipAddress)}</td>
                  </tr>`
          : ''
        }
          </table>
        </div>
        <div class="security-note">
          <strong>Didn't make this change?</strong> If you did not update your password, your account may be compromised. Please reset your password and contact our support team immediately.
        </div>
      `,
    });

    const text = `Hi ${data.name},\n\nYour NexaSocial account password was successfully changed on ${timeStr}.\n\nIf you did not make this change, please reset your password immediately at ${process.env.FRONTEND_URL || 'http://localhost:3000'}/forgot-password`;

    return { subject, html, text };
  }

  // ──────────────────────────────────────────
  // 2. SUBSCRIPTION & BILLING
  // ──────────────────────────────────────────

  static subscriptionActivated(data: {
    name: string;
    email: string;
    planName: string;
    price: number;
    currency?: string;
    endDate?: Date | string | null;
    billingCycle?: string;
  }): EmailRenderOutput {
    const currency = data.currency === 'USD' ? '$' : '₹';
    const endDateStr = data.endDate
      ? new Date(data.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      : 'Unlimited / Lifetime';

    const subject = `Subscription Activated: Welcome to ${data.planName}!`;
    const preview = `Your ${data.planName} plan is now active. All features unlocked!`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Access Your Unlocked Features',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      contentHtml: `
        <h1 class="h1">Subscription Activated! 🚀</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your subscription to the <strong>${this.escapeHtml(data.planName)}</strong> plan has been activated. All corresponding limits and features have been applied to your account.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Selected Tier</td>
              <td class="data-value" style="color:#c084fc;">${this.escapeHtml(data.planName)}</td>
            </tr>
            <tr>
              <td class="data-label">Amount Paid</td>
              <td class="data-value">${currency}${Number(data.price).toLocaleString()}</td>
            </tr>
            <tr>
              <td class="data-label">Billing Cycle</td>
              <td class="data-value">${this.escapeHtml(data.billingCycle || 'Monthly')}</td>
            </tr>
            <tr>
              <td class="data-label">Valid Until</td>
              <td class="data-value">${this.escapeHtml(endDateStr)}</td>
            </tr>
            <tr>
              <td class="data-label">Status</td>
              <td class="data-value" style="color:#4ade80;">ACTIVE</td>
            </tr>
          </table>
        </div>
        <p>You can manage your subscription and view invoices at any time from your Billing page.</p>
      `,
    });

    const text = `Hi ${data.name},\n\nYour subscription to the ${data.planName} plan is now active!\nAmount: ${currency}${data.price}\nValid Until: ${endDateStr}\n\nAccess your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

    return { subject, html, text };
  }

  static subscriptionExpiringSoon(data: {
    name: string;
    email: string;
    planName: string;
    daysLeft: number;
    expiryDate: Date | string;
  }): EmailRenderOutput {
    const expiryStr = new Date(data.expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const subject = `Reminder: Your ${data.planName} plan expires in ${data.daysLeft} day(s)`;
    const preview = `Renew your ${data.planName} subscription to maintain uninterrupted broadcasting.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Renew Subscription Now',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
      contentHtml: `
        <h1 class="h1">Your plan expires in ${data.daysLeft} day(s) ⏳</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>This is a friendly reminder that your <strong>${this.escapeHtml(data.planName)}</strong> subscription is scheduled to expire on <strong>${this.escapeHtml(expiryStr)}</strong>.</p>
        <div class="card-box">
          <p style="margin:0 0 10px; font-size:13px; color:#cbd5e1;">To avoid any interruption to your live streams, scheduled posts, and team workspaces, please renew your subscription before the expiration date.</p>
          <table class="data-table">
            <tr>
              <td class="data-label">Current Plan</td>
              <td class="data-value">${this.escapeHtml(data.planName)}</td>
            </tr>
            <tr>
              <td class="data-label">Expiration Date</td>
              <td class="data-value" style="color:#f87171;">${this.escapeHtml(expiryStr)}</td>
            </tr>
          </table>
        </div>
      `,
    });

    const text = `Hi ${data.name},\n\nYour ${data.planName} subscription will expire in ${data.daysLeft} day(s) on ${expiryStr}.\n\nRenew your plan to keep your access uninterrupted: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`;

    return { subject, html, text };
  }

  static subscriptionExpired(data: {
    name: string;
    email: string;
    planName: string;
  }): EmailRenderOutput {
    const subject = `Your NexaSocial ${data.planName} subscription has expired`;
    const preview = 'Your plan has expired. Renew now to restore full access.';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Reactivate Subscription',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
      contentHtml: `
        <h1 class="h1">Subscription Expired</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your subscription to the <strong>${this.escapeHtml(data.planName)}</strong> tier has ended. Access to subscription-protected features (such as live streaming, multi-platform multicasting, and extra workspace capacity) has been temporarily locked.</p>
        <div class="card-box">
          <p style="margin:0; font-size:13px; color:#cbd5e1;">Your workspaces, connected channels, and media files are safely stored. You can reactivate your account at any time by choosing a new plan.</p>
        </div>
      `,
    });

    const text = `Hi ${data.name},\n\nYour ${data.planName} subscription has expired. Paid features are currently locked.\n\nRenew anytime at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`;

    return { subject, html, text };
  }

  static subscriptionCancelled(data: {
    name: string;
    email: string;
    planName: string;
    effectiveDate?: Date | string | null;
  }): EmailRenderOutput {
    const dateStr = data.effectiveDate
      ? new Date(data.effectiveDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      : 'the end of your current billing period';

    const subject = `Subscription Cancelled: ${data.planName}`;
    const preview = 'Confirmation of your subscription cancellation.';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'View Billing Details',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`,
      contentHtml: `
        <h1 class="h1">Subscription Cancelled</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your subscription to the <strong>${this.escapeHtml(data.planName)}</strong> plan has been cancelled as requested.</p>
        <div class="card-box">
          <p style="margin:0; font-size:13px; color:#cbd5e1;">You will continue to have full access to all features until <strong>${this.escapeHtml(dateStr)}</strong>. After this date, your plan will revert to the default tier.</p>
        </div>
        <p>We're sorry to see you go! If you ever change your mind, you can reactivate your plan with a single click.</p>
      `,
    });

    const text = `Hi ${data.name},\n\nYour ${data.planName} subscription has been cancelled. You retain full access until ${dateStr}.\n\nYou can reactivate anytime at ${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`;

    return { subject, html, text };
  }

  // ──────────────────────────────────────────
  // 3. RAZORPAY PAYMENTS
  // ──────────────────────────────────────────

  static paymentSuccessReceipt(data: {
    name: string;
    email: string;
    amount: number;
    currency?: string;
    paymentId: string;
    orderId?: string;
    planName: string;
    date?: Date | string;
  }): EmailRenderOutput {
    const currency = data.currency === 'USD' ? '$' : '₹';
    const dateStr = new Date(data.date || new Date()).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    const subject = `Payment Receipt: ${currency}${Number(data.amount).toLocaleString()} for ${data.planName}`;
    const preview = `Your payment of ${currency}${Number(data.amount).toLocaleString()} was successful.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'View Payment History',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`,
      contentHtml: `
        <h1 class="h1">Payment Confirmation 🧾</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Thank you for your payment. Your transaction was processed successfully via Razorpay.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Payment ID</td>
              <td class="data-value">${this.escapeHtml(data.paymentId)}</td>
            </tr>
            ${data.orderId
          ? `<tr>
                    <td class="data-label">Order ID</td>
                    <td class="data-value">${this.escapeHtml(data.orderId)}</td>
                  </tr>`
          : ''
        }
            <tr>
              <td class="data-label">Plan / Item</td>
              <td class="data-value">${this.escapeHtml(data.planName)}</td>
            </tr>
            <tr>
              <td class="data-label">Amount Paid</td>
              <td class="data-value" style="color:#4ade80;">${currency}${Number(data.amount).toLocaleString()}</td>
            </tr>
            <tr>
              <td class="data-label">Date</td>
              <td class="data-value">${this.escapeHtml(dateStr)}</td>
            </tr>
            <tr>
              <td class="data-label">Status</td>
              <td class="data-value" style="color:#4ade80;">COMPLETED</td>
            </tr>
          </table>
        </div>
      `,
    });

    const text = `Payment Receipt\n\nHi ${data.name},\nPayment of ${currency}${data.amount} for ${data.planName} was successful.\nPayment ID: ${data.paymentId}\nDate: ${dateStr}\n\nView details at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`;

    return { subject, html, text };
  }

  static paymentFailed(data: {
    name: string;
    email: string;
    amount: number;
    currency?: string;
    planName: string;
    reason?: string;
  }): EmailRenderOutput {
    const currency = data.currency === 'USD' ? '$' : '₹';
    const subject = `Payment Failed: ${data.planName} Subscription`;
    const preview = 'Your payment attempt could not be completed.';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Retry Payment Securely',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
      contentHtml: `
        <h1 class="h1">Payment Unsuccessful ⚠️</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>We were unable to process your payment of <strong>${currency}${Number(data.amount).toLocaleString()}</strong> for the <strong>${this.escapeHtml(data.planName)}</strong> plan.</p>
        <div class="card-box" style="border-color:#ef4444;">
          <p style="margin:0 0 8px; font-weight:600; color:#f87171;">Reason for failure:</p>
          <p style="margin:0; font-size:13px; color:#cbd5e1;">${this.escapeHtml(data.reason || 'The card or payment method was declined by your bank or the payment provider.')}</p>
        </div>
        <p>No funds were charged. Please try again with a different payment method or contact your card issuer.</p>
      `,
    });

    const text = `Hi ${data.name},\n\nPayment of ${currency}${data.amount} for ${data.planName} failed.\nReason: ${data.reason || 'Payment declined'}.\n\nRetry payment securely: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`;

    return { subject, html, text };
  }

  // ──────────────────────────────────────────
  // 4. LIVE STREAMING
  // ──────────────────────────────────────────

  static streamScheduled(data: {
    name: string;
    email: string;
    title: string;
    scheduledAt: Date | string;
    platforms?: string[];
    streamId?: string;
  }): EmailRenderOutput {
    const dateStr = new Date(data.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = `Stream Scheduled: "${data.title}"`;
    const preview = `Your live broadcast has been scheduled for ${dateStr}.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      unsubscribeCategory: 'STREAMING',
      ctaText: 'Open Live Studio',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/streams`,
      contentHtml: `
        <h1 class="h1">Live Stream Scheduled 📅</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your live stream <strong>"${this.escapeHtml(data.title)}"</strong> has been scheduled successfully.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Broadcast Title</td>
              <td class="data-value">${this.escapeHtml(data.title)}</td>
            </tr>
            <tr>
              <td class="data-label">Scheduled Time</td>
              <td class="data-value" style="color:#38bdf8;">${this.escapeHtml(dateStr)}</td>
            </tr>
            ${data.platforms && data.platforms.length > 0
          ? `<tr>
                    <td class="data-label">Destinations</td>
                    <td class="data-value">${this.escapeHtml(data.platforms.join(', '))}</td>
                  </tr>`
          : ''
        }
          </table>
        </div>
        <p style="font-size:12px; color:#94a3b8;">We will send you a reminder shortly before your broadcast is set to begin.</p>
      `,
    });

    const text = `Hi ${data.name},\n\nYour stream "${data.title}" is scheduled for ${dateStr}.\nDestinations: ${(data.platforms || []).join(', ')}\n\nManage streams: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/streams`;

    return { subject, html, text };
  }

  static streamStarted(data: {
    name: string;
    email: string;
    title: string;
    platformsCount?: number;
    platformName?: string;
    streamId?: string;
  }): EmailRenderOutput {
    const subject = `Confirmed Live: "${data.title}"`;
    const preview = 'Your broadcast is now live on connected social channels!';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      unsubscribeCategory: 'STREAMING',
      ctaText: 'Monitor Live Studio',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/streams`,
      contentHtml: `
        <h1 class="h1">You are Live! 🔴</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your broadcast <strong>"${this.escapeHtml(data.title)}"</strong> has started and is streaming live.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Broadcast Title</td>
              <td class="data-value">${this.escapeHtml(data.title)}</td>
            </tr>
            <tr>
              <td class="data-label">Active Destinations</td>
              <td class="data-value">${this.escapeHtml(data.platformName || `${data.platformsCount || 1} destination(s)`)}</td>
            </tr>
            <tr>
              <td class="data-label">Stream Status</td>
              <td class="data-value" style="color:#ef4444;">● LIVE</td>
            </tr>
          </table>
        </div>
      `,
    });

    const text = `Hi ${data.name},\n\nYour broadcast "${data.title}" is now LIVE!\n\nMonitor your stream: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/streams`;

    return { subject, html, text };
  }

  static streamFailed(data: {
    name: string;
    email: string;
    title: string;
    reason?: string;
    platformName?: string;
  }): EmailRenderOutput {
    const subject = `Stream Alert: Broadcast failed for "${data.title}"`;
    const preview = 'An issue occurred during your livestream attempt.';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      unsubscribeCategory: 'STREAMING',
      ctaText: 'Open Live Stream Troubleshooting',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/streams`,
      contentHtml: `
        <h1 class="h1">Stream Connection Alert ⚠️</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>An issue was detected while broadcasting <strong>"${this.escapeHtml(data.title)}"</strong>.</p>
        <div class="card-box" style="border-color:#ef4444;">
          <p style="margin:0 0 8px; font-weight:600; color:#f87171;">Diagnostic Details:</p>
          <p style="margin:0; font-size:13px; color:#cbd5e1;">${this.escapeHtml(data.reason || 'RTMP/Encoder connection lost or social platform rejected the stream ingest.')}</p>
          ${data.platformName
          ? `<p style="margin:8px 0 0; font-size:12px; color:#94a3b8;">Affected platform: <strong>${this.escapeHtml(data.platformName)}</strong></p>`
          : ''
        }
        </div>
        <p style="font-size:12px; color:#94a3b8;">Recovery tip: Verify that your stream keys are up to date and that your broadcasting software (OBS/vMix) is transmitting data.</p>
      `,
    });

    const text = `Stream Alert\n\nHi ${data.name},\nYour stream "${data.title}" encountered an error: ${data.reason || 'Connection lost'}.\n\nTroubleshoot at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/streams`;

    return { subject, html, text };
  }

  // ──────────────────────────────────────────
  // 5. SOCIAL ACCOUNTS
  // ──────────────────────────────────────────

  static socialAccountConnected(data: {
    name: string;
    email: string;
    platform: string;
    accountName: string;
    workspaceName?: string;
  }): EmailRenderOutput {
    const subject = `Connected Channel: ${data.platform} (${data.accountName})`;
    const preview = `Your ${data.platform} channel was successfully linked to NexaSocial.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      unsubscribeCategory: 'SOCIAL',
      ctaText: 'View Connected Accounts',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connected-accounts`,
      contentHtml: `
        <h1 class="h1">Channel Connected Successfully 🔗</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your <strong>${this.escapeHtml(data.platform)}</strong> channel has been linked to your NexaSocial workspace.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Platform</td>
              <td class="data-value">${this.escapeHtml(data.platform)}</td>
            </tr>
            <tr>
              <td class="data-label">Account Name</td>
              <td class="data-value">${this.escapeHtml(data.accountName)}</td>
            </tr>
            ${data.workspaceName
          ? `<tr>
                    <td class="data-label">Workspace</td>
                    <td class="data-value">${this.escapeHtml(data.workspaceName)}</td>
                  </tr>`
          : ''
        }
          </table>
        </div>
      `,
    });

    const text = `Hi ${data.name},\n\nYour ${data.platform} account (${data.accountName}) has been connected to NexaSocial.\n\nManage channels: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/connected-accounts`;

    return { subject, html, text };
  }

  static socialAccountReauthRequired(data: {
    name: string;
    email: string;
    platform: string;
    accountName: string;
  }): EmailRenderOutput {
    const subject = `Action Required: Reconnect your ${data.platform} account`;
    const preview = `Your ${data.platform} authorization has expired.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Reconnect Channel Now',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connected-accounts`,
      contentHtml: `
        <h1 class="h1">Channel Reauthorization Required ⚠️</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>The authorization token for your <strong>${this.escapeHtml(data.platform)}</strong> account (<strong>${this.escapeHtml(data.accountName)}</strong>) has expired or was revoked.</p>
        <div class="card-box">
          <p style="margin:0; font-size:13px; color:#cbd5e1;">Live streaming and scheduling to this channel will pause until you re-authenticate with the platform provider.</p>
        </div>
      `,
    });

    const text = `Action Required\n\nHi ${data.name},\nYour ${data.platform} account (${data.accountName}) authorization has expired.\n\nPlease reconnect it at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/connected-accounts`;

    return { subject, html, text };
  }

  // ──────────────────────────────────────────
  // 6. WORKSPACES & INVITATIONS
  // ──────────────────────────────────────────

  static workspaceInvitation(data: {
    email: string;
    inviterName?: string;
    workspaceName: string;
    role: string;
    acceptUrl: string;
  }): EmailRenderOutput {
    const inviter = data.inviterName || 'A team administrator';
    const subject = `Invitation to join workspace "${data.workspaceName}"`;
    const preview = `${inviter} invited you to collaborate on NexaSocial.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Accept Invitation',
      ctaUrl: data.acceptUrl,
      contentHtml: `
        <h1 class="h1">You're Invited! 👥</h1>
        <p>Hi there,</p>
        <p><strong>${this.escapeHtml(inviter)}</strong> has invited you to join the <strong>${this.escapeHtml(data.workspaceName)}</strong> workspace on NexaSocial.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Workspace</td>
              <td class="data-value">${this.escapeHtml(data.workspaceName)}</td>
            </tr>
            <tr>
              <td class="data-label">Assigned Role</td>
              <td class="data-value" style="color:#c084fc;">${this.escapeHtml(data.role)}</td>
            </tr>
          </table>
        </div>
        <p style="font-size:12px; color:#94a3b8;">This invitation link will expire in 7 days. If you do not have an account yet, you will be prompted to create one.</p>
      `,
    });

    const text = `You're Invited!\n\n${inviter} has invited you to join "${data.workspaceName}" as a ${data.role} on NexaSocial.\n\nAccept invitation: ${data.acceptUrl}\n\nThis invitation expires in 7 days.`;

    return { subject, html, text };
  }

  // ──────────────────────────────────────────
  // 7. ADMIN & PLATFORM ALERTS
  // ──────────────────────────────────────────

  static adminTestEmail(data: {
    adminEmail: string;
    smtpHost: string;
    smtpPort: number;
    timestamp: Date;
  }): EmailRenderOutput {
    const dateStr = data.timestamp.toUTCString();
    const subject = 'NexaSocial SMTP Connection Test';
    const preview = 'Your email provider configuration is operational!';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.adminEmail,
      ctaText: 'Open Admin Email Logs',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/email`,
      contentHtml: `
        <h1 class="h1">SMTP Test Successful! ✅</h1>
        <p>Hello Administrator,</p>
        <p>This test email confirms that your NexaSocial mail transport is correctly configured and successfully delivering messages.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">SMTP Host</td>
              <td class="data-value">${this.escapeHtml(data.smtpHost)}</td>
            </tr>
            <tr>
              <td class="data-label">Port</td>
              <td class="data-value">${data.smtpPort}</td>
            </tr>
            <tr>
              <td class="data-label">Delivery Timestamp</td>
              <td class="data-value">${this.escapeHtml(dateStr)}</td>
            </tr>
            <tr>
              <td class="data-label">Status</td>
              <td class="data-value" style="color:#4ade80;">OPERATIONAL</td>
            </tr>
          </table>
        </div>
      `,
    });

    const text = `NexaSocial SMTP Test Successful!\n\nHost: ${data.smtpHost}\nPort: ${data.smtpPort}\nDate: ${dateStr}\n\nSMTP is operational.`;

    return { subject, html, text };
  }

  static adminPlatformAlert(data: {
    subject: string;
    alertTitle: string;
    message: string;
    details?: Record<string, any>;
  }): EmailRenderOutput {
    const subject = `[Admin Alert] ${data.subject}`;
    const preview = data.alertTitle;

    let detailsHtml = '';
    if (data.details && Object.keys(data.details).length > 0) {
      detailsHtml = `
        <table class="data-table">
          ${Object.entries(data.details)
          .map(
            ([k, v]) => `<tr>
              <td class="data-label">${this.escapeHtml(k)}</td>
              <td class="data-value">${this.escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v))}</td>
            </tr>`,
          )
          .join('')}
        </table>
      `;
    }

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      ctaText: 'Open Admin Dashboard',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/system-health`,
      contentHtml: `
        <h1 class="h1" style="color:#f87171;">⚠️ ${this.escapeHtml(data.alertTitle)}</h1>
        <p>${this.escapeHtml(data.message)}</p>
        ${detailsHtml ? `<div class="card-box">${detailsHtml}</div>` : ''}
        <p style="font-size:12px; color:#94a3b8;">This automated alert was dispatched to system administrators.</p>
      `,
    });

    const text = `[Admin Alert] ${data.alertTitle}\n\n${data.message}\n\nDetails: ${JSON.stringify(data.details || {})}`;

    return { subject, html, text };
  }

  static subscriptionRenewed(data: {
    name: string;
    email: string;
    planName: string;
    price: number;
    currency?: string;
    newEndDate: Date | string;
    billingCycle?: string;
  }): EmailRenderOutput {
    const currency = data.currency || 'INR';
    const formattedPrice =
      currency === 'INR'
        ? `₹${data.price.toLocaleString('en-IN')}`
        : `${currency} ${data.price}`;
    const subject = `Subscription Renewed: NexaSocial ${data.planName}`;
    const preview = `Your NexaSocial ${data.planName} subscription renewed successfully.`;
    const formattedDate = new Date(data.newEndDate).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'View Subscription & Invoices',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`,
      contentHtml: `
        <h1 class="h1">Subscription Renewed 🎉</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your subscription for <strong>${this.escapeHtml(data.planName)}</strong> has successfully renewed. All features remain unlocked with zero interruption.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Plan Tier</td>
              <td class="data-value">${this.escapeHtml(data.planName)}</td>
            </tr>
            <tr>
              <td class="data-label">Renewal Amount</td>
              <td class="data-value">${formattedPrice}</td>
            </tr>
            <tr>
              <td class="data-label">Billing Cycle</td>
              <td class="data-value">${this.escapeHtml(data.billingCycle || 'Monthly')}</td>
            </tr>
            <tr>
              <td class="data-label">Next Renewal Date</td>
              <td class="data-value">${formattedDate}</td>
            </tr>
            <tr>
              <td class="data-label">Status</td>
              <td class="data-value"><span class="badge" style="background:#10b981; color:#ffffff;">Active</span></td>
            </tr>
          </table>
        </div>
      `,
    });

    const text = `Hi ${data.name},\n\nYour NexaSocial ${data.planName} subscription renewed successfully.\nAmount: ${formattedPrice}\nNext Renewal: ${formattedDate}\n\nManage subscription: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`;

    return { subject, html, text };
  }

  static subscriptionPlanChanged(data: {
    name: string;
    email: string;
    fromPlan: string;
    toPlan: string;
    changeType: 'upgrade' | 'downgrade';
    price: number;
    currency?: string;
    endDate?: Date | string | null;
  }): EmailRenderOutput {
    const isUpgrade = data.changeType === 'upgrade';
    const currency = data.currency || 'INR';
    const formattedPrice =
      currency === 'INR'
        ? `₹${data.price.toLocaleString('en-IN')}`
        : `${currency} ${data.price}`;
    const subject = isUpgrade
      ? `Subscription Upgraded to ${data.toPlan} 🚀`
      : `Subscription Changed to ${data.toPlan}`;
    const preview = `Your NexaSocial subscription has been ${isUpgrade ? 'upgraded' : 'changed'} to ${data.toPlan}.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'Access Your Dashboard',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      contentHtml: `
        <h1 class="h1">${isUpgrade ? 'Plan Upgraded Successfully! 🚀' : 'Subscription Tier Updated'}</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your NexaSocial subscription has been successfully switched from <strong>${this.escapeHtml(data.fromPlan)}</strong> to <strong>${this.escapeHtml(data.toPlan)}</strong>.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Previous Tier</td>
              <td class="data-value">${this.escapeHtml(data.fromPlan)}</td>
            </tr>
            <tr>
              <td class="data-label">New Tier</td>
              <td class="data-value" style="font-weight:700; color:#818cf8;">${this.escapeHtml(data.toPlan)}</td>
            </tr>
            <tr>
              <td class="data-label">Price</td>
              <td class="data-value">${formattedPrice}</td>
            </tr>
            <tr>
              <td class="data-label">Status</td>
              <td class="data-value"><span class="badge" style="background:#10b981; color:#ffffff;">Active</span></td>
            </tr>
          </table>
        </div>
        <p>${isUpgrade ? 'Your upgraded limits and capabilities are available immediately.' : 'Your plan features have been updated accordingly.'}</p>
      `,
    });

    const text = `Hi ${data.name},\n\nYour NexaSocial plan has been ${data.changeType}d from ${data.fromPlan} to ${data.toPlan}.\nNew Price: ${formattedPrice}\n\nDashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

    return { subject, html, text };
  }

  static paymentRefunded(data: {
    name: string;
    email: string;
    amount: number;
    currency?: string;
    paymentId: string;
    reason?: string;
  }): EmailRenderOutput {
    const currency = data.currency || 'INR';
    const formattedAmount =
      currency === 'INR'
        ? `₹${data.amount.toLocaleString('en-IN')}`
        : `${currency} ${data.amount}`;
    const subject = `Refund Processed: NexaSocial (${formattedAmount})`;
    const preview = `Your refund of ${formattedAmount} for payment ${data.paymentId} has been completed.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      ctaText: 'View Billing History',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`,
      contentHtml: `
        <h1 class="h1">Refund Confirmation 💳</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>A refund has been successfully processed for your NexaSocial transaction.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Refund Amount</td>
              <td class="data-value" style="color:#10b981; font-weight:700;">${formattedAmount}</td>
            </tr>
            <tr>
              <td class="data-label">Transaction Reference</td>
              <td class="data-value">${this.escapeHtml(data.paymentId)}</td>
            </tr>
            ${data.reason ? `<tr><td class="data-label">Reason</td><td class="data-value">${this.escapeHtml(data.reason)}</td></tr>` : ''}
            <tr>
              <td class="data-label">Status</td>
              <td class="data-value"><span class="badge" style="background:#0ea5e9; color:#ffffff;">Refunded</span></td>
            </tr>
          </table>
        </div>
        <p style="font-size:13px; color:#94a3b8;">Depending on your bank or card issuer, funds typically reflect in your account within 5-7 business days.</p>
      `,
    });

    const text = `Hi ${data.name},\n\nA refund of ${formattedAmount} has been processed for payment ${data.paymentId}.${data.reason ? ` Reason: ${data.reason}` : ''}\n\nBilling History: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`;

    return { subject, html, text };
  }

  static streamEnded(data: {
    name: string;
    email: string;
    title: string;
    endedAt: Date | string;
    streamId: string;
  }): EmailRenderOutput {
    const subject = `Live Stream Ended: "${data.title}"`;
    const preview = `Your live broadcast "${data.title}" has completed.`;
    const formattedEnd = new Date(data.endedAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      unsubscribeCategory: 'STREAMING',
      ctaText: 'View Stream Analytics',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/streams`,
      contentHtml: `
        <h1 class="h1">Broadcast Summary 🎬</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your live stream <strong>"${this.escapeHtml(data.title)}"</strong> has successfully concluded.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Stream Title</td>
              <td class="data-value">${this.escapeHtml(data.title)}</td>
            </tr>
            <tr>
              <td class="data-label">Concluded At</td>
              <td class="data-value">${formattedEnd}</td>
            </tr>
            <tr>
              <td class="data-label">Status</td>
              <td class="data-value"><span class="badge" style="background:#64748b; color:#ffffff;">Ended</span></td>
            </tr>
          </table>
        </div>
        <p>Comprehensive viewer analytics and recording archives are available in your streaming dashboard.</p>
      `,
    });

    const text = `Hi ${data.name},\n\nYour live stream "${data.title}" ended at ${formattedEnd}.\n\nView details: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/streams`;

    return { subject, html, text };
  }

  static streamReminder(data: {
    name: string;
    email: string;
    title: string;
    scheduledAt: Date | string;
    platforms?: string[];
    streamId: string;
  }): EmailRenderOutput {
    const subject = `Reminder: Stream "${data.title}" starts soon! ⏱️`;
    const preview = `Your broadcast "${data.title}" is scheduled to go live shortly.`;
    const timeStr = new Date(data.scheduledAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      unsubscribeCategory: 'STREAMING',
      ctaText: 'Open Live Studio',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/streams`,
      contentHtml: `
        <h1 class="h1">Live Stream Reminder ⏱️</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>This is a reminder that your live stream <strong>"${this.escapeHtml(data.title)}"</strong> is scheduled to go live at <strong>${timeStr}</strong>.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Stream Title</td>
              <td class="data-value">${this.escapeHtml(data.title)}</td>
            </tr>
            <tr>
              <td class="data-label">Go-Live Time</td>
              <td class="data-value">${timeStr}</td>
            </tr>
            ${data.platforms && data.platforms.length > 0 ? `<tr><td class="data-label">Destinations</td><td class="data-value">${data.platforms.map((p) => this.escapeHtml(p)).join(', ')}</td></tr>` : ''}
          </table>
        </div>
        <p>Make sure your camera, microphone, and encoder are ready before going live.</p>
      `,
    });

    const text = `Hi ${data.name},\n\nReminder: Your live stream "${data.title}" starts soon at ${timeStr}.\n\nOpen Studio: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/streams`;

    return { subject, html, text };
  }

  static emailChanged(data: {
    name: string;
    oldEmail: string;
    newEmail: string;
  }): EmailRenderOutput {
    const subject = 'Security Alert: Account Email Address Changed';
    const preview =
      'The email address associated with your NexaSocial account was updated.';

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      ctaText: 'Review Account Security',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings`,
      contentHtml: `
        <h1 class="h1" style="color:#f59e0b;">Security Alert: Email Updated 🛡️</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>The email address associated with your NexaSocial account has been changed.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Previous Email</td>
              <td class="data-value">${this.escapeHtml(data.oldEmail)}</td>
            </tr>
            <tr>
              <td class="data-label">New Email</td>
              <td class="data-value" style="font-weight:700;">${this.escapeHtml(data.newEmail)}</td>
            </tr>
            <tr>
              <td class="data-label">Timestamp</td>
              <td class="data-value">${new Date().toUTCString()}</td>
            </tr>
          </table>
        </div>
        <p style="color:#f87171; font-size:13px;">If you did not authorize this change, please contact support immediately to secure your account.</p>
      `,
    });

    const text = `Hi ${data.name},\n\nSecurity Notice: The email for your NexaSocial account has been changed from ${data.oldEmail} to ${data.newEmail}.\n\nIf you did not authorize this change, contact support immediately: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings`;

    return { subject, html, text };
  }

  static workspaceInvitationAccepted(data: {
    inviterName: string;
    inviterEmail: string;
    acceptedUserName: string;
    acceptedUserEmail: string;
    workspaceName: string;
    role: string;
  }): EmailRenderOutput {
    const subject = `Invitation Accepted: ${data.acceptedUserName} joined "${data.workspaceName}"`;
    const preview = `${data.acceptedUserName} accepted your invitation to join ${data.workspaceName}.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.inviterEmail,
      unsubscribeCategory: 'WORKSPACE',
      ctaText: 'View Workspace Team',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/team`,
      contentHtml: `
        <h1 class="h1">Member Joined Workspace 🤝</h1>
        <p>Hi ${this.escapeHtml(data.inviterName)},</p>
        <p><strong>${this.escapeHtml(data.acceptedUserName)}</strong> (${this.escapeHtml(data.acceptedUserEmail)}) has accepted the invitation and joined <strong>"${this.escapeHtml(data.workspaceName)}"</strong>.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Member Name</td>
              <td class="data-value">${this.escapeHtml(data.acceptedUserName)}</td>
            </tr>
            <tr>
              <td class="data-label">Assigned Role</td>
              <td class="data-value">${this.escapeHtml(data.role)}</td>
            </tr>
            <tr>
              <td class="data-label">Workspace</td>
              <td class="data-value">${this.escapeHtml(data.workspaceName)}</td>
            </tr>
          </table>
        </div>
      `,
    });

    const text = `Hi ${data.inviterName},\n\n${data.acceptedUserName} accepted your invitation to join "${data.workspaceName}" with role ${data.role}.\n\nView team: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/team`;

    return { subject, html, text };
  }

  static workspaceMemberRoleChanged(data: {
    name: string;
    email: string;
    workspaceName: string;
    oldRole: string;
    newRole: string;
  }): EmailRenderOutput {
    const subject = `Role Updated in "${data.workspaceName}": ${data.newRole}`;
    const preview = `Your role in workspace "${data.workspaceName}" has been updated to ${data.newRole}.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      unsubscribeCategory: 'WORKSPACE',
      ctaText: 'Go to Workspace',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/team`,
      contentHtml: `
        <h1 class="h1">Workspace Role Updated 👥</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your access role in <strong>"${this.escapeHtml(data.workspaceName)}"</strong> has been changed.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">Workspace</td>
              <td class="data-value">${this.escapeHtml(data.workspaceName)}</td>
            </tr>
            <tr>
              <td class="data-label">Previous Role</td>
              <td class="data-value">${this.escapeHtml(data.oldRole)}</td>
            </tr>
            <tr>
              <td class="data-label">New Role</td>
              <td class="data-value" style="font-weight:700; color:#818cf8;">${this.escapeHtml(data.newRole)}</td>
            </tr>
          </table>
        </div>
      `,
    });

    const text = `Hi ${data.name},\n\nYour role in workspace "${data.workspaceName}" was updated from ${data.oldRole} to ${data.newRole}.\n\nView workspace: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/team`;

    return { subject, html, text };
  }

  static workspaceMemberRemoved(data: {
    name: string;
    email: string;
    workspaceName: string;
  }): EmailRenderOutput {
    const subject = `Workspace Access Update: "${data.workspaceName}"`;
    const preview = `You have been removed from the workspace "${data.workspaceName}".`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      unsubscribeCategory: 'WORKSPACE',
      ctaText: 'Go to NexaSocial',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/workspaces`,
      contentHtml: `
        <h1 class="h1">Workspace Membership Update</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>You have been removed from the workspace <strong>"${this.escapeHtml(data.workspaceName)}"</strong>. You no longer have access to channels, media, or settings within this workspace.</p>
      `,
    });

    const text = `Hi ${data.name},\n\nYou have been removed from workspace "${data.workspaceName}".\n\nNexaSocial: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/workspaces`;

    return { subject, html, text };
  }

  static workspaceOwnershipTransferred(data: {
    name: string;
    email: string;
    workspaceName: string;
    isNewOwner: boolean;
    otherPartyName: string;
  }): EmailRenderOutput {
    const subject = `Workspace Ownership Transferred: "${data.workspaceName}"`;
    const preview = data.isNewOwner
      ? `You are now the Primary Owner of "${data.workspaceName}".`
      : `Ownership of "${data.workspaceName}" was transferred.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      unsubscribeCategory: 'WORKSPACE',
      ctaText: 'Open Workspace',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/workspaces`,
      contentHtml: `
        <h1 class="h1">Ownership Transferred 🔑</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>${data.isNewOwner
          ? `You have been transferred primary ownership of the workspace <strong>"${this.escapeHtml(data.workspaceName)}"</strong> by ${this.escapeHtml(data.otherPartyName)}.`
          : `Primary ownership of <strong>"${this.escapeHtml(data.workspaceName)}"</strong> has been transferred to ${this.escapeHtml(data.otherPartyName)}. Your role is now Manager.`
        }</p>
      `,
    });

    const text = `Hi ${data.name},\n\nWorkspace Ownership Transferred for "${data.workspaceName}".\n\nOpen workspace: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/workspaces`;

    return { subject, html, text };
  }

  static socialAccountDisconnected(data: {
    name: string;
    email: string;
    platform: string;
    accountName: string;
    workspaceName?: string;
  }): EmailRenderOutput {
    const subject = `Channel Disconnected: ${data.platform} (${data.accountName})`;
    const preview = `Your ${data.platform} account has been disconnected from NexaSocial.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.email,
      unsubscribeCategory: 'SOCIAL',
      ctaText: 'Manage Connected Channels',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/social`,
      contentHtml: `
        <h1 class="h1">Channel Disconnected 🔌</h1>
        <p>Hi ${this.escapeHtml(data.name)},</p>
        <p>Your <strong>${this.escapeHtml(data.platform)}</strong> channel <strong>(${this.escapeHtml(data.accountName)})</strong> has been disconnected from NexaSocial${data.workspaceName ? ` in workspace "${this.escapeHtml(data.workspaceName)}"` : ''}.</p>
        <p>Scheduled posts or streams targeted to this account will no longer broadcast until reconnected.</p>
      `,
    });

    const text = `Hi ${data.name},\n\nYour ${data.platform} channel (${data.accountName}) has been disconnected.\n\nManage channels: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/social`;

    return { subject, html, text };
  }

  static adminNewUserRegistered(data: {
    adminEmail: string;
    userId: string;
    userName: string;
    userEmail: string;
    registeredAt: Date | string;
  }): EmailRenderOutput {
    const subject = `[Admin Alert] New User Registered: ${data.userName}`;
    const preview = `New user ${data.userName} (${data.userEmail}) created an account.`;

    const html = this.wrapLayout({
      title: subject,
      previewText: preview,
      userEmail: data.adminEmail,
      ctaText: 'View Users in Admin Panel',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/users`,
      contentHtml: `
        <h1 class="h1">New User Registration 👤</h1>
        <p>A new user has just registered on the NexaSocial platform.</p>
        <div class="card-box">
          <table class="data-table">
            <tr>
              <td class="data-label">User Name</td>
              <td class="data-value">${this.escapeHtml(data.userName)}</td>
            </tr>
            <tr>
              <td class="data-label">Email</td>
              <td class="data-value">${this.escapeHtml(data.userEmail)}</td>
            </tr>
            <tr>
              <td class="data-label">User ID</td>
              <td class="data-value" style="font-family:monospace; font-size:12px;">${this.escapeHtml(data.userId)}</td>
            </tr>
            <tr>
              <td class="data-label">Timestamp</td>
              <td class="data-value">${new Date(data.registeredAt).toUTCString()}</td>
            </tr>
          </table>
        </div>
      `,
    });

    const text = `New User Registered: ${data.userName} (${data.userEmail}) ID: ${data.userId} at ${new Date(data.registeredAt).toUTCString()}`;

    return { subject, html, text };
  }
}
