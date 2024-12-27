export interface HeaderConfig {
	'Content-Type'?: string;
	'Accept'?: string;

	[key: string]: string | undefined;
}

export interface APIRequest {
	name: string;
	url: string;
	method: string;
	headers?: HeaderConfig;
	body?: any;
	response?: {
		status: number;
		data: any;
	};
	responseTime?: number;
	responseSize?: number;
	timestamp: Date;
	saveConfig?: {
		saveHeaders: boolean;
		saveBody: boolean;
		saveResponse: boolean;
	};
}

export interface APITesterSettings {
	savedRequests: APIRequest[];
	defaultPath: string;
	saveResponses: boolean;
	defaultHeaders: {
		[key: string]: HeaderConfig;  // 修改这里的类型定义
	};
}
