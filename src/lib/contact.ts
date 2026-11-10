/**
 * IFAFA's contact address for "Get updates" and "Suggest a resource".
 * Set NEXT_PUBLIC_CONTACT_EMAIL in Vercel. Until it is set, those buttons are hidden rather than pointing nowhere.
 */
export function contactEmail(): string | null {
  const e = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '').trim();
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(e) ? e : null;
}
export const mailto = (email: string, subject: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}`;
