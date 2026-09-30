export function formatMoney(amount, currency = 'INR') {
  const value = Number(amount) || 0;
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function formatRelative(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return formatDate(value);
}

export function toDateInput(value) {
  if (!value) {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysInput(days) {
  const base = new Date(`${toDateInput()}T12:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return toDateInput(base);
}

export function invoiceClient(invoice) {
  return (
    invoice?.clientSnapshot?.company
    || invoice?.clientSnapshot?.name
    || invoice?.client?.company
    || invoice?.client?.name
    || 'Client'
  );
}

export function contactName(record) {
  if (!record) return '';
  return record.name || record.clientSnapshot?.name || '';
}

export function greeting(name) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = String(name || '').trim().split(' ')[0];
  return first ? `${part}, ${first}` : part;
}

export function formatChange(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  const number = Number(value);
  if (number === 0) return null;
  const abs = Math.abs(number);
  const text = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  return `${number > 0 ? '↑' : '↓'} ${text}% from last month`;
}

export function compactMoney(value, currency = 'INR') {
  const amount = Number(value) || 0;
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (currency === 'INR') {
    if (abs >= 10000000) return `${sign}₹${trimCompact(abs / 10000000)}Cr`;
    if (abs >= 100000) return `${sign}₹${trimCompact(abs / 100000)}L`;
    if (abs >= 1000) return `${sign}₹${trimCompact(abs / 1000)}k`;
    return `${sign}₹${Math.round(abs)}`;
  }
  const symbol = currency === 'USD' ? '$' : '';
  if (abs >= 1000) return `${sign}${symbol}${trimCompact(abs / 1000)}k`;
  return `${sign}${symbol}${Math.round(abs)}`;
}

function trimCompact(value) {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1);
}
