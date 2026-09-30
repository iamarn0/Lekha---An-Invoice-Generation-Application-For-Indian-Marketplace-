import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Fields';
import { fieldErrorsOf, getErrorMessage } from '../../utils/errors';
import { usePageMeta } from '../../hooks/usePageMeta';
import { AuthLayout, AuthLink } from './AuthLayout';

export function RegisterPage() {
  usePageMeta('Create a workspace', 'Create a LEKHA workspace with your name, email, and password.');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (values.name.trim().length < 2) next.name = 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = 'Enter a valid email';
    if (values.password.length < 8 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
      next.password = 'Use 8 or more characters, with a letter and a number';
    }
    if (values.password !== values.confirm) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setFormError('');
    try {
      await register({ name: values.name, email: values.email, password: values.password });
      navigate('/app', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
      setErrors(fieldErrorsOf(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Start with an empty account. You can add a business profile after you sign in."
      alternate={<>Already have an account? <AuthLink to="/login">Log in</AuthLink></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p> : null}
        <Input label="Name" name="name" autoComplete="name" required value={values.name} onChange={update} error={errors.name} />
        <Input label="Email" name="email" type="email" autoComplete="email" required value={values.email} onChange={update} error={errors.email} />
        <Input label="Password" name="password" type="password" autoComplete="new-password" required hint="8 or more characters, with a letter and a number." value={values.password} onChange={update} error={errors.password} />
        <Input label="Confirm password" name="confirm" type="password" autoComplete="new-password" required value={values.confirm} onChange={update} error={errors.confirm} />
        <Button type="submit" className="w-full" loading={loading}>Create workspace</Button>
      </form>
    </AuthLayout>
  );
}
