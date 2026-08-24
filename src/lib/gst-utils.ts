// Indian GST Calculation Utilities

// List of Indian states with codes for GSTIN validation
export const INDIAN_STATES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
};

// Extract state code from GSTIN (first 2 digits)
export function getStateFromGSTIN(gstin: string): string | null {
  if (!gstin || gstin.length < 2) return null;
  const stateCode = gstin.substring(0, 2);
  return INDIAN_STATES[stateCode] || null;
}

// Validate GSTIN format (basic validation)
export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  // GSTIN format: 2 digits state code + 10 char PAN + 1 entity code + Z + 1 check digit
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
}

// Determine if transaction is intra-state or inter-state
export function isIntrastate(sellerState: string, buyerState: string): boolean {
  if (!sellerState || !buyerState) return true; // Default to intra-state if unknown
  return sellerState.toLowerCase().trim() === buyerState.toLowerCase().trim();
}

// Calculate GST amounts for a line item
export interface GSTCalculation {
  taxableAmount: number;
  gstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  lineItemTotal: number;
}

export function calculateGST(
  priceWithoutGST: number,
  quantity: number,
  gstPercentage: number,
  isIntrastateTransaction: boolean
): GSTCalculation {
  const taxableAmount = priceWithoutGST * quantity;
  const totalGST = (taxableAmount * gstPercentage) / 100;
  
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  
  if (isIntrastateTransaction) {
    // Intra-state: Split equally between CGST and SGST
    cgstAmount = totalGST / 2;
    sgstAmount = totalGST / 2;
  } else {
    // Inter-state: Full amount as IGST
    igstAmount = totalGST;
  }
  
  return {
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    gstPercentage,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstAmount: Math.round(igstAmount * 100) / 100,
    totalTax: Math.round(totalGST * 100) / 100,
    lineItemTotal: Math.round((taxableAmount + totalGST) * 100) / 100,
  };
}

// Calculate total GST for multiple items
export interface OrderGSTSummary {
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  grandTotal: number;
}

export function calculateOrderGST(
  items: Array<{ priceWithoutGST: number; quantity: number; gstPercentage: number }>,
  isIntrastateTransaction: boolean,
  shippingCharges: number = 0,
  discountAmount: number = 0
): OrderGSTSummary {
  let subtotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  
  items.forEach(item => {
    const gst = calculateGST(
      item.priceWithoutGST,
      item.quantity,
      item.gstPercentage,
      isIntrastateTransaction
    );
    subtotal += gst.taxableAmount;
    cgstTotal += gst.cgstAmount;
    sgstTotal += gst.sgstAmount;
    igstTotal += gst.igstAmount;
  });
  
  const totalTax = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = subtotal + totalTax + shippingCharges - discountAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgstTotal: Math.round(cgstTotal * 100) / 100,
    sgstTotal: Math.round(sgstTotal * 100) / 100,
    igstTotal: Math.round(igstTotal * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

// Format currency in Indian Rupees
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Convert number to Indian words (for invoices)
export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const convertLessThanHundred = (n: number): string => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  };
  
  const convertLessThanThousand = (n: number): string => {
    if (n < 100) return convertLessThanHundred(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanHundred(n % 100) : '');
  };
  
  // Indian numbering system: Lakh (1,00,000) and Crore (1,00,00,000)
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = '';
  
  if (rupees >= 10000000) {
    result += convertLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore ';
  }
  if (rupees >= 100000) {
    result += convertLessThanHundred(Math.floor((rupees % 10000000) / 100000)) + ' Lakh ';
  }
  if (rupees >= 1000) {
    result += convertLessThanHundred(Math.floor((rupees % 100000) / 1000)) + ' Thousand ';
  }
  if (rupees >= 100) {
    result += convertLessThanThousand(rupees % 1000);
  } else if (rupees > 0) {
    result += convertLessThanHundred(rupees);
  }
  
  result = result.trim() + ' Rupees';
  
  if (paise > 0) {
    result += ' and ' + convertLessThanHundred(paise) + ' Paise';
  }
  
  return result + ' Only';
}
