const jwt = require('jsonwebtoken');
const User = require('../models/User.mysql');

// JWT protect middleware
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization credentials not provided'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is disabled'
        });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Role based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to perform this action`
      });
    }
    next();
  };
};

// Verify parent access: can only access verified children
exports.verifyParentAccess = async (req, res, next) => {
  try {
    if (req.user.role !== 'parent') {
      return next();
    }
    
    const childUserId = req.params.userId || req.body.childUserId;
    
    if (!childUserId) {
      return res.status(400).json({
        success: false,
        message: 'childUserId is required'
      });
    }
    
    const isAuthorized = req.user.familyRelations.some(
      relation => relation.childUserId.toString() === childUserId.toString() && relation.isVerified
    );
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user data'
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};