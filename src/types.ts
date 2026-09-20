export type ContentType = 'Image' | 'Audio' | 'Video' | 'Document';

export type VerificationStatus = 'Verified' | 'Pending' | 'Failed';

export interface VerificationHistoryItem {
  id: string;
  timestamp: string;
  verifier: string;
  result: 'Verified' | 'Failed';
  method: string;
  matchedHash: boolean;
  notes?: string;
  txHash?: string;
}

export type VerificationRecord = VerificationHistoryItem;

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  contentId?: string;
}

export interface RegisteredContent {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  creatorName: string;
  creatorWallet: string;
  creatorEmail?: string;
  dateRegistered: string;
  sha256Hash: string;
  transactionHash: string;
  blockNumber: number;
  network: string;
  status: VerificationStatus;
  fileSize: string;
  fileName: string;
  verificationHistory: VerificationHistoryItem[];
  tamperedHash?: string; // Optional field for demoing failed verification
  thumbnailUrl?: string; // Optional image preview
}

export interface ActivityItem {
  id: string;
  title: string;
  action: 'Registered' | 'Verified' | 'Verification Failed' | 'Pending Audit' | 'Failed' | 'Archived';
  type: ContentType;
  timestamp: string;
  txHash: string;
  contentId: string;
}

export interface BlockchainNetwork {
  id: string;
  name: string;
  symbol: string;
  blockTime: number;
  currentBlock: number;
  status: 'Connected' | 'Syncing' | 'Degraded';
}

export interface UserProfile {
  name: string;
  username?: string;
  email: string;
  phone?: string;
  avatar: string;
  walletAddress: string;
  role: string;
  organization: string;
  network: string;
}

export interface StoredUser extends UserProfile {
  password?: string;
  isDemo?: boolean;
}

export type LicenseType = 'Commercial' | 'Editorial' | 'Exclusive' | 'Non-Commercial' | 'Personal';
export type LicenseStatus = 'Active' | 'Expired' | 'Revoked';

export interface LicenseRecord {
  id: string;
  contentId: string;
  contentTitle?: string;
  creatorEmail?: string;
  licensee: string;
  licenseeEmail?: string;
  type: LicenseType;
  fee?: string;
  issueDate: string;
  expiry: string;
  permissions: string;
  status: LicenseStatus;
  txHash?: string;
}

export type DisputeType = 'Copyright Infringement' | 'Unauthorized Commercial Use' | 'Plagiarism' | 'Attribution Violation' | 'Ownership Dispute';
export type DisputeStatus = 'Under Review' | 'Resolved' | 'Dismissed';

export interface DisputeRecord {
  id: string;
  contentId: string;
  contentTitle?: string;
  creatorEmail?: string;
  claimant: string;
  claimantEmail?: string;
  type: DisputeType;
  description: string;
  evidence: string;
  status: DisputeStatus;
  dateFiled: string;
  resolutionNotes?: string;
  txHash?: string;
}
