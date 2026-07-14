import { create } from 'zustand'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { getNodeStatus, type NodeStatus } from '@/lib/pairing-api'

type NodeCapabilityState = {
	nodeStatus: NodeStatus
	/** False until the first status fetch finishes (or pairing is ruled out). */
	hasResolved: boolean
	refresh: () => Promise<void>
}

export const useNodeCapabilityStore = create<NodeCapabilityState>((set) => ({
	nodeStatus: { status: 'unavailable' },
	hasResolved: !IS_PAIRING_CAPABLE,
	refresh: async () => {
		if (!IS_PAIRING_CAPABLE) {
			set({
				nodeStatus: { status: 'unavailable', reason: 'desktop_only' },
				hasResolved: true,
			})
			return
		}
		try {
			const nodeStatus = await getNodeStatus()
			set({ nodeStatus, hasResolved: true })
		} catch (error) {
			console.error('Failed to get node status:', error)
			set({
				nodeStatus: {
					status: 'unavailable',
					reason: String(error),
				},
				hasResolved: true,
			})
		}
	},
}))
