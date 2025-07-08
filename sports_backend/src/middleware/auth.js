import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// JWT verification
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Middleware to authenticate the user
function authenticate(req, res, next) {
  console.log('authenticate middleware called for path:', req.path);
  console.log('Authorization header:', req.headers.authorization);
  
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = verifyToken(token);
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware to check if the user has the required role
function requireRole(role) {
  return (req, res, next) => {
    console.log('requireRole middleware called with role:', role);
    console.log('User from request:', req.user);
    
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
        console.log('Invalid role specified:', role);
        return res.status(403).json({ error: 'Invalid role specified' });
      }
      requiredRoleIds = [roleId];
    } else {
      // If role is a number, use it directly
      requiredRoleIds = [role];
    }

    console.log('Required role IDs:', requiredRoleIds);
    console.log('User role:', req.user.role);
    console.log('Role check result:', requiredRoleIds.includes(req.user.role));

    // Check if user has any of the required roles
    if (!requiredRoleIds.includes(req.user.role)) {
      console.log('Access denied: User role', req.user.role, 'not in required roles', requiredRoleIds);
      return res.status(403).json({ error: 'Unauthorized' });
    }
    console.log('Access granted for role check');
    next();
  };
}

export {
  authenticate,
  requireRole
}; 