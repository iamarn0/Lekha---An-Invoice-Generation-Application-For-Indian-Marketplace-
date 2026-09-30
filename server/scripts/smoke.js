const base = process.env.API_URL || 'http://127.0.0.1:5000/api';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, { method = 'GET', token, body, cookie } = {}) {
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  return { status: response.status, data, headers: response.headers, raw: text };
}

async function main() {
  const health = await request('/health');
  assert(health.status === 200 && health.data.data.status === 'ok', 'Health check failed');

  const badLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'demo@lekha.app', password: 'wrong-password' },
  });
  assert(badLogin.status === 401, 'Wrong password should be rejected');

  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: 'demo@lekha.app', password: 'Demo1234!' },
  });
  assert(login.status === 200, `Demo login failed: ${login.data?.message || login.status}`);
  const token = login.data.data.token;
  const user = login.data.data.user;
  assert(token, 'Login did not return a token');
  assert(!JSON.stringify(user).includes('password'), 'Password hash was returned');
  assert(user.businessName === 'Kaavya Studio', 'Demo business was not seeded');
  assert(user.currency === 'INR', 'Demo currency should be INR');
  assert(user.gstin === '29AAPFM1234Q1Z8', 'Demo GSTIN was not seeded');

  const setCookie = typeof login.headers.getSetCookie === 'function' ? login.headers.getSetCookie() : [];
  assert(setCookie.length > 0, 'Login did not set an httpOnly cookie');
  const cookie = setCookie.map((item) => item.split(';')[0]).join('; ');
  assert(/httponly/i.test(setCookie[0]), 'Auth cookie is not httpOnly');

  const me = await request('/auth/me', { cookie });
  assert(me.status === 200 && me.data.data.user.email === 'demo@lekha.app', 'Cookie session failed');

  const clients = await request('/clients?search=Filter%20Coffee&limit=5', { token });
  assert(clients.status === 200, 'Client search failed');
  assert(clients.data.data.items.some((item) => item.company === 'Filter Coffee Co.'), 'Filter Coffee was not found');

  const outstanding = await request('/clients?status=outstanding&limit=20', { token });
  assert(outstanding.status === 200 && outstanding.data.data.items.length > 0, 'Outstanding client filter failed');

  const createdClient = await request('/clients', {
    method: 'POST',
    token,
    body: {
      name: 'Smoke Tester',
      company: 'Smoke Co',
      email: `smoke.${Date.now()}@invoiceflow.test`,
      phone: '555-0100',
      address: '1 Test Street',
    },
  });
  assert(createdClient.status === 201, `Create client failed: ${createdClient.data?.message}`);
  const clientId = createdClient.data.data._id;

  const updatedClient = await request(`/clients/${clientId}`, {
    method: 'PUT',
    token,
    body: { ...createdClient.data.data, company: 'Smoke Company' },
  });
  assert(updatedClient.status === 200 && updatedClient.data.data.company === 'Smoke Company', 'Update client failed');

  const deletedClient = await request(`/clients/${clientId}`, { method: 'DELETE', token });
  assert(deletedClient.status === 200, `Delete client failed: ${deletedClient.data?.message}`);

  const clientList = await request('/clients?limit=1', { token });
  const billTo = clientList.data.data.items[0]._id;
  const createdInvoice = await request('/invoices', {
    method: 'POST',
    token,
    body: {
      client: billTo,
      issueDate: '2026-09-01',
      dueDate: '2026-09-20',
      status: 'draft',
      taxRate: 18,
      placeOfSupply: '29',
      documentType: 'tax_invoice',
      discount: 0,
      discountType: 'percent',
      notes: 'Smoke test invoice',
      items: [{ description: 'Consulting', quantity: 2, unitPrice: 100, hsn: '998311' }],
    },
  });
  assert(createdInvoice.status === 201, `Create invoice failed: ${createdInvoice.data?.message}`);
  const invoice = createdInvoice.data.data;
  assert(invoice.subtotal === 200, `Subtotal expected 200, got ${invoice.subtotal}`);
  assert(invoice.taxAmount === 36, `GST expected 36, got ${invoice.taxAmount}`);
  assert(invoice.cgstAmount === 18 && invoice.sgstAmount === 18 && invoice.igstAmount === 0, 'Intra-state GST should split into CGST and SGST');
  assert(invoice.grandTotal === 236, `Total expected 236, got ${invoice.grandTotal}`);
  assert(invoice.outstanding === 236, 'Draft tax invoice should be outstanding');
  assert(invoice.supplyType === 'intra', 'Bengaluru to Karnataka should be intra-state');

  const inter = await request('/invoices', {
    method: 'POST',
    token,
    body: {
      client: billTo,
      issueDate: '2026-09-01',
      dueDate: '2026-09-20',
      status: 'draft',
      taxRate: 18,
      placeOfSupply: '27',
      documentType: 'quotation',
      discount: 0,
      discountType: 'percent',
      notes: 'Smoke quotation',
      items: [{ description: 'Consulting', quantity: 2, unitPrice: 100 }],
    },
  });
  assert(inter.status === 201, `Inter-state quotation failed: ${inter.data?.message}`);
  assert(inter.data.data.supplyType === 'inter' && inter.data.data.igstAmount === 36, 'Inter-state supply should use IGST');
  assert(inter.data.data.outstanding === 0, 'A quotation should not be outstanding');
  const converted = await request(`/invoices/${inter.data.data._id}/convert`, { method: 'POST', token });
  assert(converted.status === 200 && converted.data.data.documentType === 'tax_invoice' && converted.data.data.outstanding === 236, 'Convert to tax invoice failed');
  await request(`/invoices/${inter.data.data._id}`, { method: 'DELETE', token });

  const filtered = await request('/invoices?status=draft&search=' + encodeURIComponent(invoice.invoiceNumber), { token });
  assert(filtered.data.data.items.some((item) => item._id === invoice._id), 'Invoice filter/search missed the new draft');

  const sent = await request(`/invoices/${invoice._id}/send`, { method: 'POST', token });
  assert(sent.status === 200 && sent.data.data.status === 'sent', 'Send invoice failed');

  const paid = await request(`/invoices/${invoice._id}/status`, {
    method: 'PATCH',
    token,
    body: { status: 'paid' },
  });
  assert(paid.status === 200 && paid.data.data.status === 'paid' && paid.data.data.outstanding === 0, 'Mark paid failed');

  const copy = await request(`/invoices/${invoice._id}/duplicate`, { method: 'POST', token });
  assert(copy.status === 201 && copy.data.data.status === 'draft', 'Duplicate invoice failed');

  const pdfRes = await fetch(`${base}/invoices/${invoice._id}/pdf`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
  assert(pdfRes.status === 200, 'PDF request failed');
  assert(pdfRes.headers.get('content-type')?.includes('application/pdf'), 'PDF content type missing');
  assert(pdfBuffer.subarray(0, 4).toString() === '%PDF', 'PDF payload is not a PDF');

  await request(`/invoices/${copy.data.data._id}`, { method: 'DELETE', token });
  await request(`/invoices/${invoice._id}`, { method: 'DELETE', token });

  const dashboard = await request('/analytics/dashboard', { token });
  assert(dashboard.status === 200, 'Dashboard analytics failed');
  assert(dashboard.data.data.stats.totalRevenue > 0, 'Seeded revenue is missing');
  assert(dashboard.data.data.revenueByMonth.length === 6, 'Revenue series should cover 6 months');
  assert(dashboard.data.data.statusDistribution.some((item) => item.status === 'paid' && item.count > 0), 'Paid status missing');

  const analytics = await request('/analytics?months=12', { token });
  assert(analytics.status === 200 && analytics.data.data.revenueTrends.length === 12, '12 month analytics failed');
  assert(analytics.data.data.clientGrowth.filter((item) => item.clients > 0).length >= 2, 'Client growth was not spread across months');
  assert(dashboard.data.data.revenueByMonth.filter((item) => item.revenue > 0).length >= 4, 'Revenue was not spread across months');

  const search = await request('/search?q=Filter%20Coffee', { token });
  assert(search.data.data.clients.length > 0, 'Global client search failed');
  const invoiceSearch = await request('/search?q=INV-1042', { token });
  assert(invoiceSearch.data.data.invoices.some((item) => item.invoiceNumber === 'INV-1042'), 'Global invoice search failed');

  const activity = await request('/activity?limit=5', { token });
  assert(activity.status === 200 && activity.data.data.items.length > 0, 'Activity feed is empty');

  const originalPhone = user.phone;
  const settings = await request('/settings', {
    method: 'PUT',
    token,
    body: {
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      address: user.address,
      phone: '+91 80 4000 1122',
      gstin: user.gstin,
      pan: user.pan,
      state: user.state,
      upiId: user.upiId,
      razorpayKeyId: user.razorpayKeyId,
      businessType: user.businessType,
      taxNumber: user.taxNumber,
      currency: user.currency,
      taxRate: user.taxRate,
      invoicePrefix: user.invoicePrefix,
    },
  });
  assert(settings.status === 200 && settings.data.data.user.phone === '+91 80 4000 1122', 'Settings update failed');
  await request('/settings', {
    method: 'PUT',
    token,
    body: {
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      address: user.address,
      phone: originalPhone,
      gstin: user.gstin,
      pan: user.pan,
      state: user.state,
      upiId: user.upiId,
      razorpayKeyId: user.razorpayKeyId,
      businessType: user.businessType,
      taxNumber: user.taxNumber,
      currency: user.currency,
      taxRate: user.taxRate,
      invoicePrefix: user.invoicePrefix,
    },
  });

  const stamp = Date.now();
  const email = `smoke.${stamp}@invoiceflow.test`;
  const registered = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Smoke User', email, password: 'Smoke1234' },
  });
  assert(registered.status === 201, `Register failed: ${registered.data?.message}`);
  assert(registered.data.data.user.currency === 'INR' && registered.data.data.user.taxRate === 18, 'New workspaces should default to INR and 18% GST');
  assert(!JSON.stringify(registered.data.data.user).includes('password'), 'Register returned a password');

  const forgot = await request('/auth/forgot-password', { method: 'POST', body: { email } });
  assert(forgot.status === 200 && forgot.data.data?.resetUrl, 'Reset link was not returned in development');
  const resetToken = forgot.data.data.resetUrl.split('/').pop();
  const reset = await request('/auth/reset-password', {
    method: 'POST',
    body: { token: resetToken, password: 'Smoke5678' },
  });
  assert(reset.status === 200, `Reset password failed: ${reset.data?.message}`);
  const relogin = await request('/auth/login', {
    method: 'POST',
    body: { email, password: 'Smoke5678' },
  });
  assert(relogin.status === 200, 'Login after reset failed');

  const contact = await request('/contact', {
    method: 'POST',
    body: { name: 'Ada', email: 'ada@example.com', message: 'Hello from the smoke test.' },
  });
  assert(contact.status === 200, 'Contact form failed');

  const missing = await request('/does-not-exist', { token });
  assert(missing.status === 404, 'Unknown API route should 404');

  const logout = await request('/auth/logout', { method: 'POST', token });
  assert(logout.status === 200, 'Logout failed');

  console.log('Smoke test passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
