const INDIAN_STATES = [
  ['01', 'Jammu and Kashmir'],
  ['02', 'Himachal Pradesh'],
  ['03', 'Punjab'],
  ['04', 'Chandigarh'],
  ['05', 'Uttarakhand'],
  ['06', 'Haryana'],
  ['07', 'Delhi'],
  ['08', 'Rajasthan'],
  ['09', 'Uttar Pradesh'],
  ['10', 'Bihar'],
  ['11', 'Sikkim'],
  ['12', 'Arunachal Pradesh'],
  ['13', 'Nagaland'],
  ['14', 'Manipur'],
  ['15', 'Mizoram'],
  ['16', 'Tripura'],
  ['17', 'Meghalaya'],
  ['18', 'Assam'],
  ['19', 'West Bengal'],
  ['20', 'Jharkhand'],
  ['21', 'Odisha'],
  ['22', 'Chhattisgarh'],
  ['23', 'Madhya Pradesh'],
  ['24', 'Gujarat'],
  ['26', 'Dadra and Nagar Haveli and Daman and Diu'],
  ['27', 'Maharashtra'],
  ['29', 'Karnataka'],
  ['30', 'Goa'],
  ['31', 'Lakshadweep'],
  ['32', 'Kerala'],
  ['33', 'Tamil Nadu'],
  ['34', 'Puducherry'],
  ['35', 'Andaman and Nicobar Islands'],
  ['36', 'Telangana'],
  ['37', 'Andhra Pradesh'],
  ['38', 'Ladakh'],
];

const STATE_NAMES = new Map(INDIAN_STATES);
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
const RAZORPAY_KEY_RE = /^rzp_(test|live)_[A-Za-z0-9_]{4,40}$/;

const BUSINESS_TYPES = ['freelancer', 'agency', 'consultant', 'manufacturer', 'logistics', 'trader', 'other'];
const DOCUMENT_TYPES = ['tax_invoice', 'quotation', 'proforma'];
const GST_SLABS = [0, 5, 12, 18, 28];

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function isStateCode(code) {
  return STATE_NAMES.has(String(code || ''));
}

function stateName(code) {
  return STATE_NAMES.get(String(code || '')) || '';
}

function supplyTypeFor(sellerState, placeOfSupply) {
  const seller = String(sellerState || '');
  const place = String(placeOfSupply || '');
  if (seller && place && seller !== place) return 'inter';
  return 'intra';
}

function wordsUnder1000(value) {
  const n = Number(value) || 0;
  if (n < 20) return ONES[n];
  if (n < 100) {
    const rest = n % 10;
    return `${TENS[Math.floor(n / 10)]}${rest ? ` ${ONES[rest]}` : ''}`;
  }
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} hundred${rest ? ` ${wordsUnder1000(rest)}` : ''}`;
}

function indianNumberWords(value) {
  let n = Math.floor(Number(value) || 0);
  if (n === 0) return '';
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts = [];
  if (crore) parts.push(`${wordsUnder1000(crore)} crore`);
  if (lakh) parts.push(`${wordsUnder1000(lakh)} lakh`);
  if (thousand) parts.push(`${wordsUnder1000(thousand)} thousand`);
  if (rest) parts.push(wordsUnder1000(rest));
  return parts.join(' ');
}

function amountInWords(amount) {
  const rounded = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  const rupees = Math.floor(Math.abs(rounded));
  const paise = Math.round((Math.abs(rounded) - rupees) * 100);
  if (!rupees && !paise) return 'Zero rupees only';
  const rupeeWords = rupees ? `${indianNumberWords(rupees)} rupee${rupees === 1 ? '' : 's'}` : '';
  const paiseWords = paise ? `${indianNumberWords(paise)} paise` : '';
  const body = [rupeeWords, paiseWords].filter(Boolean).join(' and ');
  return `${body.charAt(0).toUpperCase()}${body.slice(1)} only`;
}

module.exports = {
  INDIAN_STATES,
  GSTIN_RE,
  PAN_RE,
  UPI_RE,
  RAZORPAY_KEY_RE,
  BUSINESS_TYPES,
  DOCUMENT_TYPES,
  GST_SLABS,
  isStateCode,
  stateName,
  supplyTypeFor,
  amountInWords,
};
