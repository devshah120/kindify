const Contact = require('../models/Contact');
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendNotificationToUser } = require('../services/notificationService');

exports.submitContact = async (req, res) => {
    try {
        const { name, email, trust, message } = req.body;
        const contact = new Contact({ name, email, trust, message });
        await contact.save();
        
        // Send notification to Trust when user submits contact form
        if (trust) {
            try {
                // Validate trust ID
                if (mongoose.Types.ObjectId.isValid(trust)) {
                    await sendNotificationToUser(
                        trust,
                        'New Contact Message 📧',
                        `${name} sent you a message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
                        {
                            type: 'new_contact_message',
                            contactId: contact._id.toString(),
                            userName: name,
                            userEmail: email
                        }
                    );
                    console.log(`✅ Notification sent to Trust about contact message: ${contact._id}`);
                }
            } catch (notificationError) {
                console.error('❌ Error sending contact notification:', notificationError);
            }
        }
        
        res.status(201).json({ success: true, message: "Your message has been sent successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find({})
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            contacts
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getContactsByTrust = async (req, res) => {
    try {
        const { trustId } = req.params;

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

        const contacts = await Contact.find({ trust: trustId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: contacts.length,
            contacts
        });
    } catch (error) {
        console.error('Error fetching contacts by trust:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
