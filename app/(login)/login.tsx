'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { MultiStepSignUp } from '../../features/SignUpStepper/MultiStepSignUp';


export function Login ( {
  mode = 'signin',
  multiStep = false, // Add a prop for multi-step sign-up
}: {
  mode?: 'signin' | 'signup';
  multiStep?: boolean;
} )
{
  const searchParams = useSearchParams();
  const redirect = searchParams.get( 'redirect' );
  const priceId = searchParams.get( 'priceId' );
  const inviteId = searchParams.get( 'inviteId' );

  const [ state, formAction, pending ] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' },
  );

  // Render the multi-step sign-up form if enabled
  if ( mode === 'signup' && multiStep )
  {
    return <MultiStepSignUp />;
  }

  // Render the single-step sign-in/sign-up form
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          { mode === 'signin' ? 'Sign in to your account' : 'Create your account' }
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" action={ formAction }>
          <input type="hidden" name="redirect" value={ redirect || '' } />
          <input type="hidden" name="priceId" value={ priceId || '' } />
          <input type="hidden" name="inviteId" value={ inviteId || '' } />

          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={ state.email }
                required
                maxLength={ 50 }
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          { mode === 'signup' && (
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </Label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={ 100 }
                  className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          ) }

          { mode === 'signup' && !inviteId && (
            <div>
              <Label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                Organization Name
              </Label>
              <div className="mt-1">
                <Input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required
                  maxLength={ 100 }
                  className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your organization name"
                />
              </div>
            </div>
          ) }

          { mode === 'signup' && !inviteId && (
            <div>
              <Label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                Subdomain
              </Label>
              <div className="mt-1 flex rounded-full shadow-sm">
                <Input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  required
                  maxLength={ 63 }
                  pattern="[a-z0-9-]+"
                  className="appearance-none rounded-l-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="your-subdomain"
                />
                <span className="inline-flex items-center px-3 rounded-r-full border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  .{ process.env.NEXT_PUBLIC_ROOT_DOMAIN }
                </span>
              </div>
            </div>
          ) }

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={ mode === 'signin' ? 'current-password' : 'new-password' }
                defaultValue={ state.password }
                required
                minLength={ 8 }
                maxLength={ 100 }
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          { state?.error && <div className="text-red-500 text-sm">{ state.error }</div> }

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              disabled={ pending }
            >
              { pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Sign up'
              ) }
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                { mode === 'signin' ? 'New to our platform?' : 'Already have an account?' }
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={ `${ mode === 'signin' ? '/sign-up' : '/sign-in' }${ redirect ? `?redirect=${ redirect }` : '' }${ priceId ? `&priceId=${ priceId }` : '' }` }
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              { mode === 'signin' ? 'Create an account' : 'Sign in to existing account' }
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}