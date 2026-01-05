
import React, { useState, useMemo, useCallback } from 'react';
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Badge,
  Progress,
  Empty,
  message,
  Typography,
  ConfigProvider,
  Space,
  Breadcrumb,
  Collapse,
  Upload,
  Popconfirm,
  Tooltip as AntTooltip
} from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  HistoryOutlined,
  PlusOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SolutionOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
  BulbOutlined,
  InboxOutlined,
  UploadOutlined,
  LineChartOutlined,
  FolderAddOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { getResourceAssistantResponse } from './services/geminiService.ts';
import { StorageService } from './services/storage.ts';
import { translations } from './locales.ts';
import { Resource, Project, Folder, ResourceType, ClaimRecord } from './types.ts';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

// --- CONSTANTS ---
const MOCK_PROJECTS: Project[] = [
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

const MOCK_FOLDERS: Folder[] = [
  { id: 'f1', projectId: 'p1', name: 'VPN_Configs' },
  { id: 'f2', projectId: 'p1', name: 'Cluster_Specs' },
  { id: 'f3', projectId: 'p2', name: 'VPN_Configs' }
];

const MOCK_RESOURCES: Resource[] = [
  {
    id: 'r1',
    projectId: 'p1',
    folderName: 'VPN_Configs',
    name: 'Ops-Admin-Access.ovpn',
    type: ResourceType.CONFIG,
    description: 'Admin level OpenVPN profile for Production Cluster Alpha.',
    totalQuantity: 50,
    availableQuantity: 45,
    maxClaimsPerUser: 1,
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

// --- APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [lang, setLang] = useState<'en' | 'zh'>('zh');

  const t = useMemo(() => translations[lang], [lang]);

  // Load Data on Mount
  React.useEffect(() => {
    const initData = async () => {
      try {
        await StorageService.initDB();
        await StorageService.seedDatabase(MOCK_PROJECTS, MOCK_FOLDERS, MOCK_RESOURCES);

        const [loadedProjects, loadedFolders, loadedResources, loadedClaims] = await Promise.all([
          StorageService.getAll<Project>(StorageService.STORES.PROJECTS),
          StorageService.getAll<Folder>(StorageService.STORES.FOLDERS),
          StorageService.getAll<Resource>(StorageService.STORES.RESOURCES),
          StorageService.getAll<ClaimRecord>(StorageService.STORES.CLAIMS)
        ]);

        setProjects(loadedProjects);
        setFolders(loadedFolders);
        setResources(loadedResources);
        setClaims(loadedClaims);
      } catch (error) {
        console.error("Failed to load data:", error);
        message.error("Failed to load persistent data.");
      }
    };
    initData();
  }, []);
  /* New State */
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);

  const [uploadForm] = Form.useForm();
  const [claimForm] = Form.useForm();
  const [projectForm] = Form.useForm();
  const [folderForm] = Form.useForm();

  const stats = useMemo(() => ({
    totalProjects: projects.length,
    totalResources: resources.length,
    activeClaims: claims.length,
    outOfStockItems: resources.filter(r => r.availableQuantity === 0).length
  }), [projects, resources, claims]);

  const handleClaimSubmit = useCallback(async (values: any) => {
    if (!selectedResource) return;
    const { borrowerName } = values;

    const userPreviousClaims = claims.filter(c => c.borrowerName === borrowerName && c.resourceId === selectedResource.id);
    if (selectedResource.maxClaimsPerUser > 0 && userPreviousClaims.length >= selectedResource.maxClaimsPerUser) {
      message.error('Download limit reached! You have already downloaded this configuration.');
      return;
    }

    const newClaim: ClaimRecord = {
      id: Math.random().toString(36).substr(2, 9),
      resourceId: selectedResource.id,
      borrowerName: values.borrowerName,
      borrowerDept: values.borrowerDept,
      borrowerContact: values.borrowerContact,
      purpose: values.purpose,
      quantity: 1,
      claimDate: new Date().toISOString().split('T')[0]
    };

    // Update DB
    await StorageService.add(StorageService.STORES.CLAIMS, newClaim);

    // Update Resource Stock in DB
    const updatedResource = { ...selectedResource, availableQuantity: selectedResource.availableQuantity - 1 };
    await StorageService.update(StorageService.STORES.RESOURCES, updatedResource);

    setClaims(prev => [...prev, newClaim]);
    setResources(prev => prev.map(r =>
      r.id === selectedResource.id ? updatedResource : r
    ));

    const content = selectedResource.fileContent || `[Nexus Ops Logged Access]\nFile: ${selectedResource.name}\nRequested by: ${borrowerName}\nTimestamp: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedResource.fileName;
    a.click();
    window.URL.revokeObjectURL(url);

    message.success(t.claims.modals.success);
    setIsClaimOpen(false);
    setSelectedResource(null);
    claimForm.resetFields();
  }, [selectedResource, claims, claimForm, t]);

  const handleUploadSubmit = useCallback(async (values: any) => {
    if (uploadFileList.length === 0) {
      message.error('Please select at least one file to upload.');
      return;
    }

    const file = uploadFileList[0].originFileObj;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;

      const newResource: Resource = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: selectedProjectId!,
        folderName: values.folderName,
        name: values.name || file.name,
        type: values.type,
        description: values.description || `Uploaded file: ${file.name}`,
        totalQuantity: values.quantity,
        availableQuantity: values.quantity,
        maxClaimsPerUser: values.limit || 0,
        fileName: file.name,
        fileSize: file.size,
        fileContent: content,
        createdAt: new Date().toISOString().split('T')[0]
      };

      await StorageService.add(StorageService.STORES.RESOURCES, newResource);

      setResources(prev => [...prev, newResource]);
      message.success(t.resources.modals.success.replace('{name}', newResource.name));
      setIsUploadOpen(false);
      setUploadFileList([]);
      uploadForm.resetFields();
    };
    reader.readAsText(file);
  }, [selectedProjectId, uploadForm, uploadFileList, t]);

  const handleCreateProject = useCallback(async (values: any) => {
    const newProject: Project = {
      id: 'p' + (projects.length + 10) + Math.floor(Math.random() * 1000),
      name: values.name,
      description: values.description,
      manager: values.manager,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };
    await StorageService.add(StorageService.STORES.PROJECTS, newProject);
    setProjects(prev => [...prev, newProject]);
    message.success(t.projects.modals.success);
    setIsProjectModalOpen(false);
    projectForm.resetFields();
  }, [projects, projectForm, t]);

  const handleCreateFolder = useCallback(async (values: any) => {
    if (!selectedProjectId) return;
    const newFolder: Folder = {
      id: 'f' + (folders.length + 10) + Math.floor(Math.random() * 1000),
      projectId: selectedProjectId,
      name: values.name
    };
    await StorageService.add(StorageService.STORES.FOLDERS, newFolder);
    setFolders(prev => [...prev, newFolder]);
    message.success(t.folders.modals.success.replace('{name}', values.name));
    setIsFolderModalOpen(false);
    folderForm.resetFields();
  }, [selectedProjectId, folders, folderForm, t]);

  const handleDeleteResource = useCallback(async (resourceId: string) => {
    await StorageService.remove(StorageService.STORES.RESOURCES, resourceId);
    setResources(prev => prev.filter(r => r.id !== resourceId));
    message.success(t.resources.deleteSuccess);
  }, [t]);

  const handleDeleteFolder = useCallback(async (projectId: string, folderName: string) => {
    // Delete folder entry from DB
    const folder = folders.find(f => f.projectId === projectId && f.name === folderName);
    if (folder) await StorageService.remove(StorageService.STORES.FOLDERS, folder.id);

    // Filter resources to delete
    const resourcesToDelete = resources.filter(r => r.projectId === projectId && r.folderName === folderName);
    for (const r of resourcesToDelete) {
      await StorageService.remove(StorageService.STORES.RESOURCES, r.id);
    }

    setFolders(prev => prev.filter(f => !(f.projectId === projectId && f.name === folderName)));
    setResources(prev => prev.filter(r => !(r.projectId === projectId && r.folderName === folderName)));
    message.success(t.folders.deleteSuccess.replace('{name}', folderName));
  }, [folders, resources, t]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    await StorageService.remove(StorageService.STORES.PROJECTS, projectId);

    // Cascade delete folders and resources
    const projectFolders = folders.filter(f => f.projectId === projectId);
    for (const f of projectFolders) await StorageService.remove(StorageService.STORES.FOLDERS, f.id);

    const projectResources = resources.filter(r => r.projectId === projectId);
    for (const r of projectResources) await StorageService.remove(StorageService.STORES.RESOURCES, r.id);

    setProjects(prev => prev.filter(p => p.id !== projectId));
    setFolders(prev => prev.filter(f => f.projectId !== projectId));
    setResources(prev => prev.filter(r => r.projectId !== projectId));
    message.success(t.projects.modals.deleteSuccess);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  }, [selectedProjectId, folders, resources, t]);

  const handleAiSearch = useCallback(async (q: string) => {
    if (!q) return;
    setAiLoading(true);
    try {
      const res = await getResourceAssistantResponse(q, projects, resources);
      setAiResponse(res || "I couldn't find an answer for that.");
    } catch (err) {
      message.error("AI Assistant is temporarily unavailable.");
    } finally {
      setAiLoading(false);
    }
  }, [projects, resources]);

  const renderDashboard = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}><Card bordered={false}><Statistic title={t.stats.projects} value={stats.totalProjects} prefix={<ProjectOutlined className="text-blue-500" />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card bordered={false}><Statistic title={t.stats.resources} value={stats.totalResources} prefix={<FileTextOutlined className="text-indigo-500" />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card bordered={false}><Statistic title={t.stats.claims} value={stats.activeClaims} prefix={<DownloadOutlined className="text-emerald-500" />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card bordered={false}><Statistic title={t.stats.missing} value={stats.outOfStockItems} valueStyle={{ color: stats.outOfStockItems > 0 ? '#ff4d4f' : '#52c41a' }} prefix={<ExclamationCircleOutlined />} /></Card></Col>
      </Row>
      <Card bordered={false} style={{ background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)', color: 'white' }}>
        <Title level={3} style={{ color: 'white', marginTop: 0 }}>{t.ai.title}</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)' }}>{t.ai.desc}</Paragraph>
        <Input.Search
          placeholder={t.ai.placeholder}
          enterButton={t.ai.button}
          size="large"
          loading={aiLoading}
          onSearch={handleAiSearch}
        />
        {aiResponse && <div style={{ marginTop: 20, padding: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>{aiResponse}</div>}
      </Card>
    </Space>
  );

  const renderProjects = () => {
    // 1. Inside a specific Folder: Show Resource List (Table)
    if (selectedProjectId && selectedFolderName) {
      const project = projects.find(p => p.id === selectedProjectId);
      const items = resources.filter(r => r.projectId === selectedProjectId && r.folderName === selectedFolderName);

      return (
        <div className="animate-in slide-in-from-right-8 duration-500">
          <Breadcrumb
            items={[
              { title: <a onClick={() => { setSelectedProjectId(null); setSelectedFolderName(null); }}>{t.projects.breadcrumbs}</a> },
              { title: <a onClick={() => setSelectedFolderName(null)}>{project?.name}</a> },
              { title: selectedFolderName }
            ]}
            style={{ marginBottom: 24 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Space>
              <FolderOpenOutlined style={{ fontSize: 24, color: '#1677ff' }} />
              <Title level={3} style={{ margin: 0 }}>{selectedFolderName}</Title>
            </Space>
            <Space>
              <Button type="primary" icon={<UploadOutlined />} onClick={() => {
                uploadForm.setFieldsValue({ folderName: selectedFolderName });
                setIsUploadOpen(true);
              }}>{t.folders.uploadBtn}</Button>
              <Popconfirm
                title={t.folders.deleteTitle}
                description={t.folders.deleteDesc.replace('{name}', selectedFolderName)}
                onConfirm={() => {
                  handleDeleteFolder(selectedProjectId, selectedFolderName);
                  setSelectedFolderName(null);
                }}
                okText={t.common.yes}
                cancelText={t.common.no}
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>{t.folders.deleteBtn}</Button>
              </Popconfirm>
            </Space>
          </div>

          <Table
            dataSource={items}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: t.resources.columns.name,
                key: 'name',
                render: (_, r) => (
                  <Space>
                    <FileTextOutlined className="text-blue-500" />
                    <Text strong>{r.name}</Text>
                  </Space>
                )
              },
              {
                title: t.common.description,
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
              },
              {
                title: t.resources.columns.type,
                dataIndex: 'type',
                key: 'type',
                render: (type) => <Tag color="blue">{type}</Tag>
              },
              {
                title: t.resources.columns.fileName,
                dataIndex: 'fileName',
                key: 'fileName',
                render: (name) => <Text type="secondary" style={{ fontSize: 12 }}>{name}</Text>
              },
              {
                title: t.resources.columns.stock,
                dataIndex: 'availableQuantity',
                key: 'stock',
                render: (qty) => (
                  <Text strong style={{ color: qty < 5 ? '#f5222d' : '#52c41a' }}>
                    {qty}
                  </Text>
                )
              },
              {
                title: t.resources.columns.claimants,
                key: 'claimants',
                ellipsis: true,
                render: (_, r) => {
                  const claimants = claims.filter(c => c.resourceId === r.id).map(c => c.borrowerName);
                  return claimants.length > 0 ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>{claimants.join(', ')}</Text>
                  ) : <Text type="secondary" italic>-</Text>;
                }
              },
              {
                title: t.common.action,
                key: 'action',
                render: (_, r) => (
                  <Space size="small">
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      disabled={r.availableQuantity === 0}
                      onClick={() => { setSelectedResource(r); setIsClaimOpen(true); }}
                    >
                      {t.common.download}
                    </Button>
                    <Popconfirm
                      title={t.resources.deleteTitle}
                      description={t.resources.deleteDesc}
                      onConfirm={() => handleDeleteResource(r.id)}
                      okText={t.common.yes}
                      cancelText={t.common.no}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
          />
          {items.length === 0 && <Empty description={t.folders.emptyResource} style={{ marginTop: 40 }} />}
        </div>
      );
    }

    // 2. Inside a Project: Show Folder Grid ("Netdisk" style)
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      const projectFolders = folders.filter(f => f.projectId === selectedProjectId);

      return (
        <div className="animate-in slide-in-from-left-4 duration-500">
          <Breadcrumb
            items={[
              { title: <a onClick={() => setSelectedProjectId(null)}>{t.projects.breadcrumbs}</a> },
              { title: project?.name }
            ]}
            style={{ marginBottom: 24 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <Title level={2} style={{ marginBottom: 4 }}>{project?.name}</Title>
              <Text type="secondary">{project?.description}</Text>
            </div>
            <Space>
              <Button icon={<FolderAddOutlined />} size="large" onClick={() => setIsFolderModalOpen(true)}>{t.folders.newBtn}</Button>
              <Popconfirm
                title={t.projects.deleteTitle}
                description={t.projects.deleteAllDesc}
                onConfirm={() => handleDeleteProject(selectedProjectId)}
                okText={t.projects.deleteAllBtn}
                cancelText={t.common.no}
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} size="large" />
              </Popconfirm>
            </Space>
          </div>

          <Row gutter={[24, 24]}>
            {projectFolders.map(f => (
              <Col xs={12} sm={8} md={6} lg={4} key={f.id}>
                <Card
                  hoverable
                  className="folder-card"
                  style={{ textAlign: 'center', borderRadius: 12, border: '1px solid #f0f0f0' }}
                  styles={{ body: { padding: '24px 12px' } }}
                  onClick={() => setSelectedFolderName(f.name)}
                >
                  <FolderOpenOutlined style={{ fontSize: 48, color: '#FFC107', marginBottom: 16 }} />
                  <br />
                  <Text strong style={{ fontSize: 16 }}>{f.name}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {resources.filter(r => r.projectId === selectedProjectId && r.folderName === f.name).length} items
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
            {projectFolders.length === 0 && (
              <Col span={24}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical">
                      <Text type="secondary">{t.projects.emptyState}</Text>
                      <Button type="dashed" icon={<FolderAddOutlined />} onClick={() => setIsFolderModalOpen(true)}>{t.projects.createFirstFolder}</Button>
                    </Space>
                  }
                />
              </Col>
            )}
          </Row>
        </div>
      );
    }

    // 3. Root: Project List (unchanged)
    return (
      <div className="animate-in fade-in duration-500">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>{t.projects.title}</Title>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsProjectModalOpen(true)}>{t.projects.createButton}</Button>
        </div>
        <Table
          dataSource={projects}
          rowKey="id"
          columns={[
            {
              title: t.projects.columns.name,
              dataIndex: 'name',
              key: 'name',
              render: (text, record) => (
                <a onClick={() => setSelectedProjectId(record.id)}>
                  <Text strong style={{ fontSize: 16 }}>{text}</Text>
                </a>
              ),
            },
            {
              title: t.common.description,
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
            },
            {
              title: t.projects.columns.manager,
              dataIndex: 'manager',
              key: 'manager',
              render: (text) => <Space><UserOutlined /> {text}</Space>
            },
            {
              title: t.projects.columns.status,
              dataIndex: 'status',
              key: 'status',
              render: (status) => <Tag color="green">{status.toUpperCase()}</Tag>
            },
            {
              title: t.common.action,
              key: 'action',
              render: (_, p) => (
                <Popconfirm
                  title={t.projects.deleteTitle}
                  description={t.projects.deleteDesc}
                  onConfirm={(e) => { e?.stopPropagation(); handleDeleteProject(p.id); }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText={t.common.yes}
                  cancelText={t.common.no}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              )
            }
          ]}
        />
      </div>
    );
  };



  const renderHistory = () => (
    <Card title={t.claims.title} bordered={false}>
      <Table
        dataSource={claims.map(c => ({ ...c, key: c.id }))}
        columns={[
          { title: t.claims.columns.engineer, dataIndex: 'borrowerName', key: 'name' },
          {
            title: t.claims.columns.resource, key: 'res', render: (_, rec) => {
              const res = resources.find(r => r.id === rec.resourceId);
              return res ? res.name : <Text type="secondary" italic>{t.claims.columns.deleted}</Text>;
            }
          },
          { title: t.claims.columns.date, dataIndex: 'claimDate', key: 'date' },
          { title: t.claims.columns.reason, dataIndex: 'purpose', key: 'purpose', ellipsis: true },
          { title: t.claims.columns.status, key: 's', render: () => <Tag color="success">{t.claims.columns.downloaded}</Tag> }
        ]}
      />
    </Card>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff', borderRadius: 6 } }} locale={lang === 'zh' ? zhCN : enUS}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: 'white', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
          <Space style={{ marginRight: 40 }}><SolutionOutlined className="text-blue-600 text-xl" /><Title level={4} style={{ margin: 0 }}>{t.appTitle}</Title></Space>
          <Menu mode="horizontal" selectedKeys={[activeTab]} items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: t.menu.dashboard },
            { key: 'projects', icon: <ProjectOutlined />, label: t.menu.projects },
            { key: 'history', icon: <HistoryOutlined />, label: t.menu.history },
          ]} onClick={({ key }) => setActiveTab(key)} style={{ flex: 1, border: 'none' }} />
          <Button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} style={{ marginLeft: 16 }}>
            {lang === 'en' ? '中文' : 'EN'}
          </Button>
        </Header>
        <Content style={{ padding: '32px 48px' }}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'projects' && renderProjects()}
          {activeTab === 'history' && renderHistory()}
        </Content>
      </Layout>

      <Modal title={t.projects.modals.createTitle} open={isProjectModalOpen} onCancel={() => setIsProjectModalOpen(false)} footer={null}>
        <Form form={projectForm} layout="vertical" onFinish={handleCreateProject}>
          <Form.Item name="name" label={t.projects.modals.nameLabel} rules={[{ required: true }]}>
            <Input placeholder={t.projects.modals.namePlace} />
          </Form.Item>
          <Form.Item name="manager" label={t.projects.modals.managerLabel} rules={[{ required: true }]}>
            <Input placeholder={t.projects.modals.managerPlace} />
          </Form.Item>
          <Form.Item name="description" label={t.projects.modals.descLabel} rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder={t.projects.modals.descPlace} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">{t.projects.modals.submit}</Button>
        </Form>
      </Modal>

      <Modal title={t.folders.modals.createTitle} open={isFolderModalOpen} onCancel={() => setIsFolderModalOpen(false)} footer={null}>
        <Form form={folderForm} layout="vertical" onFinish={handleCreateFolder}>
          <Form.Item name="name" label={t.folders.modals.nameLabel} rules={[{ required: true }]}>
            <Input placeholder={t.folders.modals.namePlace} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">{t.folders.modals.submit}</Button>
        </Form>
      </Modal>

      <Modal title={t.resources.modals.uploadTitle} open={isUploadOpen} onCancel={() => setIsUploadOpen(false)} footer={null} width={700}>
        <Form form={uploadForm} layout="vertical" onFinish={handleUploadSubmit} initialValues={{ type: ResourceType.CONFIG, quantity: 1 }}>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label={t.resources.modals.fileLabel} required>
                <Dragger
                  fileList={uploadFileList}
                  beforeUpload={() => false}
                  onChange={({ fileList }) => {
                    setUploadFileList(fileList.slice(-1));
                    if (fileList.length > 0) {
                      uploadForm.setFieldsValue({ name: fileList[0].name });
                    }
                  }}
                  multiple={false}
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">{t.resources.modals.dragText}</p>
                  <p className="ant-upload-hint">{t.resources.modals.dragHint}</p>
                </Dragger>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="folderName" label={t.resources.modals.folderLabel} rules={[{ required: true }]}>
                <Select
                  placeholder={t.resources.modals.folderPlace}
                  options={folders.filter(f => f.projectId === selectedProjectId).map(f => ({ label: f.name, value: f.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label={t.resources.modals.nameLabel} rules={[{ required: true }]}>
                <Input placeholder={t.resources.modals.namePlace} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="type" label={t.resources.modals.typeLabel}>
                <Select options={[
                  { label: t.types.config, value: ResourceType.CONFIG },
                  { label: t.types.cert, value: ResourceType.CERTIFICATE },
                  { label: t.types.key, value: ResourceType.KEY },
                  { label: t.types.doc, value: ResourceType.DOCUMENT },
                  { label: t.types.sample, value: ResourceType.DATA_SAMPLE }
                ]} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="quantity" label={t.resources.modals.qtyLabel}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="limit" label={t.resources.modals.limitLabel}><InputNumber min={0} style={{ width: '100%' }} tooltip={t.resources.modals.limitTooltip} /></Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="description" label={t.resources.modals.techDescLabel}><Input.TextArea rows={2} placeholder={t.resources.modals.techDescPlace} /> </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" block size="large" icon={<UploadOutlined />}>{t.resources.modals.submit}</Button>
        </Form>
      </Modal>

      <Modal title={t.claims.modals.title} open={isClaimOpen} onCancel={() => setIsClaimOpen(false)} footer={null}>
        <Form form={claimForm} layout="vertical" onFinish={handleClaimSubmit}>
          <div className="bg-slate-50 p-4 rounded-md mb-6 border border-slate-100">
            <Space direction="vertical" size={2}>
              <Text strong>{selectedResource?.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.resources.columns.fileName}: {selectedResource?.fileName}</Text>
            </Space>
          </div>
          <Form.Item name="borrowerName" label={t.claims.modals.nameLabel} rules={[{ required: true }]}><Input prefix={<UserOutlined />} placeholder={t.claims.modals.namePlace} /></Form.Item>
          <Form.Item name="borrowerDept" label={t.claims.modals.deptLabel}><Input prefix={<ProjectOutlined />} placeholder={t.common.optional} /></Form.Item>
          <Form.Item name="purpose" label={t.claims.modals.purposeLabel}><Input.TextArea rows={2} placeholder={t.common.optional} /></Form.Item>
          <div style={{ background: '#fff7e6', border: '1px solid #ffd591', padding: 12, borderRadius: 8, marginBottom: 20 }}>
            <Space align="start"><ExclamationCircleOutlined style={{ color: '#faad14', marginTop: 4 }} /><Text type="secondary" style={{ fontSize: 12 }}>{t.claims.modals.warn}</Text></Space>
          </div>
          <Button type="primary" htmlType="submit" block size="large" icon={<DownloadOutlined />}>{t.claims.modals.submit}</Button>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
