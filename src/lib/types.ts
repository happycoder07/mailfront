export interface EmailResponseDto {
  id: number;
  from: string;
  subject: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT' | 'FAILED';
  signedContent?: string;
  rejectionReason?: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectedBy?: number;
  rejectedAt?: string;
  attachments: Array<{
    id: number;
    filename: string;
    contentType: string;
    size: number;
    minioKey: string;
    emailId: number;
    createdAt: string;
    updatedAt: string;
  }>;
  recipients: Array<{
    id: number;
    emailId: number;
    address: string;
    type: 'TO' | 'CC' | 'BCC';
    createdAt: string;
    updatedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
