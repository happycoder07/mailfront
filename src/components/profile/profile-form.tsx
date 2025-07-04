'use client';

import { useState, useEffect, useId } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { User, Mail, Lock, Save, Loader2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';

type Profile = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: string[];
};

export function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const { getCSRFToken } = useAuth();
  const emailId = useId();
  const roleId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const emailDescId = useId();
  const roleDescId = useId();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
          headers: {
            'X-XSRF-TOKEN': getCSRFToken()
          },
          credentials: 'include',

        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data);
        setFormData(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
        }));
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile information',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate passwords if changing
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast({
            title: 'Error',
            description: 'New passwords do not match',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
      }

      const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" role="region" aria-label="Loading profile information">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Loading profile information</span>
      </div>
    );
  }

  return (
    <div role="main" aria-labelledby="profile-form-title">
      <h1 id="profile-form-title" className="sr-only">Profile Information</h1>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" aria-hidden="true" />
            Profile Information
          </CardTitle>
          <CardDescription>View and update your profile information</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} aria-label="Profile update form" noValidate>
          <CardContent className="space-y-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={emailId}>Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id={emailId}
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                    aria-describedby={emailDescId}
                    aria-label="Email address (read-only)"
                  />
                </div>
                <p id={emailDescId} className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={roleId}>Role</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id={roleId}
                    value={profile?.role || ''}
                    disabled
                    className="bg-muted"
                    aria-describedby={roleDescId}
                    aria-label="User role (read-only)"
                  />
                </div>
                <p id={roleDescId} className="text-xs text-muted-foreground">Role cannot be changed</p>
              </div>
            </div>

            {profile?.firstName && profile?.lastName && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={firstNameId}>First Name</Label>
                  <Input
                    id={firstNameId}
                    name="firstName"
                    value={formData.firstName}
                    disabled
                    className="bg-muted"
                    aria-label="First name (read-only)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={lastNameId}>Last Name</Label>
                  <Input
                    id={lastNameId}
                    name="lastName"
                    value={formData.lastName}
                    disabled
                    className="bg-muted"
                    aria-label="Last name (read-only)"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissions
              </h3>
              <p className="text-sm text-muted-foreground">Your account permissions</p>

              <div className="flex flex-wrap gap-2">
                {profile?.permissions?.map((permission, index) => (
                  <Badge key={index} variant="outline" className="bg-primary/10">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Change Password</h3>
              <p className="text-sm text-muted-foreground">
                Leave these fields empty if you don&apos;t want to change your password
              </p>

              <div className="space-y-2">
                <Label htmlFor={currentPasswordId}>Current Password</Label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id={currentPasswordId}
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter your current password"
                    aria-label="Current password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={newPasswordId}>New Password</Label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id={newPasswordId}
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter your new password"
                    aria-label="New password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={confirmPasswordId}>Confirm New Password</Label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id={confirmPasswordId}
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your new password"
                    aria-label="Confirm new password"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={saving} aria-label="Save password changes" title="Save password changes">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  Save Password
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
