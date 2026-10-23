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
  if (!dateOfBirth) return 0;

  // Use provided cutoff date or default to December 1st of current year
  let cutoff;
  if (cutoffDate) {
    cutoff = cutoffDate instanceof Date ? cutoffDate : new Date(cutoffDate);
  } else {
    const currentYear = new Date().getFullYear();
    cutoff = new Date(currentYear, 11, 1); // December 1st of current year (month is 0-indexed)
  }

  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return 0;

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

  return Math.max(0, age);
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

// Seed age categories matching prisma/seed.js:L80-L92
const AGE_CATEGORIES = [
  { name: '0-5', from_age: 0, to_age: 5 },
  { name: '6-10', from_age: 6, to_age: 10 },
  { name: '11-14', from_age: 11, to_age: 14 },
  { name: '15-18', from_age: 15, to_age: 18 },
  { name: '19-24', from_age: 19, to_age: 24 },
  { name: '25-35', from_age: 25, to_age: 35 },
  { name: '36-49', from_age: 36, to_age: 49 },
  { name: '50-60', from_age: 50, to_age: 60 },
  { name: '61+', from_age: 61, to_age: 99 }
];

/**
 * Get age category based on calculated age using seed age categories
 * @param {number} age - The calculated age
 * @param {Array} [customCategories] - Optional custom categories array
 * @returns {string} - The age category name
 */
function getAgeCategory(age, customCategories = null) {
  if (age === null || age === undefined || isNaN(age)) {
    return 'Unknown';
  }

  const numericAge = Math.max(0, Math.floor(Number(age)));
  const categories = (Array.isArray(customCategories) && customCategories.length > 0)
    ? customCategories.filter(c => c && c.name && c.name.toLowerCase() !== 'all')
    : AGE_CATEGORIES;

  const matched = categories.find(
    cat => numericAge >= cat.from_age && numericAge <= cat.to_age
  );

  if (matched) {
    return matched.name;
  }

  if (numericAge >= 61) {
    return '61+';
  }

  return 'Unknown';
}

/**
 * Check if an age category should be excluded from points
 * @param {string} ageCategory - The age category name
 * @returns {boolean} - True if the age category should be excluded from points
 */
function isExcludedAgeCategory(ageCategory) {
  const excludedCategories = ['0-5', '6-10', '61-90', '61+'];
  return excludedCategories.includes(ageCategory);
}

export {
  AGE_CATEGORIES,
  calculateAge,
  calculateAgeWithSettings,
  getCutoffDateFromSettings,
  getAgeCategory,
  isExcludedAgeCategory
};
