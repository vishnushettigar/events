/**
 * Get cutoff date from settings table
 * @returns {Promise<Date>} - The cutoff date from settings, or December 1st of current year as fallback
 */
async function getCutoffDateFromSettings() {
  try {
    const prisma = (await import('./prismaClient.js')).default;
    const cutoffSetting = await prisma.settings.findUnique({
      where: { name: 'AGE_CALC_CUTOFF_DATE' }
    });
    
    if (cutoffSetting && cutoffSetting.value) {
      // Parse the date string (format: 'YYYY-MM-DD')
      const dateParts = cutoffSetting.value.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching cutoff date from settings:', error);
  }
  
  // Fallback to December 1st of current year
  const currentYear = new Date().getFullYear();
  return new Date(currentYear, 11, 1);
}

/**
 * Calculate age based on date of birth using a cutoff date
 * @param {Date|string} dateOfBirth - The date of birth
 * @param {Date|string} [cutoffDate] - Optional cutoff date. If not provided, uses December 1st of current year
 * @returns {number} - The calculated age
 * 
 * @example
 * // If DOB is December 1st, 2019 and cutoff is November 30th, 2024:
 * // Birthday in 2024 (Dec 1) hasn't occurred yet, so age = 4
 * calculateAge(new Date('2019-12-01'), new Date('2024-11-30')) // returns 4
 * 
 * @example
 * // If DOB is December 1st, 2024 and cutoff is December 1st, 2024, age will be 0
 * calculateAge(new Date('2024-12-01'), new Date('2024-12-01')) // returns 0
 */
function calculateAge(dateOfBirth, cutoffDate = null) {
  // Use provided cutoff date or default to December 1st of current year
  let cutoff;
  if (cutoffDate) {
    cutoff = cutoffDate instanceof Date ? cutoffDate : new Date(cutoffDate);
  } else {
    const currentYear = new Date().getFullYear();
    cutoff = new Date(currentYear, 11, 1); // December 1st of current year (month is 0-indexed)
  }
  
  const birthDate = new Date(dateOfBirth);
  
  // Normalize dates to start of day for accurate comparison
  const cutoffNormalized = new Date(cutoff.getFullYear(), cutoff.getMonth(), cutoff.getDate());
  const birthNormalized = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  let age = cutoffNormalized.getFullYear() - birthNormalized.getFullYear();
  
  // Calculate the birthday in the cutoff year
  const birthdayThisYear = new Date(
    cutoffNormalized.getFullYear(),
    birthNormalized.getMonth(),
    birthNormalized.getDate()
  );
  
  // If the birthday in the cutoff year hasn't occurred yet (or is after the cutoff date), subtract 1
  // This handles the case where cutoff is Nov 30 and DOB is Dec 1 - birthday hasn't occurred yet
  if (birthdayThisYear > cutoffNormalized) {
    age--;
  }
  
  return age;
}

/**
 * Calculate age using cutoff date from settings table
 * @param {Date|string} dateOfBirth - The date of birth
 * @returns {Promise<number>} - The calculated age
 */
async function calculateAgeWithSettings(dateOfBirth) {
  const cutoffDate = await getCutoffDateFromSettings();
  return calculateAge(dateOfBirth, cutoffDate);
}

/**
 * Get age category based on calculated age
 * @param {number} age - The calculated age
 * @returns {string} - The age category name
 */
function getAgeCategory(age) {
  if (age >= 0 && age <= 5) return '0-5';
  else if (age >= 6 && age <= 10) return '6-10';
  else if (age >= 11 && age <= 14) return '11-14';
  else if (age >= 15 && age <= 18) return '15-18';
  else if (age >= 19 && age <= 24) return '19-24';
  else if (age >= 25 && age <= 35) return '25-35';
  else if (age >= 36 && age <= 49) return '36-49';
  else if (age >= 50 && age <= 60) return '50-60';
  else if (age >= 61 && age <= 99) return '61-90';
  else return 'Unknown';
}

/**
 * Check if an age category should be excluded from points
 * @param {string} ageCategory - The age category name
 * @returns {boolean} - True if the age category should be excluded from points
 */
function isExcludedAgeCategory(ageCategory) {
  const excludedCategories = ['0-5', '6-10', '61-90'];
  return excludedCategories.includes(ageCategory);
}

export {
  calculateAge,
  calculateAgeWithSettings,
  getCutoffDateFromSettings,
  getAgeCategory,
  isExcludedAgeCategory
};
