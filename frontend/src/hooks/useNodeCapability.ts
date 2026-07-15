import { useCallback, useEffect } from 'react'
import { listen } from '@/lib/platform-api'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import {
	ensureNodeCapabilityLifecycle,
	useNodeCapabilityStore,
} from '@/store/node-capability-store'

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
	const isNetworkReady = useNodeCapabilityStore((s) => s.isNetworkReady)
	const refresh = useNodeCapabilityStore((s) => s.refresh)

	useEffect(() => {
		ensureNodeCapabilityLifecycle()
		ensureDevicePairedListener()
		void refresh()
	}, [refresh])

	const refreshNodeStatus = useCallback(() => refresh(), [refresh])

	const isNodeReady = IS_PAIRING_CAPABLE && nodeStatus.status === 'ready'
	const isNodeStatusPending = IS_PAIRING_CAPABLE && !hasResolved

	return {
		nodeStatus,
		isNodeReady,
		isNetworkReady: IS_PAIRING_CAPABLE ? isNetworkReady : true,
		isNodeStatusPending,
		refreshNodeStatus,
		hasResolved,
	}
}
