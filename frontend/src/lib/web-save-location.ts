import { triggerBrowserDownload } from './wasm-bridge-client'

const DB_NAME = 'alt-sendme'
const STORE_NAME = 'handles'
const DIR_HANDLE_KEY = 'download-directory'

let cachedDirHandle: FileSystemDirectoryHandle | null = null

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1)
		request.onerror = () => reject(request.error)
		request.onsuccess = () => resolve(request.result)
		request.onupgradeneeded = () => {
			request.result.createObjectStore(STORE_NAME)
		}
	})
}

async function idbGet<T>(key: string): Promise<T | undefined> {
	const db = await openDb()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly')
		const req = tx.objectStore(STORE_NAME).get(key)
		req.onsuccess = () => resolve(req.result as T | undefined)
		req.onerror = () => reject(req.error)
	})
}

async function idbSet(key: string, value: unknown): Promise<void> {
	const db = await openDb()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite')
		const req = tx.objectStore(STORE_NAME).put(value, key)
		req.onsuccess = () => resolve()
		req.onerror = () => reject(req.error)
	})
}

export function supportsWebSaveLocationPicker(): boolean {
	return (
		typeof window !== 'undefined' &&
		window.isSecureContext &&
		'showDirectoryPicker' in window
	)
}

async function ensureDirWritePermission(
	handle: FileSystemDirectoryHandle
): Promise<boolean> {
	const current = await handle.queryPermission({ mode: 'readwrite' })
	if (current === 'granted') {
		return true
	}
	const requested = await handle.requestPermission({ mode: 'readwrite' })
	return requested === 'granted'
}

async function saveDirectoryHandle(
	handle: FileSystemDirectoryHandle
): Promise<void> {
	await idbSet(DIR_HANDLE_KEY, handle)
	cachedDirHandle = handle
}

async function loadSavedDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
	try {
		const handle = await idbGet<FileSystemDirectoryHandle>(DIR_HANDLE_KEY)
		if (!handle) {
			return null
		}

		cachedDirHandle = handle
		return handle
	} catch (error) {
		console.warn('Failed to load saved download directory:', error)
		return null
	}
}

export async function initWebSaveLocation(): Promise<string> {
	const handle = await loadSavedDirectoryHandle()
	return handle?.name ?? ''
}

export async function pickDownloadDirectory(): Promise<string | null> {
	if (!supportsWebSaveLocationPicker()) {
		return null
	}

	try {
		const handle = await window.showDirectoryPicker!({ mode: 'readwrite' })
		await saveDirectoryHandle(handle)
		return handle.name
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			return null
		}
		throw error
	}
}

async function writeBytesToDirectory(
	dirHandle: FileSystemDirectoryHandle,
	fileName: string,
	bytes: Uint8Array
): Promise<void> {
	const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
	const writable = await fileHandle.createWritable()
	const payload = new Uint8Array(bytes)
	await writable.write(payload)
	await writable.close()
}

export async function writeReceivedFile(
	fileName: string,
	bytes: Uint8Array
): Promise<void> {
	if (cachedDirHandle) {
		const allowed = await ensureDirWritePermission(cachedDirHandle)
		if (allowed) {
			await writeBytesToDirectory(cachedDirHandle, fileName, bytes)
			return
		}
	}

	triggerBrowserDownload(bytes, fileName)
}
