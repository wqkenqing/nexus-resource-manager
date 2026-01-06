
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
  DeleteOutlined,
  EditOutlined,
  ArrowRightOutlined,
  ShareAltOutlined,
  SettingOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons';
const API_BASE = `http://${window.location.hostname}:3001`;
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

        // Handle Deep Linking / Share URL
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');
        if (shareId) {
          const sharedRes = loadedResources.find(r => r.id === shareId);
          if (sharedRes && sharedRes.availableQuantity > 0) {
            setSelectedResource(sharedRes);
            setIsStandaloneShare(true);
            setClaimSuccess(false);
          } else if (sharedRes && sharedRes.availableQuantity === 0) {
            message.warning(lang === 'zh' ? '该资源已无库存，无法申领' : 'Resource out of stock');
          }
        }
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
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isStandaloneShare, setIsStandaloneShare] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);

  const [uploadForm] = Form.useForm();
  const [claimForm] = Form.useForm();
  const [projectForm] = Form.useForm();
  const [folderForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const stats = useMemo(() => ({
    totalProjects: projects.length,
    totalResources: resources.length,
    activeClaims: claims.length
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

    // Download from physical storage server (Hierarchical path)
    const a = document.createElement('a');
    const encodedPid = encodeURIComponent(selectedResource.projectId);
    const encodedFid = encodeURIComponent(selectedResource.folderName);
    const encodedFname = encodeURIComponent(selectedResource.fileName);
    a.href = `${API_BASE}/api/files/${encodedPid}/${encodedFid}/${encodedFname}`;
    a.download = selectedResource.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    message.success(t.claims.modals.success);
    setIsClaimOpen(false);
    if (isStandaloneShare) {
      setClaimSuccess(true);
    } else {
      setSelectedResource(null);
    }
    claimForm.resetFields();
  }, [selectedResource, claims, claimForm, t, isStandaloneShare]);

  const handleUploadSubmit = useCallback(async (values: any) => {
    if (uploadFileList.length === 0) {
      message.error('Please select at least one file to upload.');
      return;
    }

    if (!selectedProjectId) {
      message.error('Project context lost. Please refresh.');
      return;
    }

    const isBatch = uploadFileList.length > 1;
    const hide = message.loading(isBatch ? 'Batch uploading files...' : 'Uploading file...', 0);

    try {
      const results = await Promise.all(uploadFileList.map(async (fileItem) => {
        const file = fileItem.originFileObj;
        const formData = new FormData();
        formData.append('file', file);

        // 1. Upload to physical storage server
        const uploadRes = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: {
            'x-project-id': encodeURIComponent(selectedProjectId),
            'x-folder-name': encodeURIComponent(values.folderName),
          },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);

        // 2. Read file content
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Read failed'));
          reader.readAsText(file);
        });

        // 3. Prepare Metadata
        const newResource: Resource = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: selectedProjectId,
          folderName: values.folderName,
          name: values.name || '',
          type: values.type,
          description: values.description || '',
          totalQuantity: values.quantity,
          availableQuantity: values.quantity,
          maxClaimsPerUser: values.limit || 0,
          fileName: file.name,
          fileSize: file.size,
          fileContent: content,
          createdAt: new Date().toISOString().split('T')[0]
        };

        await StorageService.add(StorageService.STORES.RESOURCES, newResource);
        return newResource;
      }));

      setResources(prev => [...prev, ...results]);
      message.success(isBatch ? `Successfully uploaded ${results.length} files` : t.resources.modals.success.replace('{name}', results[0].name));
      setIsUploadOpen(false);
      setUploadFileList([]);
      uploadForm.resetFields();
    } catch (err: any) {
      console.error('Batch Upload Error:', err);
      message.error(`Upload Error: ${err.message}`);
    } finally {
      hide();
    }
  }, [selectedProjectId, uploadForm, uploadFileList, t]);

  const handleEditSubmit = useCallback(async (values: any) => {
    if (!selectedResource) return;

    const oldFileName = selectedResource.fileName;
    const newFileName = values.fileName;
    const fileNameChanged = oldFileName !== newFileName;

    if (fileNameChanged) {
      try {
        const renameRes = await fetch(`${API_BASE}/api/rename`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedResource.projectId,
            folderName: selectedResource.folderName,
            oldFileName: oldFileName,
            newFileName: newFileName
          })
        });

        if (!renameRes.ok) {
          const errData = await renameRes.json();
          throw new Error(errData.error || 'Rename failed');
        }
      } catch (err: any) {
        message.error(`File rename failed: ${err.message}`);
        return;
      }
    }

    const updatedResource = {
      ...selectedResource,
      name: values.name || '',
      fileName: newFileName,
      type: values.type,
      description: values.description,
      totalQuantity: values.quantity,
      availableQuantity: values.quantity - (selectedResource.totalQuantity - selectedResource.availableQuantity),
      maxClaimsPerUser: values.limit || 0
    };

    await StorageService.update(StorageService.STORES.RESOURCES, updatedResource);
    setResources(prev => prev.map(r => r.id === updatedResource.id ? updatedResource : r));
    message.success(t.resources.modals.editSuccess);
    setIsEditOpen(false);
    setSelectedResource(null);
    editForm.resetFields();
  }, [selectedResource, editForm, t, resources]);

  const handleUpdateDescription = useCallback(async (resourceId: string, newDesc: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    const updatedResource = { ...resource, description: newDesc };
    await StorageService.update(StorageService.STORES.RESOURCES, updatedResource);
    setResources(prev => prev.map(r => r.id === resourceId ? updatedResource : r));
    setInlineEditingId(null);
    message.success(t.resources.modals.editSuccess);
  }, [resources, t]);

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
    const resToDelete = resources.find(r => r.id === resourceId);
    if (resToDelete) {
      try {
        const encodedProjectId = encodeURIComponent(resToDelete.projectId);
        const encodedFolderName = encodeURIComponent(resToDelete.folderName);
        const encodedFileName = encodeURIComponent(resToDelete.fileName);
        await fetch(`${API_BASE}/api/files/${encodedProjectId}/${encodedFolderName}/${encodedFileName}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.error('Failed to delete physical file:', e);
      }
    }

    await StorageService.remove(StorageService.STORES.RESOURCES, resourceId);
    setResources(prev => prev.filter(r => r.id !== resourceId));
    message.success(t.resources.deleteSuccess);
  }, [t, resources]);

  const handleDeleteFolder = useCallback(async (projectId: string, folderName: string) => {
    // 1. Delete physical folder
    try {
      await fetch(`${API_BASE}/api/folders/${encodeURIComponent(projectId)}/${encodeURIComponent(folderName)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to delete physical folder:', e);
    }

    // 2. Delete metadata
    const folder = folders.find(f => f.projectId === projectId && f.name === folderName);
    if (folder) await StorageService.remove(StorageService.STORES.FOLDERS, folder.id);

    const resourcesToDelete = resources.filter(r => r.projectId === projectId && r.folderName === folderName);
    for (const r of resourcesToDelete) {
      await StorageService.remove(StorageService.STORES.RESOURCES, r.id);
    }

    setFolders(prev => prev.filter(f => !(f.projectId === projectId && f.name === folderName)));
    setResources(prev => prev.filter(r => !(r.projectId === projectId && r.folderName === folderName)));
    message.success(t.folders.deleteSuccess.replace('{name}', folderName));
  }, [folders, resources, t]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    // 1. Delete physical project folder
    try {
      await fetch(`${API_BASE}/api/projects/${encodeURIComponent(projectId)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to delete physical project:', e);
    }

    // 2. Delete metadata
    await StorageService.remove(StorageService.STORES.PROJECTS, projectId);

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

  const handleShare = useCallback((resourceId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?share=${resourceId}`;

    // Polyfill/Fallback for clipboard in insecure contexts (HTTP + IP)
    const performCopy = (text: string) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful ? Promise.resolve() : Promise.reject(new Error('Copy failed'));
        } catch (err) {
          document.body.removeChild(textArea);
          return Promise.reject(err);
        }
      }
    };

    performCopy(url).then(() => {
      message.success(lang === 'zh' ? '分享链接已复制到剪切板' : 'Share link copied to clipboard!');
    }).catch(err => {
      console.error('Clipboard error:', err);
      message.error(lang === 'zh' ? '复制失败，请手动复制 URL' : 'Copy failed, please copy URL manually');
    });
  }, [lang]);

  const handleExportData = useCallback(async () => {
    const allData = {
      projects,
      folders,
      resources,
      claims,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t.system.exportFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(lang === 'zh' ? '元数据导出成功' : 'Metadata exported successfully');
  }, [projects, folders, resources, claims, t, lang]);

  const handleImportData = useCallback(async (info: any) => {
    const file = info.file;
    if (!file) return;

    const hide = message.loading(lang === 'zh' ? '由于数据正在恢复，请稍候...' : 'Restoring data, please wait...', 0);
    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });

      const data = JSON.parse(text);
      if (!data.projects || !data.folders || !data.resources || !data.claims) {
        throw new Error('Invalid metadata format');
      }

      // 1. Clear existing IndexedDB data
      const stores = [
        StorageService.STORES.PROJECTS,
        StorageService.STORES.FOLDERS,
        StorageService.STORES.RESOURCES,
        StorageService.STORES.CLAIMS
      ];

      for (const store of stores) {
        const currentItems = await StorageService.getAll(store);
        for (const item of currentItems) {
          await StorageService.remove(store, (item as any).id);
        }
      }

      // 2. Restore from backup
      for (const p of data.projects) await StorageService.add(StorageService.STORES.PROJECTS, p);
      for (const f of data.folders) await StorageService.add(StorageService.STORES.FOLDERS, f);
      for (const r of data.resources) await StorageService.add(StorageService.STORES.RESOURCES, r);
      for (const c of data.claims) await StorageService.add(StorageService.STORES.CLAIMS, c);

      message.success(t.system.importSuccess);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      console.error('Import Error:', err);
      message.error(t.system.importError);
    } finally {
      hide();
    }
  }, [t, lang]);

  const handleQuickSearch = useCallback((q: string) => {
    const rawQuery = q.trim();
    if (!rawQuery) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);

    const terms = rawQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const results: any[] = [];

    // Helper: Calculate match score for an item
    const calculateScore = (target: string, queryTerms: string[]) => {
      let score = 0;
      const lowerTarget = target.toLowerCase();

      queryTerms.forEach(term => {
        if (lowerTarget === term) score += 100; // Exact match
        else if (lowerTarget.split('.').includes(term)) score += 80; // File segment match
        else if (lowerTarget.startsWith(term)) score += 40; // Prefix match
        else if (lowerTarget.includes(term)) score += 15; // Contains match
      });
      return score;
    };

    // 1. Search Projects
    projects.forEach(p => {
      const nameScore = calculateScore(p.name, terms);
      const descScore = calculateScore(p.description || '', terms);
      let matchCount = 0;
      terms.forEach(t => {
        if (p.name.toLowerCase().includes(t) || (p.description && p.description.toLowerCase().includes(t))) {
          matchCount++;
        }
      });

      const totalScore = nameScore + (descScore * 0.5) + (matchCount === terms.length ? 150 : 0);

      if (totalScore > 0 && matchCount >= (terms.length > 1 ? terms.length - 1 : 1)) {
        results.push({
          type: 'project',
          id: p.id,
          name: p.name,
          desc: p.description,
          score: totalScore
        });
      }
    });

    // 2. Search Resources
    resources.forEach(r => {
      const nameScore = calculateScore(r.name, terms);
      const fileScore = calculateScore(r.fileName, terms);
      const descScore = calculateScore(r.description || '', terms);
      const typeScore = terms.some(t => r.type.toLowerCase().includes(t)) ? 40 : 0;

      let matchCount = 0;
      terms.forEach(t => {
        if (r.name.toLowerCase().includes(t) || r.fileName.toLowerCase().includes(t) || r.type.toLowerCase().includes(t) || (r.description && r.description.toLowerCase().includes(t))) {
          matchCount++;
        }
      });

      // Special check for extensions
      const fileExt = r.fileName.split('.').pop()?.toLowerCase();
      const hasExtMatch = fileExt && terms.some(t => t === fileExt || t === `.${fileExt}`);

      const totalScore = nameScore + fileScore + (descScore * 0.3) + typeScore + (hasExtMatch ? 120 : 0) + (matchCount === terms.length ? 200 : 0);

      if (totalScore > 0 && matchCount >= (terms.length > 1 ? Math.floor(terms.length * 0.6) : 1)) {
        const project = projects.find(p => p.id === r.projectId);
        results.push({
          type: 'resource',
          id: r.id,
          name: r.name,
          fileName: r.fileName,
          projectId: r.projectId,
          folderName: r.folderName,
          projectName: project?.name || 'Unknown',
          resourceType: r.type,
          score: totalScore
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    setSearchResults(results.slice(0, 30));
    setSearchLoading(false);
  }, [projects, resources]);

  const renderDashboard = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}><Card bordered={false}><Statistic title={t.stats.projects} value={stats.totalProjects} prefix={<ProjectOutlined className="text-blue-500" />} /></Card></Col>
        <Col xs={24} sm={12} lg={8}><Card bordered={false}><Statistic title={t.stats.resources} value={stats.totalResources} prefix={<FileTextOutlined className="text-indigo-500" />} /></Card></Col>
        <Col xs={24} sm={12} lg={8}><Card bordered={false}><Statistic title={t.stats.claims} value={stats.activeClaims} prefix={<DownloadOutlined className="text-emerald-500" />} /></Card></Col>
      </Row>
      <Card bordered={false} style={{ background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)', color: 'white' }}>
        <Title level={3} style={{ color: 'white', marginTop: 0 }}>{t.ai.title}</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)' }}>{t.ai.desc}</Paragraph>
        <Input.Search
          placeholder={t.ai.placeholder}
          enterButton={t.ai.button}
          size="large"
          loading={searchLoading}
          onSearch={handleQuickSearch}
          allowClear
        />
        {searchResults.length > 0 && (
          <div style={{ marginTop: 24, padding: '20px', background: 'rgba(255,255,255,0.08)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', maxHeight: 500, overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-4">
              <Title level={5} style={{ color: 'white', margin: 0 }}>
                {t.ai.responseResult}
              </Title>
              <Badge count={searchResults.length} overflowCount={99} style={{ backgroundColor: '#52c41a', boxShadow: 'none' }} />
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Projects Group */}
              {searchResults.some(r => r.type === 'project') && (
                <div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2 font-bold px-2">{t.menu.projects}</div>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {searchResults.filter(r => r.type === 'project').map((res, idx) => (
                      <div
                        key={`p-${idx}`}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-between group border border-transparent hover:border-white/10"
                        onClick={() => {
                          setActiveTab('projects');
                          setSelectedProjectId(res.id);
                        }}
                      >
                        <Space size="middle">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <ProjectOutlined style={{ color: '#69c0ff', fontSize: 18 }} />
                          </div>
                          <div>
                            <Text style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{res.name}</Text>
                            {res.desc && (
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} className="truncate max-w-[400px]">
                                {res.desc}
                              </div>
                            )}
                          </div>
                        </Space>
                        <ArrowRightOutlined className="opacity-0 group-hover:opacity-100 transition-opacity text-white/50" />
                      </div>
                    ))}
                  </Space>
                </div>
              )}

              {/* Resources Group */}
              {searchResults.some(r => r.type === 'resource') && (
                <div style={{ marginTop: 8 }}>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2 font-bold px-2">{t.stats.resources}</div>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {searchResults.filter(r => r.type === 'resource').map((res, idx) => (
                      <div
                        key={`r-${idx}`}
                        className="p-3 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl cursor-pointer transition-all flex items-center justify-between group border border-transparent hover:border-emerald-500/20"
                        onClick={() => {
                          setActiveTab('projects');
                          setSelectedProjectId(res.projectId);
                          setSelectedFolderName(res.folderName);
                        }}
                      >
                        <Space size="middle">
                          <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <FileTextOutlined style={{ color: '#b7eb8f', fontSize: 18 }} />
                          </div>
                          <div>
                            <Space align="center" size={8}>
                              <Text style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{res.fileName}</Text>
                              <Tag size="small" color="emerald" style={{ fontSize: 10, margin: 0, opacity: 0.8, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#b7eb8f' }}>
                                {res.resourceType}
                              </Tag>
                            </Space>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                              <span className="text-blue-300/80">{res.projectName}</span>
                              <span className="mx-1">/</span>
                              <span>{res.folderName}</span>
                              {res.name && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span className="bg-white/10 px-1.5 rounded text-[10px] text-white/80">
                                    {res.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </Space>
                        <ArrowRightOutlined className="opacity-0 group-hover:opacity-100 transition-opacity text-white/50" />
                      </div>
                    ))}
                  </Space>
                </div>
              )}
            </Space>
          </div>
        )}
        {searchResults.length === 0 && searchLoading === false && (
          <div style={{ marginTop: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)' }}>{t.ai.noAnswer}</Text>
          </div>
        )}
      </Card>

      <Card bordered={false} title={<Space><SettingOutlined className="text-gray-500" /><span>{t.system.title}</span></Space>}>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <Paragraph type="secondary" style={{ fontSize: 13 }}>
              {lang === 'zh' ?
                '当您需要迁移系统或在不同服务器间同步配置元数据时，可以使用导出功能。注意：此操作仅导出项目/文件关联信息，物理文件需手动迁移 uploads 文件夹。' :
                'Use the export function when migrating systems or syncing metadata. Note: This only exports metadata; physical files must be migrated manually by moving the uploads folder.'}
            </Paragraph>
            <Space size="middle">
              <Button icon={<CloudDownloadOutlined />} onClick={handleExportData} type="primary" ghost>
                {t.system.exportBtn}
              </Button>
              <Upload
                accept=".json"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleImportData}
              >
                <Button icon={<CloudUploadOutlined />}>
                  {t.system.importBtn}
                </Button>
              </Upload>
            </Space>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-none w-full md:w-64">
            <Space direction="vertical" size={0}>
              <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Instance Info</Text>
              <Text className="text-xs font-mono text-blue-600 truncate block w-full">API: {API_BASE}</Text>
              <Text className="text-xs font-mono text-gray-500 block">Host: {window.location.hostname}</Text>
            </Space>
          </div>
        </div>
      </Card>
    </Space>
  );

  const renderProjects = () => {
    // 1. Inside a specific Folder: Show Resource List (Table)
    if (selectedProjectId && selectedFolderName) {
      const project = projects.find(p => p.id === selectedProjectId);
      const items = resources
        .filter(r => r.projectId === selectedProjectId && r.folderName === selectedFolderName)
        .sort((a, b) => {
          if (a.availableQuantity > 0 && b.availableQuantity === 0) return -1;
          if (a.availableQuantity === 0 && b.availableQuantity > 0) return 1;
          return 0;
        });

      return (
        <div className="animate-in slide-in-from-right-8 duration-500">
          <div className="mb-6 flex flex-col gap-4">
            <Breadcrumb
              className="text-sm"
              items={[
                {
                  title: (
                    <Space className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => { setSelectedProjectId(null); setSelectedFolderName(null); }}>
                      <ProjectOutlined />
                      <span>{t.projects.breadcrumbs}</span>
                    </Space>
                  )
                },
                {
                  title: (
                    <Space className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setSelectedFolderName(null)}>
                      <span>{project?.name}</span>
                    </Space>
                  )
                },
                { title: <span className="font-semibold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md">{selectedFolderName}</span> }
              ]}
            />

            <div className="flex justify-between items-end">
              <div>
                <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FolderOpenOutlined className="text-amber-500" />
                  {selectedFolderName}
                </Title>
                <Text type="secondary">{project?.name} / {selectedFolderName}</Text>
              </div>
              <Space size="middle">
                <Button
                  type="primary"
                  size="large"
                  icon={<UploadOutlined />}
                  className="shadow-md hover:shadow-lg transition-all"
                  onClick={() => {
                    uploadForm.setFieldsValue({ folderName: selectedFolderName });
                    setIsUploadOpen(true);
                  }}
                >
                  {t.folders.uploadBtn}
                </Button>
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
                  <Button danger ghost icon={<DeleteOutlined />}>{t.common.delete}</Button>
                </Popconfirm>
              </Space>
            </div>
          </div>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card size="small" className="bg-blue-50/50 border-blue-100">
                <Statistic title={t.stats.resources} value={items.length} prefix={<FileTextOutlined className="text-blue-500" />} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="bg-emerald-50/50 border-emerald-100">
                <Statistic title={t.resources.columns.stock} value={items.reduce((acc, curr) => acc + curr.availableQuantity, 0)} prefix={<CheckCircleOutlined className="text-emerald-500" />} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="bg-indigo-50/50 border-indigo-100">
                <Statistic title={t.stats.claims} value={claims.filter(c => items.some(i => i.id === c.resourceId)).length} prefix={<DownloadOutlined className="text-indigo-500" />} />
              </Card>
            </Col>
          </Row>

          <Card bordered={false} styles={{ body: { padding: 0 } }} className="shadow-sm overflow-hidden">
            <Table
              dataSource={items}
              rowKey="id"
              pagination={false}
              className="custom-table"
              columns={[
                {
                  title: t.resources.columns.fileName,
                  dataIndex: 'fileName',
                  key: 'fileName',
                  width: 180,
                  ellipsis: true,
                  render: (name) => (
                    <Space>
                      <FileTextOutlined className="text-blue-500" />
                      <Text strong>{name}</Text>
                    </Space>
                  )
                },
                {
                  title: t.resources.columns.type,
                  dataIndex: 'type',
                  key: 'type',
                  width: 100,
                  render: (type) => {
                    const colors: Record<string, string> = {
                      [ResourceType.CONFIG]: 'blue',
                      [ResourceType.CERTIFICATE]: 'gold',
                      [ResourceType.KEY]: 'red',
                      [ResourceType.DOCUMENT]: 'cyan',
                      [ResourceType.DATA_SAMPLE]: 'purple'
                    };
                    return <Tag color={colors[type] || 'default'} variant="light" style={{ margin: 0 }}>{type}</Tag>
                  }
                },
                {
                  title: t.resources.columns.name,
                  key: 'name',
                  width: 150,
                  ellipsis: true,
                  render: (_, r) => <Text type={r.name ? 'reset' : 'secondary'} style={{ fontSize: 13 }}>{r.name || '-'}</Text>
                },
                {
                  title: t.resources.columns.stock,
                  dataIndex: 'availableQuantity',
                  key: 'stock',
                  width: 80,
                  align: 'center',
                  render: (qty) => (
                    <Badge count={qty} color={qty < 5 ? '#ff4d4f' : '#52c41a'} showZero overflowCount={999} />
                  )
                },
                {
                  title: t.resources.columns.claimants,
                  key: 'claimants',
                  width: 150,
                  ellipsis: true,
                  render: (_, r) => {
                    const claimantsList = claims.filter(c => c.resourceId === r.id).map(c => c.borrowerName);
                    return claimantsList.length > 0 ? (
                      <AntTooltip title={claimantsList.join(', ')}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{claimantsList.join(', ')}</Text>
                      </AntTooltip>
                    ) : <Text type="secondary" italic>-</Text>;
                  }
                },
                {
                  title: t.common.description,
                  key: 'description',
                  width: 250,
                  render: (_, r) => (
                    <div
                      onDoubleClick={() => setInlineEditingId(r.id)}
                      style={{ cursor: 'pointer', minHeight: '24px', position: 'relative' }}
                      className="group"
                    >
                      {inlineEditingId === r.id ? (
                        <Input.TextArea
                          autoFocus
                          defaultValue={r.description}
                          onBlur={(e) => handleUpdateDescription(r.id, e.target.value)}
                          onPressEnter={(e) => {
                            if (!e.shiftKey) {
                              handleUpdateDescription(r.id, (e.target as any).value);
                            }
                          }}
                          autoSize={{ minRows: 2, maxRows: 6 }}
                          className="text-xs shadow-sm border-blue-400"
                          style={{ padding: '4px 8px' }}
                        />
                      ) : (
                        <div className="flex items-start justify-between">
                          <Text
                            type={r.description ? 'reset' : 'secondary'}
                            italic={!r.description}
                            style={{ fontSize: 12, display: 'block', maxWidth: '85%' }}
                            ellipsis={{ tooltip: r.description }}
                          >
                            {r.description || t.common.optional}
                          </Text>
                          <EditOutlined
                            className="opacity-0 group-hover:opacity-40 transition-opacity"
                            style={{ fontSize: 10, marginTop: 4 }}
                            onClick={() => setInlineEditingId(r.id)}
                          />
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  title: t.common.action,
                  key: 'action',
                  width: 140,
                  fixed: 'right',
                  align: 'center',
                  render: (_, r) => (
                    <Space size={0}>
                      <AntTooltip title={t.common.download}>
                        <Button
                          type="text"
                          icon={<DownloadOutlined />}
                          disabled={r.availableQuantity === 0}
                          className="text-blue-600 flex items-center justify-center"
                          onClick={() => { setSelectedResource(r); setIsClaimOpen(true); }}
                        />
                      </AntTooltip>
                      <AntTooltip title={t.common.edit}>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          className="text-amber-600 flex items-center justify-center"
                          onClick={() => {
                            setSelectedResource(r);
                            editForm.setFieldsValue({
                              fileName: r.fileName,
                              name: r.name,
                              type: r.type,
                              quantity: r.totalQuantity,
                              limit: r.maxClaimsPerUser,
                              description: r.description
                            });
                            setIsEditOpen(true);
                          }}
                        />
                      </AntTooltip>
                      <AntTooltip title={r.availableQuantity === 0 ? (lang === 'zh' ? '无库存，不可分享' : 'Out of stock') : t.common.share}>
                        <Button
                          type="text"
                          icon={<ShareAltOutlined />}
                          disabled={r.availableQuantity === 0}
                          className={r.availableQuantity === 0 ? '' : 'text-indigo-600 flex items-center justify-center'}
                          onClick={() => handleShare(r.id)}
                        />
                      </AntTooltip>
                      <Popconfirm
                        title={t.resources.deleteTitle}
                        description={t.resources.deleteDesc}
                        onConfirm={() => handleDeleteResource(r.id)}
                        okText={t.common.yes}
                        cancelText={t.common.no}
                        okButtonProps={{ danger: true }}
                      >
                        <AntTooltip title={t.common.delete}>
                          <Button type="text" danger icon={<DeleteOutlined />} className="flex items-center justify-center" />
                        </AntTooltip>
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
              scroll={{ x: 1100 }}
            />
          </Card>
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
          <div className="mb-8 flex flex-col gap-4">
            <Breadcrumb
              items={[
                {
                  title: (
                    <Space className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setSelectedProjectId(null)}>
                      <ProjectOutlined />
                      <span>{t.projects.breadcrumbs}</span>
                    </Space>
                  )
                },
                { title: <span className="font-semibold text-gray-800 px-2 py-0.5 bg-gray-100 rounded-md">{project?.name}</span> }
              ]}
            />

            <div className="flex justify-between items-end">
              <div>
                <Title level={2} style={{ margin: 0 }}>{project?.name}</Title>
                <Text type="secondary">{project?.description}</Text>
              </div>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setSelectedProjectId(null)}
                >
                  {t.common.back}
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsFolderModalOpen(true)}
                >
                  {t.folders.newBtn}
                </Button>
              </Space>
            </div>
          </div>

          <Row gutter={[24, 24]}>
            {projectFolders.map(f => (
              <Col xs={24} sm={12} md={8} lg={6} key={f.id}>
                <Card
                  hoverable
                  className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300"
                  style={{ borderRadius: 16 }}
                  styles={{ body: { padding: 0 } }}
                  onClick={() => setSelectedFolderName(f.name)}
                >
                  <div className="h-2 bg-amber-400 group-hover:h-3 transition-all" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-100 transition-colors">
                        <FolderOpenOutlined style={{ fontSize: 32, color: '#f59e0b' }} />
                      </div>
                      <Badge
                        count={resources.filter(r => r.projectId === selectedProjectId && r.folderName === f.name).length}
                        style={{ backgroundColor: '#f59e0b' }}
                      />
                    </div>
                    <Title level={4} style={{ margin: '0 0 4px 0' }}>{f.name}</Title>
                    <Text type="secondary" className="text-xs">{t.stats.resources}</Text>

                    <div className="mt-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button type="link" className="p-0 text-amber-600 font-medium flex items-center gap-1">
                        Open Module <ArrowRightOutlined style={{ fontSize: 12 }} />
                      </Button>
                    </div>
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Title level={2} style={{ margin: 0 }}>{t.projects.title}</Title>
            <Text type="secondary">{t.stats.projects}: {projects.length}</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="shadow-md hover:shadow-lg transition-all"
            onClick={() => setIsProjectModalOpen(true)}
          >
            {t.projects.createButton}
          </Button>
        </div>

        <Table
          dataSource={projects}
          rowKey="id"
          className="nexus-table border border-gray-100 rounded-xl overflow-hidden shadow-sm"
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          onRow={(record) => ({
            onClick: () => setSelectedProjectId(record.id),
            className: 'cursor-pointer hover:bg-blue-50/30 transition-colors'
          })}
          columns={[
            {
              title: t.projects.columns.name,
              key: 'name',
              render: (_, record) => (
                <Space size="middle">
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <ProjectOutlined style={{ color: '#3b82f6', fontSize: 20 }} />
                  </div>
                  <div>
                    <Text strong className="text-base block">{record.name}</Text>
                    <Text type="secondary" className="text-xs line-clamp-1 max-w-[300px]">{record.description}</Text>
                  </div>
                </Space>
              ),
            },
            {
              title: t.projects.columns.manager,
              dataIndex: 'manager',
              key: 'manager',
              width: 180,
              render: (text) => (
                <Space className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  <UserOutlined className="text-gray-400" />
                  <Text className="text-sm">{text}</Text>
                </Space>
              )
            },
            {
              title: t.projects.columns.status,
              dataIndex: 'status',
              key: 'status',
              width: 120,
              align: 'center',
              render: (status) => (
                <Tag color="cyan" className="rounded-full px-3 border-0 bg-cyan-50 text-cyan-700 font-medium">
                  {status.toUpperCase()}
                </Tag>
              )
            },
            {
              title: t.common.action,
              key: 'action',
              width: 80,
              align: 'center',
              render: (_, p) => (
                <Popconfirm
                  title={t.projects.deleteTitle}
                  description={t.projects.deleteDesc}
                  onConfirm={(e) => { e?.stopPropagation(); handleDeleteProject(p.id); }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText={t.common.yes}
                  cancelText={t.common.no}
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    className="hover:bg-red-50"
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
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <Title level={2} style={{ margin: 0 }}>{t.claims.title}</Title>
        <Text type="secondary">{t.stats.claims}: {claims.length}</Text>
      </div>

      <Table
        dataSource={claims.map(c => ({ ...c, key: c.id })).reverse()}
        className="nexus-table border border-gray-100 rounded-xl overflow-hidden shadow-sm"
        columns={[
          {
            title: t.claims.columns.engineer,
            dataIndex: 'borrowerName',
            key: 'name',
            render: (name) => (
              <Space>
                <UserOutlined className="text-gray-400" />
                <Text strong>{name}</Text>
              </Space>
            )
          },
          {
            title: t.claims.columns.resource,
            key: 'res',
            render: (_, rec) => {
              const res = resources.find(r => r.id === rec.resourceId);
              if (!res) return <Text type="secondary" italic>{t.claims.columns.deleted}</Text>;

              const project = projects.find(p => p.id === res.projectId);

              return (
                <div className="flex flex-col">
                  <Space size={4}>
                    <FileTextOutlined className="text-blue-500 text-xs" />
                    <Text className="text-sm font-medium">{res.name || res.fileName}</Text>
                  </Space>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                      {project?.name || 'Unknown Project'}
                    </Text>
                    <span className="text-gray-300 text-[10px]">/</span>
                    <Text type="secondary" className="text-[10px] truncate max-w-[120px]">
                      {res.fileName}
                    </Text>
                  </div>
                </div>
              );
            }
          },
          {
            title: t.claims.columns.date,
            dataIndex: 'claimDate',
            key: 'date',
            width: 140,
            render: (date) => <Text type="secondary" className="text-xs">{date}</Text>
          },
          {
            title: t.claims.columns.reason,
            dataIndex: 'purpose',
            key: 'purpose',
            ellipsis: true,
            render: (text) => <Text type="secondary" className="text-sm">{text || t.common.optional}</Text>
          },
          {
            title: t.claims.columns.status,
            key: 's',
            width: 100,
            align: 'center',
            render: () => (
              <Tag color="success" className="m-0 border-0 bg-emerald-50 text-emerald-600 font-bold rounded-full px-3 text-[10px]">
                {t.claims.columns.downloaded}
              </Tag>
            )
          }
        ]}
      />
    </div>
  );

  if (isStandaloneShare) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#1677ff', borderRadius: 12 } }} locale={lang === 'zh' ? zhCN : enUS}>
        <Layout style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <Content style={{ maxWidth: 500, width: '100%' }}>
            <Card
              bordered={false}
              className="shadow-2xl overflow-hidden"
              style={{ borderRadius: 24 }}
              styles={{ body: { padding: '40px' } }}
            >
              {claimSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div className="inline-flex p-6 bg-emerald-50 rounded-full mb-6">
                    <CheckCircleOutlined style={{ fontSize: 48, color: '#10b981' }} />
                  </div>
                  <Title level={2}>{t.claims.modals.success}</Title>
                  <Paragraph type="secondary" className="mb-8">
                    {lang === 'zh' ? '文件传输已发起，请检查您的下载列表。' : 'File transfer initiated. Please check your downloads.'}
                  </Paragraph>
                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-gray-500 border border-dashed">
                    {lang === 'zh' ? '该链接已完成领用。如需重新下载，请刷新页面或联系管理员。' : 'Claim completed. Refresh or contact admin for re-download.'}
                  </div>
                </div>
              ) : selectedResource ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div className="inline-flex p-4 bg-blue-50 rounded-2xl mb-4">
                      <DownloadOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                    </div>
                    <Title level={3} style={{ margin: '0 0 8px 0' }}>{t.claims.modals.title}</Title>
                    <Text type="secondary">{t.claims.modals.warn}</Text>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100/50">
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <div className="flex justify-between items-center">
                        <Text strong className="text-lg">{selectedResource.name || selectedResource.fileName}</Text>
                        <Tag color="blue" className="m-0 border-0 bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full">{selectedResource.type}</Tag>
                      </div>
                      <Text type="secondary" className="flex items-center gap-2">
                        <FileTextOutlined className="text-gray-400" />
                        {selectedResource.fileName}
                      </Text>
                    </Space>
                  </div>

                  <Form form={claimForm} layout="vertical" onFinish={async (v) => {
                    await handleClaimSubmit(v);
                    // After successful claim and download, we can show a success state or just stay here.
                    // The handleClaimSubmit already shows success and resets field.
                  }}>
                    <Form.Item name="borrowerName" label={t.claims.modals.nameLabel} rules={[{ required: true }]}>
                      <Input size="large" prefix={<UserOutlined className="text-gray-400" />} placeholder={t.claims.modals.namePlace} className="rounded-xl" />
                    </Form.Item>
                    <Form.Item name="borrowerDept" label={t.claims.modals.deptLabel}>
                      <Input size="large" prefix={<ProjectOutlined className="text-gray-400" />} placeholder={t.common.optional} className="rounded-xl" />
                    </Form.Item>
                    <Form.Item name="purpose" label={t.claims.modals.purposeLabel}>
                      <Input.TextArea rows={3} placeholder={t.common.optional} className="rounded-xl" />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      size="large"
                      icon={<DownloadOutlined />}
                      className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shadow-lg shadow-blue-200 hover:shadow-xl transition-all rounded-xl mt-4 font-bold"
                    >
                      {t.claims.modals.submit}
                    </Button>
                  </Form>
                </>
              ) : (
                <Empty description={t.ai.noAnswer} />
              )}
            </Card>

            <div className="mt-8 text-center text-gray-400 text-xs">
              <Space>
                <SolutionOutlined />
                <span>{t.appTitle} Secure File Transfer • Enterprise Grade Security</span>
              </Space>
            </div>
          </Content>
        </Layout>
      </ConfigProvider>
    );
  }

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
                    setUploadFileList(fileList);
                    if (fileList.length === 1) {
                      uploadForm.setFieldsValue({ name: fileList[0].name });
                    }
                  }}
                  multiple={true}
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
              <Form.Item name="name" label={t.resources.modals.nameLabel}>
                <Input placeholder={t.common.optional} />
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
              <Form.Item name="description" label={t.resources.modals.techDescLabel}>
                <Input.TextArea rows={2} placeholder={t.resources.modals.techDescPlace} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" block size="large" icon={<UploadOutlined />}>{t.resources.modals.submit}</Button>
        </Form>
      </Modal>

      <Modal title={t.resources.modals.editTitle} open={isEditOpen} onCancel={() => setIsEditOpen(false)} footer={null} width={700}>
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="fileName" label={t.resources.columns.fileName} rules={[{ required: true }]}>
                <Input placeholder="config.ovpn" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label={t.resources.modals.nameLabel}>
                <Input placeholder={t.common.optional} />
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
            <Col span={12}>
              <Form.Item name="quantity" label={t.resources.modals.qtyLabel}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="limit" label={t.resources.modals.limitLabel}><InputNumber min={0} style={{ width: '100%' }} tooltip={t.resources.modals.limitTooltip} /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label={t.resources.modals.techDescLabel}>
                <Input.TextArea rows={4} placeholder={t.resources.modals.techDescPlace} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" block size="large" icon={<CheckCircleOutlined />}>{t.common.yes}</Button>
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
          <Form.Item name="borrowerName" label={t.claims.modals.nameLabel} rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder={t.claims.modals.namePlace} />
          </Form.Item>
          <Form.Item name="borrowerDept" label={t.claims.modals.deptLabel}>
            <Input prefix={<ProjectOutlined />} placeholder={t.common.optional} />
          </Form.Item>
          <Form.Item name="purpose" label={t.claims.modals.purposeLabel}>
            <Input.TextArea rows={2} placeholder={t.common.optional} />
          </Form.Item>
          <div style={{ background: '#fff7e6', border: '1px solid #ffd591', padding: 12, borderRadius: 8, marginBottom: 20 }}>
            <Space align="start"><ExclamationCircleOutlined style={{ color: '#faad14', marginTop: 4 }} /><Text type="secondary" style={{ fontSize: 12 }}>{t.claims.modals.warn}</Text></Space>
          </div>
          <Button type="primary" htmlType="submit" block size="large" icon={<DownloadOutlined />}>{t.claims.modals.submit}</Button>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
