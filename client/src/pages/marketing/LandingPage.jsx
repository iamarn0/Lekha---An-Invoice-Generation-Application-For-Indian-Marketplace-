import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { buttonClasses } from '../../components/ui/Button';
import { faqs, features, plans, steps, testimonials } from '../../content/marketing';
import { usePageMeta } from '../../hooks/usePageMeta';

export function LandingPage() {
  usePageMeta(
    'GST invoices for Indian businesses',
    'LEKHA is GST invoicing for Indian businesses. Tax invoices, quotations, and proformas with CGST, SGST, IGST, and UPI.'
  );

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(67,56,202,0.08),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="text-sm font-medium text-accent">For Indian MSMEs, freelancers, and agencies</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-navy-900 sm:text-5xl lg:text-6xl">
              GST invoices for the way India does business.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
              LEKHA raises tax invoices, quotations, and proformas in INR. CGST, SGST, and IGST follow the place of supply. UPI sits on the bill.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className={buttonClasses({ size: 'lg' })}>Start free</Link>
              <Link to="/login?demo=1" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
                View the demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">No card required. The demo workspace is already full of sample work.</p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="border-y border-line bg-mist">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-5 text-sm text-muted sm:px-6">
          <span className="font-medium text-navy-900">Built for</span>
          {['Freelancers', 'Agencies', 'Consultants', 'Manufacturers', 'Logistics'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="max-w-2xl">
          <h2 className="font-serif text-3xl text-navy-900 sm:text-4xl">The bill your client already knows how to read.</h2>
          <p className="mt-3 text-muted">GSTIN, place of supply, and a UPI ID. The rest of the workspace stays quiet.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-line bg-white p-5 shadow-card">
              <feature.icon className="h-5 w-5 text-accent" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold text-navy-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-navy-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number}>
              <p className="font-serif text-3xl text-slate-400">{step.number}</p>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl text-navy-900">Sample stories</h2>
          <p className="text-xs text-muted">Illustrative, from the demo workspace.</p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.name} className="rounded-xl border border-line bg-white p-5 shadow-card">
              <blockquote className="text-sm leading-6 text-ink">“{item.quote}”</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-medium text-navy-900">{item.name}</span>
                <span className="text-muted"> · {item.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-mist">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-serif text-3xl text-navy-900">Simple pricing for the demo</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">Paid tiers are illustrative. There is no checkout. Create a workspace and use the product.</p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`rounded-xl border bg-white p-6 shadow-card ${plan.featured ? 'border-accent' : 'border-line'}`}>
                {plan.featured ? <p className="text-xs font-medium uppercase tracking-wide text-accent">Most teams</p> : <p className="text-xs text-muted">Plan</p>}
                <h3 className="mt-2 text-lg font-semibold text-navy-900">{plan.name}</h3>
                <p className="mt-3 font-serif text-4xl text-navy-900">{plan.price}</p>
                <p className="mt-1 text-sm text-muted">{plan.detail}</p>
                <ul className="mt-5 space-y-2 text-sm text-ink">
                  {plan.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
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
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-3xl text-navy-900">Questions</h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {faqs.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-navy-900">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="text-muted group-open:rotate-45" aria-hidden="true">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl bg-navy-900 px-6 py-10 text-white sm:px-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-serif text-3xl">Open the demo, or start empty.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">The sample workspace is Kaavya Studio, Bengaluru. Your own workspace starts empty.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link to="/login?demo=1" className={buttonClasses({ variant: 'secondary' })}>View demo</Link>
            <Link to="/register" className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-navy-900">Start free</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductPreview() {
  const bars = [42, 48, 46, 58, 64, 70];
  return (
    <div className="rounded-2xl border border-line bg-white p-3 shadow-lift" aria-hidden="true">
      <div className="rounded-xl border border-line bg-mist">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-2 text-xs text-muted">Kaavya Studio · Bengaluru</span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {[
            ['Total revenue', '₹12.4L'],
            ['Outstanding', '₹1.8L'],
            ['Paid invoices', '15'],
            ['Active clients', '8'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-white px-3 py-3">
              <p className="text-[11px] text-muted">{label}</p>
              <p className="mt-1 text-lg font-semibold text-navy-900">{value}</p>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <div className="flex h-24 items-end gap-2 rounded-lg border border-line bg-white px-3 py-3">
            {bars.map((height) => (
              <span key={height} className="flex-1 rounded-sm bg-accent/80" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
