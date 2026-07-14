import { useCallback, useEffect } from 'react'
import { listen } from '@/lib/platform-api'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { useNodeCapabilityStore } from '@/store/node-capability-store'

let devicePairedListenerStarted = false

function ensureDevicePairedListener() {
	if (!IS_PAIRING_CAPABLE || devicePairedListenerStarted) return
	devicePairedListenerStarted = true
	void listen('device-paired', () => {
		void useNodeCapabilityStore.getState().refresh()
	})
}

export function useNodeCapability() {
	const nodeStatus = useNodeCapabilityStore((s) => s.nodeStatus)
	const hasResolved = useNodeCapabilityStore((s) => s.hasResolved)
	const refresh = useNodeCapabilityStore((s) => s.refresh)

	useEffect(() => {
		ensureDevicePairedListener()
		void refresh()
	}, [refresh])

	const refreshNodeStatus = useCallback(() => refresh(), [refresh])

	const isNodeReady = IS_PAIRING_CAPABLE && nodeStatus.status === 'ready'
	const isNodeStatusPending = IS_PAIRING_CAPABLE && !hasResolved

	return {
		nodeStatus,
		isNodeReady,
		isNodeStatusPending,
		refreshNodeStatus,
		hasResolved,
	}
}
