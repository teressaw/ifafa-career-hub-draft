'use client';
import { useActionState } from 'react';
import { deleteOpportunity, markVerified, setPublication, type FormState } from '@/app/admin/actions';
import type { PublicationState } from '@/lib/types';

function Result({ s }: { s: FormState }) {
  return s.message ? <p role={s.ok ? 'status' : 'alert'} className={`mt-3 text-sm ${s.ok ? 'text-open' : 'text-red-800'}`}>{s.message}</p> : null;
}

export function PublicationControls({ id, publication }: { id: string; publication: PublicationState }) {
  const [state, action, pending] = useActionState(setPublication, {});
  const btn = (to: PublicationState, text: string, cls = 'btn-secondary') => (
    <button name="state" value={to} className={`${cls} w-full`} disabled={pending}>{text}</button>
  );
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <div className="space-y-2">
        {publication !== 'published' && btn('published', 'Publish', 'btn-primary')}
        {publication === 'published' && btn('draft', 'Unpublish (back to draft)')}
        {publication !== 'archived' && btn('archived', 'Archive')}
        {publication === 'archived' && btn('draft', 'Restore to drafts')}
      </div>
      <Result s={state} />
    </form>
  );
}

export function VerifyControl({ id }: { id: string }) {
  const [state, action, pending] = useActionState(markVerified, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input type="checkbox" name="confirm" required className="mt-0.5 size-5 accent-[var(--color-forest)]" />
        <span>I checked the official source today and the listing is still accurate.</span>
      </label>
      <button className="btn-secondary mt-3 w-full" disabled={pending}>{pending ? 'Saving…' : 'Mark as verified today'}</button>
      <Result s={state} />
    </form>
  );
}

export function DeleteControl({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteOpportunity, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <label htmlFor="del-confirm" className="field-label">Type DELETE to permanently remove this listing</label>
      <input id="del-confirm" name="confirm" autoComplete="off" className="field" />
      <button className="btn-danger mt-3 w-full" disabled={pending}>Delete permanently</button>
      <Result s={state} />
    </form>
  );
}
