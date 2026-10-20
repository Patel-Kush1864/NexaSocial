import { SecurityCenterClient } from '@/components/admin/security/security-center-client';

export const metadata = {
  title: 'Security Center | NexaSocial Admin',
  description: 'Monitor authentication, sessions, suspicious activity, privileged actions, and security events across NexaSocial.',
};

export default function SecurityCenterPage() {
  return (
    <div className="p-6">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
        <p className="text-muted-foreground">
          Monitor authentication, sessions, suspicious activity, privileged actions, and security events across NexaSocial.
        </p>
      </div>

      <SecurityCenterClient />
    </div>
  );
}
