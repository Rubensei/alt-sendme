export type { UnlistenFn } from '@tauri-apps/api/event'

import type { UnlistenFn } from '@tauri-apps/api/event'
import { IS_TAURI, IS_WEB } from './platform'
import { WebPreviewError } from './web-preview-error'

type DialogOptions = {
	multiple?: boolean
	directory?: boolean
}

type TauriWindowStub = {
	minimize: () => Promise<void>
	toggleMaximize: () => Promise<void>
	close: () => Promise<void>
	listen: <T>(
		event: string,
		handler: (event: { payload: T }) => void
	) => Promise<UnlistenFn>
}

const noopUnlisten: UnlistenFn = () => {}

const webWindowStub: TauriWindowStub = {
	minimize: async () => {},
	toggleMaximize: async () => {},
	close: async () => {},
	listen: async () => noopUnlisten,
}

function invokeWebStub<T>(cmd: string, args?: Record<string, unknown>): T {
	switch (cmd) {
		case 'check_launch_intent':
			return null as T
		case 'check_path_type': {
			const path = String(args?.path ?? '')
			return (path.endsWith('/') ? 'directory' : 'file') as T
		}
		case 'get_paths_mime_types': {
			const paths = (args?.paths as string[] | undefined) ?? []
			return paths.map(() => null) as T
		}
		case 'get_file_size':
			return 0 as T
		case 'get_sharing_status':
			return null as T
		case 'stop_sharing':
		case 'toggle_context_menu':
			return undefined as T
		case 'get_relay_status':
			return {
				kind: 'unavailable',
				url: null,
				connected: false,
				fellBackToPublic: false,
			} as T
		case 'verify_relays':
			throw new WebPreviewError('Relay verification is not available in the web preview.')
		case 'fetch_ticket_metadata':
		case 'send_items':
		case 'receive_file':
		case 'start_sharing':
			throw new WebPreviewError()
		case 'plugin:native-utils|select_download_folder':
		case 'plugin:native-utils|select_send_document':
		case 'plugin:native-utils|select_send_folder':
		case 'plugin:native-utils|cancel_job':
			return null as T
		default:
			console.warn(`[web preview] unhandled invoke: ${cmd}`)
			throw new WebPreviewError()
	}
}

export async function invoke<T>(
	cmd: string,
	args?: Record<string, unknown>
): Promise<T> {
	if (IS_WEB) {
		return invokeWebStub<T>(cmd, args)
	}

	const { invoke: tauriInvoke } = await import('@tauri-apps/api/core')
	return tauriInvoke<T>(cmd, args)
}

export async function listen<T>(
	event: string,
	handler: (event: { payload: T }) => void
): Promise<UnlistenFn> {
	if (IS_WEB) {
		return noopUnlisten
	}

	const { listen: tauriListen } = await import('@tauri-apps/api/event')
	return tauriListen<T>(event, handler)
}

export async function openDialog(
	options: DialogOptions = {}
): Promise<string | string[] | null> {
	if (IS_TAURI) {
		const { open } = await import('@tauri-apps/plugin-dialog')
		return open(options)
	}

	return pickPathsInBrowser(options)
}

function pickPathsInBrowser(
	options: DialogOptions
): Promise<string | string[] | null> {
	return new Promise((resolve) => {
		const input = document.createElement('input')
		input.type = 'file'
		input.style.display = 'none'
		input.multiple = options.multiple ?? false

		if (options.directory) {
			input.setAttribute('webkitdirectory', '')
			input.setAttribute('directory', '')
		}

		const cleanup = () => {
			input.remove()
		}

		input.addEventListener('change', () => {
			const files = input.files
			cleanup()

			if (!files?.length) {
				resolve(null)
				return
			}

			if (options.directory) {
				const topLevel = new Set<string>()
				for (const file of Array.from(files)) {
					const relativePath =
						(file as File & { webkitRelativePath?: string })
							.webkitRelativePath ?? file.name
					const [root] = relativePath.split('/')
					if (root) topLevel.add(root)
				}
				const folders = [...topLevel]
				resolve(options.multiple ? folders : (folders[0] ?? null))
				return
			}

			const names = Array.from(files).map((file) => file.name)
			resolve(options.multiple ? names : (names[0] ?? null))
		})

		input.addEventListener('cancel', () => {
			cleanup()
			resolve(null)
		})

		document.body.appendChild(input)
		input.click()
	})
}

export async function downloadDir(): Promise<string> {
	if (IS_TAURI) {
		const { downloadDir: tauriDownloadDir } = await import('@tauri-apps/api/path')
		return tauriDownloadDir()
	}

	return ''
}

export async function joinPath(...paths: string[]): Promise<string> {
	if (IS_TAURI) {
		const { join } = await import('@tauri-apps/api/path')
		return join(...paths)
	}

	return paths.filter(Boolean).join('/')
}

export async function revealItemInDir(_path: string): Promise<void> {
	if (IS_TAURI) {
		const { revealItemInDir: tauriReveal } = await import(
			'@tauri-apps/plugin-opener'
		)
		await tauriReveal(_path)
	}
}

export async function getCurrentWindow(): Promise<TauriWindowStub> {
	if (IS_TAURI) {
		const { getCurrentWindow: tauriGetCurrentWindow } = await import(
			'@tauri-apps/api/window'
		)
		return tauriGetCurrentWindow()
	}

	return webWindowStub
}
