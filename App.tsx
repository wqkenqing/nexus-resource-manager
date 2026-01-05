
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
import { Resource, Project, Folder, ResourceType, ClaimRecord } from './types.ts';

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
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [folders, setFolders] = useState<Folder[]>(MOCK_FOLDERS);
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
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

    setClaims(prev => [...prev, newClaim]);
    setResources(prev => prev.map(r => 
      r.id === selectedResource.id ? { ...r, availableQuantity: r.availableQuantity - 1 } : r
    ));
    
    const content = selectedResource.fileContent || `[Nexus Ops Logged Access]\nFile: ${selectedResource.name}\nRequested by: ${borrowerName}\nTimestamp: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedResource.fileName;
    a.click();
    window.URL.revokeObjectURL(url);

    message.success('Configuration downloaded and access logged.');
    setIsClaimOpen(false);
    setSelectedResource(null);
    claimForm.resetFields();
  }, [selectedResource, claims, claimForm]);

  const handleUploadSubmit = useCallback(async (values: any) => {
    if (uploadFileList.length === 0) {
      message.error('Please select at least one file to upload.');
      return;
    }

    const file = uploadFileList[0].originFileObj;
    const reader = new FileReader();
    reader.onload = (e) => {
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

      setResources(prev => [...prev, newResource]);
      message.success(`Resource "${newResource.name}" uploaded successfully`);
      setIsUploadOpen(false);
      setUploadFileList([]);
      uploadForm.resetFields();
    };
    reader.readAsText(file);
  }, [selectedProjectId, uploadForm, uploadFileList]);

  const handleCreateProject = useCallback((values: any) => {
    const newProject: Project = {
      id: 'p' + (projects.length + 10) + Math.floor(Math.random() * 1000),
      name: values.name,
      description: values.description,
      manager: values.manager,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setProjects(prev => [...prev, newProject]);
    message.success('Project created successfully');
    setIsProjectModalOpen(false);
    projectForm.resetFields();
  }, [projects, projectForm]);

  const handleCreateFolder = useCallback((values: any) => {
    if (!selectedProjectId) return;
    const newFolder: Folder = {
      id: 'f' + (folders.length + 10) + Math.floor(Math.random() * 1000),
      projectId: selectedProjectId,
      name: values.name
    };
    setFolders(prev => [...prev, newFolder]);
    message.success(`Folder "${values.name}" created`);
    setIsFolderModalOpen(false);
    folderForm.resetFields();
  }, [selectedProjectId, folders, folderForm]);

  const handleDeleteResource = useCallback((resourceId: string) => {
    setResources(prev => prev.filter(r => r.id !== resourceId));
    message.success('Resource deleted successfully');
  }, []);

  const handleDeleteFolder = useCallback((projectId: string, folderName: string) => {
    // Delete folder entry
    setFolders(prev => prev.filter(f => !(f.projectId === projectId && f.name === folderName)));
    // Delete all resources in that folder
    setResources(prev => prev.filter(r => !(r.projectId === projectId && r.folderName === folderName)));
    message.success(`Folder "${folderName}" and its resources deleted`);
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setFolders(prev => prev.filter(f => f.projectId !== projectId));
    setResources(prev => prev.filter(r => r.projectId !== projectId));
    message.success('Project and all its contents deleted');
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  }, [selectedProjectId]);

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
        <Col xs={24} sm={12} lg={6}><Card bordered={false}><Statistic title="Managed Projects" value={stats.totalProjects} prefix={<ProjectOutlined className="text-blue-500" />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card bordered={false}><Statistic title="Total Config Files" value={stats.totalResources} prefix={<FileTextOutlined className="text-indigo-500" />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card bordered={false}><Statistic title="Downloads Logged" value={stats.activeClaims} prefix={<DownloadOutlined className="text-emerald-500" />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card bordered={false}><Statistic title="Missing Configs" value={stats.outOfStockItems} valueStyle={{ color: stats.outOfStockItems > 0 ? '#ff4d4f' : '#52c41a' }} prefix={<ExclamationCircleOutlined />} /></Card></Col>
      </Row>
      <Card bordered={false} style={{ background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)', color: 'white' }}>
        <Title level={3} style={{ color: 'white', marginTop: 0 }}>Infrastructure AI Assistant</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)' }}>Query environment configurations or check cross-project resource distribution.</Paragraph>
        <Input.Search 
          placeholder="e.g., Which projects have OpenVPN configs?" 
          enterButton="Ask Ops AI" 
          size="large" 
          loading={aiLoading} 
          onSearch={handleAiSearch} 
        />
        {aiResponse && <div style={{ marginTop: 20, padding: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>{aiResponse}</div>}
      </Card>
    </Space>
  );

  const renderProjects = () => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      const projectResources = resources.filter(r => r.projectId === selectedProjectId);
      const projectFolders = folders.filter(f => f.projectId === selectedProjectId);
      
      const folderSet = new Set(projectFolders.map(f => f.name));
      projectResources.forEach(r => folderSet.add(r.folderName));
      const allFolderNames = Array.from(folderSet);

      const collapseItems = allFolderNames.map((folderName) => {
        const items = projectResources.filter(r => r.folderName === folderName);
        return {
          key: folderName,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', paddingRight: 24 }}>
              <Text strong style={{ fontSize: 16 }}>{folderName}</Text>
              <Popconfirm 
                title="Delete Folder" 
                description={`Delete "${folderName}" and all its contents?`} 
                onConfirm={(e) => { e?.stopPropagation(); handleDeleteFolder(selectedProjectId, folderName); }}
                onCancel={(e) => e?.stopPropagation()}
                okText="Yes" 
                cancelText="No"
              >
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small" 
                  onClick={(e) => e.stopPropagation()} 
                />
              </Popconfirm>
            </div>
          ),
          children: (
            <Row gutter={[16, 16]}>
              {items.length > 0 ? (
                items.map(r => (
                  <Col xs={24} md={12} lg={8} key={r.id}>
                    <Card 
                      size="small"
                      className="shadow-sm"
                      title={<Space><FileTextOutlined className="text-blue-500" />{r.name}</Space>}
                      extra={
                        <Popconfirm 
                          title="Delete File" 
                          description="Are you sure you want to delete this resource?" 
                          onConfirm={() => handleDeleteResource(r.id)} 
                          okText="Yes" 
                          cancelText="No"
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                      }
                      actions={[
                        <Button 
                          type="link" 
                          icon={<DownloadOutlined />}
                          disabled={r.availableQuantity === 0}
                          onClick={() => { setSelectedResource(r); setIsClaimOpen(true); }}
                        >
                          Download
                        </Button>,
                        <Tag color="blue" style={{ border: 'none', margin: 0 }}>{r.type}</Tag>
                      ]}
                    >
                      <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13, minHeight: 40 }}>{r.description}</Paragraph>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>{r.fileName}</Text>
                        <Text strong style={{ fontSize: 12, color: r.availableQuantity < 5 ? '#f5222d' : '#52c41a' }}>Stock: {r.availableQuantity}</Text>
                      </div>
                      {r.maxClaimsPerUser === 1 && <Tag color="orange" style={{ marginTop: 8, fontSize: 10 }}>Single Access Only</Tag>}
                    </Card>
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No files in this folder yet." />
                </Col>
              )}
            </Row>
          )
        };
      });

      return (
        <div className="animate-in slide-in-from-left-4 duration-500">
          <Breadcrumb items={[{ title: <a onClick={() => setSelectedProjectId(null)}>Projects</a> }, { title: project?.name }]} style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <Title level={2} style={{ marginBottom: 4 }}>{project?.name}</Title>
              <Text type="secondary">{project?.description}</Text>
            </div>
            <Space>
              <Button icon={<FolderAddOutlined />} onClick={() => setIsFolderModalOpen(true)}>New Folder</Button>
              <Button type="primary" icon={<UploadOutlined />} size="large" onClick={() => setIsUploadOpen(true)}>Upload Config</Button>
              <Popconfirm 
                title="Delete Project" 
                description="This will permanently delete the project and all contents. Continue?" 
                onConfirm={() => handleDeleteProject(selectedProjectId)}
                okText="Delete All" 
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} size="large" />
              </Popconfirm>
            </Space>
          </div>
          <Collapse 
            defaultActiveKey={allFolderNames} 
            ghost 
            items={collapseItems} 
            expandIcon={({ isActive }) => <FolderOpenOutlined rotate={isActive ? 90 : 0} />}
          />
          {allFolderNames.length === 0 && <Empty description="This project has no folders or files." />}
        </div>
      );
    }

    return (
      <div className="animate-in fade-in duration-500">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>Environments Directory</Title>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsProjectModalOpen(true)}>Create Environment</Button>
        </div>
        <Row gutter={[24, 24]}>
          {projects.map(p => (
            <Col xs={24} md={12} lg={8} key={p.id}>
              <Card 
                hoverable 
                className="shadow-sm" 
                onClick={() => setSelectedProjectId(p.id)} 
                title={p.name} 
                extra={
                  <Space>
                    <Tag color="green">{p.status.toUpperCase()}</Tag>
                    <Popconfirm 
                      title="Delete Project" 
                      description="Delete this project?" 
                      onConfirm={(e) => { e?.stopPropagation(); handleDeleteProject(p.id); }} 
                      onCancel={(e) => e?.stopPropagation()}
                      okText="Yes" 
                      cancelText="No"
                    >
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={(e) => e.stopPropagation()} 
                      />
                    </Popconfirm>
                  </Space>
                }
              >
                <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ minHeight: 44 }}>{p.description}</Paragraph>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary"><UserOutlined /> {p.manager}</Text>
                  <Text type="primary">View Folders <ArrowLeftOutlined rotate={180} /></Text>
                </div>
              </Card>
            </Col>
          ))}
          {projects.length === 0 && <Col span={24}><Empty description="No projects available. Create one to get started." /></Col>}
        </Row>
      </div>
    );
  };

  const renderHistory = () => (
    <Card title="Configuration Access Logs" bordered={false}>
      <Table 
        dataSource={claims.map(c => ({ ...c, key: c.id }))}
        columns={[
          { title: 'Engineer', dataIndex: 'borrowerName', key: 'name' },
          { title: 'Resource', key: 'res', render: (_, rec) => {
            const res = resources.find(r => r.id === rec.resourceId);
            return res ? res.name : <Text type="secondary" italic>(Deleted Resource)</Text>;
          }},
          { title: 'Date', dataIndex: 'claimDate', key: 'date' },
          { title: 'Reason', dataIndex: 'purpose', key: 'purpose', ellipsis: true },
          { title: 'Status', key: 's', render: () => <Tag color="success">DOWNLOADED</Tag> }
        ]}
      />
    </Card>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff', borderRadius: 6 } }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: 'white', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
          <Space style={{ marginRight: 40 }}><SolutionOutlined className="text-blue-600 text-xl" /><Title level={4} style={{ margin: 0 }}>Nexus Ops</Title></Space>
          <Menu mode="horizontal" selectedKeys={[activeTab]} items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: 'projects', icon: <ProjectOutlined />, label: 'Environments' },
            { key: 'history', icon: <HistoryOutlined />, label: 'Logs' },
          ]} onClick={({ key }) => setActiveTab(key)} style={{ flex: 1, border: 'none' }} />
        </Header>
        <Content style={{ padding: '32px 48px' }}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'projects' && renderProjects()}
          {activeTab === 'history' && renderHistory()}
        </Content>
      </Layout>

      <Modal title="Create New Environment Project" open={isProjectModalOpen} onCancel={() => setIsProjectModalOpen(false)} footer={null}>
        <Form form={projectForm} layout="vertical" onFinish={handleCreateProject}>
          <Form.Item name="name" label="Environment Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. AWS Production Cluster" />
          </Form.Item>
          <Form.Item name="manager" label="Owner/Manager" rules={[{ required: true }]}>
            <Input placeholder="Zhang Wei" />
          </Form.Item>
          <Form.Item name="description" label="Environment Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Region, purpose, and key services..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">Create Environment</Button>
        </Form>
      </Modal>

      <Modal title="Add New Folder" open={isFolderModalOpen} onCancel={() => setIsFolderModalOpen(false)} footer={null}>
        <Form form={folderForm} layout="vertical" onFinish={handleCreateFolder}>
          <Form.Item name="name" label="Folder Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. VPN_Configurations" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">Create Folder</Button>
        </Form>
      </Modal>

      <Modal title="Upload Resource File" open={isUploadOpen} onCancel={() => setIsUploadOpen(false)} footer={null} width={700}>
        <Form form={uploadForm} layout="vertical" onFinish={handleUploadSubmit} initialValues={{ type: ResourceType.CONFIG, quantity: 10 }}>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="Upload File" required>
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
                  <p className="ant-upload-text">Click or drag config file to this area to upload</p>
                  <p className="ant-upload-hint">Support for .ovpn, .xml, .yaml, .json, .crt, .key files</p>
                </Dragger>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item name="folderName" label="Target Folder" rules={[{ required: true }]}>
                <Select 
                  placeholder="Select folder..." 
                  options={folders.filter(f => f.projectId === selectedProjectId).map(f => ({ label: f.name, value: f.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Resource Display Name" rules={[{ required: true }]}>
                <Input placeholder="e.g., Production Admin VPN" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="type" label="Resource Type"><Select options={Object.values(ResourceType).map(v => ({ label: v, value: v }))} /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="quantity" label="Availability"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="limit" label="Access Limit"><InputNumber min={0} style={{ width: '100%' }} tooltip="0 = Unlimited downloads" /></Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="description" label="Technical Description"><Input.TextArea rows={2} placeholder="Optional notes for other engineers..." /></Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" block size="large" icon={<UploadOutlined />}>Publish & Upload Resource</Button>
        </Form>
      </Modal>

      <Modal title="Access Request Details" open={isClaimOpen} onCancel={() => setIsClaimOpen(false)} footer={null}>
        <Form form={claimForm} layout="vertical" onFinish={handleClaimSubmit}>
          <div className="bg-slate-50 p-4 rounded-md mb-6 border border-slate-100">
            <Space direction="vertical" size={2}>
              <Text strong>{selectedResource?.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>File: {selectedResource?.fileName}</Text>
            </Space>
          </div>
          <Form.Item name="borrowerName" label="Engineer Name" rules={[{ required: true }]}><Input prefix={<UserOutlined />} placeholder="e.g. Li Ming" /></Form.Item>
          <Form.Item name="borrowerDept" label="Department / Team" rules={[{ required: true }]}><Input prefix={<ProjectOutlined />} placeholder="e.g. Data Platform Ops" /></Form.Item>
          <Form.Item name="purpose" label="Purpose for Download" rules={[{ required: true }]}><Input.TextArea rows={2} placeholder="e.g. Accessing Alpha cluster for node maintenance (Ticket #1234)" /></Form.Item>
          <div style={{ background: '#fff7e6', border: '1px solid #ffd591', padding: 12, borderRadius: 8, marginBottom: 20 }}>
            <Space align="start"><ExclamationCircleOutlined style={{ color: '#faad14', marginTop: 4 }} /><Text type="secondary" style={{ fontSize: 12 }}>This action will be logged in the system audit history. Please ensure compliance with security policies.</Text></Space>
          </div>
          <Button type="primary" htmlType="submit" block size="large" icon={<DownloadOutlined />}>Log Access & Download File</Button>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
