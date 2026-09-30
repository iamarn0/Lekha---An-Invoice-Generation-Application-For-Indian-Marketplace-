import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Fields';
import { getErrorMessage } from '../../utils/errors';
import { usePageMeta } from '../../hooks/usePageMeta';
import { AuthLayout, AuthLink } from './AuthLayout';

export function LoginPage() {
  usePageMeta('Log in', 'Log in to LEKHA or open the Kaavya Studio demo workspace.');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [values, setValues] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get('demo') === '1') {
      setValues({ email: 'demo@lekha.app', password: 'Demo1234!' });
    }
  }, [params]);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(values);
      navigate(location.state?.from || '/app', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your workspace. You’ll stay signed in on this device for 7 days."
      alternate={<>New to LEKHA? <AuthLink to="/register">Create a workspace</AuthLink></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
        <Input label="Email" name="email" type="email" autoComplete="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
        <div className="relative">
          <Input label="Password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className="pr-14" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} />
          <button type="button" className="absolute right-3 top-9 text-xs font-medium text-muted" onClick={() => setShow((value) => !value)}>
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="text-right text-sm">
          <AuthLink to="/forgot-password">Forgot password?</AuthLink>
        </div>
        <Button type="submit" className="w-full" loading={loading}>Log in</Button>
      </form>
      <div className="mt-6 rounded-xl border border-line bg-mist p-4 text-sm">
        <p className="font-medium text-navy-900">Explore the demo workspace</p>
        <p className="mt-1 text-muted">demo@lekha.app · Demo1234!</p>
        <button type="button" className="mt-3 text-sm font-medium text-accent" onClick={() => setValues({ email: 'demo@lekha.app', password: 'Demo1234!' })}>
          Use demo account
        </button>
      </div>
    </AuthLayout>
  );
}
