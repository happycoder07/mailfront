import * as z from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  twoFactorToken: z.string().optional(),
});

export const loginWithTwoFactorSchema = z.object({
  token: z.string().refine(
    val => {
      // Accept either 6-digit TOTP token or 8-character alphanumeric backup code
      const isTOTP = /^\d{6}$/.test(val);
      const isBackupCode = /^[A-Z0-9]{8}$/.test(val);
      return isTOTP || isBackupCode;
    },
    {
      message: 'Please enter a valid 6-digit authentication code or 8-character backup code.',
    }
  ),
  tempToken: z.string().min(1, {
    message: 'Temporary token is required.',
  }),
});

// 2FA validation schemas
export const enableTwoFactorSchema = z.object({
  token: z.string().min(6, {
    message: 'Please enter a valid 6-digit token.',
  }),
});

export const disableTwoFactorSchema = z.object({
  token: z.string().refine(
    val => {
      // Accept either 6-digit TOTP token or 8-character alphanumeric backup code
      const isTOTP = /^\d{6}$/.test(val);
      const isBackupCode = /^[A-Z0-9]{8}$/.test(val);
      return isTOTP || isBackupCode;
    },
    {
      message: 'Please enter a valid 6-digit token or 8-character backup code.',
    }
  ),
});

export const verifyTwoFactorSchema = z.object({
  token: z.string().refine(
    val => {
      // Accept either 6-digit TOTP token or 8-character alphanumeric backup code
      const isTOTP = /^\d{6}$/.test(val);
      const isBackupCode = /^[A-Z0-9]{8}$/.test(val);
      return isTOTP || isBackupCode;
    },
    {
      message: 'Please enter a valid 6-digit token or 8-character backup code.',
    }
  ),
});

export const regenerateBackupCodesSchema = z.object({
  token: z.string().min(6, {
    message: 'Please enter a valid 6-digit token.',
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

export const createEmailSchema = z
  .object({
    recipients: z.array(recipientSchema).optional(),
    contactRecipients: z
      .array(
        z.object({
          contactId: z.number(),
          type: z.enum(['TO', 'CC', 'BCC']),
        })
      )
      .optional(),
    contactListRecipients: z
      .array(
        z.object({
          contactListId: z.number(),
          type: z.enum(['TO', 'CC', 'BCC']),
        })
      )
      .optional(),
    subject: z.string().min(1, {
      message: 'Subject is required.',
    }),
    content: z.string().min(1, {
      message: 'Content is required.',
    }),
    html: z.boolean().optional(),
    attachments: z.array(z.instanceof(File)).optional(),
  })
  .refine(
    data => {
      // At least one type of recipient is required
      const hasDirectRecipients = data.recipients && data.recipients.length > 0;
      const hasContactRecipients = data.contactRecipients && data.contactRecipients.length > 0;
      const hasContactListRecipients =
        data.contactListRecipients && data.contactListRecipients.length > 0;

      return hasDirectRecipients || hasContactRecipients || hasContactListRecipients;
    },
    {
      message: 'At least one recipient is required (direct email, contact, or contact list).',
      path: ['recipients'], // This will show the error on the recipients field
    }
  );

export const createTemplateSchema = z.object({
  name: z.string().min(1, {
    message: 'Template name is required.',
  }),
  subject: z.string().min(1, {
    message: 'Subject is required.',
  }),
  content: z.string().min(1, {
    message: 'Content is required.',
  }),
  html: z.boolean().optional(),
  templateEmailRecipients: z
    .array(
      z.object({
        address: z.string().email(),
        type: z.enum(['TO', 'CC', 'BCC']),
      })
    )
    .optional(),
  templateContactRecipients: z
    .array(
      z.object({
        contactId: z.number(),
        type: z.enum(['TO', 'CC', 'BCC']),
      })
    )
    .optional(),
  templateContactListRecipients: z
    .array(
      z.object({
        contactListId: z.number(),
        type: z.enum(['TO', 'CC', 'BCC']),
      })
    )
    .optional(),
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
export type LoginWithTwoFactorFormData = z.infer<typeof loginWithTwoFactorSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type EditUserFormData = z.infer<typeof editUserSchema>;
export type EnableTwoFactorFormData = z.infer<typeof enableTwoFactorSchema>;
export type DisableTwoFactorFormData = z.infer<typeof disableTwoFactorSchema>;
export type VerifyTwoFactorFormData = z.infer<typeof verifyTwoFactorSchema>;
export type RegenerateBackupCodesFormData = z.infer<typeof regenerateBackupCodesSchema>;
export type RecipientFormData = z.infer<typeof recipientSchema>;
export type AttachmentFormData = z.infer<typeof attachmentSchema>;
export type CreateEmailFormData = z.infer<typeof createEmailSchema>;
export type CreateTemplateFormData = z.infer<typeof createTemplateSchema>;
export type RejectEmailFormData = z.infer<typeof rejectEmailSchema>;
export type CreateContactFormData = z.infer<typeof createContactSchema>;
