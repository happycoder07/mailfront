import { Metadata } from 'next';
import { ProfileForm } from '@/components/profile/profile-form';

export const metadata: Metadata = {
  title: 'Mail Manger - Profile',
  description: 'Manage your profile settings',
};

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>
      <ProfileForm />
    </div>
  );
}
