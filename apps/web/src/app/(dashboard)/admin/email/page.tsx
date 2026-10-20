import { Metadata } from 'next';
import { EmailManagementClient } from '@/components/admin/email/email-management-client';

export const metadata: Metadata = {
  title: 'Email System | NexaSocial Admin',
  description: 'Manage automated email delivery, SMTP server status, and event logs.',
};

export default function AdminEmailPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <EmailManagementClient />
    </div>
  );
}
