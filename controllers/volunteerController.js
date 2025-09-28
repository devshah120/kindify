const Volunteer = require('../models/Volunteer');

exports.joinVolunteer = async (req, res) => {
    try {
        const { fullName, email, trust, availability, options } = req.body;
        const volunteer = new Volunteer({ fullName, email, trust, availability, options });
        await volunteer.save();
        res.status(201).json({ success: true, message: "Thank you for joining as a volunteer." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
};
