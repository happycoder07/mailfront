import * as z from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export const registerSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  firstName: z.string().min(1, {
    message: 'First name is required.',
  }),
  lastName: z.string().min(1, {
    message: 'Last name is required.',
  }),
  roleId: z.number({
    required_error: 'Role is required.',
  }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, {
    message: 'Current password must be at least 6 characters.',
  }),
  newPassword: z.string().min(6, {
    message: 'New password must be at least 6 characters.',
  }),
});

export const editUserSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  firstName: z.string().min(1, {
    message: 'First name is required.',
  }),
  lastName: z.string().min(1, {
    message: 'Last name is required.',
  }),
  roleId: z.number({
    required_error: 'Role is required.',
  }),
});

// Email validation schemas
export const recipientSchema = z.object({
  address: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  type: z.enum(['TO', 'CC', 'BCC'], {
    required_error: 'Recipient type is required.',
  }),
});

export const attachmentSchema = z.object({
  filename: z.string().min(1, {
    message: 'Filename is required.',
  }),
  path: z.string().optional(),
  contentType: z.string().optional(),
});

export const createEmailSchema = z.object({
  recipients: z.array(recipientSchema).optional(),
  contactRecipients: z.array(z.object({
    contactId: z.number(),
    type: z.enum(['TO', 'CC', 'BCC']),
  })).optional(),
  contactListRecipients: z.array(z.object({
    contactListId: z.number(),
    type: z.enum(['TO', 'CC', 'BCC']),
  })).optional(),
  subject: z.string().min(1, {
    message: 'Subject is required.',
  }),
  content: z.string().min(1, {
    message: 'Content is required.',
  }),
  html: z.string().optional(),
  attachments: z.array(z.instanceof(File)).optional(),
}).refine((data) => {
  // At least one type of recipient is required
  const hasDirectRecipients = data.recipients && data.recipients.length > 0;
  const hasContactRecipients = data.contactRecipients && data.contactRecipients.length > 0;
  const hasContactListRecipients = data.contactListRecipients && data.contactListRecipients.length > 0;

  return hasDirectRecipients || hasContactRecipients || hasContactListRecipients;
}, {
  message: 'At least one recipient is required (direct email, contact, or contact list).',
  path: ['recipients'], // This will show the error on the recipients field
});

export const rejectEmailSchema = z.object({
  reason: z.string().min(1, {
    message: 'Rejection reason is required.',
  }),
});

// Contact validation schemas
export const createContactSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required.',
  }),
  eid: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  contactListIds: z.array(z.number()).optional(),
});

// Types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type EditUserFormData = z.infer<typeof editUserSchema>;
export type RecipientFormData = z.infer<typeof recipientSchema>;
export type AttachmentFormData = z.infer<typeof attachmentSchema>;
export type CreateEmailFormData = z.infer<typeof createEmailSchema>;
export type RejectEmailFormData = z.infer<typeof rejectEmailSchema>;
export type CreateContactFormData = z.infer<typeof createContactSchema>;
