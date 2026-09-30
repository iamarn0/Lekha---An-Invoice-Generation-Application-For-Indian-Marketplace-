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

function calculateInvoice({
  items,
  taxRate = 0,
  discount = 0,
  discountType = 'percent',
  status = 'draft',
  supplyType = 'intra',
  documentType = 'tax_invoice',
}) {
  const normalized = items.map((item) => {
    const quantity = roundMoney(item.quantity);
    const unitPrice = roundMoney(item.unitPrice);
    return {
      description: String(item.description || '').trim(),
      hsn: String(item.hsn || '').replace(/\D/g, '').slice(0, 8),
      quantity,
      unitPrice,
      amount: roundMoney(quantity * unitPrice),
    };
  });

  const subtotal = roundMoney(normalized.reduce((sum, item) => sum + item.amount, 0));
  let discountAmount = discountType === 'fixed'
    ? roundMoney(discount)
    : roundMoney((subtotal * (Number(discount) || 0)) / 100);

  if (discountAmount < 0) discountAmount = 0;
  if (discountAmount > subtotal) discountAmount = subtotal;

  const taxable = roundMoney(subtotal - discountAmount);
  const gst = splitGst(taxable, taxRate, supplyType === 'inter' ? 'inter' : 'intra');
  const grandTotal = roundMoney(taxable + gst.taxAmount);
  const isTaxInvoice = documentType !== 'quotation' && documentType !== 'proforma';
  const settled = status === 'paid' && isTaxInvoice;
  const closed = status === 'cancelled' || !isTaxInvoice;

  return {
    items: normalized,
    subtotal,
    discountAmount,
    ...gst,
    supplyType: supplyType === 'inter' ? 'inter' : 'intra',
    documentType: isTaxInvoice ? 'tax_invoice' : documentType,
    grandTotal,
    amountPaid: settled ? grandTotal : 0,
    outstanding: settled || closed ? 0 : grandTotal,
  };
}

module.exports = { roundMoney, calculateInvoice };
