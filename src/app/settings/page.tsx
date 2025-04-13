import { Metadata } from 'next';
import { SettingsForm } from '@/components/settings/settings-form';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage system settings',
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and email server configuration.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
