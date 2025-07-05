const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// JWT verification
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Middleware to authenticate the user
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware to check if the user has the required role
function requireRole(role) {
  return (req, res, next) => {
    // Map role names to role IDs
    const roleMap = {
      'SUPER_USER': 4,
      'TEMPLE_ADMIN': 2,
      'STAFF': 3,
      'PARTICIPANT': 1
    };

    // Get the role ID(s) (either from the map or use the number directly)
    let requiredRoleIds;
    if (Array.isArray(role)) {
      // If role is an array, use the numbers directly
      requiredRoleIds = role;
    } else if (typeof role === 'string') {
      // If role is a string, map it to role ID
      const roleId = roleMap[role];
      if (!roleId) {
        return res.status(403).json({ error: 'Invalid role specified' });
      }
      requiredRoleIds = [roleId];
    } else {
      // If role is a number, use it directly
      requiredRoleIds = [role];
    }

    // Check if user has any of the required roles
    if (!requiredRoleIds.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole
}; 