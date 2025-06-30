'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { createEmailSchema, CreateEmailFormData } from '@/lib/validation';
import { Mail, Plus, Trash2, Loader2, Paperclip } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CreateEmailForm() {
  const router = useRouter();
  const { hasPermission, getCSRFToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Check if user has permission to send emails
  const canSendEmail = hasPermission(PERMISSIONS.SEND_EMAIL);

  const defaultValues = useMemo(
    () => ({
      from: '',
      recipients: [{ address: '', type: 'TO' as const }],
      subject: '',
      content: '',
      html: '',
    }),
    [],
  );

  const form = useForm<CreateEmailFormData>({
    resolver: zodResolver(createEmailSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'recipients',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  async function onSubmit(data: CreateEmailFormData) {
    if (!canSendEmail) {
      toast({
        title: 'Error',
        description: 'You do not have permission to send emails',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData to handle file uploads
      const formData = new FormData();

      // Add email data
      formData.append('from', data.from);
      formData.append('subject', data.subject);
      formData.append('content', data.content);

      if (data.html) {
        formData.append('html', data.html);
      }

      // Add recipients as a JSON string array
      formData.append('recipients', JSON.stringify(data.recipients));

      // Add attachments - IMPORTANT: Use the correct field name
      attachments.forEach((file, index) => {
        // Use 'attachments' as the field name to match server expectation
        formData.append('attachments', file, file.name);
      });

      console.log('Sending request to:', API_ENDPOINTS.MAIL.CREATE);
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File: ${value.name} (${value.size} bytes, type: ${value.type})`);
        } else {
          console.log(`${key}:`, value);
        }
      }

      const response = await fetch(API_ENDPOINTS.MAIL.CREATE, {
        method: 'POST',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        let errorMessage = 'Failed to create email';

        if (response.status === 401) {
          errorMessage = 'Unauthorized - Please login again';
        } else if (response.status === 403) {
          errorMessage = 'Forbidden - You do not have permission to perform this action';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Success response:', result);

      toast({
        title: 'Success',
        description: 'Email created successfully',
      });

      router.push('/emails');
    } catch (error) {
      console.error('Error creating email:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // If user doesn't have permission to send emails, show a message
  if (!canSendEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="p-6 text-center bg-card text-card-foreground rounded-lg shadow-md"
      >
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-2">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            You do not have permission to send emails. Please contact your administrator.
          </p>
        </CardContent>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Sender Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="sender@example.com" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recipients</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ address: '', type: 'TO' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Recipient
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end space-x-2">
                  <FormField
                    control={form.control}
                    name={`recipients.${index}.address`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="recipient@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`recipients.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="w-[120px]">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TO">To</SelectItem>
                            <SelectItem value="CC">CC</SelectItem>
                            <SelectItem value="BCC">BCC</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Email content"
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="html"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTML Content (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="HTML content"
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attachments</CardTitle>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="attachments"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('attachments')?.click()}
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  Add Attachment
                </Button>
              </div>
            </CardHeader>
            {attachments.length > 0 && (
              <CardContent className="space-y-2 pt-4">
                {attachments.map((file, index) => (
                  <div
                    key={file.name + index}
                    className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                  >
                    <span className="text-sm font-medium">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          <div className="flex items-center justify-between mt-8">
            <Button type="submit" disabled={isLoading || !form.formState.isValid} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Email'
              )}
            </Button>
            {!form.formState.isValid && (
              <p className="text-sm text-destructive">
                Please fill in all required fields correctly
              </p>
            )}
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
