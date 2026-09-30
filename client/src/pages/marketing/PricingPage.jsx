import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { faqs, plans } from '../../content/marketing';
import { buttonClasses } from '../../components/ui/Button';
import { usePageMeta } from '../../hooks/usePageMeta';

export function PricingPage() {
  usePageMeta('Pricing', 'Demo pricing for LEKHA in rupees. Create a free workspace. There is no live checkout.');

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-accent">Pricing</p>
      <h1 className="mt-3 font-serif text-4xl text-navy-900 sm:text-5xl">Demo plans. No checkout.</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Starter is the product you can use today. Studio and Business show how a paid lineup would read. Nothing is charged.
      </p>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`rounded-xl border bg-white p-6 shadow-card ${plan.featured ? 'border-accent' : 'border-line'}`}>
            <h2 className="text-lg font-semibold text-navy-900">{plan.name}</h2>
            <p className="mt-4 font-serif text-4xl text-navy-900">{plan.price}</p>
            <p className="mt-1 text-sm text-muted">{plan.detail}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {plan.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <Link to="/register" className={buttonClasses({ variant: plan.featured ? 'primary' : 'secondary', className: 'mt-6 w-full' })}>
              Create a workspace
            </Link>
          </article>
        ))}
      </div>
      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-serif text-3xl text-navy-900">Questions</h2>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {faqs.map((item) => (
            <details key={item.question} className="py-4">
              <summary className="cursor-pointer text-sm font-medium text-navy-900">{item.question}</summary>
              <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
