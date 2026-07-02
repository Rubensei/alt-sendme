/** Vite `base` with trailing slash; React Router wants no trailing slash. */
export function getRouterBasename(): string | undefined {
	const base = import.meta.env.BASE_URL
	if (!base || base === '/') {
		return undefined
	}

	return base.replace(/\/$/, '')
}
