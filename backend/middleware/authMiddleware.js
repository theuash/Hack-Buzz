const jwt = require('jsonwebtoken');
const GP = require('../models/GP');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Basic check for JWT format (3 parts separated by dots)
      if (!token || token.split('.').length !== 3) {
        return res.status(401).json({ message: 'Invalid token format' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.gp = await GP.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
