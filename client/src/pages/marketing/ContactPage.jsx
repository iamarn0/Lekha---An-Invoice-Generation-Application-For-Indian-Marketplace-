import { useState } from 'react';
import { contactApi } from '../../services/endpoints';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Fields';
import { getErrorMessage } from '../../utils/errors';
import { usePageMeta } from '../../hooks/usePageMeta';

const empty = { name: '', email: '', company: '', message: '' };

export function ContactPage() {
  usePageMeta('Contact', 'Contact LEKHA. This demo confirms the form and does not send email.');
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const [formError, setFormError] = useState('');

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (values.name.trim().length < 2) next.name = 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = 'Enter a valid email';
    if (values.message.trim().length < 10) next.message = 'Write at least a short note';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setFormError('');
    try {
      const response = await contactApi.submit(values);
      setDone(response.data.message);
      setValues(empty);
    } catch (error) {
      setFormError(getErrorMessage(error));
      setErrors(error.fieldErrors || {});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-sm font-medium text-accent">Contact</p>
        <h1 className="mt-3 font-serif text-4xl text-navy-900">Say hello.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          This portfolio demo confirms the form. It does not email anyone. When you deploy, connect the route to an inbox you control.
        </p>
        <p className="mt-6 text-sm text-navy-900">hello@lekha.app</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6 shadow-card" noValidate>
        {done ? <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{done}</p> : null}
        {formError ? <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" name="name" required value={values.name} onChange={update} error={errors.name} />
          <Input label="Email" name="email" type="email" required value={values.email} onChange={update} error={errors.email} />
        </div>
        <div className="mt-4">
          <Input label="Company" name="company" value={values.company} onChange={update} />
        </div>
        <div className="mt-4">
          <Textarea label="Message" name="message" required value={values.message} onChange={update} error={errors.message} />
        </div>
        <Button type="submit" className="mt-5" loading={loading}>Send note</Button>
      </form>
    </div>
  );
}
