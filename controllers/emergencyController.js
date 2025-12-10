const Emergency = require('../models/Emergency');

// POST /api/emergencies - Create a new emergency
exports.createEmergency = async (req, res) => {
  try {
    const {
      patientName,
      patientAge,
      patientId,
      bloodGroup,
      requiredQty,
      relativeNumber,
      relativeAlternateNumber,
      hospitalName,
      iAccept
    } = req.body;

    // Validate required fields
    if (!patientName || !patientAge || !bloodGroup || 
        !requiredQty || !relativeNumber || !hospitalName || iAccept === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields. Required: patientName, patientAge, bloodGroup, requiredQty, relativeNumber, hospitalName, iAccept' 
      });
    }

    // Validate iAccept is boolean
    if (typeof iAccept !== 'boolean') {
      return res.status(400).json({ message: 'iAccept must be a boolean value' });
    }

    const emergency = await Emergency.create({
      patientName,
      patientAge,
      patientId,
      bloodGroup,
      requiredQty,
      relativeNumber,
      relativeAlternateNumber, // Optional
      hospitalName,
      iAccept,
      createdBy: req.user.id // Track creator
    });

    // Populate creator info
    await emergency.populate('createdBy', 'email role trustName adminName name');

    res.status(201).json({
      message: 'Emergency created successfully',
      emergency
    });
  } catch (err) {
    console.error('Create Emergency Error:', err);
    res.status(500).json({ error: err.message || 'Failed to create emergency' });
  }
};

// GET /api/emergencies - Get all emergencies
exports.getEmergencies = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const emergencies = await Emergency.find()
      .populate('createdBy', 'email role trustName adminName name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Emergency.countDocuments();

    res.json({
      emergencies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    console.error('Get Emergencies Error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch emergencies' });
  }
};

