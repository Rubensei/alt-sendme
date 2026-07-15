import { create } from 'zustand'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { listen } from '@/lib/platform-api'
import { getNodeStatus, type NodeStatus } from '@/lib/pairing-api'

type NodeCapabilityState = {
	nodeStatus: NodeStatus
	/** False until the node is ready, or init has definitively failed. */
	hasResolved: boolean
	/**
	 * True once the bound node has reached its home relay (or relay is disabled).
	 * While false with a ready node, paired peers may briefly show Connecting.
	 */
	isNetworkReady: boolean
	refresh: () => Promise<void>
}

let refreshInFlight: Promise<void> | null = null
let lifecycleListenersStarted = false
/** Single delayed recheck if an early poll races bind / misses the ready event. */
let fallbackTimer: ReturnType<typeof setTimeout> | null = null
let waitStartedAt: number | null = null

const FALLBACK_RECHECK_MS = 1000
const WAIT_MAX_MS = 30_000

function clearFallback() {
	if (fallbackTimer != null) {
		clearTimeout(fallbackTimer)
		fallbackTimer = null
	}
	waitStartedAt = null
}

/** Ready, or unavailable with a concrete failure reason. */
export function isNodeStatusSettled(nodeStatus: NodeStatus): boolean {
	if (nodeStatus.status === 'ready') return true
	if (nodeStatus.status === 'starting') return false
	// unavailable — only settle when we have a reason (hard failure / desktop_only).
	return Boolean(nodeStatus.reason)
}

export const useNodeCapabilityStore = create<NodeCapabilityState>((set, get) => ({
	nodeStatus: IS_PAIRING_CAPABLE
		? { status: 'starting' }
		: { status: 'unavailable', reason: 'desktop_only' },
	hasResolved: !IS_PAIRING_CAPABLE,
	isNetworkReady: !IS_PAIRING_CAPABLE,
	refresh: async () => {
		if (!IS_PAIRING_CAPABLE) {
			set({
				nodeStatus: { status: 'unavailable', reason: 'desktop_only' },
				hasResolved: true,
				isNetworkReady: true,
			})
			return
		}

		if (refreshInFlight) return refreshInFlight

		refreshInFlight = (async () => {
			try {
				const nodeStatus = await getNodeStatus()

				if (isNodeStatusSettled(nodeStatus)) {
					clearFallback()
					set({
						nodeStatus,
						hasResolved: true,
						isNetworkReady:
							nodeStatus.status === 'ready'
								? Boolean(nodeStatus.network_ready)
								: false,
					})
					return
				}

				set({
					nodeStatus: {
						status: 'starting',
						reason: nodeStatus.reason ?? null,
					},
					hasResolved: false,
					isNetworkReady: false,
				})

				if (waitStartedAt == null) waitStartedAt = Date.now()
				if (Date.now() - waitStartedAt >= WAIT_MAX_MS) {
					clearFallback()
					set({
						nodeStatus: {
							status: 'unavailable',
							reason:
								nodeStatus.reason ??
								'Device node failed to start in time.',
						},
						hasResolved: true,
						isNetworkReady: false,
					})
					return
				}

				// Event-driven path is primary; light recheck covers a missed emit.
				if (fallbackTimer == null) {
					fallbackTimer = setTimeout(() => {
						fallbackTimer = null
						void get().refresh()
					}, FALLBACK_RECHECK_MS)
				}
			} catch (error) {
				console.error('Failed to get node status:', error)
				clearFallback()
				set({
					nodeStatus: {
						status: 'unavailable',
						reason: String(error),
					},
					hasResolved: true,
					isNetworkReady: false,
				})
			} finally {
				refreshInFlight = null
			}
		})()

		return refreshInFlight
	},
}))

/** Listen for native node lifecycle events and keep status fresh app-wide. */
export function ensureNodeCapabilityLifecycle() {
	if (!IS_PAIRING_CAPABLE || lifecycleListenersStarted) return
	lifecycleListenersStarted = true

	void listen('device-node-ready', () => {
		clearFallback()
		void useNodeCapabilityStore.getState().refresh()
	})

	void listen('device-node-network-ready', () => {
		useNodeCapabilityStore.setState({ isNetworkReady: true })
		void useNodeCapabilityStore.getState().refresh()
	})

	void listen('device-node-network-warming', () => {
		useNodeCapabilityStore.setState({ isNetworkReady: false })
	})

	void listen('device-node-failed', (event: { payload: unknown }) => {
		clearFallback()
		const reason =
			typeof event.payload === 'string' && event.payload.trim()
				? event.payload
				: 'Failed to initialize device node'
		useNodeCapabilityStore.setState({
			nodeStatus: { status: 'unavailable', reason },
			hasResolved: true,
			isNetworkReady: false,
		})
	})
}
