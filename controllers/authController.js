const User = require('../models/User');
const Otp = require('../models/Otp');
const generateOtp = require('../utils/generateOtp');
const { sendMail } = require('../config/mailer');
const jwt = require('jsonwebtoken');
const upload = require('../config/multer');

const OTP_EXPIRE_SECONDS = parseInt(process.env.OTP_EXPIRE_SECONDS || '300', 10);

// helper: send OTP email
async function sendOtpEmail(toEmail, otp, userName) {
  const subject = 'Your OTP code';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Kindify OTP Verification</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 0; margin: 0;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 30px 0;">
      <tr>
        <td align="center">
          <table width="600" style="background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header with Logo -->
            <tr>
              <td align="center" style="padding: 20px; background-color: #ff6f61;">
                <img src="https://res.cloudinary.com/dcxwy01a6/image/upload/v1765426499/kindify-logo_tzapkk.png" alt="Kindify Logo" width="120" style="display: block;">
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="padding: 20px; text-align: center;">
                <h2 style="color: #333;">Verify Your Email</h2>
                <p style="color: #666; font-size: 15px;">Thank you for joining <strong>Kindify</strong> – your gateway to making a difference.</p>
              </td>
            </tr>

            <!-- OTP Box -->
            <tr>
              <td align="center" style="padding: 20px;">
                <p style="color: #555; font-size: 16px;">Your One-Time Password (OTP) is:</p>
                <div style="font-size: 24px; font-weight: bold; color: #ff6f61; background: #ffeceb; padding: 12px 24px; border-radius: 8px; display: inline-block;">
                  ${otp}
                </div>
                <p style="color: #999; font-size: 14px; margin-top: 10px;">Valid for ${Math.floor(OTP_EXPIRE_SECONDS/60)} minutes. Do not share with anyone.</p>
              </td>
            </tr>

            <!-- Image & Brand Message -->
            <tr>
              <td align="center" style="padding: 20px;">
                <p style="color: #666; font-size: 14px; max-width: 400px; margin: auto;">
                  Every act of kindness counts. With Kindify, you can connect with causes that matter and contribute to a better tomorrow.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px; background: #f1f1f1; text-align: center; font-size: 12px; color: #888;">
                © 2025 Kindify. All rights reserved.<br>
                You are receiving this email because you signed up for Kindify.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  await sendMail({ to: toEmail, subject, html });
}

