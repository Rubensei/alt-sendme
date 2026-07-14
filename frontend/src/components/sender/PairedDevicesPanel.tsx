import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { PairedDevice } from '@/lib/pairing-api'
import {
	deviceSubtitle,
	isPairedDeviceActive,
	matchesPairedDeviceSearch,
} from '@/lib/pairing-api'
import { deviceTypeIcon } from '@/lib/device-icon'
import { DevicePairingStatus } from '../pairing/DevicePairingStatus'
import { PairedDevicesSearchField } from '../pairing/PairedDevicesSearchField'
import { Button } from '../ui/button'

type PairedInviteStatus = 'sending' | 'sent' | 'failed'

interface PairedDevicesPanelProps {
	pairedDevices: PairedDevice[]
	pairedInviteStatus: Record<string, PairedInviteStatus>
	isNodeReady: boolean
	hasTicket: boolean
	onInvitePairedDevice?: (endpointId: string) => Promise<void>
	showHeader?: boolean
	showSearch?: boolean
	isOpen?: boolean
}

export function PairedDevicesPanel({
	pairedDevices,
	pairedInviteStatus,
	isNodeReady,
	hasTicket,
	onInvitePairedDevice,
	showHeader = true,
	showSearch = false,
	isOpen = false,
}: PairedDevicesPanelProps) {
	const { t } = useTranslation()
	const [searchQuery, setSearchQuery] = useState('')

	useEffect(() => {
		if (isOpen) {
			setSearchQuery('')
		}
	}, [isOpen])

	const sortedDevices = useMemo(
		() =>
			[...pairedDevices].sort((a, b) =>
				a.display_name.localeCompare(b.display_name)
			),
		[pairedDevices]
	)

	const filteredDevices = useMemo(() => {
		if (!showSearch) return sortedDevices
		return sortedDevices.filter((device) =>
			matchesPairedDeviceSearch(device, searchQuery)
		)
	}, [sortedDevices, searchQuery, showSearch])

	return (
		<div className="space-y-4">
			{showHeader ? (
				<div className="space-y-0.5">
					<p className="text-sm font-medium">
						{t('common:sender.sharingActive.devices.title')}
					</p>
					<p className="text-xs text-muted-foreground">
						{t('common:sender.sharingActive.devices.hint')}
					</p>
				</div>
			) : null}

			{!isNodeReady && (
				<p className="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
					{t('common:sender.sharingActive.devices.nodeUnavailable')}
				</p>
			)}

			{showSearch && sortedDevices.length > 0 ? (
				<PairedDevicesSearchField
					value={searchQuery}
					onChange={setSearchQuery}
					className="sticky top-0 z-10 -mx-1 bg-popover px-1 pb-3"
				/>
			) : null}

			{sortedDevices.length === 0 ? (
				<div className="space-y-2 rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
					<p className="font-medium text-foreground">
						{t('common:sender.sharingActive.devices.emptyTitle')}
					</p>
					<p>{t('common:sender.sharingActive.devices.emptyHint')}</p>
					<Link
						to="/settings/devices"
						className="inline-block underline underline-offset-2 hover:text-foreground"
					>
						{t('common:sender.sharingActive.devices.manageInSettings')}
					</Link>
				</div>
			) : filteredDevices.length === 0 ? (
				<p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
					{t('common:sender.sharingActive.devices.searchNoResults')}
				</p>
			) : (
				<ul className="divide-y divide-border">
					{filteredDevices.map((device) => {
						const Icon = deviceTypeIcon(device.device_type)
						const inviteStatus = pairedInviteStatus[device.endpoint_id]
						const isActive = isPairedDeviceActive(device)
						const disabled =
							!isNodeReady ||
							!hasTicket ||
							inviteStatus === 'sending' ||
							!isActive
						return (
							<li
								key={device.endpoint_id}
								className="flex items-center justify-between gap-3 py-3 text-sm"
							>
								<div className="flex min-w-0 items-center gap-3">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
										<Icon className="h-4 w-4" />
									</div>
									<div className="min-w-0">
										<span className="block truncate">
											{device.display_name}
										</span>
										<span className="block truncate text-xs text-muted-foreground">
											{deviceSubtitle(device)}
										</span>
									</div>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<DevicePairingStatus device={device} namespace="sender" />
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={disabled}
										onClick={() => onInvitePairedDevice?.(device.endpoint_id)}
									>
										{inviteStatus === 'sending' ? (
											<>
												<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
												{t('common:sender.pairedDevices.sending')}
											</>
										) : inviteStatus === 'sent' ? (
											<>
												<Check className="w-3.5 h-3.5 mr-1.5" />
												{t('common:sender.pairedDevices.sent')}
											</>
										) : inviteStatus === 'failed' ? (
											t('common:sender.pairedDevices.failed')
										) : (
											t('common:sender.pairedDevices.send')
										)}
									</Button>
								</div>
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}
