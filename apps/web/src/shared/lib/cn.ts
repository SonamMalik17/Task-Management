import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine class names with proper Tailwind conflict resolution.
// `clsx` handles conditional/array inputs; `twMerge` dedups conflicting
// utilities (e.g. "px-2 px-4" → "px-4").
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
