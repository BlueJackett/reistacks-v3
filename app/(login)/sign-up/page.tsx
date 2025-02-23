'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Login } from '../login';
import { TeamSignUp } from '../team-signup/team-signup';

//Example URLs
//1. Multi - Step Form( No Query Parameters )
//URL: /sign-up

//Behavior:

//The user sees the multi - step form for creating a new organization and account.

//2. VA Sign - Up Form( With inviteId )
//URL: /sign-up?inviteId=123&email=va@example.com

//Behavior:

//The user sees the VA sign - up form with their email pre - filled.

//The inviteId is passed to the server action to associate the VA with the correct organization.

export default function SignUpPage ()
{
  const searchParams = useSearchParams();
  const inviteId = searchParams.get( 'inviteId' );

  // If inviteId is present, show the VA sign-up form
  if ( inviteId )
  {
    return (
      <Suspense>
        <TeamSignUp />
      </Suspense>
    );
  }

  // Otherwise, show the regular sign-up form
  return (
    <Suspense>
      <Login mode="signup" multiStep={ true } />
    </Suspense>
  );
}