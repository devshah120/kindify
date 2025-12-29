const Volunteer = require('../models/Volunteer');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendMail } = require('../config/mailer');
const { sendNotificationToUser } = require('../services/notificationService');

// Helper: Send email when volunteer submits request
async function sendVolunteerSubmissionEmail(volunteerEmail, volunteerName, trustName) {
  const subject = 'Volunteer Request Submitted - Kindify';
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Volunteer Request Submitted</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 0; margin: 0;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 30px 0;">
      <tr>
        <td align="center">
          <table width="600" style="background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <tr>
              <td align="center" style="padding: 20px;">
                <img src="https://res.cloudinary.com/dcxwy01a6/image/upload/v1765426499/kindify-logo_tzapkk.png" alt="Kindify Logo" width="120" style="display: block;">
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 20px; text-align: center;">
                <h1 style="color: #333; margin: 0 0 10px 0;">Thank You for Your Interest!</h1>
                <p style="color: #666; font-size: 16px; margin: 0;">Hello <strong>${volunteerName}</strong>,</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 40px;">
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  We have received your volunteer request for <strong>${trustName}</strong>. Your application is currently under review.
                </p>
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  The trust will review your application and get back to you soon. We appreciate your willingness to make a difference in your community.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; background: #f1f1f1; text-align: center; font-size: 12px; color: #888;">
                © 2025 Kindify. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
  await sendMail({ to: volunteerEmail, subject, html });
}

// Helper: Send email when volunteer is approved
async function sendVolunteerApprovalEmail(volunteerEmail, volunteerName, trustName, remarks) {
  const subject = 'Volunteer Request Approved - Kindify';
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Volunteer Request Approved</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 0; margin: 0;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 30px 0;">
      <tr>
        <td align="center">
          <table width="600" style="background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <tr>
              <td align="center" style="padding: 20px;">
                <img src="https://res.cloudinary.com/dcxwy01a6/image/upload/v1765426499/kindify-logo_tzapkk.png" alt="Kindify Logo" width="120" style="display: block;">
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 20px; text-align: center;">
                <h1 style="color: #333; margin: 0 0 10px 0;">Congratulations!</h1>
                <p style="color: #666; font-size: 16px; margin: 0;">Hello <strong>${volunteerName}</strong>,</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 40px;">
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  Great news! Your volunteer request for <strong>${trustName}</strong> has been <strong style="color: #28a745;">approved</strong>!
                </p>
                ${remarks ? `<p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>Message from ${trustName}:</strong><br>${remarks}</p>` : ''}
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  You can now start volunteering with ${trustName}. Thank you for your commitment to making a positive impact!
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; background: #f1f1f1; text-align: center; font-size: 12px; color: #888;">
                © 2025 Kindify. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
  await sendMail({ to: volunteerEmail, subject, html });
}

// Helper: Send email when volunteer is rejected
async function sendVolunteerRejectionEmail(volunteerEmail, volunteerName, trustName, remarks) {
  const subject = 'Volunteer Request Update - Kindify';
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Volunteer Request Update</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 0; margin: 0;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 30px 0;">
      <tr>
        <td align="center">
          <table width="600" style="background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <tr>
              <td align="center" style="padding: 20px; background-color: #dc3545;">
                <img src="https://res.cloudinary.com/dcxwy01a6/image/upload/v1765426499/kindify-logo_tzapkk.png" alt="Kindify Logo" width="120" style="display: block;">
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 20px; text-align: center;">
                <h1 style="color: #333; margin: 0 0 10px 0;">Volunteer Request Update</h1>
                <p style="color: #666; font-size: 16px; margin: 0;">Hello <strong>${volunteerName}</strong>,</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 40px;">
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  We regret to inform you that your volunteer request for <strong>${trustName}</strong> has not been approved at this time.
                </p>
                ${remarks ? `<p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>Message from ${trustName}:</strong><br>${remarks}</p>` : ''}
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  We appreciate your interest in volunteering and encourage you to explore other opportunities on Kindify.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; background: #f1f1f1; text-align: center; font-size: 12px; color: #888;">
                © 2025 Kindify. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
  await sendMail({ to: volunteerEmail, subject, html });
}

