// utils/organizations.ts
import { headers } from 'next/headers';

export async function getCurrentOrganization() {
  const headersList = headers();
  return {
    id: ( await headersList ).get('x-organization-id'),
    name: ( await headersList ).get('x-organization-name'),
  };
}