const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  
  // Expect header format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  
  // If no token, continue without setting req.user
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // This will contain user data like id, email, etc.
    next();
  } catch (err) {
    // If token is invalid, continue without setting req.user (don't fail the request)
    next();
  }
};

