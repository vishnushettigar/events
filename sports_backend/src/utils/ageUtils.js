/**
 * Calculate age based on date of birth using December 1st of current year as cutoff
 * @param {Date} dateOfBirth - The date of birth
 * @returns {number} - The calculated age
 */
function calculateAge(dateOfBirth) {
  const currentYear = new Date().getFullYear();
  const cutoffDate = new Date(currentYear, 11, 1); // December 1st of current year (month is 0-indexed)
  
  const birthDate = new Date(dateOfBirth);
  
  let age = cutoffDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = cutoffDate.getMonth() - birthDate.getMonth();
  
  // If the birthday hasn't occurred yet this year (before December 1st), subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && cutoffDate.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
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
  getAgeCategory,
  isExcludedAgeCategory
};
