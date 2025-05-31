const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function register(username, password, email, first_name, last_name, phone, aadhar_number, dob, gender, temple_id) {
  try {
    console.log('Received registration data:', { username, password, email, first_name, last_name, phone, aadhar_number, dob, gender, temple_id });
    
    const user = await prisma.user.create({
      data: {
        username,
        password, // In production, hash the password
        email,
        profile: {
          create: {
            first_name,
            last_name,
            phone,
            aadhar_number,
            dob: new Date(dob),
            gender,
            temple_id: temple_id ? parseInt(temple_id) : null,
            role_id: 1 // Default role: Participant
          }
        }
      },
      include: {
        profile: true
      }
    });
    // Log the registration in audit_log
    await prisma.audit_log.create({
      data: {
        user_id: user.id,
        action: 'REGISTER',
        table_name: 'User',
        record_id: user.id,
        new_value: JSON.stringify(user)
      }
    });
    return user;
  } catch (error) {
    console.error('Error in register function:', error);
    throw error;
  }
}

async function login(username, password) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { profile: true }
  });
  if (!user || user.password !== password) {
    throw new Error('Invalid credentials');
  }
  // Log the login in audit_log
  await prisma.audit_log.create({
    data: {
      user_id: user.id,
      action: 'LOGIN',
      table_name: 'User',
      record_id: user.id,
      new_value: JSON.stringify(user)
    }
  });
  // Generate JWT token with temple_id
  const token = jwt.sign({ 
    id: user.id, 
    role: user.profile.role_id,
    temple_id: user.profile.temple_id 
  }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
}

async function updateRole(user_id, new_role_id) {
  // In production, verify the requester is a Super User
  const isSuperUser = true; // Placeholder check
  if (!isSuperUser) {
    throw new Error('Unauthorized');
  }
  const updatedUser = await prisma.user.update({
    where: { id: parseInt(user_id) },
    data: {
      profile: {
        update: {
          role_id: parseInt(new_role_id)
        }
      }
    },
    include: { profile: true }
  });
  // Log the role update in audit_log
  await prisma.audit_log.create({
    data: {
      user_id: updatedUser.id,
      action: 'UPDATE_ROLE',
      table_name: 'User',
      record_id: updatedUser.id,
      new_value: JSON.stringify(updatedUser)
    }
  });
  return updatedUser;
}

module.exports = {
  register,
  login,
  updateRole
}; 