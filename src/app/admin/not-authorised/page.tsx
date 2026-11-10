import { signOut } from '../actions';
import { AuthShell } from '../auth-shell';
export default function NotAuthorised() {
  return (
    <AuthShell title="Not authorised" intro="You are signed in, but your account has not been given access to manage listings. Ask an IFAFA administrator to add you as a volunteer editor.">
      <form action={signOut}><button className="btn-secondary">Sign out</button></form>
    </AuthShell>
  );
}
