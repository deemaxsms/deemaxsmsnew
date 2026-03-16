// Comprehensive Email Template System for SMS Globe
// Different templates for each order status and product category

interface ProductOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  productId: string;
  productName: string;
  category: 'esim' | 'proxy' | 'rdp' | 'vpn' | 'sms' | 'gift';
  provider: string;
  quantity: number;
  price: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  fulfillmentData?: any;
  requestDetails?: {
    location?: string;
    duration?: string;
    specifications?: string;
    additionalNotes?: string;
  };
}

// Company branding
const COMPANY_LOGO_FULL = "https://i.ibb.co/4Zpc947T/favicon.png"; // Logo with name and tagline
const COMPANY_LOGO_ICON = "https://i.ibb.co/84Yyw5RL/favicon-16x16.png"; // Just the logo
const COMPANY_NAME = "SMS Globe";
const COMPANY_TAGLINE = "Your Global Digital Services Partner";
const SUPPORT_EMAIL = "support@smsglobe.com";
const WEBSITE_URL = "https://smsglobe.com";

// Helper function to format dates
const formatEmailDate = (dateValue: any): string => {
  try {
    let date: Date;
    if (dateValue && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      date = new Date();
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return new Date().toLocaleDateString();
  }
};

// Helper function to format currency
const formatEmailCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

// Base email template structure
const getBaseEmailTemplate = (content: string, headerColor: string = "#2563eb"): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMS Globe - Order Update</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%); padding: 30px 20px; text-align: center; }
        .logo { max-width: 200px; height: auto; margin-bottom: 10px; }
        .header-text { color: white; margin: 0; font-size: 24px; font-weight: bold; }
        .content { padding: 30px 20px; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${headerColor}; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        .info-box { background-color: #f8fafc; border-left: 4px solid ${headerColor}; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .credentials-box { background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .credential-item { margin: 10px 0; }
        .credential-label { font-weight: bold; color: #1e40af; }
        .credential-value { font-family: 'Courier New', monospace; background-color: #e0f2fe; padding: 4px 8px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${COMPANY_LOGO_FULL}" alt="${COMPANY_NAME}" class="logo">
            <h1 class="header-text">${COMPANY_TAGLINE}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
                <strong>${COMPANY_NAME}</strong> - Your trusted partner for digital services worldwide
            </p>
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px;">
                📧 <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a> | 
                🌐 <a href="${WEBSITE_URL}" style="color: #2563eb;">${WEBSITE_URL}</a>
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                © ${new Date().getFullYear()} SMS Globe. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;
};

// PENDING ORDER TEMPLATES
export const generatePendingOrderEmail = (order: ProductOrder): { subject: string; body: string } => {
  const orderDate = formatEmailDate(order.createdAt);
  const amount = formatEmailCurrency(order.amount || order.price || 0);
  
  const subject = `📋 Order Received - ${order.category?.toUpperCase()} Service | Order #${order.orderNumber || order.id.slice(-8)}`;
  
  let categoryIcon = "📦";
  let categoryDescription = "digital service";
  
  switch (order.category) {
    case 'esim':
      categoryIcon = "📱";
      categoryDescription = "eSIM data plan";
      break;
    case 'rdp':
      categoryIcon = "🖥️";
      categoryDescription = "RDP server access";
      break;
    case 'proxy':
      categoryIcon = "🔒";
      categoryDescription = "proxy service";
      break;
    case 'vpn':
      categoryIcon = "🛡️";
      categoryDescription = "VPN service";
      break;
    case 'gift':
      categoryIcon = "🎁";
      categoryDescription = "gift delivery";
      break;
  }

  const content = `
    <h2 style="color: #1e40af; margin-bottom: 20px;">${categoryIcon} Order Confirmation</h2>
    
    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        Thank you for choosing <strong>SMS Globe</strong>! We've received your order and our team is now processing your ${categoryDescription} request.
    </p>

    <div class="info-box">
        <h3 style="margin-top: 0; color: #1e40af;">📋 Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Number:</td>
                <td style="padding: 8px 0; color: #1f2937;">#${order.orderNumber || order.id.slice(-8)}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Product:</td>
                <td style="padding: 8px 0; color: #1f2937;">${order.productName}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Category:</td>
                <td style="padding: 8px 0; color: #1f2937;">${order.category?.toUpperCase()}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Amount:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${amount}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderDate}</td>
            </tr>
        </table>
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #92400e;">⏱️ What Happens Next?</h3>
        <ul style="color: #451a03; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Our team will review and process your order within 2-4 hours</li>
            <li>You'll receive another email when your order moves to "Processing" status</li>
            <li>Once ready, we'll send you the complete ${categoryDescription} details</li>
            <li>Average fulfillment time: 4-24 hours depending on the service</li>
        </ul>
    </div>

    ${order.requestDetails ? `
    <div class="info-box">
        <h3 style="margin-top: 0; color: #1e40af;">📝 Your Requirements</h3>
        ${order.requestDetails.location ? `<p><strong>Location:</strong> ${order.requestDetails.location}</p>` : ''}
        ${order.requestDetails.duration ? `<p><strong>Duration:</strong> ${order.requestDetails.duration}</p>` : ''}
        ${order.requestDetails.specifications ? `<p><strong>Specifications:</strong> ${order.requestDetails.specifications}</p>` : ''}
        ${order.requestDetails.additionalNotes ? `<p><strong>Additional Notes:</strong> ${order.requestDetails.additionalNotes}</p>` : ''}
    </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
        <a href="${WEBSITE_URL}/orders" class="button">Track Your Order</a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        <strong>Need help?</strong> Our support team is available 24/7 to assist you. 
        Simply reply to this email or contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a>.
    </p>
  `;

  return {
    subject,
    body: getBaseEmailTemplate(content, "#f59e0b")
  };
};

// PROCESSING ORDER TEMPLATES
export const generateProcessingOrderEmail = (order: ProductOrder): { subject: string; body: string } => {
  const orderDate = formatEmailDate(order.createdAt);
  const amount = formatEmailCurrency(order.amount || order.price || 0);
  
  const subject = `⚡ Order Processing - ${order.category?.toUpperCase()} Service | Order #${order.orderNumber || order.id.slice(-8)}`;
  
  let categoryIcon = "📦";
  let processingMessage = "We're setting up your digital service";
  let estimatedTime = "2-12 hours";
  
  switch (order.category) {
    case 'esim':
      categoryIcon = "📱";
      processingMessage = "We're configuring your eSIM data plan";
      estimatedTime = "1-6 hours";
      break;
    case 'rdp':
      categoryIcon = "🖥️";
      processingMessage = "We're setting up your dedicated RDP server";
      estimatedTime = "2-12 hours";
      break;
    case 'proxy':
      categoryIcon = "🔒";
      processingMessage = "We're configuring your proxy service";
      estimatedTime = "1-4 hours";
      break;
    case 'vpn':
      categoryIcon = "🛡️";
      processingMessage = "We're setting up your VPN account";
      estimatedTime = "1-6 hours";
      break;
    case 'gift':
      categoryIcon = "🎁";
      processingMessage = "We're preparing your gift for delivery";
      estimatedTime = "1-3 business days";
      break;
  }

  const content = `
    <h2 style="color: #2563eb; margin-bottom: 20px;">${categoryIcon} Order In Progress</h2>
    
    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        Great news! Your order is now being processed by our technical team. ${processingMessage} and it will be ready soon.
    </p>

    <div style="background-color: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="margin-top: 0; color: #1e40af;">🚀 Status: PROCESSING</h3>
        <p style="margin: 10px 0; color: #1e3a8a; font-size: 18px; font-weight: bold;">
            Estimated completion: ${estimatedTime}
        </p>
        <div style="background-color: #3b82f6; height: 4px; border-radius: 2px; margin: 15px 0;">
            <div style="background-color: #1d4ed8; height: 4px; width: 60%; border-radius: 2px; animation: pulse 2s infinite;"></div>
        </div>
    </div>

    <div class="info-box">
        <h3 style="margin-top: 0; color: #2563eb;">📋 Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Number:</td>
                <td style="padding: 8px 0; color: #1f2937;">#${order.orderNumber || order.id.slice(-8)}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Product:</td>
                <td style="padding: 8px 0; color: #1f2937;">${order.productName}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Amount:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${amount}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderDate}</td>
            </tr>
        </table>
    </div>

    <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">⚡ What's Happening Now?</h3>
        <ul style="color: #1e3a8a; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Our technical team is configuring your service</li>
            <li>Quality checks are being performed to ensure optimal performance</li>
            <li>Access credentials and setup instructions are being prepared</li>
            <li>You'll receive the complete details once processing is complete</li>
        </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="${WEBSITE_URL}/orders" class="button">Track Progress</a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        <strong>Questions?</strong> Feel free to reach out to our support team at 
        <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a> 
        if you have any questions about your order.
    </p>
  `;

  return {
    subject,
    body: getBaseEmailTemplate(content, "#2563eb")
  };
};

// COMPLETED ORDER TEMPLATES
export const generateCompletedOrderEmail = (order: ProductOrder): { subject: string; body: string } => {
  const orderDate = formatEmailDate(order.createdAt);
  const completedDate = formatEmailDate(order.completedAt || new Date());
  const amount = formatEmailCurrency(order.amount || order.price || 0);
  
  const subject = `🎉 Order Ready - ${order.category?.toUpperCase()} Service | Order #${order.orderNumber || order.id.slice(-8)}`;
  
  let categoryIcon = "📦";
  let successMessage = "Your digital service is ready!";
  let productDetails = '';
  let setupInstructions = '';
  
  switch (order.category) {
    case 'esim':
      categoryIcon = "📱";
      successMessage = "Your eSIM is ready to use!";
      
      if (order.fulfillmentData) {
        productDetails = `
        <div class="credentials-box">
            <h3 style="color: #059669; margin-top: 0;">${categoryIcon} Your eSIM Details</h3>
            ${order.fulfillmentData.qrCodeUrl ? `
            <div class="credential-item">
                <div class="credential-label">📱 QR Code:</div>
                <div style="margin: 10px 0;">
                    <img src="${order.fulfillmentData.qrCodeUrl}" alt="eSIM QR Code" style="max-width: 200px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
            </div>` : ''}
            ${order.fulfillmentData.activationCode ? `
            <div class="credential-item">
                <div class="credential-label">🔑 Activation Code:</div>
                <div class="credential-value">${order.fulfillmentData.activationCode}</div>
            </div>` : ''}
            ${order.fulfillmentData.iccid ? `
            <div class="credential-item">
                <div class="credential-label">📋 ICCID:</div>
                <div class="credential-value">${order.fulfillmentData.iccid}</div>
            </div>` : ''}
            ${order.fulfillmentData.pin ? `
            <div class="credential-item">
                <div class="credential-label">🔐 PIN/PUK:</div>
                <div class="credential-value">${order.fulfillmentData.pin}</div>
            </div>` : ''}
        </div>`;

        setupInstructions = `
        <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">📋 Setup Instructions</h3>
            <ol style="color: #065f46; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li><strong>Scan the QR Code:</strong> Use your device's camera or eSIM app to scan the QR code above</li>
                <li><strong>Follow Prompts:</strong> Your device will guide you through the installation process</li>
                <li><strong>Enter Activation Code:</strong> Use the activation code provided when prompted</li>
                <li><strong>Activate & Enjoy:</strong> Your eSIM will be activated and ready for use</li>
            </ol>
        </div>`;
      }
      break;

    case 'rdp':
      categoryIcon = "🖥️";
      successMessage = "Your RDP server is ready!";
      
      if (order.fulfillmentData) {
        productDetails = `
        <div class="credentials-box">
            <h3 style="color: #1d4ed8; margin-top: 0;">${categoryIcon} Your RDP Server Details</h3>
            ${order.fulfillmentData.serverIp ? `
            <div class="credential-item">
                <div class="credential-label">🌐 Server IP:</div>
                <div class="credential-value">${order.fulfillmentData.serverIp}</div>
            </div>` : ''}
            ${order.fulfillmentData.rdpPort ? `
            <div class="credential-item">
                <div class="credential-label">🔌 Port:</div>
                <div class="credential-value">${order.fulfillmentData.rdpPort}</div>
            </div>` : ''}
            ${order.fulfillmentData.username ? `
            <div class="credential-item">
                <div class="credential-label">👤 Username:</div>
                <div class="credential-value">${order.fulfillmentData.username}</div>
            </div>` : ''}
            ${order.fulfillmentData.password ? `
            <div class="credential-item">
                <div class="credential-label">🔑 Password:</div>
                <div class="credential-value">${order.fulfillmentData.password}</div>
            </div>` : ''}
        </div>`;

        setupInstructions = `
        <div style="background-color: #eff6ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1d4ed8; margin-top: 0;">📋 Connection Instructions</h3>
            <ol style="color: #1e3a8a; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li><strong>Open Remote Desktop:</strong> Launch Remote Desktop Connection on your device</li>
                <li><strong>Enter Server IP:</strong> Use the server IP address: <code>${order.fulfillmentData.serverIp || 'See details above'}</code></li>
                <li><strong>Set Port:</strong> Configure port: <code>${order.fulfillmentData.rdpPort || '3389'}</code></li>
                <li><strong>Login:</strong> Use the provided username and password to connect</li>
            </ol>
        </div>`;
      }
      break;

    case 'proxy':
      categoryIcon = "🔒";
      successMessage = "Your proxy service is ready!";
      
      if (order.fulfillmentData) {
        productDetails = `
        <div class="credentials-box">
            <h3 style="color: #7c3aed; margin-top: 0;">${categoryIcon} Your Proxy Details</h3>
            ${order.fulfillmentData.ipAddress ? `
            <div class="credential-item">
                <div class="credential-label">🌐 Proxy IP:</div>
                <div class="credential-value">${order.fulfillmentData.ipAddress}</div>
            </div>` : ''}
            ${order.fulfillmentData.port ? `
            <div class="credential-item">
                <div class="credential-label">🔌 Port:</div>
                <div class="credential-value">${order.fulfillmentData.port}</div>
            </div>` : ''}
            ${order.fulfillmentData.username ? `
            <div class="credential-item">
                <div class="credential-label">👤 Username:</div>
                <div class="credential-value">${order.fulfillmentData.username}</div>
            </div>` : ''}
            ${order.fulfillmentData.password ? `
            <div class="credential-item">
                <div class="credential-label">🔑 Password:</div>
                <div class="credential-value">${order.fulfillmentData.password}</div>
            </div>` : ''}
        </div>`;

        setupInstructions = `
        <div style="background-color: #f3e8ff; border: 1px solid #8b5cf6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #7c3aed; margin-top: 0;">📋 Setup Instructions</h3>
            <ol style="color: #6b21a8; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li><strong>Configure Application:</strong> Set up your browser or application to use the proxy</li>
                <li><strong>Enter Proxy Details:</strong> Use the IP address and port provided above</li>
                <li><strong>Authentication:</strong> Enter the username and password when prompted</li>
                <li><strong>Test Connection:</strong> Verify the proxy is working by checking your IP address</li>
            </ol>
        </div>`;
      }
      break;

    case 'vpn':
      categoryIcon = "🛡️";
      successMessage = "Your VPN account is ready!";
      
      if (order.fulfillmentData) {
        productDetails = `
        <div class="credentials-box">
            <h3 style="color: #059669; margin-top: 0;">${categoryIcon} Your VPN Account Details</h3>
            ${order.fulfillmentData.username ? `
            <div class="credential-item">
                <div class="credential-label">👤 VPN Username:</div>
                <div class="credential-value">${order.fulfillmentData.username}</div>
            </div>` : ''}
            ${order.fulfillmentData.password ? `
            <div class="credential-item">
                <div class="credential-label">🔑 VPN Password:</div>
                <div class="credential-value">${order.fulfillmentData.password}</div>
            </div>` : ''}
            ${order.fulfillmentData.serverAddress ? `
            <div class="credential-item">
                <div class="credential-label">🌐 Server Address:</div>
                <div class="credential-value">${order.fulfillmentData.serverAddress}</div>
            </div>` : ''}
            ${order.fulfillmentData.configFileUrl ? `
            <div class="credential-item">
                <div class="credential-label">📁 Configuration File:</div>
                <div style="margin: 10px 0;">
                    <a href="${order.fulfillmentData.configFileUrl}" style="display: inline-block; padding: 8px 16px; background-color: #059669; color: white; text-decoration: none; border-radius: 4px;">Download Config File</a>
                </div>
            </div>` : ''}
        </div>`;

        setupInstructions = `
        <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">📋 Setup Instructions</h3>
            <ol style="color: #065f46; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li><strong>Download VPN Client:</strong> Install your preferred VPN application</li>
                <li><strong>Import Configuration:</strong> Use the config file or enter server details manually</li>
                <li><strong>Enter Credentials:</strong> Use the username and password provided above</li>
                <li><strong>Connect & Secure:</strong> Connect to the VPN and verify your new IP address</li>
            </ol>
        </div>`;
      }
      break;

    case 'gift':
      categoryIcon = "🎁";
      successMessage = "Your gift order is being prepared!";
      
      productDetails = `
      <div class="credentials-box">
          <h3 style="color: #dc2626; margin-top: 0;">${categoryIcon} Gift Order Details</h3>
          <div class="credential-item">
              <div class="credential-label">🎁 Gift Item:</div>
              <div style="color: #1f2937; font-weight: bold;">${order.productName}</div>
          </div>
          <div class="credential-item">
              <div class="credential-label">📦 Status:</div>
              <div style="color: #059669; font-weight: bold;">Order Confirmed - Preparing for Delivery</div>
          </div>
      </div>`;

      setupInstructions = `
      <div style="background-color: #fef2f2; border: 1px solid #f87171; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">📋 What Happens Next?</h3>
          <ul style="color: #7f1d1d; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li><strong>Processing:</strong> We're preparing your gift for shipment</li>
              <li><strong>Tracking:</strong> You'll receive tracking information once shipped</li>
              <li><strong>Delivery:</strong> Estimated delivery time will be provided with tracking</li>
              <li><strong>Updates:</strong> We'll keep you informed throughout the process</li>
          </ul>
      </div>`;
      break;
  }

  const content = `
    <h2 style="color: #059669; margin-bottom: 20px;">${categoryIcon} ${successMessage}</h2>
    
    <div style="background-color: #dcfce7; border: 1px solid #16a34a; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="margin-top: 0; color: #15803d;">✅ ORDER COMPLETED SUCCESSFULLY!</h3>
        <p style="margin: 10px 0; color: #166534; font-size: 16px;">
            Your ${order.category?.toUpperCase()} service is now ready for use.
        </p>
    </div>

    <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">📋 Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Number:</td>
                <td style="padding: 8px 0; color: #1f2937;">#${order.orderNumber || order.id.slice(-8)}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Product:</td>
                <td style="padding: 8px 0; color: #1f2937;">${order.productName}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Category:</td>
                <td style="padding: 8px 0; color: #1f2937;">${order.category?.toUpperCase()}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Amount:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${amount}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderDate}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Completed:</td>
                <td style="padding: 8px 0; color: #1f2937;">${completedDate}</td>
            </tr>
        </table>
    </div>

    ${productDetails}

    ${setupInstructions}

    ${order.fulfillmentData?.instructions ? `
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #92400e; margin-top: 0;">📝 Additional Instructions</h3>
        <div style="color: #451a03; line-height: 1.6; white-space: pre-wrap;">${order.fulfillmentData.instructions}</div>
    </div>` : ''}

    <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">💡 Need Help?</h3>
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 15px;">
            Our support team is available 24/7 to help you with setup, troubleshooting, or any questions you might have.
        </p>
        <div style="margin-bottom: 10px;">
            <strong style="color: #374151;">📧 Email Support:</strong> 
            <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a>
        </div>
        <div>
            <strong style="color: #374151;">🌐 Help Center:</strong> 
            <a href="${WEBSITE_URL}/help" style="color: #2563eb;">Visit our Help Center</a>
        </div>
    </div>

    <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #059669; margin-top: 0;">🔄 Need More Services?</h3>
        <p style="color: #065f46; line-height: 1.6;">
            Explore our complete range of digital services including eSIMs, VPNs, Proxies, RDP servers, and gift delivery at 
            <a href="${WEBSITE_URL}" style="color: #059669; font-weight: bold;">${WEBSITE_URL}</a>
        </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="${WEBSITE_URL}/orders" class="button">View All Orders</a>
        <a href="${WEBSITE_URL}/marketplace" class="button" style="background-color: #059669; margin-left: 10px;">Browse More Services</a>
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
            Thank you for choosing SMS Globe! 🚀
        </p>
        <p style="color: #9ca3af; font-size: 12px;">
            This email was sent regarding your order #${order.orderNumber || order.id.slice(-8)}
        </p>
    </div>
  `;

  return {
    subject,
    body: getBaseEmailTemplate(content, "#059669")
  };
};

// Main function to generate email based on status
export const generateOrderStatusEmail = (order: ProductOrder, status: string): { subject: string; body: string } => {
  // Use Gmail-friendly version for better compatibility
  return generateGmailFriendlyEmail(order, status);
};

// Keep the original HTML templates for future use (newsletters, etc.)
export const generateOrderStatusEmailHTML = (order: ProductOrder, status: string): { subject: string; body: string } => {
  switch (status) {
    case 'pending':
      return generatePendingOrderEmail(order);
    case 'processing':
      return generateProcessingOrderEmail(order);
    case 'completed':
      return generateCompletedOrderEmail(order);
    default:
      return generatePendingOrderEmail(order);
  }
};
export const generateGmailFriendlyEmail = (order: ProductOrder, status: string): { subject: string; body: string } => {
  const orderDate = formatEmailDate(order.createdAt);
  const amount = formatEmailCurrency(order.amount || order.price || 0);
  const orderNumber = order.orderNumber || order.id.slice(-8);
  
  let subject = '';
  let statusEmoji = '';
  let mainMessage = '';
  let nextSteps = '';
  
  switch (status) {
    case 'pending':
      subject = `📋 Order Received - ${order.category?.toUpperCase()} Service | Order #${orderNumber}`;
      statusEmoji = '📋';
      mainMessage = `Thank you for your order! We've received your ${order.category?.toUpperCase()} service request and our team is reviewing it.`;
      nextSteps = `What's next?
• Our team will review and process your order within 2-4 hours
• You'll receive an email when processing begins
• Complete service details will be sent once ready
• Average fulfillment time: 4-24 hours`;
      break;
      
    case 'processing':
      subject = `⚡ Order Processing - ${order.category?.toUpperCase()} Service | Order #${orderNumber}`;
      statusEmoji = '⚡';
      mainMessage = `Great news! Your ${order.category?.toUpperCase()} service is now being processed by our technical team.`;
      nextSteps = `What's happening now?
• Our technical team is configuring your service
• Quality checks are being performed
• Access credentials are being prepared
• Estimated completion: 2-12 hours`;
      break;
      
    case 'completed':
      subject = `🎉 Order Ready - ${order.category?.toUpperCase()} Service | Order #${orderNumber}`;
      statusEmoji = '🎉';
      mainMessage = `Excellent! Your ${order.category?.toUpperCase()} service is ready and active!`;
      nextSteps = `Access your service:
• Log into your account at: https://smsglobe.com/orders
• Click on order #${orderNumber} to view complete details
• Follow the setup instructions provided
• Contact support if you need assistance`;
      break;
  }

  const body = `Dear Valued Customer,

${statusEmoji} ${mainMessage}

ORDER DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order Number: #${orderNumber}
Product: ${order.productName}
Category: ${order.category?.toUpperCase()}
Amount: ${amount}
Order Date: ${orderDate}
Status: ${status.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${nextSteps}

${status === 'completed' ? `
🔗 QUICK ACCESS LINKS:
• View Order Details: https://smsglobe.com/orders
• Browse More Services: https://smsglobe.com/marketplace
• Contact Support: support@smsglobe.com
` : ''}

NEED HELP?
Our support team is available 24/7 to assist you:
📧 Email: support@smsglobe.com
🌐 Website: https://smsglobe.com
💬 Live Chat: Available on our website

Thank you for choosing SMS Globe - Your Global Digital Services Partner!

Best regards,
The SMS Globe Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SMS Globe | https://smsglobe.com
This email was sent regarding order #${orderNumber}
© ${new Date().getFullYear()} SMS Globe. All rights reserved.`;

  return { subject, body };
};

// Helper function to open Gmail with pre-filled email
export const openGmailWithTemplate = (to: string, subject: string, body: string): void => {
  try {
    // Gmail compose URL - body should already be plain text from generateGmailFriendlyEmail
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Check URL length (Gmail has limits around 2000 characters)
    if (gmailUrl.length > 2000) {
      // If too long, use a shorter version
      const shortBody = body.substring(0, 1000) + '\n\n[Content truncated - please visit https://smsglobe.com/orders for full details]';
      const shortGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(shortBody)}`;
      
      const newWindow = window.open(shortGmailUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        fallbackToMailto(to, subject, body);
      }
      return;
    }
    
    // Try to open Gmail
    const newWindow = window.open(gmailUrl, '_blank');
    
    // If popup was blocked, use mailto as fallback
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      fallbackToMailto(to, subject, body);
    }
  } catch (error) {
    console.error('Error opening Gmail:', error);
    fallbackToMailto(to, subject, body);
  }
};

// Fallback function for mailto
const fallbackToMailto = (to: string, subject: string, body: string): void => {
  try {
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  } catch (error) {
    console.error('Error with mailto:', error);
    // Final fallback - copy to clipboard
    navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${body}`).then(() => {
      alert('Email content copied to clipboard. Please paste it into your email client.');
    }).catch(() => {
      alert('Unable to open email client. Please manually compose the email.');
    });
  }
};

// Alternative: Simple Gmail compose with fulfillment data
export const openSimpleGmailCompose = (to: string, orderNumber: string, status: string, productName: string, fulfillmentData?: any): void => {
  const subject = `${status === 'completed' ? '🎉 Order Ready' : status === 'processing' ? '⚡ Order Processing' : '📋 Order Received'} - Order #${orderNumber}`;
  
  let fulfillmentSection = '';
  
  // Add fulfillment data for completed orders
  if (status === 'completed' && fulfillmentData) {
    fulfillmentSection = `

🎯 YOUR SERVICE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    // eSIM fulfillment data
    if (fulfillmentData.qrCodeUrl || fulfillmentData.activationCode) {
      fulfillmentSection += `
📱 eSIM SETUP INFORMATION:
${fulfillmentData.qrCodeUrl ? `• QR Code: ${fulfillmentData.qrCodeUrl}` : ''}
${fulfillmentData.activationCode ? `• Activation Code: ${fulfillmentData.activationCode}` : ''}
${fulfillmentData.iccid ? `• ICCID: ${fulfillmentData.iccid}` : ''}
${fulfillmentData.pin ? `• PIN/PUK: ${fulfillmentData.pin}` : ''}

📋 SETUP STEPS:
1. Scan the QR code with your device camera
2. Follow the on-screen installation prompts
3. Enter the activation code when requested
4. Your eSIM will activate automatically`;
    }
    
    // RDP fulfillment data
    if (fulfillmentData.serverIp || fulfillmentData.username) {
      fulfillmentSection += `
🖥️ RDP SERVER ACCESS:
${fulfillmentData.serverIp ? `• Server IP: ${fulfillmentData.serverIp}` : ''}
${fulfillmentData.rdpPort ? `• Port: ${fulfillmentData.rdpPort}` : ''}
${fulfillmentData.username ? `• Username: ${fulfillmentData.username}` : ''}
${fulfillmentData.password ? `• Password: ${fulfillmentData.password}` : ''}
${fulfillmentData.operatingSystem ? `• OS: ${fulfillmentData.operatingSystem}` : ''}

📋 CONNECTION STEPS:
1. Open Remote Desktop Connection
2. Enter server IP: ${fulfillmentData.serverIp || '[See above]'}
3. Use port: ${fulfillmentData.rdpPort || '3389'}
4. Login with provided credentials`;
    }
    
    // Proxy fulfillment data
    if (fulfillmentData.ipAddress || fulfillmentData.port) {
      fulfillmentSection += `
🔒 PROXY CONFIGURATION:
${fulfillmentData.ipAddress ? `• Proxy IP: ${fulfillmentData.ipAddress}` : ''}
${fulfillmentData.port ? `• Port: ${fulfillmentData.port}` : ''}
${fulfillmentData.username ? `• Username: ${fulfillmentData.username}` : ''}
${fulfillmentData.password ? `• Password: ${fulfillmentData.password}` : ''}
${fulfillmentData.protocol ? `• Protocol: ${fulfillmentData.protocol}` : ''}

📋 SETUP STEPS:
1. Configure your browser/app proxy settings
2. Enter the IP and port provided above
3. Use authentication credentials if required
4. Test connection to verify it's working`;
    }
    
    // VPN fulfillment data
    if (fulfillmentData.serverAddress || (fulfillmentData.username && !fulfillmentData.ipAddress)) {
      fulfillmentSection += `
🛡️ VPN ACCOUNT DETAILS:
${fulfillmentData.username ? `• VPN Username: ${fulfillmentData.username}` : ''}
${fulfillmentData.password ? `• VPN Password: ${fulfillmentData.password}` : ''}
${fulfillmentData.serverAddress ? `• Server: ${fulfillmentData.serverAddress}` : ''}
${fulfillmentData.configFileUrl ? `• Config File: ${fulfillmentData.configFileUrl}` : ''}

📋 SETUP STEPS:
1. Download your VPN client app
2. Enter server and credentials above
3. Connect to secure your connection
4. Verify your new IP address`;
    }
    
    // Additional instructions
    if (fulfillmentData.instructions) {
      fulfillmentSection += `

📝 ADDITIONAL INSTRUCTIONS:
${fulfillmentData.instructions}`;
    }
    
    fulfillmentSection += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  const body = `Dear Customer,

Your order #${orderNumber} for "${productName}" is now ${status.toUpperCase()}.

${status === 'completed' ? 
'🎉 Great news! Your service is ready and active. Below are your complete setup details:' :
status === 'processing' ? 
'⚡ We are currently setting up your service. You will receive your access details within 2-12 hours.' :
'📋 Thank you for your order! We will send you updates as we process your request.'}${fulfillmentSection}

${status === 'completed' ? `
🔗 QUICK ACCESS:
• View Full Details: https://smsglobe.com/orders
• Browse More Services: https://smsglobe.com/marketplace
• Download Setup Guides: https://smsglobe.com/help` : `
• Track Order Status: https://smsglobe.com/orders`}

Need help? Our support team is available 24/7:
📧 Email: support@smsglobe.com
🌐 Website: https://smsglobe.com
💬 Live Chat: Available on our website

Best regards,
SMS Globe Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SMS Globe | Your Global Digital Services Partner
Order #${orderNumber} | https://smsglobe.com`;

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  try {
    const newWindow = window.open(gmailUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  } catch (error) {
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
};