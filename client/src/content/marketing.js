import { FileText, LineChart, Receipt, Search, Users, Wallet } from 'lucide-react';

export const features = [
  {
    icon: FileText,
    title: 'Tax invoices, quotations, proformas',
    text: 'The same document flow covers a GST tax invoice, a quotation, and a proforma. Only tax invoices sit in outstanding and revenue.',
  },
  {
    icon: Wallet,
    title: 'CGST, SGST, and IGST',
    text: 'Place of supply decides the split. Same state is CGST plus SGST. Another state is IGST. Totals match on screen and in the PDF.',
  },
  {
    icon: Users,
    title: 'GSTIN and PAN on the client',
    text: 'Keep the GSTIN, PAN, and state with the business you bill. The invoice stores a snapshot so later edits do not rewrite a sent bill.',
  },
  {
    icon: Receipt,
    title: 'A bill Indian MSMEs recognise',
    text: 'HSN or SAC on the line, amount in words, and a UPI ID on the PDF. The same layout serves freelancers, agencies, consultants, manufacturers, and logistics.',
  },
  {
    icon: LineChart,
    title: 'Collections in rupees',
    text: 'Paid tax invoices become revenue. Quotations stay out of the chart. The month is shown in INR, including lakhs and crores.',
  },
  {
    icon: Search,
    title: 'Find a bill quickly',
    text: 'Search by invoice number, client, or notes. Filter by status, document type, date, or amount.',
  },
];

export const steps = [
  { number: '01', title: 'Add the business', text: 'Name, GSTIN, PAN, and state. Intra-state and inter-state bills start from that record.' },
  { number: '02', title: 'Raise the document', text: 'Choose a tax invoice, quotation, or proforma. Add HSN or SAC, the GST slab, and any discount.' },
  { number: '03', title: 'Collect in INR', text: 'Share the PDF with your UPI ID. Mark the tax invoice paid when the money lands. Razorpay checkout is a placeholder.' },
];

export const testimonials = [
  {
    quote: 'CGST and SGST show up without a second spreadsheet. The PDF is what I send to the client.',
    name: 'Ananya Rao',
    role: 'Kalpa Retail, Bengaluru',
  },
  {
    quote: 'We raise a quotation first, then convert it when the order is confirmed. The number stays readable.',
    name: 'Meenakshi Nair',
    role: 'Malabar Prints, Kochi',
  },
  {
    quote: 'Freight bills need a place of supply and an HSN. LEKHA already asks for both.',
    name: 'Kabir Shah',
    role: 'Westline Logistics, Mumbai',
  },
];

export const plans = [
  {
    name: 'Starter',
    price: '₹0',
    detail: 'The working demo',
    featured: false,
    points: ['One workspace', 'GST invoices, clients, and PDFs', 'Dashboard and activity', 'Kaavya Studio sample data'],
  },
  {
    name: 'Studio',
    price: '₹999',
    detail: 'Illustrative monthly price',
    featured: true,
    points: ['Everything in Starter', 'GSTIN, PAN, and UPI on every bill', 'Revenue in INR', 'Razorpay checkout on the roadmap'],
  },
  {
    name: 'Business',
    price: '₹2,499',
    detail: 'Illustrative monthly price',
    featured: false,
    points: ['Everything in Studio', 'Quotations and proformas', 'A bookkeeper seat on the roadmap', 'Live Razorpay on the roadmap'],
  },
];

export const faqs = [
  {
    question: 'Does LEKHA collect UPI or card payments?',
    answer: 'It prints your UPI ID and can store a public Razorpay key ID. Checkout is a placeholder. LEKHA does not charge cards or store a Razorpay secret.',
  },
  {
    question: 'How are CGST, SGST, and IGST chosen?',
    answer: 'Compare your state with the place of supply. The same state splits GST into CGST and SGST. A different state applies IGST. Standard slabs are 0, 5, 12, 18, and 28 percent.',
  },
  {
    question: 'Can I send a quotation or a proforma?',
    answer: 'Yes. They use the same line items and GST preview, and they do not count as money owed. Convert one into a tax invoice when the work is confirmed.',
  },
  {
    question: 'Is the demo data real?',
    answer: 'Kaavya Studio in Bengaluru is sample data so you can click through a populated workspace. Create your own account for an empty one. GSTINs in the demo are fictional.',
  },
  {
    question: 'What happens if I delete a client who has invoices?',
    answer: 'LEKHA keeps the invoices. Mark the client inactive, or delete them only when they have no invoices.',
  },
];
