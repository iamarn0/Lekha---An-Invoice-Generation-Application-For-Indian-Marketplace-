const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { amountInWords, stateName } = require('../utils/india');

const INDIGO = '#4338CA';
const MUTED = '#6B7280';
const LINE = '#E5E5E0';
const INK = '#171717';
const SAND = '#F1F1EE';

const TITLES = {
  tax_invoice: 'TAX INVOICE',
  quotation: 'QUOTATION',
  proforma: 'PROFORMA INVOICE',
};

function money(amount, currency) {
  const code = currency || 'INR';
  const value = Number(amount) || 0;
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  // Standard PDF fonts are WinAnsi and have no rupee glyph.
  if (code === 'INR') return `Rs. ${formatted}`;
  return `${code} ${formatted}`;
}

function drawBlock(doc, text, x, y, width) {
  const value = String(text ?? '');
  const height = doc.heightOfString(value, { width });
  doc.text(value, x, y, { width });
  return y + height + 3;
}

function drawRight(doc, text, right, y) {
  doc.text(text, right - doc.widthOfString(text), y, { lineBreak: false });
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function partyName(snapshot) {
  return snapshot?.company || snapshot?.name || 'Client';
}

function generateInvoicePdf(invoice, user) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const currency = user.currency || 'INR';
    const pageWidth = doc.page.width;
    const title = TITLES[invoice.documentType] || 'TAX INVOICE';
    const showHsn = invoice.items.some((item) => item.hsn);
    doc.rect(0, 0, 8, doc.page.height).fill(INDIGO);

    let textX = 48;
    if (user.logo && user.logo.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', 'uploads', path.basename(user.logo));
      if (fs.existsSync(filePath)) {
        try {
          doc.image(filePath, 48, 42, { fit: [42, 42] });
          textX = 102;
        } catch {
          textX = 48;
        }
      }
    }

    const rightEdge = pageWidth - 48;
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(16);
    let headerBottom = drawBlock(doc, user.businessName || user.name, textX, 48, 250);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    if (user.address) headerBottom = drawBlock(doc, user.address, textX, headerBottom, 250);

    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    drawRight(doc, title, rightEdge, 48);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(INK);
    drawRight(doc, invoice.invoiceNumber, rightEdge, 64);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    drawRight(doc, String(invoice.status || '').toUpperCase(), rightEdge, 84);

    const ruleY = Math.max(headerBottom, 108) + 14;
    doc.moveTo(48, ruleY).lineTo(rightEdge, ruleY).strokeColor(LINE).lineWidth(1).stroke();

    const sellerLines = [
      user.email,
      user.phone,
      user.gstin || user.taxNumber ? `GSTIN ${user.gstin || user.taxNumber}` : '',
      user.pan ? `PAN ${user.pan}` : '',
      user.state ? `State ${stateName(user.state)} (${user.state})` : '',
    ].filter(Boolean);

    const partyTop = ruleY + 18;
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('FROM', 48, partyTop, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK);
    let fromY = drawBlock(doc, user.businessName || user.name, 48, partyTop + 14, 230);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    sellerLines.forEach((line) => {
      fromY = drawBlock(doc, line, 48, fromY, 230);
    });

    const snapshot = invoice.clientSnapshot || {};
    const billLines = [
      snapshot.company && snapshot.name !== partyName(snapshot) ? snapshot.name : '',
      snapshot.email,
      snapshot.phone,
      snapshot.address,
      snapshot.gstin ? `GSTIN ${snapshot.gstin}` : '',
      snapshot.pan ? `PAN ${snapshot.pan}` : '',
      snapshot.state ? `State ${stateName(snapshot.state)} (${snapshot.state})` : '',
    ].filter(Boolean);

    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('BILL TO', 320, partyTop, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK);
    let billY = drawBlock(doc, partyName(snapshot), 320, partyTop + 14, 220);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    billLines.forEach((line) => {
      billY = drawBlock(doc, line, 320, billY, 220);
    });

    const metaY = Math.max(fromY, billY) + 16;
    const meta = [
      ['Issue date', formatDate(invoice.issueDate)],
      ['Due date', formatDate(invoice.dueDate)],
      ['Place of supply', stateName(invoice.placeOfSupply) || '—'],
    ];
    meta.forEach((entry, index) => {
      const x = 48 + index * 165;
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(entry[0].toUpperCase(), x, metaY, { lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(INK);
      drawBlock(doc, entry[1], x, metaY + 14, 155);
    });

    let y = metaY + 46;
    doc.rect(48, y, pageWidth - 96, 26).fill(SAND);
    doc.fillColor(MUTED).font('Helvetica').fontSize(8);
    doc.text('DESCRIPTION', 56, y + 9, { lineBreak: false });
    if (showHsn) doc.text('HSN/SAC', 250, y + 9, { lineBreak: false });
    drawRight(doc, 'QTY', 330, y + 9);
    drawRight(doc, 'RATE', 430, y + 9);
    drawRight(doc, 'AMOUNT', rightEdge, y + 9);
    y += 36;

    invoice.items.forEach((item) => {
      const descWidth = showHsn ? 180 : 250;
      doc.font('Helvetica').fontSize(10).fillColor(INK);
      const height = doc.heightOfString(item.description, { width: descWidth });
      if (y + height > doc.page.height - 220) {
        doc.addPage();
        doc.rect(0, 0, 8, doc.page.height).fill(INDIGO);
        y = 56;
      }
      doc.fillColor(INK).text(item.description, 56, y, { width: descWidth });
      if (showHsn) doc.text(item.hsn || '—', 250, y, { lineBreak: false });
      drawRight(doc, String(item.quantity), 330, y);
      drawRight(doc, money(item.unitPrice, currency), 430, y);
      drawRight(doc, money(item.amount, currency), rightEdge, y);
      y += Math.max(height, 12) + 12;
      doc.moveTo(56, y - 6).lineTo(pageWidth - 48, y - 6).strokeColor(LINE).stroke();
    });

    y += 8;
    const rows = [
      ['Subtotal', money(invoice.subtotal, currency)],
      ['Discount', money(invoice.discountAmount > 0 ? -invoice.discountAmount : 0, currency)],
    ];
    if (invoice.igstAmount > 0) rows.push([`IGST (${invoice.igstRate}%)`, money(invoice.igstAmount, currency)]);
    else if (invoice.taxAmount > 0) {
      rows.push([`CGST (${invoice.cgstRate}%)`, money(invoice.cgstAmount, currency)]);
      rows.push([`SGST (${invoice.sgstRate}%)`, money(invoice.sgstAmount, currency)]);
    } else rows.push([`GST (${invoice.taxRate || 0}%)`, money(0, currency)]);

    rows.forEach((row) => {
      doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(row[0], 330, y, { lineBreak: false });
      doc.fillColor(INK);
      drawRight(doc, row[1], rightEdge, y);
      y += 18;
    });

    doc.moveTo(330, y).lineTo(rightEdge, y).strokeColor(LINE).stroke();
    y += 10;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text('Total', 330, y, { lineBreak: false });
    drawRight(doc, money(invoice.grandTotal, currency), rightEdge, y);
    y += 20;
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('Outstanding', 330, y, { lineBreak: false });
    doc.font('Helvetica-Bold').fillColor(INK);
    drawRight(doc, money(invoice.outstanding, currency), rightEdge, y);

    y += 28;
    if (currency === 'INR') {
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('AMOUNT IN WORDS', 48, y, { lineBreak: false });
      doc.font('Helvetica').fontSize(10).fillColor(INK);
      y = drawBlock(doc, amountInWords(invoice.grandTotal), 48, y + 12, 280) + 8;
    } else {
      y += 8;
    }

    const upi = invoice.upiId || user.upiId;
    if (upi) {
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('PAY BY UPI', 48, y, { lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(upi, 48, y + 12, { lineBreak: false });
      y += 36;
    }

    if (invoice.notes) {
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('NOTES', 48, y, { lineBreak: false });
      doc.font('Helvetica').fontSize(10).fillColor(INK);
      drawBlock(doc, invoice.notes, 48, y + 14, pageWidth - 96);
    }

    const footerY = doc.page.maxY() - 22;
    doc.moveTo(48, footerY).lineTo(pageWidth - 48, footerY).strokeColor(LINE).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(MUTED);
    doc.text('This is a computer-generated document.', 48, footerY + 8, { lineBreak: false });
    const brand = 'Prepared with LEKHA';
    doc.text(brand, pageWidth - 48 - doc.widthOfString(brand), footerY + 8, { lineBreak: false });

    doc.end();
  });
}

module.exports = { generateInvoicePdf };
