// components/pricing-form.tsx
'use client';

import { SubmitButton } from '@/app/(marketing)/pricing/submit-button';
import { checkoutAction } from '@/lib/payments/actions';


export function PricingForm ( { priceId }: { priceId?: string } )
{
  return (
    <form
      action={ async ( formData: FormData ) =>
      {
        const result = await checkoutAction( formData );
        if ( result && 'error' in result )
        {
          throw new Error( result.error );
        }
      } }
    >
      <input type="hidden" name="priceId" value={ priceId } />
      <SubmitButton />
    </form>
  );
}