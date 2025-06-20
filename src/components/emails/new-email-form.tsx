'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, AlertCircle, Plus, Upload, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { getXsrfToken } from '@/lib/utils';

const formSchema = z.object({
  from: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  recipients: z
    .array(
      z.object({
        address: z.string().email(),
        type: z.enum(['TO', 'CC', 'BCC']),
      })
    )
    .min(1, {
      message: 'At least one recipient is required.',
    }),
  subject: z.string().min(1, {
    message: 'Subject is required.',
  }),
  content: z.string().min(1, {
    message: 'Content is required.',
  }),
  html: z.string().optional(),
  attachments: z.array(z.instanceof(File)).optional(),
});

type Recipient = {
  address: string;
  type: 'TO' | 'CC' | 'BCC';
};

export function NewEmailForm() {
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [recipientType, setRecipientType] = useState<'TO' | 'CC' | 'BCC'>('TO');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Check if user has permission to send emails
  const canSendEmail = hasPermission(PERMISSIONS.SEND_EMAIL);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: '',
      recipients: [],
      subject: '',
      content: '',
      html: '',
      attachments: [],
    },
  });

  const addRecipient = () => {
    if (!newRecipient) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRecipient)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    setRecipients([...recipients, { address: newRecipient, type: recipientType }]);
    setNewRecipient('');
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
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
      const formData = new FormData();

      // Add required fields
      formData.append('from', data.from);
      formData.append('subject', data.subject);
      formData.append('content', data.content);

      // Add optional fields if they exist
      if (data.html) {
        formData.append('html', data.html);
      }

      // Add recipients as individual form fields
      data.recipients.forEach((recipient, index) => {
        formData.append(`recipients[${index}][address]`, recipient.address);
        formData.append(`recipients[${index}][type]`, recipient.type);
      });

      // Add attachments if they exist
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      const response = await fetch(API_ENDPOINTS.MAIL.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create email');
      }

      const emailData = await response.json();

      toast({
        title: 'Success',
        description: 'Email created successfully',
      });

      // Open the created email in a new tab
      window.open(`/emails/${emailData.id}`, '_blank');

      // Close the current tab/form
      window.close();
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
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Required</AlertTitle>
            <AlertDescription>
              You do not have permission to send emails. Please contact your administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose New Email</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormDescription>
                    The email address that will appear as the sender
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="sender@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Recipients</FormLabel>
              <FormDescription>
                Add recipients by entering their email addresses and selecting the type (To, CC, or
                BCC)
              </FormDescription>
              <div className="flex gap-2">
                <Input
                  placeholder="recipient@example.com"
                  value={newRecipient}
                  onChange={e => setNewRecipient(e.target.value)}
                />
                <Select
                  value={recipientType}
                  onValueChange={(value: 'TO' | 'CC' | 'BCC') => setRecipientType(value)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TO">To</SelectItem>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="BCC">BCC</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addRecipient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <ScrollArea className="h-[100px] rounded-md border p-2">
                <div className="flex flex-wrap gap-2">
                  {recipients.map((recipient, index) => (
                    <Badge
                      key={index}
                      variant={
                        recipient.type === 'TO'
                          ? 'default'
                          : recipient.type === 'CC'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {recipient.type}: {recipient.address}
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormDescription>A brief description of the email&apos;s content</FormDescription>
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
                  <FormDescription>The main body of your email</FormDescription>
                  <FormControl>
                    <Textarea placeholder="Email content" className="min-h-[200px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Attachments</FormLabel>
              <FormDescription>Add files to be attached to the email</FormDescription>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              <ScrollArea className="h-[100px] rounded-md border p-2">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <Badge key={index} variant="secondary">
                      {file.name}
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.close()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Email'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
