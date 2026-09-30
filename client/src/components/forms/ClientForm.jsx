import { useState } from 'react';
import { Input, Select, Textarea } from '../ui/Fields';
import { Button } from '../ui/Button';
import { INDIAN_STATES } from '../../content/india';

const empty = { name: '', company: '', email: '', phone: '', address: '', gstin: '', pan: '', state: '', status: 'active' };

export function ClientForm({ initial = empty, submitting, onSubmit, onCancel, submitLabel = 'Save client' }) {
  const [values, setValues] = useState({ ...empty, ...initial });
  const [errors, setErrors] = useState({});

  function update(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (values.name.trim().length < 2) next.name = 'Enter the client name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = 'Enter a valid email';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input label="Name" name="name" required value={values.name} onChange={update} error={errors.name} />
      <Input label="Company" name="company" value={values.company} onChange={update} />
      <Input label="Email" name="email" type="email" required value={values.email} onChange={update} error={errors.email} />
      <Input label="Phone" name="phone" value={values.phone} onChange={update} />
      <Textarea label="Address" name="address" value={values.address} onChange={update} />
      <Select label="State" name="state" value={values.state || ''} onChange={update}>
        <option value="">Select state</option>
        {INDIAN_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </Select>
      <Input label="GSTIN" name="gstin" value={values.gstin || ''} onChange={update} />
      <Input label="PAN" name="pan" value={values.pan || ''} onChange={update} />
      <Select label="Status" name="status" value={values.status} onChange={update}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel ? <Button variant="secondary" onClick={onCancel}>Cancel</Button> : null}
        <Button type="submit" loading={submitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
