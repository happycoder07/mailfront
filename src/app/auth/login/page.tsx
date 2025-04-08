import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { Mail, Lock, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold">Mail Manager</h1>
            <p className="text-blue-100 mt-1">Secure email management system</p>
          </div>
          <div className="p-6">
            <LoginForm />
          </div>
        </div>
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Don't have an account? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}
