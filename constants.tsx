
import { ResourceType, Project, Resource } from './types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Production Cluster Alpha',
    description: 'Core Hadoop/Spark cluster for real-time analytics pipeline.',
    manager: 'Zhang Wei',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: 'p2',
    name: 'Dev-Stage Environment',
    description: 'Internal testing and staging for new data models.',
    manager: 'Li Na',
    status: 'active',
    createdAt: '2024-02-10',
  }
];

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'r1',
    projectId: 'p1',
    folderName: 'VPN_Configs',
    name: 'Ops-Admin-Access.ovpn',
    type: ResourceType.CONFIG,
    description: 'Admin level OpenVPN profile for Production Cluster Alpha.',
    totalQuantity: 50,
    availableQuantity: 45,
    maxClaimsPerUser: 1, // Only allowed one download
    fileName: 'admin_prod.ovpn',
    createdAt: '2024-01-20',
  },
  {
    id: 'r2',
    projectId: 'p1',
    folderName: 'Cluster_Specs',
    name: 'core-site.xml',
    type: ResourceType.CONFIG,
    description: 'Hadoop core configuration for HDFS access.',
    totalQuantity: 100,
    availableQuantity: 98,
    maxClaimsPerUser: 0,
    fileName: 'core-site.xml',
    createdAt: '2024-01-22',
  },
  {
    id: 'r3',
    projectId: 'p2',
    folderName: 'VPN_Configs',
    name: 'Developer-Sandbox.ovpn',
    type: ResourceType.CONFIG,
    description: 'Standard developer access for Dev-Stage environment.',
    totalQuantity: 200,
    availableQuantity: 150,
    maxClaimsPerUser: 1,
    fileName: 'dev_sandbox.ovpn',
    createdAt: '2024-02-15',
  }
];
