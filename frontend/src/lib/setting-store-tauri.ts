import { LazyStore } from '@tauri-apps/plugin-store'
import type { StateStorage } from 'zustand/middleware'
import { defaultAppSettings, SETTING_FILE } from './setting-store'

export function createTauriSettingStorage(): StateStorage {
	const localSettingStore = new LazyStore(SETTING_FILE, {
		autoSave: true,
		defaults: defaultAppSettings,
	})

	return {
		getItem: async (name: string) => {
			const value = await localSettingStore.get<string>(name)
			return value || null
		},
		setItem: async (name: string, value: string) => {
			await localSettingStore.set(name, value)
			await localSettingStore.save()
		},
		removeItem: async (name: string) => {
			await localSettingStore.delete(name)
			await localSettingStore.save()
		},
	}
}
