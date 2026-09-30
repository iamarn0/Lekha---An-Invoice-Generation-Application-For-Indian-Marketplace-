import { Link } from 'react-router-dom';
import { features, steps } from '../../content/marketing';
import { buttonClasses } from '../../components/ui/Button';
import { usePageMeta } from '../../hooks/usePageMeta';

export function FeaturesPage() {
  usePageMeta('Features', 'GST invoices, quotations, proformas, clients, PDFs, and analytics in one LEKHA workspace.');

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-accent">Product</p>
      <h1 className="mt-3 max-w-3xl font-serif text-4xl text-navy-900 sm:text-5xl">GST billing, kept to the work you repeat.</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        LEKHA covers the loop an Indian business repeats: who you bill, which state the supply is in, what you sent, and what cleared in rupees.
      </p>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-xl border border-line p-6">
            <feature.icon className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-navy-900">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{feature.text}</p>
          </article>
        ))}
      </div>
      <ol className="mt-12 grid gap-6 border-t border-line pt-10 md:grid-cols-3">
        {steps.map((step) => (
          <li key={step.number}>
            <p className="text-sm font-medium text-accent">{step.number}</p>
            <h2 className="mt-2 font-semibold text-navy-900">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
          </li>
        ))}
      </ol>
      <Link to="/register" className={`${buttonClasses()} mt-10`}>Start free</Link>
    </div>
  );
}