exports.joinVolunteer = async (req, res) => {
    try {
        const { fullName, email, trust, availability, options } = req.body;
        const userId = req.user?.id; // Get userId from authenticated user if available

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: "User authentication required" 
            });
        }

        // Check if user has already made 5 requests
        const existingRequestsCount = await Volunteer.countDocuments({ userId });
        if (existingRequestsCount >= 5) {
            return res.status(400).json({ 
                success: false, 
                message: "You have reached the maximum limit of 5 volunteer requests. You cannot submit more requests." 
            });
        }

        // Normalize input data for comparison
        const normalizedFullName = fullName?.trim();
        const normalizedEmail = email?.trim().toLowerCase();
        
        // Convert availability to normalized object for comparison
        let normalizedAvailability = {};
        if (availability) {
            if (availability instanceof Map) {
                normalizedAvailability = Object.fromEntries(availability);
            } else if (typeof availability === 'object') {
                normalizedAvailability = availability;
            }
            // Sort arrays within availability for consistent comparison
            for (const key in normalizedAvailability) {
                if (Array.isArray(normalizedAvailability[key])) {
                    normalizedAvailability[key] = [...normalizedAvailability[key]].sort();
                }
            }
        }

        // Normalize options array for comparison (sort and filter empty values)
        const normalizedOptions = Array.isArray(options) 
            ? [...options].map(opt => opt?.trim()).filter(opt => opt && opt !== '').sort()
            : [];

        // Check for existing volunteer requests by the same user
        const existingVolunteers = await Volunteer.find({ 
            userId,
            fullName: normalizedFullName,
            email: normalizedEmail,
            trust
        });

        // Check if any existing volunteer has the same availability and options
        for (const existing of existingVolunteers) {
            // Normalize existing availability
            let existingAvailability = {};
            if (existing.availability) {
                if (existing.availability instanceof Map) {
                    existingAvailability = Object.fromEntries(existing.availability);
                } else if (typeof existing.availability === 'object') {
                    existingAvailability = existing.availability;
                }
                // Sort arrays within availability for consistent comparison
                for (const key in existingAvailability) {
                    if (Array.isArray(existingAvailability[key])) {
                        existingAvailability[key] = [...existingAvailability[key]].sort();
                    }
                }
            }

            // Compare availability objects
            const availabilityMatch = JSON.stringify(normalizedAvailability) === JSON.stringify(existingAvailability);

            // Normalize and compare options arrays
            const existingOptions = Array.isArray(existing.options)
                ? [...existing.options].map(opt => opt?.trim()).filter(opt => opt && opt !== '').sort()
                : [];
            const optionsMatch = JSON.stringify(normalizedOptions) === JSON.stringify(existingOptions);

            // If all details match, it's a duplicate
            if (availabilityMatch && optionsMatch) {
                return res.status(400).json({ 
                    success: false, 
                    message: "You have already submitted a volunteer request with the same details. Please use different information." 
                });
            }
        }

        const volunteer = new Volunteer({ 
            fullName, 
            email, 
            trust, 
            availability, 
            options,
            userId
        });
        await volunteer.save();

        // Get trust information for email
        const trustInfo = await User.findById(trust).select('trustName email');
        const trustName = trustInfo?.trustName || 'the Trust';

        // Send email to volunteer (don't block response if email fails)
        try {
            await sendVolunteerSubmissionEmail(email, fullName, trustName);
        } catch (err) {
            console.error('Error sending volunteer submission email:', err);
            // Don't fail the request if email fails
        }

        // Send push notification to volunteer (don't block response if notification fails)
        try {
            if (userId) {
                await sendNotificationToUser(
                    userId,
                    'Volunteer Request Submitted',
                    `Your volunteer request to ${trustName} has been submitted and is under review.`,
                    {
                        type: 'volunteer_submission',
                        volunteerId: volunteer._id.toString(),
                        trustId: trust.toString()
                    }
                );
            }
        } catch (err) {
            console.error('Error sending volunteer submission notification:', err);
            // Don't fail the request if notification fails
        }

        // Send push notification to trust admin (don't block response if notification fails)
        try {
            await sendNotificationToUser(
                trust,
                'New Volunteer Request',
                `${fullName} has submitted a volunteer request.`,
                {
                    type: 'new_volunteer_request',
                    volunteerId: volunteer._id.toString(),
                    userId: userId ? userId.toString() : null
                }
            );
        } catch (err) {
            console.error('Error sending notification to trust:', err);
            // Don't fail the request if notification fails
        }
        
        const remainingRequests = 5 - (existingRequestsCount + 1);
        res.status(201).json({ 
            success: true, 
            message: "Thank you for joining as a volunteer.",
            remainingRequests: remainingRequests
        });
    } catch (error) {
        console.error('Error joining volunteer:', error);
        res.status(500).json({ 
            success: false, 
            message: "Server error.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find({})
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            volunteers
        });
    } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get volunteers by trust (for Trust admin to manage)
