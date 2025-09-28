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
