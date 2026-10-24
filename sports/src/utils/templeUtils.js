/**
 * Utility functions for temple-related operations
 */
import { userAPI } from './api.js';

/**
 * Get temple information by temple ID
 * @param {number} templeId - The temple ID
 * @returns {Promise<Object>} Temple information
 */
export const getTempleById = async (templeId) => {
    try {
        const response = await userAPI.getTempleById(templeId);
        return response;
    } catch (error) {
        // console.error('Error fetching temple:', error);
        throw error;
    }
};

/**
 * Get temple name by temple ID
 * @param {number} templeId - The temple ID
 * @returns {Promise<string>} Temple name
 */
export const getTempleNameById = async (templeId) => {
    try {
        const temple = await getTempleById(templeId);
        return temple.name;
    } catch (error) {
        console.error('Error fetching temple name:', error);
        return 'Unknown Temple';
    }
};

/**
 * Get current user's temple information
 * @returns {Promise<Object>} User's temple information
 */
export const getCurrentUserTemple = async () => {
    try {
        const data = await userAPI.getProfile();
        return {
            id: data.temple_id,
            name: data.temple
        };
    } catch (error) {
        // console.error('Error fetching current user temple:', error);
        throw error;
    }
};

/**
 * Get all temples from the backend
 * @returns {Promise<Array>} Array of temple objects
 */
export const getAllTemples = async () => {
    try {
        return await userAPI.getAllTemples();
    } catch (error) {
        // console.error('Error fetching temples:', error);
        throw error;
    }
};

/**
 * Get temple names as an array
 * @returns {Promise<Array<string>>} Array of temple names
 */
export const getTempleNames = async () => {
    try {
        const temples = await getAllTemples();
        return temples.map(temple => temple.name);
    } catch (error) {
        // console.error('Error fetching temple names:', error);
        // Fallback to hardcoded list if API fails
        return [
            'BARKUR', 'HALEYANGADI', 'HOSADURGA', 'KALYANPURA', 'KAPU', 'KARKALA',
            'KINNIMULKI', 'MANGALORE', 'MANJESHWARA', 'MULKI', 'PADUBIDRI',
            'SALIKERI', 'SIDDAKATTE', 'SURATHKAL', 'ULLALA', 'YERMAL'
        ];
    }
};

export const TEMPLE_CODES = {
  SALIKERI: 'SLK',
  BARKUR: 'BRK',
  HOSADURGA: 'HSD',
  MANJESHWARA: 'MJS',
  ULLALA: 'ULL',
  SURATHKAL: 'SRK',
  HALEYANGADI: 'HLY',
  MULKI: 'MLK',
  PADUBIDRI: 'PDB',
  YERMAL: 'YRM',
  KAPU: 'KAP',
  KINNIMULKI: 'KNM',
  KALYANPURA: 'KLY',
  KARKALA: 'KRK',
  SIDDAKATTE: 'SDK',
  MANGALORE: 'MNG'
};

export const TEMPLE_CODE_BY_ID = {
  1: 'SLK',
  2: 'BRK',
  3: 'HSD',
  4: 'MJS',
  5: 'ULL',
  6: 'SRK',
  7: 'HLY',
  8: 'MLK',
  9: 'PDB',
  10: 'YRM',
  11: 'KAP',
  12: 'KNM',
  13: 'KLY',
  14: 'KRK',
  15: 'SDK',
  16: 'MNG'
};

export const getBibNumber = (templeIdentifier, userId) => {
  if (!userId) return null;
  let code = 'ATH';
  if (typeof templeIdentifier === 'number') {
    code = TEMPLE_CODE_BY_ID[templeIdentifier] || code;
  } else if (typeof templeIdentifier === 'string') {
    const trimmed = templeIdentifier.trim().toUpperCase();
    if (TEMPLE_CODES[trimmed]) {
      code = TEMPLE_CODES[trimmed];
    } else if (trimmed.length === 3) {
      code = trimmed;
    }
  }
  return `${code}${String(userId).padStart(4, '0')}`;
}; 