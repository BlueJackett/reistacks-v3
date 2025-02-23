'use client';

import { useSignUpStore } from '@/stores/useSignUpStore';
import { useState } from 'react';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import { signUp } from '@/app/(login)/actions';


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
      // Call the server action directly
      const result = await signUp(
        {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          organizationName: formData.organizationName,
          subdomain: formData.subdomain,
          inviteId: '', // Pass inviteId if applicable
        },
        new FormData(), // Pass a FormData object (can be empty if not used)
      );

      if ( result?.error )
      {
        throw new Error( result.error );
      }

      // Redirect to dashboard on success
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