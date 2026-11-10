import { ForgotPasswordForm } from '@/components/admin/auth-forms';
import { AuthShell } from '../auth-shell';
export default function ForgotPage() {
  return <AuthShell title="Reset your password" intro="Enter the email address of your volunteer account and we’ll send you a link to choose a new password."><ForgotPasswordForm /></AuthShell>;
}
