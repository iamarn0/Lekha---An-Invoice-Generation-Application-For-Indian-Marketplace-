import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Fields';
import { getErrorMessage } from '../../utils/errors';
import { usePageMeta } from '../../hooks/usePageMeta';
import { AuthLayout } from './AuthLayout';

export function ResetPasswordPage() {
  usePageMeta('Choose a new password', 'Set a new LEKHA password from your reset link.');
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Use 8 or more characters, with a letter and a number');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authApi.reset({ token, password });
      setUser(response.data.data.user);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="This link expires one hour after it was created.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
        <Input label="New password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        <Input label="Confirm password" type="password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        <Button type="submit" className="w-full" loading={loading}>Update password</Button>
      </form>
    </AuthLayout>
  );
}
