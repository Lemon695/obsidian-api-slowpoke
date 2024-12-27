import {ItemView, WorkspaceLeaf} from 'obsidian';
import APITesterPlugin from '../main';
import {HeaderConfig} from "./types";

export const VIEW_TYPE_API_TESTER = 'api-tester-view';

export class APITesterView extends ItemView {
	plugin: APITesterPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: APITesterPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_API_TESTER;
	}

	getDisplayText(): string {
		return 'API Tester';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl('h4', {text: 'API Tester'});

		const form = container.createEl('form');
		form.addEventListener('submit', this.handleSubmit.bind(this));

		// URL input
		const urlContainer = form.createDiv('url-container');
		const urlInput = urlContainer.createEl('input', {
			attr: {
				type: 'text',
				placeholder: 'Enter URL',
				required: 'true'
			}
		});
		urlInput.addClass('api-tester-url');

		// Method select
		const methodSelect = urlContainer.createEl('select');
		['GET', 'POST', 'PUT', 'DELETE'].forEach(method => {
			const option = methodSelect.createEl('option', {
				value: method,
				text: method
			});
		});
		methodSelect.addClass('api-tester-method');

		// 添加默认请求头选择
		const defaultHeadersContainer = form.createDiv('default-headers-container');
		defaultHeadersContainer.createEl('h5', {text: 'Default Headers'});

		// 创建默认请求头的选择框
		const defaultHeadersSelect = defaultHeadersContainer.createEl('select', {
			cls: 'api-tester-default-headers'
		});
		defaultHeadersSelect.createEl('option', {
			value: '',
			text: 'Select default headers'
		});

		// 添加预设的请求头选项
		const defaultHeaders = this.plugin.settings.defaultHeaders;
		Object.keys(defaultHeaders).forEach(headerName => {
			defaultHeadersSelect.createEl('option', {
				value: headerName,
				text: headerName
			});
		});

		// 监听选择变化
		defaultHeadersSelect.addEventListener('change', (e) => {
			const select = e.target as HTMLSelectElement;
			const selectedHeader = select.value;
			const selectedHeaderConfig = this.plugin.settings.defaultHeaders[selectedHeader];

			if (selectedHeader && selectedHeaderConfig) {
				const headersTextarea = this.containerEl.querySelector('.api-tester-headers') as HTMLTextAreaElement;
				let currentHeaders: HeaderConfig = {};

				try {
					currentHeaders = headersTextarea.value ? JSON.parse(headersTextarea.value) : {};
				} catch (error) {
					console.error('Error parsing current headers:', error);
				}

				const newHeaders: HeaderConfig = {
					...currentHeaders,
					...selectedHeaderConfig
				};

				headersTextarea.value = JSON.stringify(newHeaders, null, 2);
			}
		});

		// Headers
		const headersContainer = form.createDiv('headers-container');
		headersContainer.createEl('h5', {text: 'Headers'});

		// 创建一个容器来存放所有的 header 输入对
		const headersInputContainer = headersContainer.createDiv('headers-input-container');

		// 添加一个初始的 header 输入对
		this.addHeaderInputPair(headersInputContainer);

		// 添加按钮
		const addHeaderButton = headersContainer.createEl('button', {
			text: 'Add Header',
			cls: 'api-tester-add-header'
		});
		addHeaderButton.addEventListener('click', (e) => {
			e.preventDefault();
			this.addHeaderInputPair(headersInputContainer);
		});

		// 隐藏的 textarea 用于存储最终的 JSON 格式
		const headersTextarea = headersContainer.createEl('textarea', {
			cls: 'api-tester-headers hidden'
		});

		// Body
		const bodyContainer = form.createDiv('body-container');
		bodyContainer.createEl('h5', {text: 'Request Body'});
		const bodyTextarea = bodyContainer.createEl('textarea', {
			placeholder: 'Enter request body in JSON format'
		});
		bodyTextarea.addClass('api-tester-body');

		// 保存配置选项
		const saveConfigContainer = form.createDiv('save-config-container');
		saveConfigContainer.createEl('h5', {text: 'Save Configuration'});

		const saveHeadersCheckbox = this.createSaveConfigCheckbox(
			saveConfigContainer,
			'Save Headers',
			'api-tester-save-headers'
		);
		const saveBodyCheckbox = this.createSaveConfigCheckbox(
			saveConfigContainer,
			'Save Body',
			'api-tester-save-body'
		);
		const saveResponseCheckbox = this.createSaveConfigCheckbox(
			saveConfigContainer,
			'Save Response',
			'api-tester-save-response'
		);

		// Submit button
		const submitButton = form.createEl('button', {
			type: 'submit',
			text: 'Send Request'
		});
		submitButton.addClass('api-tester-submit');

		// Response area
		const responseContainer = container.createDiv('response-container');
		responseContainer.createEl('h5', {text: 'Response'});
		const responseArea = responseContainer.createEl('pre');
		responseArea.addClass('api-tester-response');
	}

	private addHeaderInputPair(container: HTMLElement) {
		const pairContainer = container.createDiv('header-pair-container');

		// Key input
		const keyInput = pairContainer.createEl('input', {
			attr: {
				type: 'text',
				placeholder: 'Header Key'
			},
			cls: 'header-key-input'
		});

		// Value input
		const valueInput = pairContainer.createEl('input', {
			attr: {
				type: 'text',
				placeholder: 'Header Value'
			},
			cls: 'header-value-input'
		});

		// Remove button
		const removeButton = pairContainer.createEl('button', {
			text: '×',
			cls: 'header-remove-button'
		});

		// 添加事件监听
		const updateHeaders = () => {
			const headersTextarea = this.containerEl.querySelector('.api-tester-headers') as HTMLTextAreaElement;
			const headers: Record<string, string> = {};

			// 收集所有有效的 header 对
			this.containerEl.querySelectorAll('.header-pair-container').forEach((pair) => {
				const key = (pair.querySelector('.header-key-input') as HTMLInputElement).value.trim();
				const value = (pair.querySelector('.header-value-input') as HTMLInputElement).value.trim();
				if (key && value) {
					headers[key] = value;
				}
			});

			headersTextarea.value = JSON.stringify(headers, null, 2);
		};

		keyInput.addEventListener('input', updateHeaders);
		valueInput.addEventListener('input', updateHeaders);
		removeButton.addEventListener('click', (e) => {
			e.preventDefault();
			pairContainer.remove();
			updateHeaders();
		});
	}

	private createSaveConfigCheckbox(container: HTMLElement, label: string, className: string) {
		const div = container.createDiv();
		const checkbox = div.createEl('input', {
			attr: {
				type: 'checkbox',
				checked: 'true'
			}
		});
		checkbox.addClass(className);
		div.createSpan({text: label});
		return checkbox;
	}

	private async handleSubmit(e: Event) {
		e.preventDefault();

		const form = e.target as HTMLFormElement;
		const urlInput = form.querySelector('.api-tester-url') as HTMLInputElement;
		const methodSelect = form.querySelector('.api-tester-method') as HTMLSelectElement;
		const headersTextarea = form.querySelector('.api-tester-headers') as HTMLTextAreaElement;
		const bodyTextarea = form.querySelector('.api-tester-body') as HTMLTextAreaElement;
		const responseArea = this.containerEl.querySelector('.api-tester-response') as HTMLPreElement;

		// 获取保存配置
		const saveHeaders = (form.querySelector('.api-tester-save-headers') as HTMLInputElement).checked;
		const saveBody = (form.querySelector('.api-tester-save-body') as HTMLInputElement).checked;
		const saveResponse = (form.querySelector('.api-tester-save-response') as HTMLInputElement).checked;

		try {
			const headers = headersTextarea.value ? JSON.parse(headersTextarea.value) : {};
			const body = bodyTextarea.value ? JSON.parse(bodyTextarea.value) : null;

			const startTime = Date.now();
			const response = await fetch(urlInput.value, {
				method: methodSelect.value,
				headers: headers,
				body: body ? JSON.stringify(body) : null
			});

			const responseTime = Date.now() - startTime;
			const responseData = await response.json();

			// 保存请求
			this.plugin.saveRequest({
				name: new URL(urlInput.value).pathname.split('/').pop() || 'request',
				url: urlInput.value,
				method: methodSelect.value,
				headers: headers,
				body: body,
				response: {
					status: response.status,
					data: responseData
				},
				responseTime: responseTime,
				timestamp: new Date(),
				saveConfig: {
					saveHeaders,
					saveBody,
					saveResponse
				}
			});

			// 显示响应
			responseArea.textContent = JSON.stringify(responseData, null, 2);
		} catch (error) {
			responseArea.textContent = `Error: ${error.message}`;
		}
	}
}
