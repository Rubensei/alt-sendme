import { useCallback, useEffect, useState } from 'react'
import { listen } from '@/lib/platform-api'
import { IS_DESKTOP } from '@/lib/platform'
import { getNodeStatus, type NodeStatus } from '@/lib/pairing-api'

export function useNodeCapability() {
	const [nodeStatus, setNodeStatus] = useState<NodeStatus>({
		status: 'unavailable',
	})

	const refresh = useCallback(async () => {
		if (!IS_DESKTOP) {
			setNodeStatus({ status: 'unavailable', reason: 'desktop_only' })
			return
		}
		try {
			setNodeStatus(await getNodeStatus())
		} catch (error) {
			console.error('Failed to get node status:', error)
			setNodeStatus({
				status: 'unavailable',
				reason: String(error),
			})
		}
	}, [])

	useEffect(() => {
		void refresh()
	}, [refresh])

	useEffect(() => {
		if (!IS_DESKTOP) return

		let disposed = false
		let unlisten: (() => void) | undefined

		const setup = async () => {
			const fn = await listen('device-paired', () => {
				void refresh()
			})
			if (disposed) {
				fn()
			} else {
				unlisten = fn
			}
		}

		void setup()

		return () => {
			disposed = true
			unlisten?.()
		}
	}, [refresh])

	const isNodeReady = IS_DESKTOP && nodeStatus.status === 'ready'

	return {
		nodeStatus,
		isNodeReady,
		refreshNodeStatus: refresh,
	}
}
