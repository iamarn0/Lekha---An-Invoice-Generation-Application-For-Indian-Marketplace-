function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function splitGst(taxable, taxRate, supplyType) {
  const safeTax = Math.min(Math.max(Number(taxRate) || 0, 0), 100);
  const taxAmount = roundMoney((taxable * safeTax) / 100);
  if (supplyType === 'inter') {
    return {
      taxRate: safeTax,
      taxAmount,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: safeTax,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: taxAmount,
    };
  }

  const cgstRate = roundMoney(safeTax / 2);
  const sgstRate = roundMoney(safeTax - cgstRate);
  const cgstAmount = roundMoney((taxable * cgstRate) / 100);
  const sgstAmount = roundMoney(taxAmount - cgstAmount);
  return {
    taxRate: safeTax,
    taxAmount,
    cgstRate,
    sgstRate,
    igstRate: 0,
    cgstAmount,
    sgstAmount: sgstAmount < 0 ? 0 : sgstAmount,
    igstAmount: 0,
  };
}

export function calculateInvoice({
  items = [],
  taxRate = 0,
  discount = 0,
  discountType = 'percent',
  supplyType = 'intra',
  documentType = 'tax_invoice',
  status = 'draft',
}) {
  const normalized = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return {
      ...item,
      amount: roundMoney(quantity * unitPrice),
    };
  });

  const subtotal = roundMoney(normalized.reduce((sum, item) => sum + item.amount, 0));
  let discountAmount = discountType === 'fixed'
    ? roundMoney(Number(discount) || 0)
    : roundMoney((subtotal * (Number(discount) || 0)) / 100);

  if (discountAmount < 0) discountAmount = 0;
  if (discountAmount > subtotal) discountAmount = subtotal;

  const taxable = roundMoney(subtotal - discountAmount);
  const gst = splitGst(taxable, taxRate, supplyType);
  const grandTotal = roundMoney(taxable + gst.taxAmount);
  const isTaxInvoice = documentType !== 'quotation' && documentType !== 'proforma';
  const outstanding = status === 'paid' || status === 'cancelled' || !isTaxInvoice ? 0 : grandTotal;

  return {
    items: normalized,
    subtotal,
    discountAmount,
    ...gst,
    grandTotal,
    outstanding,
    supplyType,
  };
}
