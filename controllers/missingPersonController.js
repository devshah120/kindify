const MissingPerson = require('../models/MissingPerson');

// POST /api/missing-persons - Create a new missing person report
exports.createMissingPerson = async (req, res) => {
  try {
    const {
      fullName,
      dob,
      age,
      sex,
      race,
      height,
      weight,
      hairColor,
      eyeColor,
      clothLastWorn,
      identifyingMarks,
      lastSeenDate,
      additionalRemarks
    } = req.body;

    // Validate required fields
    if (!fullName || !dob || !age || !sex || !weight || 
        !hairColor || !eyeColor || !clothLastWorn || 
        !identifyingMarks || !lastSeenDate) {
      return res.status(400).json({ 
        message: 'Missing required fields. Required: fullName, dob, age, sex, weight, hairColor, eyeColor, clothLastWorn, identifyingMarks, lastSeenDate' 
      });
    }

    // Check if userImage is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'User image is required' });
    }

    // Validate sex enum
    if (!['Male', 'Female', 'Other'].includes(sex)) {
      return res.status(400).json({ message: 'sex must be one of: Male, Female, Other' });
    }

    // Validate additionalRemarks length if provided
    if (additionalRemarks && additionalRemarks.length > 200) {
      return res.status(400).json({ message: 'additionalRemarks must be 200 characters or less' });
    }

    const missingPerson = await MissingPerson.create({
      userImage: req.file.path, // Cloudinary URL
      fullName,
      dob,
      age,
      sex,
      race, // Optional
      height, // Optional
      weight,
      hairColor,
      eyeColor,
      clothLastWorn,
      identifyingMarks,
      lastSeenDate,
      additionalRemarks // Optional
    });

    res.status(201).json({
      message: 'Missing person report created successfully',
      missingPerson
    });
  } catch (err) {
    console.error('Create Missing Person Error:', err);
    res.status(500).json({ error: err.message || 'Failed to create missing person report' });
  }
};

// GET /api/missing-persons - Get all missing person reports
exports.getMissingPersons = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const missingPersons = await MissingPerson.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MissingPerson.countDocuments();

    res.json({
      missingPersons,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    console.error('Get Missing Persons Error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch missing person reports' });
  }
};

