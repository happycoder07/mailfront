import { Metadata } from 'next';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';


export const metadata: Metadata = {
  title: 'Mail Manager - Login',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-xl overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Mail Manager" width={120} height={32} />
              {/* <Shield className="h-12 w-12" /> */}
            </div>
            <h1 className="text-2xl font-bold">Mail Manager</h1>
            <p className="text-primary-foreground/80 mt-1">Secure email management system</p>
          </div>
          <div className="p-6">
            <LoginForm />
          </div>
        </div>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Don&apos;t have an account? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}
