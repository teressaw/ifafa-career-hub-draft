'use client';
import { useActionState } from 'react';
import { dismissSuggestion, type FormState } from '@/app/admin/actions';

export function DismissButton({ id }: { id: string }) {
  const [state, act, pending] = useActionState(dismissSuggestion, {} as FormState);
  return (
    <form action={act} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button className="btn-secondary min-h-10" disabled={pending}>Not relevant</button>
      {state.message && <span role="status" className="text-sm text-muted">{state.message}</span>}
    </form>
  );
}
