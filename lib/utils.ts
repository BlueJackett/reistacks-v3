import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function normalizeSubdomain(subdomain: string) {
  return subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
}