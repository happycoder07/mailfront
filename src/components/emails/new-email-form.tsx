'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { X } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/config';

const formSchema = z.object({
  from: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  recipients: z.array(
    z.object({
      address: z.string().email(),
      type: z.enum(['TO', 'CC', 'BCC']),
    })
  ),
  subject: z.string().min(1, {
    message: 'Subject is required.',
  }),
  content: z.string().min(1, {
    message: 'Content is required.',
  }),
  html: z.string().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        path: z.string(),
        contentType: z.string(),
      })
    )
    .optional(),
});

type Recipient = {
  address: string;
  type: 'TO' | 'CC' | 'BCC';
};

export function NewEmailForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [recipientType, setRecipientType] = useState<'TO' | 'CC' | 'BCC'>('TO');
  const [attachments, setAttachments] = useState<File[]>([]);

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
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.EMAIL.LIST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create email');
      }

      toast({
        title: 'Success',
        description: 'Email created successfully',
      });

      router.push('/emails');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="from"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From</FormLabel>
              <FormControl>
                <Input placeholder="sender@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Recipients</FormLabel>
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
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recipients.map((recipient, index) => (
              <Badge key={index} variant="secondary">
                {recipient.type}: {recipient.address}
                <button type="button" onClick={() => removeRecipient(index)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
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
                <Textarea
                  placeholder="HTML content"
                  className="min-h-[200px] font-mono"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Attachments</FormLabel>
          <Input type="file" multiple onChange={handleFileChange} className="cursor-pointer" />
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <Badge key={index} variant="secondary">
                {file.name}
                <button type="button" onClick={() => removeAttachment(index)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Email'}
        </Button>
      </form>
    </Form>
  );
}
