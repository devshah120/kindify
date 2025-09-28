const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  
  // Expect header format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // This will contain user data like id, email, etc.
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};