// helper: send welcome email after successful login
async function sendWelcomeEmail(toEmail, userName, userRole) {
  const subject = 'Welcome to Kindify!';
  
  // Determine display name based on role
  let displayName = userName || 'there';
  if (userRole === 'Trust' && userName) {
    displayName = userName;
  } else if (userRole === 'User' && userName) {
    displayName = userName;
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Welcome to Kindify</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 0; margin: 0;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 30px 0;">
      <tr>
        <td align="center">
          <table width="600" style="background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header with Logo -->
            <tr>
              <td align="center" style="padding: 20px; background-color: #ff6f61;">
                <img src="https://res.cloudinary.com/dcxwy01a6/image/upload/v1765426499/kindify-logo_tzapkk.png" alt="Kindify Logo" width="120" style="display: block;">
              </td>
            </tr>

            <!-- Welcome Title -->
            <tr>
              <td style="padding: 30px 20px; text-align: center;">
                <h1 style="color: #333; margin: 0 0 10px 0;">Welcome to Kindify!</h1>
                <p style="color: #666; font-size: 16px; margin: 0;">Hello <strong>${displayName}</strong>, we're thrilled to have you with us!</p>
              </td>
            </tr>

            <!-- Welcome Message -->
            <tr>
              <td style="padding: 20px 40px;">
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  Thank you for joining <strong>Kindify</strong> – your gateway to making a meaningful difference in the world.
                </p>
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  You've successfully logged in and are now part of a community dedicated to spreading kindness and creating positive change.
                </p>
              </td>
            </tr>

            <!-- Features Section -->
            <tr>
              <td style="padding: 20px 40px;">
                <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">What you can do:</h3>
                <ul style="color: #555; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Create and manage campaigns for causes you care about</li>
                  <li>Report emergencies and help those in need</li>
                  <li>Share missing person reports to reunite families</li>
                  <li>Connect with trusts and organizations</li>
                  <li>Make a real impact in your community</li>
                </ul>
              </td>
            </tr>

            <!-- Call to Action -->
            <tr>
              <td align="center" style="padding: 30px 20px;">
                <p style="color: #666; font-size: 15px; margin: 0 0 20px 0;">
                  Ready to make a difference? Start exploring Kindify now!
                </p>
                <a href="${process.env.FRONTEND_URL || 'https://bondbyte.in'}" style="display: inline-block; background-color: #ff6f61; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Get Started</a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px; background: #f1f1f1; text-align: center; font-size: 12px; color: #888;">
                © 2025 Kindify. All rights reserved.<br>
                You are receiving this email because you logged into your Kindify account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // Send welcome email
  await sendMail({ 
    to: toEmail, 
    subject, 
    html
  });
}

// Register: create OTP (if email/mobile not already registered)

// exports.register = async (req, res) => {
//   const { email, mobile, role } = req.body;
//   if (!email || !role) return res.status(400).json({ message: 'email and role are required' });

  // check existing user
//   const existing = await User.findOne({ $or: [{ email }, { mobile }] });
//   if (existing) return res.status(409).json({ message: 'Email or mobile already registered' });

//   const otpCode = generateOtp();
//   await Otp.create({ email, otp: otpCode, role });

//   try {
//     await sendOtpEmail(email, otpCode);
//     return res.json({ message: 'OTP sent to email for verification' });
//   } catch (err) {
//     console.error('sendOtp error:', err);
//     return res.status(500).json({ message: 'Failed to send OTP' });
//   }
// };

// Verify register: create user if OTP valid
// exports.verifyRegister = async (req, res) => {
//   const { email, otp } = req.body;
//   if (!email || !otp) return res.status(400).json({ message: 'email and otp required' });

//   const record = await Otp.findOne({ email, otp });
//   if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });

  // Double-check a user wasn't created in the meantime
//   const existing = await User.findOne({ $or: [{ email: record.email }, { mobile: record.mobile }] });
//   if (existing) {
//     await Otp.deleteMany({ email: record.email }); // cleanup
//     return res.status(409).json({ message: 'User already exists' });
//   }

//   await User.create({ email: record.email, mobile: record.mobile, role: record.role });
//   await Otp.deleteMany({ email: record.email });

//   return res.json({ message: 'Account created successfully' });
// };




// POST /trust/register
exports.registerTrust = async (req, res) => {
  const { trustName, adminName, mobile, email, darpanId } = req.body;

  if (!trustName || !adminName || !mobile || !email || !darpanId) {
    return res.status(400).json({ message: 'All trust details are required' });
  }

  // File check
  if (!req.file) {
    return res.status(400).json({ message: 'Darpan Certificate file is required' });
  }

  const existing = await User.findOne({ $or: [{ email }, { mobile }] });
  if (existing) {
    return res.status(409).json({ message: 'Email or mobile already registered' });
  }

  await User.create({
    trustName,
    adminName,
    mobile,
    email,
    darpanId,
    darpanCertificate: req.file.path, // store Cloudinary URL
    role: 'Trust'
  });

  return res.json({
    message: 'We are verifying your data and will get back to you within 24 hours.'
  });
};

// Login: accept email or mobile, find user, issue OTP to user's email
// Login or register: send OTP only
exports.login = async (req, res) => {
  const { email, role } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }
  if (!role) {
    return res.status(400).json({ message: 'role is required' });
  }

let user = await User.findOne({ email });

if (!user) {
  if (role === 'User') {
    user = await User.create({ email, role: 'User' });
  } else if (role === 'Trust') {
    return res.status(400).json({ message: 'Please register first as Trust' });
  } else {
    return res.status(400).json({ message: 'Invalid role' });
  }
} else {
  // User exists — verify role match
  if (user.role !== role) {
    return res.status(400).json({  message: `This email is already registered as ${user.role}` });
  }
}

  // For Trust role, return static OTP message instead of sending email
  if (user.role === 'Trust') {
    const STATIC_OTP = process.env.STATIC_OTP_TRUST || '111111';
    return res.json({ 
      message: `Use static OTP: ${STATIC_OTP}`,
      staticOtp: STATIC_OTP
    });
  }

  // For User and other roles, generate and send OTP via email
  // Remove old OTPs for this email
  await Otp.deleteMany({ email: user.email });

  // Generate new OTP
  const otpCode = generateOtp();
  await Otp.create({ email: user.email, otp: otpCode, role: user.role });

  try {
    await sendOtpEmail(user.email, otpCode);
    return res.json({ message: 'OTP sent to registered email' });
  } catch (err) {
    console.error('sendOtp error:', err);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
};


// Verify login: create JWT after OTP check
exports.verifyLogin = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'email and otp required' });
  }

  // Find user to check role
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if user is Trust role - use static OTP
  if (user.role === 'Trust') {
    const STATIC_OTP = process.env.STATIC_OTP_TRUST || '111111';
    if (otp !== STATIC_OTP) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  } else {
    // For User and other roles, verify OTP from database
    const record = await Otp.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    // Cleanup OTPs for this email
    await Otp.deleteMany({ email });
  }

  // Create JWT
  const payload = { id: user._id, email: user.email, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

  // Send welcome email after successful login (don't block response if email fails)
  try {
    const userName = user.role === 'Trust' ? user.trustName || user.adminName : user.name;
    await sendWelcomeEmail(user.email, userName, user.role);
  } catch (err) {
    console.error('Welcome email error:', err);
    // Don't fail the login if email fails
  }

  return res.json({
    message: 'Login successful',
    token,
    user: { id: user._id, email: user.email, role: user.role }
  });
};

