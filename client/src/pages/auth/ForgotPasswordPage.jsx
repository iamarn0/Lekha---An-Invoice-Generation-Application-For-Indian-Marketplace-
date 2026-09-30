import { useState } from 'react';
import { authApi } from '../../services/endpoints';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Fields';
import { getErrorMessage } from '../../utils/errors';
import { usePageMeta } from '../../hooks/usePageMeta';
import { AuthLayout, AuthLink } from './AuthLayout';

export function ForgotPasswordPage() {
  usePageMeta('Forgot password', 'Request a password reset link for your LEKHA account.');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResetUrl('');
    try {
      const response = await authApi.forgot(email);
      setMessage(response.data.message);
      setResetUrl(response.data.data?.resetUrl || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email on the account. In this demo, the reset link is shown here because email delivery is not configured."
      alternate={<AuthLink to="/login">Back to log in</AuthLink>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
        {message ? <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
        <Input label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
        {resetUrl ? (
          <p className="rounded-lg border border-line bg-mist p-3 text-sm">
            Local demo link:{' '}
            <a className="break-all font-medium text-accent" href={resetUrl}>{resetUrl}</a>
          </p>
        ) : null}
      </form>
    </AuthLayout>
  );
}
