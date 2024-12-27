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

		const fileName = `${folderPath}/${request.name}-${new Date().toISOString()}.md`;
		const content = this.generateMarkdown(request);

		await vault.create(fileName, content);
	}

	private generateMarkdown(request: APIRequest): string {
		let content = `## API Request: ${request.name}

### Basic Information
- URL: ${request.url}
- Method: ${request.method}
- Timestamp: ${new Date().toLocaleString()}
`;

		// 根据保存配置生成内容
		const saveConfig = request.saveConfig || {
			saveHeaders: true,
			saveBody: true,
			saveResponse: true
		};

		if (saveConfig.saveHeaders && request.headers) {
			content += `\n### Request Headers
\`\`\`json
${JSON.stringify(request.headers, null, 2)}
\`\`\``;
		}

		if (saveConfig.saveBody && request.body) {
			content += `\n### Request Body
\`\`\`json
${JSON.stringify(request.body, null, 2)}
\`\`\``;
		}

		if (saveConfig.saveResponse && request.response) {
			content += `\n### Response
\`\`\`json
${JSON.stringify(request.response, null, 2)}
\`\`\`

### Statistics
- Status Code: ${request.response.status}
- Response Time: ${request.responseTime}ms`;
		}

		return content;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