exports.getAllTrusts = async (req, res) => {
  try {
    const trusts = await User.find({ role: 'Trust' }).select('trustName _id'); // include _id
    return res.json({ trusts });
  } catch (err) {
    console.error('getAllTrusts error:', err);
    return res.status(500).json({ message: 'Failed to fetch trusts' });
  }
};

// Search trusts only
exports.searchTrusts = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Search query is required' 
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Search filter - only Trust role, search in multiple fields
    const searchFilter = {
      role: 'Trust',
      $or: [
        { trustName: { $regex: query, $options: 'i' } },
        { adminName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } },
        { state: { $regex: query, $options: 'i' } },
        { darpanId: { $regex: query, $options: 'i' } }
      ]
    };

    const trusts = await User.find(searchFilter)
      .select('trustName adminName email role profilePhoto designation city state address pincode darpanId createdAt supportedBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalTrusts = await User.countDocuments(searchFilter);

    // Get support count for each trust
    const trustsWithCounts = trusts.map(trust => ({
      _id: trust._id,
      trustName: trust.trustName,
      adminName: trust.adminName,
      email: trust.email,
      role: trust.role,
      profilePhoto: trust.profilePhoto || null,
      designation: trust.designation || null,
      city: trust.city || null,
      state: trust.state || null,
      address: trust.address || null,
      pincode: trust.pincode || null,
      darpanId: trust.darpanId || null,
      totalSupporters: trust.supportedBy ? trust.supportedBy.length : 0,
      createdAt: trust.createdAt
    }));

    res.status(200).json({
      success: true,
      query: query,
      currentPage: pageNum,
      totalPages: Math.ceil(totalTrusts / limitNum),
      totalTrusts,
      trusts: trustsWithCounts
    });

  } catch (err) {
    console.error('Search Trusts Error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search trusts',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};