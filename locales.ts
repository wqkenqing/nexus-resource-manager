
export const translations = {
    en: {
        appTitle: "Nexus Ops",
        menu: {
            dashboard: "Dashboard",
            projects: "Projects",
            history: "Logs"
        },
        common: {
            yes: "Yes",
            no: "No",
            cancel: "Cancel",
            delete: "Delete",
            action: "Action",
            description: "Description",
            status: "Status",
            search: "Search",
            download: "Download",
            upload: "Upload",
            create: "Create",
            edit: "Edit",
            share: "Share",
            optional: "Optional",
            back: "Back"
        },
        stats: {
            projects: "Total Projects",
            resources: "Config Files",
            claims: "Downloads Logged"
        },
        ai: {
            title: "Quick Access Finder",
            desc: "Locate mission-critical configs by searching tags, filenames, or project names.",
            placeholder: "Search anything...",
            button: "Find Now",
            unavailable: "Search is initializing...",
            noAnswer: "No matching resources found.",
            responseResult: "Search Results"
        },
        projects: {
            title: "Project Repository",
            createButton: "New Project",
            breadcrumbs: "Root",
            deleteTitle: "Delete Project",
            deleteDesc: "Delete this project?",
            deleteAllDesc: "This will permanently delete the project and all contents. Continue?",
            deleteAllBtn: "Delete All",
            emptyState: "This project has no content.",
            createFirstFolder: "Create First Folder",
            columns: {
                name: "Project Name",
                manager: "Lead",
                status: "Status"
            },
            modals: {
                createTitle: "Create Project",
                nameLabel: "Project Name",
                namePlace: "e.g. Production Cluster X",
                managerLabel: "Project Lead",
                managerPlace: "John Doe",
                descLabel: "Project Scope",
                descPlace: "Project objectives and key environment details...",
                submit: "Initialize Project",
                success: "Project created successfully",
                deleteSuccess: "Project and all its contents deleted"
            }
        },
        folders: {
            newBtn: "Add Module",
            uploadBtn: "Upload File",
            deleteTitle: "Delete Module",
            deleteDesc: "Delete \"{name}\" and all its contents?",
            deleteBtn: "Remove Module",
            emptyResource: "No files found. Let's upload some.",
            modals: {
                createTitle: "Add New Module Folder",
                nameLabel: "Module Name",
                namePlace: "e.g. VPN_Node_Alpha",
                submit: "Add Module",
                success: "Module \"{name}\" created"
            },
            deleteSuccess: "Module \"{name}\" removed"
        },
        resources: {
            columns: {
                name: "Resource Tag",
                type: "Type",
                fileName: "File Name",
                stock: "Stock",
                claimants: "History"
            },
            deleteTitle: "Delete Artifact",
            deleteDesc: "Are you sure you want to delete this resource?",
            deleteSuccess: "Resource deleted",
            modals: {
                uploadTitle: "Upload Resource Artifact",
                fileLabel: "Select Artifact",
                dragText: "Drop resource artifacts here",
                dragHint: "Support for .ovpn, .xml, .yaml, .json, .crt, .key files",
                folderLabel: "Module Folder",
                folderPlace: "Select module...",
                nameLabel: "Resource Tag",
                namePlace: "e.g., Admin Gateway Config",
                typeLabel: "Resource Type",
                qtyLabel: "Limit Availability",
                limitLabel: "Usage Limit",
                limitTooltip: "0 = Unlimited downloads",
                techDescLabel: "Operation Notes",
                techDescPlace: "Deployment notes or SOP details...",
                submit: "Publish Resource",
                errorNoFile: "Please select at least one file.",
                success: "Artifact \"{name}\" published",
                editTitle: "Edit Artifact Properties",
                editSuccess: "Resource updated"
            }
        },
        claims: {
            title: "Access Audit Logs",
            columns: {
                engineer: "Operated By",
                resource: "Artifact",
                date: "Timestamp",
                reason: "Context",
                status: "Status",
                deleted: "(N/A)",
                downloaded: "SUCCESS"
            },
            modals: {
                title: "Authentication & Authorization",
                nameLabel: "Operator ID",
                namePlace: "e.g. JDoe",
                deptLabel: "Security Group / Team",
                purposeLabel: "Operation Purpose",
                warn: "Security Audit Active. This operation is being monitored.",
                submit: "Authorize & Download",
                errorLimit: "Threshold reached! Security policy prohibits further downloads.",
                success: "Access granted. File is being transferred."
            }
        },
        types: {
            config: 'Configuration',
            cert: 'Certificate',
            key: 'Access Key',
            doc: 'Documentation',
            sample: 'Dataset'
        },
        system: {
            title: "System Management",
            exportBtn: "Export Metadata (JSON)",
            importBtn: "Import Metadata",
            importSuccess: "Data restored successfully. Application will reload.",
            importError: "Invalid metadata file. Please check the format.",
            exportFilename: "nexus_ops_metadata.json"
        }
    },
    zh: {
        appTitle: "Nexus Ops",
        menu: {
            dashboard: "仪表盘",
            projects: "项目列表",
            history: "审计日志"
        },
        common: {
            yes: "确认",
            no: "取消",
            cancel: "取消",
            delete: "删除",
            action: "操作",
            description: "描述",
            status: "状态",
            search: "全域搜索",
            download: "下载",
            upload: "上传",
            create: "新建",
            edit: "编辑",
            share: "分享",
            optional: "选填",
            back: "返回"
        },
        stats: {
            projects: "托管项目总数",
            resources: "配置资源总数",
            claims: "合规申领次数"
        },
        ai: {
            title: "资源快速访达",
            desc: "输入资源标签、文件名或项目代号，全域检索并一键触达核心配置。",
            placeholder: "搜索任意资源、项目、文件...",
            button: "立即检索",
            unavailable: "搜索引擎就绪中...",
            noAnswer: "未找到相关资源，请尝试其他关键词。",
            responseResult: "检索结果"
        },
        projects: {
            title: "项目仓库",
            createButton: "新建项目",
            breadcrumbs: "根目录",
            deleteTitle: "解散项目",
            deleteDesc: "确认解散此项目？",
            deleteAllDesc: "此操作将永久抹除项目及其所有关联资源，操作不可逆。是否继续？",
            deleteAllBtn: "彻底删除",
            emptyState: "该项目暂未划定模块区域。",
            createFirstFolder: "创建首个模块",
            columns: {
                name: "项目代号/名称",
                manager: "责任人",
                status: "状态"
            },
            modals: {
                createTitle: "初始化新项目",
                nameLabel: "项目名称",
                namePlace: "例如：生产环境核心集群",
                managerLabel: "主负责人",
                managerPlace: "姓名或工号",
                descLabel: "项目背景/描述",
                descPlace: "描述项目的核心职责、所属地域及业务优先级...",
                submit: "初始化项目",
                success: "项目初始化成功",
                deleteSuccess: "项目及关联实体已全部清理"
            }
        },
        folders: {
            newBtn: "添加模块",
            uploadBtn: "上传至此模块",
            deleteTitle: "移除模块",
            deleteDesc: "将移除模块 \"{name}\" 及其包含的所有资源实体。确认？",
            deleteBtn: "确认移除",
            emptyResource: "该模块尚未入库任何配置。点击按钮上传。",
            modals: {
                createTitle: "定义新功能模块",
                nameLabel: "模块标识",
                namePlace: "例如：VPN_核心节点",
                submit: "确认添加",
                success: "模块 \"{name}\" 已就绪"
            },
            deleteSuccess: "模块 \"{name}\" 已从项目中移除"
        },
        resources: {
            columns: {
                name: "资源标签",
                type: "资源类型",
                fileName: "物理文件名",
                stock: "分发配额",
                claimants: "审计快照"
            },
            deleteTitle: "下线资源",
            deleteDesc: "确定要从系统中抹除此资源实体吗？",
            deleteSuccess: "资源下线成功",
            modals: {
                uploadTitle: "资源实体入库",
                fileLabel: "选择物理文件",
                dragText: "拖拽实体至此进行高可靠上传",
                dragHint: "兼容 .ovpn, .xml, .yaml, .json, .crt, .key 等运维核心格式",
                folderLabel: "归属模块",
                folderPlace: "指派所属的功能模块...",
                nameLabel: "业务标签",
                namePlace: "例如：网关核心认证配置",
                typeLabel: "资源类型",
                qtyLabel: "单次配额",
                limitLabel: "每人限领",
                limitTooltip: "0 表示不限制个人领用次数",
                techDescLabel: "运维审计备注",
                techDescPlace: "备注实体的具体版本、用途、或 SRE 特殊说明...",
                submit: "确认发布",
                errorNoFile: "请先指定需要入库的物理文件。",
                success: "实体 \"{name}\" 已正式发布",
                editTitle: "修正资源属性",
                editSuccess: "资源属性已更新"
            }
        },
        claims: {
            title: "安全审计与领用志",
            columns: {
                engineer: "操作员",
                resource: "关联资源",
                date: "审计时间",
                reason: "操作上下文",
                status: "执行状态",
                deleted: "(资源已清理)",
                downloaded: "下载成功"
            },
            modals: {
                title: "身份鉴权与安全审计",
                nameLabel: "操作员标识",
                namePlace: "姓名、账号或工号",
                deptLabel: "归属组织/团队",
                purposeLabel: "申领正当理由",
                warn: "安全提醒：该操作受实时审计监控。非法外泄配置将触发安全溯源。",
                submit: "授权并执行下载",
                errorLimit: "已触发安全策略限制！该操作员已超出此资源的领用上限。",
                success: "鉴权通过，文件传输任务已发起。"
            }
        },
        projects_enhanced: {
            view: "视图切换",
            grid: "卡片网格",
            list: "列表视图"
        },
        types: {
            config: '配置文件',
            cert: '证书/凭证',
            key: '私钥/密钥',
            doc: '运维文档',
            sample: '数据样例'
        },
        system: {
            title: "系统管理与维护",
            exportBtn: "导出元数据 (JSON)",
            importBtn: "导入元数据",
            importSuccess: "系统数据恢复成功，即将重新加载。",
            importError: "导入文件格式非法或损坏。",
            exportFilename: "nexus_元数据备份.json"
        }
    }
};
