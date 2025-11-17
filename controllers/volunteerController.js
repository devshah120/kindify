const Volunteer = require('../models/Volunteer');
const mongoose = require('mongoose');

exports.joinVolunteer = async (req, res) => {
    try {
        const { fullName, email, trust, availability, options } = req.body;
        const userId = req.user?.id; // Get userId from authenticated user if available
        const volunteer = new Volunteer({ 
            fullName, 
            email, 
            trust, 
            availability, 
            options,
            userId: userId || null
        });
        await volunteer.save();
        res.status(201).json({ success: true, message: "Thank you for joining as a volunteer." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
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
