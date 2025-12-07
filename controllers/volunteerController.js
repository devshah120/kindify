const Volunteer = require('../models/Volunteer');
const mongoose = require('mongoose');

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
