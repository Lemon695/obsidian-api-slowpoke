import {App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, addIcon} from 'obsidian';
import {APITesterView, VIEW_TYPE_API_TESTER} from './types/view';
import {APIRequest, APITesterSettings} from './types/types';
import {APITesterSettingTab} from "./types/settings";

const DEFAULT_SETTINGS: APITesterSettings = {
	savedRequests: [],
	defaultPath: 'API Requests',
	saveResponses: true,
	defaultHeaders: {
		'JSON': {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		'XML': {
			'Content-Type': 'application/xml',
			'Accept': 'application/xml'
		},
		'Form': {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	}
};

export default class APITesterPlugin extends Plugin {
	settings: APITesterSettings;

	async onload() {
		await this.loadSettings();

		// Register Custom View
		this.registerView(
			VIEW_TYPE_API_TESTER,
			(leaf: WorkspaceLeaf) => new APITesterView(leaf, this)
		);

		// Add icon to left ribbon
		addIcon('api', `<path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8h-8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z"/>`);

		// Add ribbon icon
		this.addRibbonIcon('api', 'API Tester', async () => {
			this.activateView();
		});

		// Add settings tab
		this.addSettingTab(new APITesterSettingTab(this.app, this));

		// Add commands
		this.addCommand({
			id: 'open-api-tester',
			name: 'Open API Tester',
			callback: () => {
				this.activateView();
			},
		});
	}

	async activateView() {
		const {workspace} = this.app;
		let leaf: WorkspaceLeaf | null;  // 修改这里的类型声明，允许 null
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_API_TESTER);

		if (leaves.length > 0) {
			// 确保 leaf 不为 null
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			if (!leaf) {
				// 如果获取右侧叶子失败，创建新叶子
				leaf = workspace.getLeaf('split');
			}
		}

		// 确保 leaf 不为 null 后再使用
		if (leaf) {
			await leaf.setViewState({type: VIEW_TYPE_API_TESTER});
			workspace.revealLeaf(leaf);
		}
	}

	async saveRequest(request: APIRequest) {
		const {vault} = this.app;
		const folderPath = this.settings.defaultPath;

		// Create folder if it doesn't exist
		if (!(await vault.adapter.exists(folderPath))) {
			await vault.createFolder(folderPath);
		}

		const safeName = request.name.replace(/[\\/:]/g, '-');
		const safeTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const fileName = `${folderPath}/${safeName}-${safeTimestamp}.md`;
		const content = this.generateMarkdown(request);

		await vault.create(fileName, content);
	}

	private generateMarkdown(request: APIRequest): string {
		const timestamp = new Date().toLocaleString();
		const responseSize = request.responseSize || 0;

		let content = `## API Request: ${request.name}

### 基本信息
- URL: ${request.url}
- Method: ${request.method}
- 时间: ${timestamp}

### 请求头
\`\`\`json
${JSON.stringify(request.headers, null, 2)}
\`\`\`

### 请求体
\`\`\`json
${JSON.stringify(request.body, null, 2)}
\`\`\`

### 响应数据
\`\`\`json
${JSON.stringify(request.response?.data, null, 2)}
\`\`\`

### 统计信息
- 响应时间: ${request.responseTime}ms
- 状态码: ${request.response?.status}
- 数据大小: ${this.formatBytes(responseSize)}
`;

		return content;
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
