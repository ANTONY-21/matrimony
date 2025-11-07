/**
 * MatrimonyAI - Enhanced Cloud Functions
 * Includes Email Verification Support
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Email configuration (Choose your provider)
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'sendgrid'; // 'sendgrid', 'mailgun', or 'none'
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@matrimonyai.com';

// SMS configuration
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'console'; // 'twilio', 'msg91', 'fast2sms', or 'console'
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE;
const MSG91_KEY = process.env.MSG91_KEY;
const FAST2SMS_KEY = process.env.FAST2SMS_KEY;

// ==================== SEND OTP ====================
Parse.Cloud.define("sendOTP", async (request) => {
  const { phone, email, type = 'registration' } = request.params;
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    // Save OTP to database (expires in 10 minutes)
    const OTPObject = Parse.Object.extend("OTPVerification");
    const otpRecord = new OTPObject();
    
    if (phone) otpRecord.set("phone", phone);
    if (email) otpRecord.set("email", email);
    otpRecord.set("otp", otp);
    otpRecord.set("type", type);
    otpRecord.set("expiresAt", new Date(Date.now() + 10 * 60 * 1000));
    otpRecord.set("verified", false);
    otpRecord.set("attempts", 0);
    
    await otpRecord.save(null, { useMasterKey: true });
    
    // Send OTP via SMS or Email
    if (phone) {
      await sendSMS(phone, otp, type);
    } else if (email) {
      await sendEmail(email, otp, type);
    }
    
    return {
      success: true,
      message: phone ? "OTP sent to your phone" : "OTP sent to your email",
      // Only show OTP in development
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    };
  } catch (error) {
    console.error("Send OTP Error:", error);
    return {
      success: false,
      message: "Failed to send OTP. Please try again.",
      error: error.message
    };
  }
});

// ==================== VERIFY OTP ====================
Parse.Cloud.define("verifyOTP", async (request) => {
  const { phone, email, otp } = request.params;
  
  try {
    const query = new Parse.Query("OTPVerification");
    
    if (phone) {
      query.equalTo("phone", phone);
    } else if (email) {
      query.equalTo("email", email);
    } else {
      return { success: false, message: "Phone or email required" };
    }
    
    query.equalTo("otp", otp);
    query.equalTo("verified", false);
    query.greaterThan("expiresAt", new Date());
    query.descending("createdAt");
    
    const otpRecord = await query.first({ useMasterKey: true });
    
    if (otpRecord) {
      // Check attempts
      const attempts = otpRecord.get("attempts") || 0;
      if (attempts >= 5) {
        return { success: false, message: "Too many attempts. Please request a new OTP." };
      }
      
      // Mark as verified
      otpRecord.set("verified", true);
      otpRecord.set("verifiedAt", new Date());
      await otpRecord.save(null, { useMasterKey: true });
      
      return { success: true, message: "OTP verified successfully" };
    } else {
      // Increment attempts
      const allQuery = new Parse.Query("OTPVerification");
      if (phone) allQuery.equalTo("phone", phone);
      else if (email) allQuery.equalTo("email", email);
      allQuery.equalTo("verified", false);
      allQuery.greaterThan("expiresAt", new Date());
      allQuery.descending("createdAt");
      
      const record = await allQuery.first({ useMasterKey: true });
      if (record) {
        record.increment("attempts");
        await record.save(null, { useMasterKey: true });
      }
      
      return { success: false, message: "Invalid or expired OTP" };
    }
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return {
      success: false,
      message: "Verification failed. Please try again.",
      error: error.message
    };
  }
});

// ==================== SEND SMS ====================
async function sendSMS(phone, otp, type) {
  const message = type === 'registration' 
    ? `Your MatrimonyAI verification code is: ${otp}. Valid for 10 minutes.`
    : `Your MatrimonyAI password reset code is: ${otp}. Valid for 10 minutes.`;
  
  switch (SMS_PROVIDER) {
    case 'twilio':
      return await sendViaTwilio(phone, message);
    
    case 'msg91':
      return await sendViaMSG91(phone, otp);
    
    case 'fast2sms':
      return await sendViaFast2SMS(phone, message);
    
    default:
      // Console logging for development
      console.log(`📱 SMS to ${phone}: ${message}`);
      console.log(`OTP: ${otp}`);
      return { success: true };
  }
}

// Twilio SMS
async function sendViaTwilio(phone, message) {
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: phone,
        From: TWILIO_PHONE,
        Body: message
      })
    });
    
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('Twilio Error:', error);
    throw error;
  }
}

// MSG91 SMS (India)
async function sendViaMSG91(phone, otp) {
  try {
    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'authkey': MSG91_KEY,
        'content-type': 'application/JSON'
      },
      body: JSON.stringify({
        mobile: phone.replace('+', ''),
        otp: otp,
        template_id: process.env.MSG91_TEMPLATE_ID
      })
    });
    
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('MSG91 Error:', error);
    throw error;
  }
}

// Fast2SMS (India)
async function sendViaFast2SMS(phone, message) {
  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: 'FSTSMS',
        message: message,
        language: 'english',
        flash: 0,
        numbers: phone.replace('+', '').replace(/^91/, '')
      })
    });
    
    const data = await response.json();
    return { success: data.return, data };
  } catch (error) {
    console.error('Fast2SMS Error:', error);
    throw error;
  }
}

// ==================== SEND EMAIL ====================
async function sendEmail(email, otp, type) {
  const subject = type === 'registration' 
    ? 'Verify Your MatrimonyAI Account'
    : 'Reset Your Password';
    
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px solid #8b5cf6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
        .otp { font-size: 32px; font-weight: bold; color: #8b5cf6; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❤️ MatrimonyAI</h1>
          <p>${subject}</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your verification code is:</p>
          <div class="otp-box">
            <div class="otp">${otp}</div>
          </div>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} MatrimonyAI. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  switch (EMAIL_PROVIDER) {
    case 'sendgrid':
      return await sendViaSendGrid(email, subject, html);
    
    case 'mailgun':
      return await sendViaMailgun(email, subject, html);
    
    default:
      // Console logging for development
      console.log(`📧 Email to ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`OTP: ${otp}`);
      return { success: true };
  }
}

// SendGrid Email
async function sendViaSendGrid(to, subject, html) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL },
        subject: subject,
        content: [{ type: 'text/html', value: html }]
      })
    });
    
    return { success: response.ok };
  } catch (error) {
    console.error('SendGrid Error:', error);
    throw error;
  }
}

// Mailgun Email
async function sendViaMailgun(to, subject, html) {
  try {
    const formData = new URLSearchParams();
    formData.append('from', FROM_EMAIL);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', html);
    
    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });
    
    return { success: response.ok };
  } catch (error) {
    console.error('Mailgun Error:', error);
    throw error;
  }
}

// ==================== COMPLETE REGISTRATION ====================
Parse.Cloud.define("completeRegistration", async (request) => {
  const { phone, email, fullName, password } = request.params;
  
  try {
    // Verify OTP was completed
    const otpQuery = new Parse.Query("OTPVerification");
    if (phone) otpQuery.equalTo("phone", phone);
    else otpQuery.equalTo("email", email);
    otpQuery.equalTo("verified", true);
    otpQuery.descending("verifiedAt");
    
    const otpRecord = await otpQuery.first({ useMasterKey: true });
    
    if (!otpRecord) {
      return { success: false, message: "Please verify your OTP first" };
    }
    
    // Check if already registered
    const userQuery = new Parse.Query(Parse.User);
    if (email) userQuery.equalTo("email", email.toLowerCase());
    else userQuery.equalTo("username", phone);
    const existingUser = await userQuery.first({ useMasterKey: true });
    
    if (existingUser) {
      return { success: false, message: "User already registered" };
    }
    
    // Create user
    const user = new Parse.User();
    user.set("username", phone || email);
    user.set("email", email?.toLowerCase());
    user.set("password", password);
    
    await user.signUp(null, { useMasterKey: true });
    
    // Create profile
    const UserProfile = Parse.Object.extend("UserProfile");
    const profile = new UserProfile();
    profile.set("userId", user);
    profile.set("fullName", fullName);
    if (phone) profile.set("phone", phone);
    if (email) profile.set("email", email.toLowerCase());
    profile.set("isVerified", true);
    profile.set("registrationDate", new Date());
    
    await profile.save(null, { useMasterKey: true });
    
    return {
      success: true,
      message: "Registration completed successfully",
      userId: user.id
    };
    
  } catch (error) {
    console.error("Complete Registration Error:", error);
    return {
      success: false,
      message: "Registration failed. Please try again.",
      error: error.message
    };
  }
});

// ... (Include all other functions from original main.js: aiChat, findMatches, etc.)

console.log("✅ MatrimonyAI Enhanced Cloud Functions loaded successfully!");