exports.getVolunteersByTrust = async (req, res) => {
    try {
        const { trustId } = req.params;
        const { status } = req.query; // Optional filter by status

        if (!trustId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Trust ID is required' 
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(trustId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid Trust ID format' 
            });
        }

        let filter = { trust: trustId };
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            filter.status = status;
        }

        const volunteers = await Volunteer.find(filter)
            .populate('userId', 'name email profilePhoto trustName adminName role phone mobile')
            .sort({ createdAt: -1 });

        const volunteersWithUserInfo = volunteers.map(volunteer => {
            const user = volunteer.userId;
            const trust = volunteer.trust;
            return {
                _id: volunteer._id,
                fullName: volunteer.fullName,
                email: volunteer.email,
                trust: volunteer.trust,
                availability: volunteer.availability,
                options: volunteer.options,
                status: volunteer.status,
                remarks: volunteer.remarks,
                user: user ? {
                    _id: user._id,
                    name: user.name || user.trustName || user.adminName,
                    email: user.email,
                    profilePhoto: user.profilePhoto || null,
                    role: user.role,
                    phone: user.phone || user.mobile || null
                } : null,
                createdAt: volunteer.createdAt,
                updatedAt: volunteer.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            count: volunteersWithUserInfo.length,
            volunteers: volunteersWithUserInfo
        });
    } catch (error) {
        console.error('Error fetching volunteers by trust:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Approve or reject volunteer (Trust admin action)
exports.updateVolunteerStatus = async (req, res) => {
    try {
        const { volunteerId } = req.params;
        const { status, remarks } = req.body;

        if (!volunteerId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Volunteer ID is required' 
            });
        }

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Status must be either "approved" or "rejected"' 
            });
        }

        const updateData = { status };
        if (remarks) {
            updateData.remarks = remarks;
        }

        const volunteer = await Volunteer.findByIdAndUpdate(
            volunteerId,
            updateData,
            { new: true, runValidators: true }
        ).populate('trust', 'trustName adminName name email role')
         .populate('userId', 'name email profilePhoto trustName adminName role phone mobile');

        if (!volunteer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Volunteer request not found' 
            });
        }

        const user = volunteer.userId;
        const trust = volunteer.trust;
        const volunteerResponse = {
            _id: volunteer._id,
            fullName: volunteer.fullName,
            email: volunteer.email,
            trust: volunteer.trust,
            availability: volunteer.availability,
            options: volunteer.options,
            status: volunteer.status,
            remarks: volunteer.remarks,
            user: user ? {
                _id: user._id,
                name: user.name || user.trustName || user.adminName,
                email: user.email,
                profilePhoto: user.profilePhoto || null,
                role: user.role,
                phone: user.phone || user.mobile || null
            } : null,
            createdAt: volunteer.createdAt,
            updatedAt: volunteer.updatedAt
        };

        // Send email to volunteer based on status (don't block response if email fails)
        try {
            const trustName = trust?.trustName || 'the Trust';
            if (status === 'approved') {
                await sendVolunteerApprovalEmail(
                    volunteer.email, 
                    volunteer.fullName, 
                    trustName, 
                    remarks
                );
            } else if (status === 'rejected') {
                await sendVolunteerRejectionEmail(
                    volunteer.email, 
                    volunteer.fullName, 
                    trustName, 
                    remarks
                );
            }
        } catch (err) {
            console.error('Error sending volunteer status email:', err);
            // Don't fail the request if email fails
        }

        // Send push notification to volunteer based on status (don't block response if notification fails)
        try {
            if (user && user._id) {
                const trustName = trust?.trustName || 'the Trust';
                if (status === 'approved') {
                    await sendNotificationToUser(
                        user._id,
                        'Volunteer Request Approved',
                        `Congratulations! Your volunteer request to ${trustName} has been approved.`,
                        {
                            type: 'volunteer_approved',
                            volunteerId: volunteer._id.toString(),
                            trustId: trust?._id?.toString() || null
                        }
                    );
                } else if (status === 'rejected') {
                    await sendNotificationToUser(
                        user._id,
                        'Volunteer Request Update',
                        `Your volunteer request to ${trustName} has been ${status}.`,
                        {
                            type: 'volunteer_rejected',
                            volunteerId: volunteer._id.toString(),
                            trustId: trust?._id?.toString() || null
                        }
                    );
                }
            }
        } catch (err) {
            console.error('Error sending volunteer status notification:', err);
            // Don't fail the request if notification fails
        }

        res.status(200).json({ 
            success: true, 
            message: `Volunteer request ${status} successfully`,
            volunteer: volunteerResponse
        });
    } catch (error) {
        console.error('Error updating volunteer status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
