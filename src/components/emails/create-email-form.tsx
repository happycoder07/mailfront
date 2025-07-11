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
import { API_ENDPOINTS, CreateTemplateDto, EmailTemplateResponseDto } from '@/lib/config';
import { createEmailSchema, CreateEmailFormData } from '@/lib/validation';
import {
  Mail,
  Plus,
  Trash2,
  Loader2,
  Paperclip,
  Users,
  List,
  Search,
  X,
  Save,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { sanitizeHtml } from '@/lib/sanitize';

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
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [allContactLists, setAllContactLists] = useState<ContactList[]>([]);
  const searchTimeoutRef = useRef<number | undefined>(undefined);

  // Template state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Template selection state
  const [isTemplateSelectionModalOpen, setIsTemplateSelectionModalOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  // Template details state
  const [isTemplateDetailsModalOpen, setIsTemplateDetailsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateResponseDto | null>(null);

  // Rich text editor state
  const [useRichText, setUseRichText] = useState(false);

  // Handle rich text toggle
  const handleRichTextToggle = (enabled: boolean) => {
    setUseRichText(enabled);
    // Automatically set HTML checkbox based on rich text mode
    form.setValue('html', enabled);
  };

  // Check if user has permission to send emails
  const canSendEmail = hasPermission(PERMISSIONS.SEND_EMAIL);
  const canViewContacts = hasPermission(PERMISSIONS.READ_CONTACT);
  const canViewContactLists = hasPermission(PERMISSIONS.READ_CONTACT_LIST);
  const canCreateTemplate = hasPermission(PERMISSIONS.CREATE_EMAIL_TEMPLATE);
  const canReadTemplates = hasPermission(PERMISSIONS.READ_EMAIL_TEMPLATE);

  const defaultValues = useMemo(
    () => ({
      recipients: [],
      contactRecipients: [] as { contactId: number; type: 'TO' | 'CC' | 'BCC' }[],
      contactListRecipients: [] as { contactListId: number; type: 'TO' | 'CC' | 'BCC' }[],
      subject: '',
      content: '',
      html: false,
    }),
    []
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

  const saveToSessionStorage = (key: string, data: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };
  const loadFromSessionStorage = (key: string) => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  // Load contacts and contact lists on mount (from cache or API)
  useEffect(() => {
    canViewContacts && loadContacts();
    canViewContactLists && loadContactLists();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadContacts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.CONTACTS, {
        headers: { 'X-XSRF-TOKEN': getCSRFToken() },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const contactsData = data.items || data || [];
        setContacts(contactsData);
        setAllContacts(contactsData);
        saveToSessionStorage(CONTACTS_KEY, contactsData);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };
  const loadContactLists = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.CONTACT_LISTS, {
        headers: { 'X-XSRF-TOKEN': getCSRFToken() },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const contactListsData = data.items || data || [];
        setContactLists(contactListsData);
        setAllContactLists(contactListsData);
        saveToSessionStorage(CONTACT_LISTS_KEY, contactListsData);
      }
    } catch (error) {
      console.error('Error loading contact lists:', error);
    }
  };

  const loadTemplates = async () => {
    if (!canReadTemplates) {
      toast({
        title: 'Error',
        description: 'You do not have permission to read email templates',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingTemplates(true);
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.TEMPLATES, {
        headers: { 'X-XSRF-TOKEN': getCSRFToken() },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data || []);
      } else {
        throw new Error('Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTemplates(false);
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
        timestamp: new Date().toISOString(),
      },
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
              timestamp: new Date().toISOString(),
            },
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
        variant: 'destructive',
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
            variant: 'destructive',
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
              prev.some(a => a.id === attachmentId)
                ? prev
                : [
                    ...prev,
                    {
                      id: attachmentId,
                      filename,
                      contentType: '',
                      size: progress.totalBytes,
                      createdAt: new Date().toISOString(),
                    },
                  ]
            );
          }
          // Remove from progress immediately for instant UI update
          setUploadProgress(prev => {
            const { [sessionId]: _, ...rest } = prev;
            return rest;
          });
        } else if (progress.status === 'error') {
          clearInterval(pollInterval);
          toast({
            title: 'Upload Error',
            description: `Failed to upload ${filename}: ${progress.message}`,
            variant: 'destructive',
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
      toast({
        title: 'Attachment Deleted',
        description: 'Draft attachment deleted successfully.',
        duration: 1000,
      });
    } catch (error) {
      toast({
        title: 'Delete Error',
        description: error instanceof Error ? error.message : 'Failed to delete attachment',
        variant: 'destructive',
      });
    }
  };

  // --- Contact/ContactList Search ---
  const filteredContacts = contacts.filter(
    c =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.eid.toLowerCase().includes(contactSearch.toLowerCase())
  );
  const filteredContactLists = contactLists.filter(
    cl =>
      cl.name.toLowerCase().includes(contactListSearch.toLowerCase()) ||
      (cl.description || '').toLowerCase().includes(contactListSearch.toLowerCase())
  );

  // Modal search functionality
  const filteredModalContacts = useMemo(() => {
    return contacts.filter(
      c =>
        c.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
        c.eid.toLowerCase().includes(modalSearch.toLowerCase())
    );
  }, [modalSearch, contacts]);

  const filteredModalContactLists = useMemo(() => {
    return contactLists.filter(
      cl =>
        cl.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
        (cl.description || '').toLowerCase().includes(modalSearch.toLowerCase())
    );
  }, [modalSearch, contactLists]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(
      template =>
        template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        template.subject.toLowerCase().includes(templateSearch.toLowerCase())
    );
  }, [templateSearch, templates]);

  // Search API functionality - now using client-side filtering
  const searchItems = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      if (modalType === 'contact') {
        // Use client-side filtering instead of API call
        const filtered = allContacts.filter(
          c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.eid.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setContacts(filtered);
      } else {
        // Use client-side filtering instead of API call
        const filtered = allContactLists.filter(
          cl =>
            cl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cl.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        setContactLists(filtered);
      }
    } catch (error) {
      console.error('Error filtering items:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function
  const debouncedSearch = (searchTerm: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = window.setTimeout(() => {
      if (searchTerm.length >= 1) {
        searchItems(searchTerm);
      } else if (searchTerm.length === 0) {
        // Reset to all data when search is cleared
        if (modalType === 'contact') {
          setContacts(allContacts);
        } else {
          setContactLists(allContactLists);
        }
      }
    }, 200); // Reduced debounce delay since we're not making API calls
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
    debouncedSearch(searchTerm);
  };

  const addContactRecipient = (contact: Contact, type: 'TO' | 'CC' | 'BCC') => {
    const currentRecipients = form.getValues('contactRecipients') || [];
    form.setValue('contactRecipients', [...currentRecipients, { contactId: contact.id, type }]);
    setIsContactModalOpen(false);
    toast({ title: 'Contact Added', description: `${contact.name} added as ${type} recipient` });
  };

  const addContactListRecipient = (contactList: ContactList, type: 'TO' | 'CC' | 'BCC') => {
    const currentRecipients = form.getValues('contactListRecipients') || [];
    form.setValue('contactListRecipients', [
      ...currentRecipients,
      { contactListId: contactList.id, type },
    ]);
    setIsContactListModalOpen(false);
    toast({
      title: 'Contact List Added',
      description: `${contactList.name} added as ${type} recipient`,
    });
  };

  const removeContactRecipient = (index: number) => {
    const currentRecipients = form.getValues('contactRecipients') || [];
    form.setValue(
      'contactRecipients',
      currentRecipients.filter((_, i) => i !== index)
    );
  };

  const removeContactListRecipient = (index: number) => {
    const currentRecipients = form.getValues('contactListRecipients') || [];
    form.setValue(
      'contactListRecipients',
      currentRecipients.filter((_, i) => i !== index)
    );
  };

  // Custom validation to check if at least one recipient is added
  const hasRecipients = useMemo(() => {
    const recipients = form.watch('recipients') || [];
    const contactRecipients = form.watch('contactRecipients') || [];
    const contactListRecipients = form.watch('contactListRecipients') || [];

    return (
      recipients.length > 0 || contactRecipients.length > 0 || contactListRecipients.length > 0
    );
  }, [
    form.watch('recipients'),
    form.watch('contactRecipients'),
    form.watch('contactListRecipients'),
  ]);

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
      // Only use already uploaded attachments
      const attachmentIds = uploadedAttachments.map(att => att.id);
      const emailData: any = {
        subject: data.subject,
        content: data.content,
      };

      // If using rich text editor, automatically set html to true and sanitize content
      if (useRichText) {
        emailData.html = true;
        emailData.content = sanitizeHtml(data.content);
      } else if (data.html) {
        emailData.html = data.html;
        // Also sanitize plain text content if HTML is manually enabled
        emailData.content = sanitizeHtml(data.content);
      } else {
        // For plain text, just use the content as-is
        emailData.content = data.content;
      }

      if (data.recipients && data.recipients.length > 0)
        emailData.recipients = JSON.stringify(data.recipients);
      const contactRecipients = form.getValues('contactRecipients');
      if (contactRecipients && contactRecipients.length > 0)
        emailData.contactRecipients = JSON.stringify(contactRecipients);
      const contactListRecipients = form.getValues('contactListRecipients');
      if (contactListRecipients && contactListRecipients.length > 0)
        emailData.contactListRecipients = JSON.stringify(contactListRecipients);
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
        else if (response.status === 403)
          errorMessage = 'Forbidden - You do not have permission to perform this action';
        else if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
        throw new Error(errorMessage);
      }
      const result = await response.json();
      toast({ title: 'Success', description: 'Email created successfully' });
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

  async function saveAsTemplate() {
    if (!canCreateTemplate) {
      toast({
        title: 'Error',
        description: 'You do not have permission to create email templates',
        variant: 'destructive',
      });
      return;
    }

    if (!templateName.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a template name',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingTemplate(true);
    try {
      const data = form.getValues();
      const templateData: CreateTemplateDto = {
        name: templateName.trim(),
        subject: data.subject,
        content: data.content,
      };

      // If using rich text editor, automatically set html to true and sanitize content
      if (useRichText) {
        templateData.html = true;
        templateData.content = sanitizeHtml(data.content);
      } else if (data.html) {
        templateData.html = data.html;
        // Also sanitize plain text content if HTML is manually enabled
        templateData.content = sanitizeHtml(data.content);
      } else {
        // For plain text, just use the content as-is
        templateData.content = data.content;
      }

      // Convert recipients to template format (no attachments in templates)
      if (data.recipients && data.recipients.length > 0) {
        templateData.templateEmailRecipients = data.recipients;
      }

      const contactRecipients = form.getValues('contactRecipients');
      if (contactRecipients && contactRecipients.length > 0) {
        templateData.templateContactRecipients = contactRecipients;
      }

      const contactListRecipients = form.getValues('contactListRecipients');
      if (contactListRecipients && contactListRecipients.length > 0) {
        templateData.templateContactListRecipients = contactListRecipients;
      }

      const response = await fetch(API_ENDPOINTS.MAIL.TEMPLATES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCSRFToken() },
        credentials: 'include',
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        let errorMessage = 'Failed to save template';
        if (response.status === 401) errorMessage = 'Unauthorized - Please login again';
        else if (response.status === 403)
          errorMessage = 'Forbidden - You do not have permission to perform this action';
        else if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast({ title: 'Success', description: `Template "${templateName}" saved successfully` });
      setIsTemplateModalOpen(false);
      setTemplateName('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTemplate(false);
    }
  }

  const applyTemplate = (template: EmailTemplateResponseDto) => {
    try {
      // Clear existing form data
      form.reset({
        recipients: [],
        contactRecipients: [],
        contactListRecipients: [],
        subject: '',
        content: '',
        html: false,
      });

      // Apply template data
      form.setValue('subject', template.subject || '');
      form.setValue('content', template.content || '');

      // If template has HTML content, enable rich text editor
      if (template.html) {
        setUseRichText(true);
        form.setValue('html', true);
      }

      // Apply email recipients
      if (template.templateEmailRecipients && template.templateEmailRecipients.length > 0) {
        form.setValue('recipients', template.templateEmailRecipients);
      }

      // Apply contact recipients
      if (template.templateContactRecipients && template.templateContactRecipients.length > 0) {
        form.setValue('contactRecipients', template.templateContactRecipients);
      }

      // Apply contact list recipients
      if (
        template.templateContactListRecipients &&
        template.templateContactListRecipients.length > 0
      ) {
        form.setValue('contactListRecipients', template.templateContactListRecipients);
      }

      setIsTemplateSelectionModalOpen(false);
      setTemplateSearch('');
      toast({ title: 'Success', description: `Template "${template.name}" applied successfully` });
    } catch (error) {
      console.error('Error applying template:', error);
      toast({ title: 'Error', description: 'Failed to apply template', variant: 'destructive' });
    }
  };

  const showTemplateDetails = (template: EmailTemplateResponseDto) => {
    setSelectedTemplate(template);
    setIsTemplateDetailsModalOpen(true);
  };

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
                {canReadTemplates && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-contact-primary/90 hover:bg-contact-primary"
                    onClick={() => {
                      setIsTemplateSelectionModalOpen(true);
                      loadTemplates();
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                )}
                {canViewContacts && (
                  <Button type="button" size="sm" onClick={openContactModal}>
                    <Users className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                )}
                {canViewContactLists && (
                  <Button type="button" size="sm" onClick={openContactListModal}>
                    <List className="mr-2 h-4 w-4" />
                    Add Contact List
                  </Button>
                )}
                <Button type="button" size="sm" onClick={() => append({ address: '', type: 'TO' })}>
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
                    name={`recipients.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
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

                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              {/* Contact Recipients */}
              {form.watch('contactRecipients')?.map((recipient, index) => {
                const contact = contacts.find(c => c.id === recipient.contactId);
                return (
                  <div
                    key={`contact-${index}`}
                    className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                  >
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
                  <div
                    key={`contact-list-${index}`}
                    className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                  >
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{recipient.type}</Badge>
                      <span className="font-medium">
                        {contactList?.name || 'Unknown Contact List'}
                      </span>
                      {contactList?.description && (
                        <span className="text-sm text-muted-foreground">
                          ({contactList.description})
                        </span>
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
            <DialogContent className="max-w-2xl max-h-[85vh] bg-card border border-primary/30 shadow-2xl">
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
                    onChange={e => handleModalSearch(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>

                {/* Status indicator */}
                {modalSearch && !isSearching && (
                  <div className="text-xs text-muted-foreground">
                    {filteredModalContacts.length} found
                  </div>
                )}

                {/* Results */}
                <ScrollArea className="h-[450px] max-h-[60vh]">
                  {filteredModalContacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {modalSearch ? 'No contacts found' : 'Start typing to search contacts'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredModalContacts.map(contact => (
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
            <DialogContent className="max-w-2xl max-h-[85vh] bg-card border border-primary/30 shadow-2xl">
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
                    onChange={e => handleModalSearch(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>

                {/* Status indicator */}
                {modalSearch && !isSearching && (
                  <div className="text-xs text-muted-foreground">
                    {filteredModalContactLists.length} found
                  </div>
                )}

                {/* Results */}
                <ScrollArea className="h-[450px] max-h-[60vh]">
                  {filteredModalContactLists.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {modalSearch
                        ? 'No contact lists found'
                        : 'Start typing to search contact lists'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredModalContactLists.map(contactList => (
                        <div
                          key={contactList.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{contactList.name}</div>
                            {contactList.description && (
                              <div className="text-sm text-muted-foreground">
                                {contactList.description}
                              </div>
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

          {/* Template Save Modal */}
          <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
            <DialogContent className="max-w-md border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-lg flex items-center space-x-2">
                  <div className="p-1.5 bg-contact-primary/10 dark:bg-contact-primary/20 rounded-lg">
                    <Save className="h-4 w-4 text-contact-primary" />
                  </div>
                  <span>Save as Template</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <FormLabel
                    htmlFor="template-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Template Name
                  </FormLabel>
                  <div className="relative">
                    <Input
                      id="template-name"
                      placeholder="e.g., Welcome Email, Newsletter, Meeting Invite..."
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveAsTemplate();
                        }
                      }}
                      className="pr-12 border-input focus:border-contact-primary focus:ring-contact-primary/20"
                      maxLength={100}
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      {templateName.length}/100
                    </div>
                  </div>
                  {templateName.length > 80 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Template name is getting long
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Template Preview</h4>
                  <div className="space-y-2 text-sm border border-border/50 rounded-md p-4 bg-muted/30">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subject:</span>
                      <span
                        className="font-medium truncate max-w-[200px]"
                        title={form.getValues('subject')}
                      >
                        {form.getValues('subject') || 'No subject'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipients:</span>
                      <span className="font-medium">
                        {(() => {
                          const recipients = form.getValues('recipients') || [];
                          const contactRecipients = form.getValues('contactRecipients') || [];
                          const contactListRecipients =
                            form.getValues('contactListRecipients') || [];
                          const total =
                            recipients.length +
                            contactRecipients.length +
                            contactListRecipients.length;
                          return total > 0
                            ? `${total} recipient${total !== 1 ? 's' : ''}`
                            : 'No recipients';
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Content:</span>
                      <span className="font-medium">
                        {form.getValues('content')?.length > 0
                          ? `${form.getValues('content').length} characters`
                          : 'No content'}
                      </span>
                    </div>
                  </div>
                </div>

                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <strong>Note:</strong> This template will save the email content, subject,
                        and recipients, but <strong>attachments will not be included</strong>.
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsTemplateModalOpen(false);
                      setTemplateName('');
                    }}
                    className="flex-1 hover:bg-accent"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveAsTemplate}
                    disabled={isSavingTemplate || !templateName.trim() || templateName.length > 100}
                    className="flex-1 bg-contact-primary hover:bg-contact-primary/90 text-contact-primary-foreground"
                  >
                    {isSavingTemplate ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Template
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Template Selection Modal */}
          <Dialog
            open={isTemplateSelectionModalOpen}
            onOpenChange={setIsTemplateSelectionModalOpen}
          >
            <DialogContent className="max-w-2xl max-h-[85vh] bg-card border border-primary/30 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Select Email Template
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates by name or subject..."
                    value={templateSearch}
                    onChange={e => setTemplateSearch(e.target.value)}
                    className="pl-10"
                  />
                  {isLoadingTemplates && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>

                {/* Status indicator */}
                {templateSearch && !isLoadingTemplates && (
                  <div className="text-xs text-muted-foreground">
                    {filteredTemplates.length} found
                  </div>
                )}

                {/* Results */}
                <ScrollArea className="h-[450px] max-h-[60vh]">
                  {isLoadingTemplates ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading templates...</p>
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {templateSearch ? 'No templates found' : 'No templates available'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTemplates.map(template => (
                        <div
                          key={template.id}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">{template.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                Template
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <strong>Subject:</strong> {template.subject || 'No subject'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <strong>Recipients:</strong>
                              {(() => {
                                const emailRecipients = template.templateEmailRecipients || [];
                                const contactRecipients = template.templateContactRecipients || [];
                                const contactListRecipients =
                                  template.templateContactListRecipients || [];

                                const recipients = [];

                                if (emailRecipients.length > 0) {
                                  recipients.push(
                                    `${emailRecipients.length} email${emailRecipients.length !== 1 ? 's' : ''}`
                                  );
                                }
                                if (contactRecipients.length > 0) {
                                  recipients.push(
                                    `${contactRecipients.length} contact${contactRecipients.length !== 1 ? 's' : ''}`
                                  );
                                }
                                if (contactListRecipients.length > 0) {
                                  recipients.push(
                                    `${contactListRecipients.length} contact list${contactListRecipients.length !== 1 ? 's' : ''}`
                                  );
                                }

                                return recipients.length > 0
                                  ? recipients.join(', ')
                                  : 'No recipients';
                              })()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created {new Date(template.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => showTemplateDetails(template)}
                              className="text-xs"
                            >
                              View Details
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => applyTemplate(template)}
                            >
                              Use Template
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

          {/* Template Details Modal */}
          <Dialog open={isTemplateDetailsModalOpen} onOpenChange={setIsTemplateDetailsModalOpen}>
            <DialogContent className="max-w-2xl max-h-[85vh] bg-card border border-primary/30 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Template Details: {selectedTemplate?.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {selectedTemplate && (
                  <>
                    {/* Template Info */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground">Template Information</h4>
                      <div className="space-y-2 text-sm border border-border/50 rounded-md p-4 bg-muted/30">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{selectedTemplate.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subject:</span>
                          <span className="font-medium">
                            {selectedTemplate.subject || 'No subject'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Content Length:</span>
                          <span className="font-medium">
                            {selectedTemplate.content?.length || 0} characters
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium">
                            {new Date(selectedTemplate.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Email Recipients */}
                    {selectedTemplate.templateEmailRecipients &&
                      selectedTemplate.templateEmailRecipients.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-foreground">Email Recipients</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto border border-border/50 rounded-md p-4 bg-muted/30">
                            {selectedTemplate.templateEmailRecipients.map((recipient, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                              >
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary">{recipient.type}</Badge>
                                  <span className="font-mono text-sm">{recipient.address}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Contact Recipients */}
                    {selectedTemplate.templateContactRecipients &&
                      selectedTemplate.templateContactRecipients.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-foreground">
                            Contact Recipients
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto border border-border/50 rounded-md p-4 bg-muted/30">
                            {selectedTemplate.templateContactRecipients.map((recipient, index) => {
                              const contact = contacts.find(c => c.id === recipient.contactId);
                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="secondary">{recipient.type}</Badge>
                                    <span className="font-medium">
                                      {contact?.name || `Contact ID: ${recipient.contactId}`}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      ({contact?.eid || 'Unknown email'})
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* Contact List Recipients */}
                    {selectedTemplate.templateContactListRecipients &&
                      selectedTemplate.templateContactListRecipients.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-foreground">
                            Contact List Recipients
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto border border-border/50 rounded-md p-4 bg-muted/30">
                            {selectedTemplate.templateContactListRecipients.map(
                              (recipient, index) => {
                                const contactList = contactLists.find(
                                  cl => cl.id === recipient.contactListId
                                );
                                return (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="secondary">{recipient.type}</Badge>
                                      <span className="font-medium">
                                        {contactList?.name ||
                                          `Contact List ID: ${recipient.contactListId}`}
                                      </span>
                                      {contactList?.description && (
                                        <span className="text-sm text-muted-foreground">
                                          ({contactList.description})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                    {/* Content Preview */}
                    {selectedTemplate.content && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground">Content Preview</h4>
                        <div className="border border-border/50 rounded-md p-4 bg-muted/30">
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {selectedTemplate.content}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <Button variant="outline" onClick={() => setIsTemplateDetailsModalOpen(false)}>
                    Close
                  </Button>
                  {selectedTemplate && (
                    <Button
                      onClick={() => {
                        setIsTemplateDetailsModalOpen(false);
                        applyTemplate(selectedTemplate);
                      }}
                      className="bg-contact-primary hover:bg-contact-primary/90 text-contact-primary-foreground"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Use This Template
                    </Button>
                  )}
                </div>
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Content</FormLabel>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Rich Text</span>
                        <Switch checked={useRichText} onCheckedChange={handleRichTextToggle} />
                      </div>
                    </div>
                    <FormControl>
                      {useRichText ? (
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Email content"
                          className="min-h-[300px]"
                        />
                      ) : (
                        <div className="relative">
                          <ScrollArea className="h-[300px] border rounded-md">
                            <Textarea
                              placeholder="Email content"
                              className="min-h-[400px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                            />
                          </ScrollArea>
                          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                            {field.value?.length || 0} characters
                          </div>
                        </div>
                      )}
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
              {Object.entries(uploadProgress)
                .filter(
                  ([sessionId, progress]) =>
                    !uploadedAttachments.some(att => att.filename === progress.filename)
                )
                .map(([sessionId, progress]) => (
                  <div
                    key={sessionId}
                    className="flex items-center justify-between p-2 border rounded-md bg-muted/50 mb-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{progress.filename}</span>
                        <span className="text-xs text-muted-foreground">{progress.progress}%</span>
                      </div>
                      <Progress value={progress.progress} className="w-full mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">{progress.message}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        // Cancel upload if possible
                        if (uploadAbortControllers.current[sessionId]) {
                          uploadAbortControllers.current[sessionId].abort();
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

              {/* Uploaded Attachments */}
              {uploadedAttachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Uploaded</h4>
                  {uploadedAttachments
                    .filter(
                      att =>
                        !Object.values(uploadProgress).some(
                          progress => progress.filename === att.filename
                        )
                    )
                    .map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 border rounded-md bg-green-50 dark:bg-green-500 dark:text-white"
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
                  <br />
                  <strong>Note:</strong> Attachments are not saved when creating email templates.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center space-x-4">
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid || !hasRecipients}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
              {canCreateTemplate && (
                <Button
                  type="button"
                  className="bg-success/70 hover:bg-success text-success-foreground"
                  size="lg"
                  onClick={() => setIsTemplateModalOpen(true)}
                  disabled={!form.formState.isValid || !hasRecipients}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Template
                </Button>
              )}
            </div>

            <div className="flex flex-col items-end space-y-1">
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
              {!canCreateTemplate && (
                <p className="text-sm text-muted-foreground">
                  You don't have permission to create email templates
                </p>
              )}
              {!canReadTemplates && (
                <p className="text-sm text-muted-foreground">
                  You don't have permission to use email templates
                </p>
              )}
            </div>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
