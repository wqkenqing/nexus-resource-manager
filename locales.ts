
export const translations = {
    en: {
        appTitle: "Nexus Ops",
        menu: {
            dashboard: "Dashboard",
            projects: "Environments",
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
            optional: "Optional"
        },
        stats: {
            projects: "Managed Projects",
            resources: "Total Config Files",
            claims: "Downloads Logged",
            missing: "Missing Configs"
        },
        ai: {
            title: "Infrastructure AI Assistant",
            desc: "Query environment configurations or check cross-project resource distribution.",
            placeholder: "e.g., Which projects have OpenVPN configs?",
            button: "Ask Ops AI",
            unavailable: "AI Assistant is temporarily unavailable.",
            noAnswer: "I couldn't find an answer for that.",
            responseResult: "AI Response"
        },
        projects: {
            title: "Environments Directory",
            createButton: "Create Environment",
            breadcrumbs: "Projects",
            deleteTitle: "Delete Project",
            deleteDesc: "Delete this project?",
            deleteAllDesc: "This will permanently delete the project and all contents. Continue?",
            deleteAllBtn: "Delete All",
            emptyState: "This project is empty.",
            createFirstFolder: "Create First Folder",
            columns: {
                name: "Project Name",
                manager: "Manager",
                status: "Status"
            },
            modals: {
                createTitle: "Create New Environment Project",
                nameLabel: "Environment Name",
                namePlace: "e.g. AWS Production Cluster",
                managerLabel: "Owner/Manager",
                managerPlace: "Zhang Wei",
                descLabel: "Environment Description",
                descPlace: "Region, purpose, and key services...",
                submit: "Create Environment",
                success: "Project created successfully",
                deleteSuccess: "Project and all its contents deleted"
            }
        },
        folders: {
            newBtn: "New Folder",
            uploadBtn: "Upload File Here",
            deleteTitle: "Delete Folder",
            deleteDesc: "Delete \"{name}\" and all its contents?",
            deleteBtn: "Delete Folder",
            emptyResource: "No files in this folder. Upload one to get started.",
            modals: {
                createTitle: "Add New Folder",
                nameLabel: "Folder Name",
                namePlace: "e.g. VPN_Configurations",
                submit: "Create Folder",
                success: "Folder \"{name}\" created"
            },
            deleteSuccess: "Folder \"{name}\" and its resources deleted"
        },
        resources: {
            columns: {
                name: "Resource Tag",
                type: "Type",
                fileName: "File Name",
                stock: "Stock",
                claimants: "Claimants"
            },
            deleteTitle: "Delete File",
            deleteDesc: "Are you sure you want to delete this resource?",
            deleteSuccess: "Resource deleted successfully",
            modals: {
                uploadTitle: "Upload Resource File",
                fileLabel: "Upload File",
                dragText: "Click or drag config file to this area to upload",
                dragHint: "Support for .ovpn, .xml, .yaml, .json, .crt, .key files",
                folderLabel: "Target Folder",
                folderPlace: "Select folder...",
                nameLabel: "Resource Tag",
                namePlace: "e.g., Production Admin VPN",
                typeLabel: "Resource Type",
                qtyLabel: "Availability",
                limitLabel: "Access Limit",
                limitTooltip: "0 = Unlimited downloads",
                techDescLabel: "Technical Description",
                techDescPlace: "Optional notes for other engineers...",
                submit: "Publish & Upload Resource",
                errorNoFile: "Please select at least one file to upload.",
                success: "Resource \"{name}\" uploaded successfully",
                editTitle: "Edit Resource Properties",
                editSuccess: "Resource updated successfully"
            }
        },
        claims: {
            title: "Configuration Access Logs",
            columns: {
                engineer: "Engineer",
                resource: "Resource",
                date: "Date",
                reason: "Reason",
                status: "Status",
                deleted: "(Deleted Resource)",
                downloaded: "DOWNLOADED"
            },
            modals: {
                title: "Access Request Details",
                nameLabel: "Engineer Name",
                namePlace: "e.g. Li Ming",
                deptLabel: "Department / Team",
                purposeLabel: "Purpose for Download",
                warn: "This action will be logged in the system audit history. Please ensure compliance with security policies.",
                submit: "Log Access & Download File",
                errorLimit: "Download limit reached! You have already downloaded this configuration.",
                success: "Configuration downloaded and access logged."
            }
        },
        types: {
            config: 'Configuration',
            cert: 'Certificate',
            key: 'Access Key',
            doc: 'Documentation',
            sample: 'Data Sample'
        }
    },
    zh: {
        appTitle: "Nexus Ops",
        menu: {
            dashboard: "仪表盘",
            projects: "环境列表",
            history: "操作日志"
        },
        common: {
            yes: "确认",
            no: "取消",
            cancel: "取消",
            delete: "删除",
            action: "操作",
            description: "描述",
            status: "状态",
            search: "搜索",
            download: "下载",
            upload: "上传",
            create: "创建",
            edit: "编辑",
            optional: "选填"
        },
        stats: {
            projects: "管理项目数",
            resources: "配置文件总数",
            claims: "累计下载次数",
            missing: "缺货项目"
        },
        ai: {
            title: "基础架构 AI 助手",
            desc: "查询环境配置信息或检查跨项目的资源分布情况。",
            placeholder: "例如：哪些项目包含 OpenVPN 配置？",
            button: "询问 AI",
            unavailable: "AI 助手暂时不可用。",
            noAnswer: "我找不到相关的答案。",
            responseResult: "AI 回复"
        },
        projects: {
            title: "环境目录",
            createButton: "创建新环境",
            breadcrumbs: "项目列表",
            deleteTitle: "删除项目",
            deleteDesc: "确认删除此项目？",
            deleteAllDesc: "此操作将永久删除该项目及其所有内容。是否继续？",
            deleteAllBtn: "全部删除",
            emptyState: "此项目为空。",
            createFirstFolder: "创建第一个文件夹",
            columns: {
                name: "项目名称",
                manager: "负责人",
                status: "状态"
            },
            modals: {
                createTitle: "创建新环境项目",
                nameLabel: "环境名称",
                namePlace: "例如：AWS 生产集群",
                managerLabel: "负责人/管理员",
                managerPlace: "张伟",
                descLabel: "环境描述",
                descPlace: "区域、用途及关键服务...",
                submit: "创建环境",
                success: "项目创建成功",
                deleteSuccess: "项目及其所有内容已删除"
            }
        },
        folders: {
            newBtn: "新建文件夹",
            uploadBtn: "上传文件",
            deleteTitle: "删除文件夹",
            deleteDesc: "删除 \"{name}\" 及其所有内容？",
            deleteBtn: "删除文件夹",
            emptyResource: "此文件夹暂无文件。上传一个文件以开始。",
            modals: {
                createTitle: "添加新文件夹",
                nameLabel: "文件夹名称",
                namePlace: "例如：VPN_配置",
                submit: "创建文件夹",
                success: "文件夹 \"{name}\" 已创建"
            },
            deleteSuccess: "文件夹 \"{name}\" 及其资源已删除"
        },
        resources: {
            columns: {
                name: "资源标签",
                type: "类型",
                fileName: "文件名",
                stock: "库存",
                claimants: "申领人"
            },
            deleteTitle: "删除文件",
            deleteDesc: "确定要删除此资源吗？",
            deleteSuccess: "资源删除成功",
            modals: {
                uploadTitle: "上传资源文件",
                fileLabel: "上传文件",
                dragText: "点击或拖拽配置文件到此处上传",
                dragHint: "支持 .ovpn, .xml, .yaml, .json, .crt, .key 等格式文件",
                folderLabel: "目标文件夹",
                folderPlace: "选择文件夹...",
                nameLabel: "资源标签",
                namePlace: "例如：生产环境 Admin VPN",
                typeLabel: "资源类型",
                qtyLabel: "可用数量",
                limitLabel: "访问限制",
                limitTooltip: "0 = 无限下载",
                techDescLabel: "技术描述",
                techDescPlace: "给其他工程师的备注（选填）...",
                submit: "发布并上传资源",
                errorNoFile: "请至少选择一个要上传的文件。",
                success: "资源 \"{name}\" 上传成功",
                editTitle: "编辑资源属性",
                editSuccess: "资源属性更新成功"
            }
        },
        claims: {
            title: "配置访问日志",
            columns: {
                engineer: "工程师",
                resource: "资源",
                date: "日期",
                reason: "用途",
                status: "状态",
                deleted: "(已删除资源)",
                downloaded: "已下载"
            },
            modals: {
                title: "访问请求详情",
                nameLabel: "工程师姓名",
                namePlace: "例如：李明",
                deptLabel: "部门 / 团队",
                purposeLabel: "下载用途",
                warn: "此操作将记录在系统审计历史中。请确保符合信息安全政策。",
                submit: "记录访问并下载文件",
                errorLimit: "达到下载限制！您已经下载过此配置。",
                success: "配置下载成功并已记录日志。"
            }
        },
        types: {
            config: '配置文件',
            cert: '证书文件',
            key: '访问密钥',
            doc: '技术文档',
            sample: '样本数据'
        }
    }
};
