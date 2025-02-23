'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useSignUpStore } from '@/stores/useSignUpStore';

export function MultiStepSignUp ()
{
  const {
    step,
    formData,
    setFormData,
    nextStep,
    prevStep,
    reset,
  } = useSignUpStore();
  const [ loading, setLoading ] = useState( false );

  const handleSubmit = async () =>
  {
    setLoading( true );
    try
    {
      // Call your server action to create the account
      const response = await fetch( '/api/signup', {
        method: 'POST',
        body: JSON.stringify( formData ),
      } );
      if ( !response.ok ) throw new Error( 'Signup failed' );
      // Redirect to dashboard or next step
      window.location.href = '/dashboard';
    } catch ( error )
    {
      console.error( error );
      alert( 'Signup failed. Please try again.' );
    } finally
    {
      setLoading( false );
      reset(); // Reset the form after submission
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          { step === 1 && <Step1 /> }
          { step === 2 && <Step2 /> }
          { step === 3 && <Step3 /> }
          { step === 4 && <Step4 onSubmit={ handleSubmit } loading={ loading } /> }
        </div>
      </div>
    </div>
  );
}