'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserList } from '@/components/users/user-list';
import { UserRegisterForm } from '@/components/users/user-register-form';

export default function UsersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUserCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Register New User</CardTitle>
          </CardHeader>
          <CardContent>
            <UserRegisterForm onSuccess={handleUserCreated} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UserList key={refreshKey} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
