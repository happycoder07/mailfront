'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  createEmailSchema,
  CreateEmailFormData,
  recipientSchema,
  RecipientFormData,
} from '@/lib/validation';
import { Mail, Plus, Trash2, Loader2, Paperclip } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { EmailResponseDto } from '@/lib/types';

export function CreateEmailForm() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Check if user has permission to send emails
  const canSendEmail = hasPermission(PERMISSIONS.SEND_EMAIL);

  const form = useForm<CreateEmailFormData>({
    resolver: zodResolver(createEmailSchema),
    defaultValues: {
      from: '',
      recipients: [{ address: '', type: 'TO' }],
      subject: '',
      content: '',
      html: '',
    },
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

      // Add recipients as individual form fields
      data.recipients.forEach((recipient, index) => {
        formData.append(`recipients[${index}][address]`, recipient.address);
        formData.append(`recipients[${index}][type]`, recipient.type);
      });

      // Add attachments
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch(API_ENDPOINTS.MAIL.CREATE, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
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

      const responseData: EmailResponseDto = await response.json();

      toast({
        title: 'Success',
        description: 'Email created successfully',
      });

      router.push('/emails');
    } catch (error) {
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
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to send emails. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Recipients</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ address: '', type: 'TO' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Recipient
            </Button>
          </div>

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
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

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
                <Textarea placeholder="Email content" className="min-h-[200px]" {...field} />
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
                <Textarea placeholder="HTML content" className="min-h-[200px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Attachments</FormLabel>
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
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttachment(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button type="submit" disabled={isLoading || !form.formState.isValid}>
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
            <span className="text-sm text-muted-foreground">
              Please fill in all required fields correctly
            </span>
          )}
        </div>
      </form>
    </Form>
  );
}
