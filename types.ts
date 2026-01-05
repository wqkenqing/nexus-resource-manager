
export enum ResourceType {
  CONFIG = 'Configuration',
  CERTIFICATE = 'Certificate',
  KEY = 'Access Key',
  DOCUMENT = 'Documentation',
  DATA_SAMPLE = 'Data Sample'
}

export interface ClaimRecord {
  id: string;
  resourceId: string;
  borrowerName: string;
  borrowerDept: string;
  borrowerContact: string;
  claimDate: string;
  quantity: number;
  purpose: string;
}

export interface Resource {
  id: string;
  projectId: string;
  folderName: string;
  name: string;
  type: ResourceType;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
  maxClaimsPerUser: number;
  fileName: string;
  fileSize?: number;
  fileContent?: string; // Base64 or text content for simulation
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  manager: string;
  status: 'active' | 'completed' | 'on-hold';
  createdAt: string;
}

export interface Folder {
  id: string;
  projectId: string;
  name: string;
}
