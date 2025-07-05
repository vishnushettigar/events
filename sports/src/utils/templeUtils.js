/**
 * Utility functions for temple-related operations
 */

/**
 * Get temple information by temple ID
 * @param {number} templeId - The temple ID
 * @returns {Promise<Object>} Temple information
 */
export const getTempleById = async (templeId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:4000/api/users/temple/${templeId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch temple information');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching temple:', error);
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
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:4000/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        return {
            id: data.temple_id,
            name: data.temple
        };
    } catch (error) {
        console.error('Error fetching current user temple:', error);
        throw error;
    }
};

/**
 * Get all temples from the backend
 * @returns {Promise<Array>} Array of temple objects
 */
export const getAllTemples = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:4000/api/users/temples', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch temples');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching temples:', error);
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
        console.error('Error fetching temple names:', error);
        // Fallback to hardcoded list if API fails
        return [
            'BARKUR', 'HALEYANGADI', 'HOSADURGA', 'KALYANPURA', 'KAPU', 'KARKALA',
            'KINNIMULKI', 'MANGALORE', 'MANJESHWARA', 'MULKI', 'PADUBIDRI',
            'SALIKERI', 'SIDDAKATTE', 'SURATHKAL', 'ULLALA', 'YERMAL'
        ];
    }
}; 