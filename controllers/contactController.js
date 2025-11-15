const Contact = require('../models/Contact');

exports.submitContact = async (req, res) => {
    try {
        const { name, email, trust, message } = req.body;
        const contact = new Contact({ name, email, trust, message });
        await contact.save();
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
