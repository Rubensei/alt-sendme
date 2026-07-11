import { useCallback, useEffect, useState } from 'react'
import { listen } from '@/lib/platform-api'
import { IS_DESKTOP } from '@/lib/platform'
import {
	forgetPairedDevice,
	joinPairing,
	listPairedDevices,
	startPairingHost,
	stopPairingHost,
	type PairedDevice,
} from '@/lib/pairing-api'
import { useNodeCapability } from './useNodeCapability'

const PAIRING_HOST_TTL_SECS = 60

export function usePairing() {
	const [devices, setDevices] = useState<PairedDevice[]>([])
	const [pairingTicket, setPairingTicket] = useState<string | null>(null)
	const [hostExpiresIn, setHostExpiresIn] = useState<number | null>(null)
	const [isJoining, setIsJoining] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const { isNodeReady, nodeStatus } = useNodeCapability()

	const refreshDevices = useCallback(async () => {
		if (!IS_DESKTOP || !isNodeReady) {
			setDevices([])
			return
		}
		try {
			setDevices(await listPairedDevices())
		} catch (error) {
			console.error('Failed to list paired devices:', error)
		}
	}, [isNodeReady])

	useEffect(() => {
		void refreshDevices()
	}, [refreshDevices])

	useEffect(() => {
		if (!IS_DESKTOP) return

		let disposed = false
		let unlistenPaired: (() => void) | undefined
		let unlistenExpired: (() => void) | undefined

		const setup = async () => {
			const pairedUnlisten = await listen('device-paired', () => {
				void refreshDevices()
			})
			if (disposed) {
				pairedUnlisten()
			} else {
				unlistenPaired = pairedUnlisten
			}

			const expiredUnlisten = await listen('pairing-host-expired', () => {
				setPairingTicket(null)
				setHostExpiresIn(null)
			})
			if (disposed) {
				expiredUnlisten()
			} else {
				unlistenExpired = expiredUnlisten
			}
		}

		void setup()

		return () => {
			disposed = true
			unlistenPaired?.()
			unlistenExpired?.()
		}
	}, [refreshDevices])

	useEffect(() => {
		if (hostExpiresIn == null || hostExpiresIn <= 0) return

		const timer = window.setInterval(() => {
			setHostExpiresIn((prev) => {
				if (prev == null || prev <= 1) {
					window.clearInterval(timer)
					return null
				}
				return prev - 1
			})
		}, 1000)

		return () => window.clearInterval(timer)
	}, [hostExpiresIn])

	const openHostPairing = useCallback(async () => {
		if (!IS_DESKTOP || !isNodeReady) return null
		setIsLoading(true)
		try {
			const ticket = await startPairingHost()
			setPairingTicket(ticket)
			setHostExpiresIn(PAIRING_HOST_TTL_SECS)
			return ticket
		} finally {
			setIsLoading(false)
		}
	}, [isNodeReady])

	const closeHostPairing = useCallback(async () => {
		setPairingTicket(null)
		setHostExpiresIn(null)
		await stopPairingHost()
	}, [])

	const join = useCallback(
		async (ticket: string) => {
			if (!IS_DESKTOP || !isNodeReady) return
			setIsJoining(true)
			try {
				await joinPairing(ticket.trim())
				await refreshDevices()
			} finally {
				setIsJoining(false)
			}
		},
		[isNodeReady, refreshDevices]
	)

	const forget = useCallback(
		async (endpointId: string) => {
			await forgetPairedDevice(endpointId)
			await refreshDevices()
		},
		[refreshDevices]
	)

	return {
		devices,
		pairingTicket,
		hostExpiresIn,
		isJoining,
		isLoading,
		isNodeReady,
		nodeStatus,
		refreshDevices,
		openHostPairing,
		closeHostPairing,
		join,
		forget,
	}
}
