// Valid UK postcode prefixes (1-2 letters)
export const VALID_POSTCODE_PREFIXES = [
  // Single letters
  'B', 'E', 'G', 'L', 'M', 'N', 'S', 'W',
  // London postcodes
  'EC', 'WC', 'SE', 'SW', 'NW', 'BR', 'CR', 'DA', 'EN', 'HA', 'IG', 'KT', 'RM', 'SM', 'TW', 'UB', 'WD',
  // Other major cities
  'AB', 'BD', 'BL', 'BN', 'BS', 'BT', 'CB', 'CF', 'CH', 'CV', 'DH', 'DN', 'DY',
  'EH', 'HD', 'HX', 'LE', 'LS', 'NE', 'NG', 'OL', 'OX', 'PA', 'PL', 'PO', 'RG',
  'SK', 'SO', 'SR', 'WF', 'WN', 'WS', 'WV'
];

// Map city names to postcode prefixes
export const cityToPostcodeMap = {
  'london': 'SW', 'manchester': 'M', 'birmingham': 'B', 'liverpool': 'L',
  'leeds': 'LS', 'sheffield': 'S', 'bristol': 'BS', 'newcastle': 'NE',
  'nottingham': 'NG', 'leicester': 'LE', 'coventry': 'CV', 'bradford': 'BD',
  'cardiff': 'CF', 'edinburgh': 'EH', 'glasgow': 'G', 'aberdeen': 'AB',
  'belfast': 'BT', 'southampton': 'SO', 'portsmouth': 'PO', 'oxford': 'OX',
  'cambridge': 'CB', 'york': 'LS', 'brighton': 'BN', 'exeter': 'EX',
  'norwich': 'NR', 'derby': 'DE', 'wolverhampton': 'WV', 'plymouth': 'PL',
  'reading': 'RG'
};

export const getPostcodePrefix = (input) => {
  const trimmed = input?.trim().toUpperCase() || '';
  if (!trimmed) return '';
  
  // Check if it's already a valid postcode prefix (SW, M, NW, etc.)
  if (VALID_POSTCODE_PREFIXES.includes(trimmed)) return trimmed;
  
  // Check if it's a city name
  const cityMatch = cityToPostcodeMap[trimmed.toLowerCase()];
  if (cityMatch) return cityMatch;
  
  // Extract postcode prefix (1-2 letters before digits) from address/postcode
  // e.g., "SW1" -> "SW", "M1" -> "M", "NW10" -> "NW", "London SW4" -> "SW"
  const match = trimmed.match(/\b([A-Z]{1,2})\d/);
  if (match) {
    const prefix = match[1];
    // Validate it's a known prefix
    if (VALID_POSTCODE_PREFIXES.includes(prefix)) return prefix;
    // If 2-letter prefix not found, try single letter
    if (prefix.length === 2 && VALID_POSTCODE_PREFIXES.includes(prefix[0])) return prefix[0];
    return prefix; // Return anyway as backend will handle unknown
  }
  
  // Fallback: try to find any 1-2 letter sequence that might be a postcode
  const fallback = trimmed.match(/\b([A-Z]{1,2})\b/);
  if (fallback && VALID_POSTCODE_PREFIXES.includes(fallback[1])) return fallback[1];
  
  return '';
};

export const formatPrice = (price) => {
  return `£${Math.round(price).toLocaleString()}`;
};

export const generateHumanExplanation = (predictedPrice, propertyData, serverResult = null) => {
  const askingPrice = propertyData?.price_num || 0;
  const priceDiff = predictedPrice - askingPrice;
  const diffPercent = askingPrice > 0 ? ((priceDiff / askingPrice) * 100).toFixed(1) : 0;
  const threshold = 0.05;
  
  // Use server-provided valuation summary if available
  let priceAssessment = serverResult?.valuation_summary || '';
  if (!priceAssessment) {
    if (Math.abs(priceDiff) < askingPrice * threshold) {
      priceAssessment = `Our model values this property at ${formatPrice(predictedPrice)}, which aligns closely with the asking price of ${formatPrice(askingPrice)}.`;
    } else if (priceDiff > 0) {
      priceAssessment = `Our model estimates ${formatPrice(predictedPrice)} is ${diffPercent}% above the asking price of ${formatPrice(askingPrice)}. This suggests the property may be priced below market value, but verify comparable sales.`;
    } else {
      priceAssessment = `Our analysis suggests ${formatPrice(predictedPrice)} is ${Math.abs(diffPercent)}% below the asking price of ${formatPrice(askingPrice)}. The property appears overvalued relative to our model. Consider negotiation or further due diligence.`;
    }
  }
  
  const epc = propertyData?.ecp_rating || 'C';
  const epcAssessment = ['A', 'B', 'C'].includes(epc)
    ? `The ${epc} energy rating is strong for this property.`
    : `The ${epc} energy rating may require future improvements, potentially affecting value.`;
  
  const tenure = propertyData?.tenure || 'Leasehold';
  const tenureAssessment = tenure.toLowerCase().includes('freehold')
    ? `Freehold ownership provides full control with no ground rent.`
    : `As leasehold, be mindful of ground rents and service charges.`;
  
  const isGoodDeal = priceDiff > askingPrice * threshold && ['A', 'B', 'C'].includes(epc);
  const recommendation = isGoodDeal
    ? `Property appears undervalued relative to model. Consider accelerated acquisition.`
    : `Proceed with standard due diligence. Price aligns with model expectations.`;

  // Include feature bullets from server if available
  const featureBullets = serverResult?.feature_bullets || [];

  return { summary: priceAssessment, energyInsight: epcAssessment, tenureInsight: tenureAssessment, recommendation, predictedPrice, askingPrice, featureBullets };
};

export const buildPayload = (form, propertyData) => {
  if (propertyData) {
    return {
      bedrooms: parseFloat(propertyData.bedrooms) || 2,
      bathrooms: parseFloat(propertyData.bathrooms) || 1,
      receptions: parseFloat(propertyData.receptions) || 1,
      property_size: parseFloat(propertyData.property_size) || 800,
      time_remaining_on_lease: parseFloat(propertyData.time_remaining_on_lease) || 150,
      service_charge: parseFloat(propertyData.service_charge) || 3000,
      price_per_sqft: (parseFloat(propertyData.price_num) || 0) / (parseFloat(propertyData.property_size) || 800) || 1000,
      postcode_area: getPostcodePrefix(propertyData.address),
      property_type_clean: (propertyData.property_type || '').toLowerCase().trim(),
    };
  }
  
  return {
    bedrooms: Math.min(10, Math.max(0, parseFloat(form.bedrooms) || 2)),
    bathrooms: Math.min(8, Math.max(0, parseFloat(form.bathrooms) || 1)),
    receptions: Math.min(6, Math.max(0, parseFloat(form.receptions) || 1)),
    property_size: Math.min(10000, Math.max(200, parseFloat(form.property_size) || 800)),
    time_remaining_on_lease: Math.min(999, Math.max(0, parseFloat(form.time_remaining_on_lease) || 150)),
    service_charge: Math.min(20000, Math.max(0, parseFloat(form.service_charge) || 3000)),
    price_per_sqft: Math.min(5000, Math.max(500, parseFloat(form.price_per_size) || 1000)),
    postcode_area: getPostcodePrefix(form.area),
    property_type_clean: form.property_type?.toLowerCase().trim() || '',
  };
};
