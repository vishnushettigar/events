import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: {
          include: {
            temple: true,
            role: true
          }
        }
      }
    });

    if (!user || user.password !== password) { // In production, use bcrypt to compare hashed passwords
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.profile.role_id,
        temple_id: user.profile.temple_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile: {
          id: user.profile.id,
          first_name: user.profile.first_name,
          last_name: user.profile.last_name,
          phone: user.profile.phone,
          aadhar_number: user.profile.aadhar_number,
          dob: user.profile.dob,
          gender: user.profile.gender,
          temple: user.profile.temple,
          role: user.profile.role
        }
      }
    };
  } catch (error) {
    console.error('Error in login function:', error);
    throw error;
  }
}

async function updateRole(userId, newRoleId) {
  try {
    const updatedProfile = await prisma.profile.update({
      where: { user_id: userId },
      data: { role_id: newRoleId },
      include: {
        role: true
      }
    });

    // Log the role update in audit_log
    await prisma.audit_log.create({
      data: {
        user_id: userId,
        action: 'UPDATE_ROLE',
        table_name: 'Profile',
        record_id: updatedProfile.id,
        new_value: JSON.stringify(updatedProfile)
      }
    });

    return updatedProfile;
  } catch (error) {
    console.error('Error in updateRole function:', error);
    throw error;
  }
}

export {
  register,
  login,
  updateRole
}; 