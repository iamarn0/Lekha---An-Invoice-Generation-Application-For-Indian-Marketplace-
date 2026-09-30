import { useState } from 'react';
import { settingsApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePageMeta } from '../../hooks/usePageMeta';
import { getErrorMessage } from '../../utils/errors';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Fields';
import { Card, CardHeader } from '../../components/ui/Card';
import { BUSINESS_TYPES, CURRENCIES, GST_SLABS, INDIAN_STATES } from '../../content/india';

export function SettingsPage() {
  const { user, setUser } = useAuth();
  usePageMeta('Settings', 'GSTIN, PAN, UPI, and invoice defaults for your LEKHA workspace.');
  const { push } = useToast();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    businessName: user?.businessName || '',
    address: user?.address || '',
    phone: user?.phone || '',
    gstin: user?.gstin || '',
    pan: user?.pan || '',
    state: user?.state || '',
    businessType: user?.businessType || '',
    upiId: user?.upiId || '',
    razorpayKeyId: user?.razorpayKeyId || '',
    currency: user?.currency || 'INR',
    taxRate: String(user?.taxRate ?? 18),
    invoicePrefix: user?.invoicePrefix || 'INV',
  });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  function update(event) {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await settingsApi.update({ ...profile, taxRate: Number(profile.taxRate) || 0 });
      setUser(response.data.data.user);
      push('Business profile saved');
    } catch (error) {
      push(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await settingsApi.password(password);
      setPassword({ currentPassword: '', newPassword: '' });
      push('Password updated');
    } catch (error) {
      push(getErrorMessage(error), 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  async function onLogo(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const response = await settingsApi.logo(file);
      setUser(response.data.data.user);
      push('Logo updated');
    } catch (error) {
      push(getErrorMessage(error), 'error');
    } finally {
      setUploading(false);
    }
  }

  async function removeLogo() {
    setUploading(true);
    try {
      const response = await settingsApi.removeLogo();
      setUser(response.data.data.user);
      push('Logo removed');
    } catch (error) {
      push(getErrorMessage(error), 'error');
    } finally {
      setUploading(false);
    }
  }

  const sections = [
    ['profile', 'Profile'],
    ['business', 'Business'],
    ['tax', 'Tax information'],
    ['invoices', 'Invoice settings'],
    ['payment', 'Payment details'],
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">Settings</h1>
      <p className="mt-1.5 text-sm text-muted">Business details, tax, and payment information used on your invoices.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-white hover:text-ink">{label}</a>
          ))}
          <a href="#logo" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-white hover:text-ink">Logo</a>
          <a href="#security" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-white hover:text-ink">Password</a>
        </nav>
        <div className="min-w-0">

      <form onSubmit={saveProfile} className="space-y-4">
        <Card id="profile">
          <CardHeader title="Profile" description="How you sign in to this workspace." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Input label="Your name" name="name" required value={profile.name} onChange={update} />
            <Input label="Email" name="email" type="email" required hint="This is also the sign-in email." value={profile.email} onChange={update} />
          </div>
        </Card>

        <Card id="business">
          <CardHeader title="Business" description="Printed on every invoice." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Input label="Business name" name="businessName" value={profile.businessName} onChange={update} />
            <Select label="Business type" name="businessType" value={profile.businessType} onChange={update}>
              <option value="">Select a type</option>
              {BUSINESS_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </Select>
            <div className="sm:col-span-2">
              <Textarea label="Address" name="address" value={profile.address} onChange={update} />
            </div>
            <Input label="Phone" name="phone" value={profile.phone} onChange={update} />
            <Select label="State" name="state" value={profile.state} onChange={update}>
              <option value="">Select state</option>
              {INDIAN_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </Select>
          </div>
        </Card>

        <Card id="tax">
          <CardHeader title="Tax information" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Input label="GSTIN" name="gstin" value={profile.gstin} onChange={update} autoComplete="off" />
            <Input label="PAN" name="pan" value={profile.pan} onChange={update} autoComplete="off" />
            <Select label="Default GST (%)" name="taxRate" value={profile.taxRate} onChange={update}>
              {(GST_SLABS.includes(Number(profile.taxRate)) ? GST_SLABS : [Number(profile.taxRate), ...GST_SLABS]).map((rate) => (
                <option key={rate} value={String(rate)}>{rate}%</option>
              ))}
            </Select>
          </div>
        </Card>

        <Card id="invoices">
          <CardHeader title="Invoice settings" description={user?.invoiceNextNumber ? `Next invoice: ${profile.invoicePrefix || 'INV'}-${user.invoiceNextNumber}` : ''} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Select label="Currency" name="currency" value={profile.currency} onChange={update}>
              {CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </Select>
            <Input label="Invoice prefix" name="invoicePrefix" value={profile.invoicePrefix} onChange={update} maxLength={8} />
          </div>
        </Card>

        <Card id="payment">
          <CardHeader title="Payment details" description="Shown on the invoice. LEKHA does not collect the payment." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Input label="UPI ID" name="upiId" value={profile.upiId} onChange={update} hint="Printed on the invoice." autoComplete="off" />
            <Input label="Razorpay key ID" name="razorpayKeyId" value={profile.razorpayKeyId} onChange={update} hint="Public key only, such as rzp_test_…. The secret is never stored." autoComplete="off" />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>Save changes</Button>
        </div>
      </form>

      <Card id="logo" className="mt-4">
        <CardHeader title="Logo" description="PNG, JPG, or WebP. 2 MB maximum." />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          {user?.logo ? <img src={user.logo} alt="Business logo" className="h-16 w-16 rounded-lg border border-line object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted">None</div>}
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-line bg-white px-4 text-sm font-medium">
              {uploading ? 'Uploading…' : 'Upload logo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onLogo} disabled={uploading} />
            </label>
            {user?.logo ? <Button variant="secondary" onClick={removeLogo} disabled={uploading}>Remove</Button> : null}
          </div>
        </div>
      </Card>

      <form id="security" onSubmit={savePassword} className="mt-4">
        <Card>
          <CardHeader title="Password" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Input label="Current password" type="password" autoComplete="current-password" required value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} />
            <Input label="New password" type="password" autoComplete="new-password" required value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} />
          </div>
          <div className="flex justify-end px-5 pb-5">
            <Button type="submit" loading={savingPassword}>Update password</Button>
          </div>
        </Card>
      </form>
        </div>
      </div>
    </div>
  );
}
