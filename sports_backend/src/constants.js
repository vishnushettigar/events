// Temple mappings
const TEMPLES = {
  SALIKERI: { id: 1, name: 'SALIKERI', code: 'SLK' },
  BARKUR: { id: 2, name: 'BARKUR', code: 'BRK' },
  HOSADURGA: { id: 3, name: 'HOSADURGA', code: 'HSD' },
  MANJESHWARA: { id: 4, name: 'MANJESHWARA', code: 'MJS' },
  ULLALA: { id: 5, name: 'ULLALA', code: 'ULL' },
  SURATHKAL: { id: 6, name: 'SURATHKAL', code: 'SRK' },
  HALEYANGADI: { id: 7, name: 'HALEYANGADI', code: 'HLY' },
  MULKI: { id: 8, name: 'MULKI', code: 'MLK' },
  PADUBIDRI: { id: 9, name: 'PADUBIDRI', code: 'PDB' },
  YERMAL: { id: 10, name: 'YERMAL', code: 'YRM' },
  KAPU: { id: 11, name: 'KAPU', code: 'KAP' },
  KINNIMULKI: { id: 12, name: 'KINNIMULKI', code: 'KNM' },
  KALYANPURA: { id: 13, name: 'KALYANPURA', code: 'KLY' },
  KARKALA: { id: 14, name: 'KARKALA', code: 'KRK' },
  SIDDAKATTE: { id: 15, name: 'SIDDAKATTE', code: 'SDK' },
  MANGALORE: { id: 16, name: 'MANGALORE', code: 'MNG' }
};

// Map temple ID to 3-letter code
const TEMPLE_CODE_BY_ID = Object.values(TEMPLES).reduce((acc, t) => {
  acc[t.id] = t.code;
  return acc;
}, {});

// Map uppercase temple Name to 3-letter code
const TEMPLE_CODE_BY_NAME = Object.values(TEMPLES).reduce((acc, t) => {
  acc[t.name.toUpperCase()] = t.code;
  return acc;
}, {});

/**
 * Generate BIB number by combining temple code and participant/user ID.
 * @param {number|string} templeIdentifier - Temple ID, Temple Name, or Temple Code
 * @param {number|string} userId - Participant / Profile ID
 * @returns {string|null} - e.g. "SLK0001", "SLK0045", "BRK1024"
 */
const getBibNumber = (templeIdentifier, userId) => {
  if (!userId) return null;

  let code = 'ATH';
  if (typeof templeIdentifier === 'number') {
    code = TEMPLE_CODE_BY_ID[templeIdentifier] || code;
  } else if (typeof templeIdentifier === 'string') {
    const trimmed = templeIdentifier.trim().toUpperCase();
    if (TEMPLE_CODE_BY_NAME[trimmed]) {
      code = TEMPLE_CODE_BY_NAME[trimmed];
    } else if (trimmed.length === 3) {
      code = trimmed;
    }
  }

  const paddedId = String(userId).padStart(4, '0');
  return `${code}${paddedId}`;
};

export {
  TEMPLES,
  TEMPLE_CODE_BY_ID,
  TEMPLE_CODE_BY_NAME,
  getBibNumber
}; 