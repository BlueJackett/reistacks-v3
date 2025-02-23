// app/pricing/page.tsx
import { PricingCard } from '@/components/pricing-card';

export default function PricingPage ()
{
  const plans = [
    {
      name: 'Base',
      price: 800,
      interval: 'month',
      trialDays: 7,
      features: [ 'Unlimited Usage', 'Unlimited Workspace Members', 'Email Support' ],
      priceId: 'price_1QvinBEJl8DGHrbwFZf8oP9k', // Replace with your actual Stripe price ID
    },
    {
      name: 'Plus',
      price: 1200,
      interval: 'month',
      trialDays: 7,
      features: [ 'Everything in Base, and:', 'Early Access to New Features', '24/7 Support + Slack Access' ],
      priceId: 'price_1QvipAEJl8DGHrbwzbcRIbRZ', // Replace with your actual Stripe price ID
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
      { plans.map( ( plan ) => (
        <PricingCard key={ plan.name } { ...plan } />
      ) ) }
    </div>
  );
}