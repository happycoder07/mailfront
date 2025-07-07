'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { createEmailSchema, CreateEmailFormData } from '@/lib/validation';
import { Mail, Plus, Trash2, Loader2, Paperclip, Users, List, Search, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types for the new attachment upload flow
interface DraftAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

interface UploadProgress {
  sessionId: string;
  progress: number;
  bytesUploaded: number;
  totalBytes: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  filename: string;
  message: string;
  timestamp: string;
}

interface Contact {
  id: number;
  name: string;
  eid: string;
}

interface ContactList {
  id: number;
  name: string;
  description?: string;
}

export function CreateEmailForm() {
  const router = useRouter();
  const { hasPermission, getCSRFToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<DraftAttachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [contactListSearch, setContactListSearch] = useState('');
  const uploadAbortControllers = useRef<Record<string, AbortController>>({});

  // Modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isContactListModalOpen, setIsContactListModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalType, setModalType] = useState<'contact' | 'contactList'>('contact');
  const [isSearching, setIsSearching] = useState(false);

  // Check if user has permission to send emails
  const canSendEmail = hasPermission(PERMISSIONS.SEND_EMAIL);

  const defaultValues = useMemo(
    () => ({
      recipients: [],
      contactRecipients: [] as { contactId: number; type: 'TO' | 'CC' | 'BCC' }[],
      contactListRecipients: [] as { contactListId: number; type: 'TO' | 'CC' | 'BCC' }[],
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

  // LocalStorage helpers
  const CONTACTS_KEY = 'mailfront_contacts_cache';
  const CONTACT_LISTS_KEY = 'mailfront_contactlists_cache';

  const saveToLocalStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };
  const loadFromLocalStorage = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  // Load contacts and contact lists on mount (from cache or API)
  useEffect(() => {
    const cachedContacts = loadFromLocalStorage(CONTACTS_KEY);
    if (cachedContacts) setContacts(cachedContacts);
    else loadContacts();
    const cachedLists = loadFromLocalStorage(CONTACT_LISTS_KEY);
    if (cachedLists) setContactLists(cachedLists);
    else loadContactLists();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CONTACTS.LIST, {
        headers: { 'X-XSRF-TOKEN': getCSRFToken() },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setContacts(data.items || []);
        saveToLocalStorage(CONTACTS_KEY, data.items || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };
  const loadContactLists = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CONTACT_LISTS.LIST, {
        headers: { 'X-XSRF-TOKEN': getCSRFToken() },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setContactLists(data.items || []);
        saveToLocalStorage(CONTACT_LISTS_KEY, data.items || []);
      }
    } catch (error) {
      console.error('Error loading contact lists:', error);
    }
  };

  // --- Attachment Upload ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      for (const file of newFiles) {
        uploadAttachmentImmediate(file);
      }
    }
  };

  // Upload immediately and show progress
  const uploadAttachmentImmediate = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const abortController = new AbortController();

    // Create a temporary key for tracking before we get the real sessionId
    const tempKey = file.name + '-' + Date.now();
    uploadAbortControllers.current[tempKey] = abortController;

    setUploadProgress(prev => ({
      ...prev,
      [tempKey]: {
        sessionId: tempKey,
        progress: 0,
        bytesUploaded: 0,
        totalBytes: file.size,
        status: 'uploading' as const,
        filename: file.name,
        message: 'Starting upload...',
        timestamp: new Date().toISOString()
      }
    }));

    try {
      const response = await fetch(`${API_ENDPOINTS.MAIL.ATTACHMENTS}?track-progress=true`, {
        method: 'POST',
        headers: { 'X-XSRF-TOKEN': getCSRFToken() },
        credentials: 'include',
        body: formData,
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload attachment');
      }

      const result = await response.json();

      // If we got a sessionId from the server, use it for progress tracking
      if (result.sessionId) {
        // Remove the temporary progress entry and add the real one
        setUploadProgress(prev => {
          const { [tempKey]: _, ...rest } = prev;
          return {
            ...rest,
            [result.sessionId]: {
              sessionId: result.sessionId,
              progress: 0,
              bytesUploaded: 0,
              totalBytes: file.size,
              status: 'uploading' as const,
              filename: file.name,
              message: 'Upload started...',
              timestamp: new Date().toISOString()
            }
          };
        });

        // Update the abort controller reference
        uploadAbortControllers.current[result.sessionId] = abortController;
        delete uploadAbortControllers.current[tempKey];

        // Start monitoring progress with the real sessionId
        monitorUploadProgress(result.sessionId, file.name, result.id);
      } else {
        // No progress tracking, just add the attachment directly
        setUploadedAttachments(prev => [...prev, result]);
        setUploadProgress(prev => {
          const { [tempKey]: _, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      setUploadProgress(prev => {
        const { [tempKey]: _, ...rest } = prev;
        return rest;
      });
      toast({
        title: 'Upload Error',
        description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      delete uploadAbortControllers.current[tempKey];
    }
  };

  // Progress monitor using fetch polling (instead of SSE)
  const monitorUploadProgress = (sessionId: string, filename: string, attachmentId?: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(API_ENDPOINTS.MAIL.UPLOAD_PROGRESS(sessionId), {
          headers: { 'X-XSRF-TOKEN': getCSRFToken() },
          credentials: 'include',
        });

        if (!response.ok) {
          clearInterval(pollInterval);
          if (response.status === 404) {
            // Session not found - might be completed or expired
            setUploadProgress(prev => {
              const { [sessionId]: _, ...rest } = prev;
              return rest;
            });
            return;
          }
          toast({
            title: 'Upload Error',
            description: `Failed to track progress for ${filename}`,
            variant: 'destructive'
          });
          setUploadProgress(prev => {
            const { [sessionId]: _, ...rest } = prev;
            return rest;
          });
          return;
        }

        const progress: UploadProgress = await response.json();
        setUploadProgress(prev => ({ ...prev, [sessionId]: progress }));

        if (progress.status === 'completed') {
          clearInterval(pollInterval);
          // Add to uploaded attachments
          if (attachmentId) {
            setUploadedAttachments(prev =>
              prev.some(a => a.id === attachmentId) ? prev : [...prev, {
                id: attachmentId,
                filename,
                contentType: '',
                size: progress.totalBytes,
                createdAt: new Date().toISOString()
              }]
            );
          }
          // Keep progress visible for 2 seconds then remove
          setTimeout(() => setUploadProgress(prev => {
            const { [sessionId]: _, ...rest } = prev;
            return rest;
          }), 2000);
        } else if (progress.status === 'error') {
          clearInterval(pollInterval);
          toast({
            title: 'Upload Error',
            description: `Failed to upload ${filename}: ${progress.message}`,
            variant: 'destructive'
          });
          setUploadProgress(prev => {
            const { [sessionId]: _, ...rest } = prev;
            return rest;
          });
        }
      } catch (error) {
        clearInterval(pollInterval);
        console.error('Error polling progress:', error);
        setUploadProgress(prev => {
          const { [sessionId]: _, ...rest } = prev;
          return rest;
        });
      }
    }, 500); // Poll every 500ms

    // Cleanup function to clear interval if component unmounts
    return () => clearInterval(pollInterval);
  };

  // Remove/cancel upload
  const removeAttachment = (index: number) => {
    const file = attachments[index];
    setAttachments(attachments.filter((_, i) => i !== index));

    // Find and abort any uploads for this file
    Object.entries(uploadAbortControllers.current).forEach(([key, ctrl]) => {
      if (key.startsWith(file.name)) {
        ctrl.abort();
        // Remove from progress tracking
        setUploadProgress(prev => {
          const { [key]: _, ...rest } = prev;
          return rest;
        });
      }
    });
  };
  const removeUploadedAttachment = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.MAIL.ATTACHMENTS}/${id}`, {
        method: 'DELETE',
        headers: { 'X-XSRF-TOKEN': getCSRFToken() },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to delete attachment');
      }
      setUploadedAttachments(prev => prev.filter(att => att.id !== id));
      toast({ title: 'Attachment Deleted', description: 'Draft attachment deleted successfully.' });
    } catch (error) {
      toast({ title: 'Delete Error', description: error instanceof Error ? error.message : 'Failed to delete attachment', variant: 'destructive' });
    }
  };

  // --- Contact/ContactList Search ---
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.eid.toLowerCase().includes(contactSearch.toLowerCase())
  );
  const filteredContactLists = contactLists.filter(cl =>
    cl.name.toLowerCase().includes(contactListSearch.toLowerCase()) ||
    (cl.description || '').toLowerCase().includes(contactListSearch.toLowerCase())
  );

  // Modal search functionality
  const filteredModalContacts = useMemo(() => {
    return contacts.filter(c =>
      c.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      c.eid.toLowerCase().includes(modalSearch.toLowerCase())
    );
  }, [modalSearch, contacts]);

  const filteredModalContactLists = useMemo(() => {
    return contactLists.filter(cl =>
      cl.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      (cl.description || '').toLowerCase().includes(modalSearch.toLowerCase())
    );
  }, [modalSearch, contactLists]);

  // Search API functionality
  const searchItems = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      if (modalType === 'contact') {
        const response = await fetch(`${API_ENDPOINTS.MAIL.CONTACTS}?search=${encodeURIComponent(searchTerm)}`, {
          headers: { 'X-XSRF-TOKEN': getCSRFToken() },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setContacts(data.items || data || []);
        }
      } else {
        const response = await fetch(`${API_ENDPOINTS.MAIL.CONTACT_LISTS}?search=${encodeURIComponent(searchTerm)}`, {
          headers: { 'X-XSRF-TOKEN': getCSRFToken() },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setContactLists(data.items || data || []);
        }
      }
    } catch (error) {
      console.error('Error searching items:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Modal handlers
  const openContactModal = () => {
    setModalType('contact');
    setModalSearch('');
    setIsContactModalOpen(true);
  };

  const openContactListModal = () => {
    setModalType('contactList');
    setModalSearch('');
    setIsContactListModalOpen(true);
  };

  const handleModalSearch = (searchTerm: string) => {
    setModalSearch(searchTerm);
    if (searchTerm.length >= 2) {
      searchItems(searchTerm);
    }
  };

  const addContactRecipient = (contact: Contact, type: 'TO' | 'CC' | 'BCC') => {
    const currentRecipients = form.getValues('contactRecipients') || [];
    form.setValue('contactRecipients', [
      ...currentRecipients,
      { contactId: contact.id, type }
    ]);
    setIsContactModalOpen(false);
    toast({ title: 'Contact Added', description: `${contact.name} added as ${type} recipient` });
  };

  const addContactListRecipient = (contactList: ContactList, type: 'TO' | 'CC' | 'BCC') => {
    const currentRecipients = form.getValues('contactListRecipients') || [];
    form.setValue('contactListRecipients', [
      ...currentRecipients,
      { contactListId: contactList.id, type }
    ]);
    setIsContactListModalOpen(false);
    toast({ title: 'Contact List Added', description: `${contactList.name} added as ${type} recipient` });
  };

  const removeContactRecipient = (index: number) => {
    const currentRecipients = form.getValues('contactRecipients') || [];
    form.setValue('contactRecipients', currentRecipients.filter((_, i) => i !== index));
  };

  const removeContactListRecipient = (index: number) => {
    const currentRecipients = form.getValues('contactListRecipients') || [];
    form.setValue('contactListRecipients', currentRecipients.filter((_, i) => i !== index));
  };

  // Custom validation to check if at least one recipient is added
  const hasRecipients = useMemo(() => {
    const recipients = form.watch('recipients') || [];
    const contactRecipients = form.watch('contactRecipients') || [];
    const contactListRecipients = form.watch('contactListRecipients') || [];

    return recipients.length > 0 || contactRecipients.length > 0 || contactListRecipients.length > 0;
  }, [form.watch('recipients'), form.watch('contactRecipients'), form.watch('contactListRecipients')]);

  async function onSubmit(data: CreateEmailFormData) {
    if (!canSendEmail) {
      toast({ title: 'Error', description: 'You do not have permission to send emails', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      // Only use already uploaded attachments
      const attachmentIds = uploadedAttachments.map(att => att.id);
      const emailData: any = {
        subject: data.subject,
        content: data.content,
      };
      if (data.html) emailData.html = data.html;
      if (data.recipients && data.recipients.length > 0) emailData.recipients = JSON.stringify(data.recipients);
      const contactRecipients = form.getValues('contactRecipients');
      if (contactRecipients && contactRecipients.length > 0) emailData.contactRecipients = JSON.stringify(contactRecipients);
      const contactListRecipients = form.getValues('contactListRecipients');
      if (contactListRecipients && contactListRecipients.length > 0) emailData.contactListRecipients = JSON.stringify(contactListRecipients);
      if (attachmentIds.length > 0) emailData.attachmentIds = attachmentIds;
      const response = await fetch(API_ENDPOINTS.MAIL.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCSRFToken() },
        credentials: 'include',
        body: JSON.stringify(emailData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        let errorMessage = 'Failed to create email';
        if (response.status === 401) errorMessage = 'Unauthorized - Please login again';
        else if (response.status === 403) errorMessage = 'Forbidden - You do not have permission to perform this action';
        else if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
        throw new Error(errorMessage);
      }
      const result = await response.json();
      toast({ title: 'Success', description: 'Email created successfully' });
      router.push('/emails');
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create email', variant: 'destructive' });
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recipients</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openContactModal}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openContactListModal}
                >
                  <List className="mr-2 h-4 w-4" />
                  Add Contact List
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ address: '', type: 'TO' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Email
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Direct Email Recipients */}
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Contact Recipients */}
              {form.watch('contactRecipients')?.map((recipient, index) => {
                const contact = contacts.find(c => c.id === recipient.contactId);
                return (
                  <div key={`contact-${index}`} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{recipient.type}</Badge>
                      <span className="font-medium">{contact?.name || 'Unknown Contact'}</span>
                      <span className="text-sm text-muted-foreground">({contact?.eid})</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContactRecipient(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}

              {/* Contact List Recipients */}
              {form.watch('contactListRecipients')?.map((recipient, index) => {
                const contactList = contactLists.find(cl => cl.id === recipient.contactListId);
                return (
                  <div key={`contact-list-${index}`} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{recipient.type}</Badge>
                      <span className="font-medium">{contactList?.name || 'Unknown Contact List'}</span>
                      {contactList?.description && (
                        <span className="text-sm text-muted-foreground">({contactList.description})</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContactListRecipient(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Contact Selection Modal */}
          <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Contact
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts by name or email..."
                    value={modalSearch}
                    onChange={(e) => handleModalSearch(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>

                {/* Results */}
                <ScrollArea className="h-[400px]">
                  {filteredModalContacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {modalSearch ? 'No contacts found' : 'Start typing to search contacts'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredModalContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">{contact.eid}</div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addContactRecipient(contact, 'TO')}
                            >
                              To
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addContactRecipient(contact, 'CC')}
                            >
                              CC
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addContactRecipient(contact, 'BCC')}
                            >
                              BCC
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

          {/* Contact List Selection Modal */}
          <Dialog open={isContactListModalOpen} onOpenChange={setIsContactListModalOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Select Contact List
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contact lists by name or description..."
                    value={modalSearch}
                    onChange={(e) => handleModalSearch(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>

                {/* Results */}
                <ScrollArea className="h-[400px]">
                  {filteredModalContactLists.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {modalSearch ? 'No contact lists found' : 'Start typing to search contact lists'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredModalContactLists.map((contactList) => (
                        <div
                          key={contactList.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{contactList.name}</div>
                            {contactList.description && (
                              <div className="text-sm text-muted-foreground">{contactList.description}</div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addContactListRecipient(contactList, 'TO')}
                            >
                              To
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addContactListRecipient(contactList, 'CC')}
                            >
                              CC
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addContactListRecipient(contactList, 'BCC')}
                            >
                              BCC
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

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
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
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
            <CardContent className="space-y-4">
              {/* Upload Progress */}
              {Object.entries(uploadProgress).map(([sessionId, progress]) => (
                <div key={sessionId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{progress.filename}</span>
                    <span className="text-sm text-muted-foreground">{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{progress.message}</p>
                </div>
              ))}

              {/* Pending Attachments */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Pending Upload</h4>
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
                </div>
              )}

              {/* Uploaded Attachments */}
              {uploadedAttachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Uploaded</h4>
                  {uploadedAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 border rounded-md bg-green-50"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{attachment.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUploadedAttachment(attachment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* File Limits Info */}
              <Alert>
                <AlertDescription>
                  <strong>File Limits:</strong> Maximum 50MB per file, 100MB total per email.
                  Supported: PDF, Images (JPEG, PNG), Documents (DOC, DOCX), Text files.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mt-8">
            <Button type="submit" disabled={isLoading || !form.formState.isValid || !hasRecipients} size="lg">
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
            {!hasRecipients && (
              <p className="text-sm text-destructive">
                Please add at least one recipient (email, contact, or contact list)
              </p>
            )}
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
