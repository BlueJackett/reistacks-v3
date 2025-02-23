'use client';

import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signUp } from '../actions';
import { ActionState } from '@/lib/auth/middleware';


export function TeamSignUp ()
{
  const searchParams = useSearchParams();
  const inviteId = searchParams.get( 'inviteId' ); // Get inviteId from the URL
  const email = searchParams.get( 'email' ); // Get email from the URL

  const [ state, formAction, pending ] = useActionState<ActionState, FormData>(
    signUp,
    { error: '' },
  );

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Join as a Virtual Assistant</h2>
          <form className="space-y-4" action={ formAction }>
            {/* Pass inviteId as a hidden input */ }
            <input type="hidden" name="inviteId" value={ inviteId || '' } />
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={ email || '' }
                required
                disabled={ !!email } // Disable if email is pre-filled
              />
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            { state?.error && <div className="text-red-500 text-sm">{ state.error }</div> }
            <Button type="submit" className="w-full" disabled={ pending }>
              { pending ? <Loader2 className="animate-spin" /> : 'Join' }
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}