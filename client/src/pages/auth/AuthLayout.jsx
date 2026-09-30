import { Link } from 'react-router-dom';
import { Logo } from '../../components/layout/Logo';

export function AuthLayout({ title, subtitle, children, alternate }) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <section className="ledger-lines hidden flex-col justify-between border-r border-line bg-white p-12 lg:flex">
        <Logo to="/" />
        <div>
          <p className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-ink">A modern ledger for Indian businesses.</p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>CGST, SGST, and IGST from the place of supply</li>
            <li>Quotations, proformas, and tax invoices</li>
            <li>UPI on the PDF, collections in rupees</li>
          </ul>
        </div>
        <p className="text-sm text-faint">Demo workspace · demo@lekha.app</p>
      </section>
      <section className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo to="/" /></div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-muted">{alternate}</p>
        </div>
      </section>
    </div>
  );
}

export function AuthLink({ to, children }) {
  return <Link to={to} className="font-medium text-accent hover:text-accent-hover">{children}</Link>;
}
