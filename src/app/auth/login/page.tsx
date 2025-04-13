import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { Mail, Lock, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-xl overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold">NCCC Mail Manager</h1>
            <p className="text-primary-foreground/80 mt-1">Secure email management system</p>
          </div>
          <div className="p-6">
            <LoginForm />
          </div>
        </div>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Don't have an account? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}
