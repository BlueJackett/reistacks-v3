// components/pricing-card.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { checkoutAction } from '@/lib/payments/actions';

export function PricingCard ( {
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
} )
{
  const handleSubmit = async ( event: React.FormEvent<HTMLFormElement> ) =>
  {
    event.preventDefault();
    const formData = new FormData( event.currentTarget );

    const result = await checkoutAction( formData );

    if ( result?.url )
    {
      // Redirect to the Stripe checkout page
      window.location.href = result.url;
    } else if ( result?.error )
    {
      // Handle the error (e.g., show a toast or alert)
      console.error( result.error );
    }
  };

  return (
    <div className="pt-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{ name }</h2>
      <p className="text-sm text-gray-600 mb-4">
        with { trialDays } day free trial
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${ price / 100 }{ ' ' }
        <span className="text-xl font-normal text-gray-600">
          per user / { interval }
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        { features.map( ( feature, index ) => (
          <li key={ index } className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{ feature }</span>
          </li>
        ) ) }
      </ul>
      <form onSubmit={ handleSubmit }>
        <input type="hidden" name="priceId" value={ priceId } />
        <Button type="submit">Get Started</Button>
      </form>
    </div>
  );
}