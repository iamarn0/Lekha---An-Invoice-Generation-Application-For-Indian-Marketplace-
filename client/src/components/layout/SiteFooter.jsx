import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            GST invoices, quotations, and UPI for Indian businesses.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-navy-900">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link to="/features" className="hover:text-navy-900">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-navy-900">Pricing</Link></li>
            <li><Link to="/login?demo=1" className="hover:text-navy-900">Live demo</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-navy-900">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link to="/contact" className="hover:text-navy-900">Contact</Link></li>
            <li><Link to="/register" className="hover:text-navy-900">Create a workspace</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs leading-5 text-muted sm:px-6">
          LEKHA records invoice status and prints a UPI ID. Razorpay checkout is a placeholder and does not charge payments.
        </p>
      </div>
    </footer>
  );
}
