import { dispatchWebEvent } from './web-event-bus'

type EngineWasmModule = typeof import('../wasm/pkg/engine_wasm.js')

let initPromise: Promise<EngineWasmModule> | null = null
let currentTicket: string | null = null

async function loadEngineWasm(): Promise<EngineWasmModule> {
	const wasm = await import('../wasm/pkg/engine_wasm.js')
	await wasm.default()

	wasm.set_event_callback((eventName: string, payload: string | null | undefined) => {
		dispatchWebEvent(eventName, payload ?? undefined)
	})

	return wasm
}

export async function ensureEngineWasm(): Promise<EngineWasmModule> {
	if (!initPromise) {
		initPromise = loadEngineWasm().catch((error) => {
			initPromise = null
			throw error
		})
	}
	return initPromise
}

export function getWebSharingTicket(): string | null {
	return currentTicket
}

export async function wasmSendFile(
	fileName: string,
	bytes: Uint8Array,
	metadataJson?: string
): Promise<string> {
	const wasm = await ensureEngineWasm()
	const result = await wasm.send_file(fileName, bytes, metadataJson ?? undefined)
	currentTicket = result.ticket
	return result.ticket
}

export async function wasmStopSharing(): Promise<void> {
	const wasm = await ensureEngineWasm()
	wasm.stop_sharing()
	currentTicket = null
}

export async function wasmFetchTicketMetadata(ticket: string): Promise<string> {
	const wasm = await ensureEngineWasm()
	return wasm.fetch_ticket_metadata(ticket)
}

export async function wasmReceiveFile(
	ticket: string
): Promise<{ fileName: string; bytes: Uint8Array }> {
	const wasm = await ensureEngineWasm()
	const result = await wasm.receive_file(ticket)
	return {
		fileName: result.file_name,
		bytes: new Uint8Array(result.bytes),
	}
}

export function triggerBrowserDownload(bytes: Uint8Array, fileName: string): void {
	const copy = new Uint8Array(bytes)
	const blob = new Blob([copy])
	const url = URL.createObjectURL(blob)
	const anchor = document.createElement('a')
	anchor.href = url
	anchor.download = fileName
	anchor.style.display = 'none'
	document.body.appendChild(anchor)
	anchor.click()
	anchor.remove()
	URL.revokeObjectURL(url)
}
