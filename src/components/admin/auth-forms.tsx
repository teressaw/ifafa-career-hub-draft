'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { requestPasswordReset, signIn, updatePassword, type FormState } from '@/app/admin/actions';

function Message({ state }: { state: FormState }) {
  if (!state.message) return null;
  return <p role={state.ok ? 'status' : 'alert'} className={`rounded-xl px-4 py-3 text-sm ${state.ok ? 'bg-open-bg text-open' : 'bg-red-50 text-red-800'}`}>{state.message}</p>;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="space-y-4">
      <Message state={state} />
      <div><label htmlFor="email" className="field-label">Email address</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /></div>
      <div><label htmlFor="password" className="field-label">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="field" /></div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
      <p className="text-center text-sm"><Link href="/admin/forgot-password" className="font-semibold text-forest hover:underline">Forgotten your password?</Link></p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-4">
      <Message state={state} />
      <div><label htmlFor="email" className="field-label">Email address</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /></div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'Sending…' : 'Send reset link'}</button>
      <p className="text-center text-sm"><Link href="/admin/login" className="font-semibold text-forest hover:underline">Back to sign in</Link></p>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <form action={action} className="space-y-4">
      <Message state={state} />
      <div><label htmlFor="password" className="field-label">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required className="field" aria-describedby="pw-hint" />
        <span id="pw-hint" className="field-hint">At least 12 characters. A short phrase is easier to remember than a complex word.</span>
        {state.errors?.password && <span className="mt-1 block text-sm text-red-800">{state.errors.password}</span>}</div>
      <div><label htmlFor="confirm" className="field-label">Confirm new password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" />
        {state.errors?.confirm && <span className="mt-1 block text-sm text-red-800">{state.errors.confirm}</span>}</div>
      <button className="btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Set password'}</button>
    </form>
  );
}
