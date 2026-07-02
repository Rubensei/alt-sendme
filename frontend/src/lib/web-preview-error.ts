export class WebPreviewError extends Error {
	constructor(
		message = 'File transfer is not available in the web preview. Use the desktop app to send and receive files.'
	) {
		super(message)
		this.name = 'WebPreviewError'
	}
}

export function isWebPreviewError(error: unknown): boolean {
	return error instanceof WebPreviewError
}
