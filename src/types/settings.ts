import { App, PluginSettingTab, Setting } from 'obsidian';
import APITesterPlugin from "../main";

export class APITesterSettingTab extends PluginSettingTab {
	plugin: APITesterPlugin;

	constructor(app: App, plugin: APITesterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'API Tester Settings' });

		new Setting(containerEl)
			.setName('Default Save Path')
			.setDesc('Path where API request documents will be saved')
			.addText(text => text
				.setPlaceholder('API Requests')
				.setValue(this.plugin.settings.defaultPath)
				.onChange(async (value) => {
					this.plugin.settings.defaultPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Save Responses')
			.setDesc('Save response data in the generated markdown files')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.saveResponses)
				.onChange(async (value) => {
					this.plugin.settings.saveResponses = value;
					await this.plugin.saveSettings();
				}));
	}
}
