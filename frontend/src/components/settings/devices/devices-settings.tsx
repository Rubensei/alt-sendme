import { useState } from 'react'
import { Copy, Plus, QrCode, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { usePairing } from '../../../hooks/usePairing'
import { Button } from '../../ui/button'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../../ui/alert-dialog'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { toastManager } from '../../ui/toast'
import {
	Frame,
	FrameDescription,
	FramePanel,
	FrameTitle,
} from '../../ui/frame'
import { IS_DESKTOP } from '@/lib/platform'

function PairHostModal({
	open,
	ticket,
	isLoading,
	expiresIn,
	onClose,
}: {
	open: boolean
	ticket: string | null
	isLoading: boolean
	expiresIn: number | null
	onClose: () => void
}) {
	const { t } = useTranslation()

	const copyTicket = async () => {
		if (!ticket) return
		await navigator.clipboard.writeText(ticket)
		toastManager.add({
			title: t('common:settings.devices.copied'),
			type: 'success',
		})
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onClose()
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t('common:settings.devices.showQrCode')}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t('common:settings.devices.hostHint')}
						{expiresIn != null && expiresIn > 0 ? (
							<>
								{' '}
								{t('common:settings.devices.hostExpiresIn', {
									seconds: expiresIn,
								})}
							</>
						) : null}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="space-y-3 px-6">
					<Label>{t('common:settings.devices.pairingCode')}</Label>
					<Textarea
						readOnly
						value={isLoading ? t('common:loading') : (ticket ?? '')}
						className="font-mono text-xs min-h-28"
					/>
					<Button
						type="button"
						variant="outline"
						disabled={isLoading || !ticket}
						onClick={copyTicket}
					>
						<Copy className="w-4 h-4 mr-2" />
						{t('common:sender.copyToClipboard')}
					</Button>
				</div>
				<AlertDialogFooter>
					<Button type="button" onClick={onClose}>
						{t('common:ok')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

function PairJoinModal({
	open,
	isLoading,
	onClose,
	onJoin,
}: {
	open: boolean
	isLoading: boolean
	onClose: () => void
	onJoin: (ticket: string) => Promise<void>
}) {
	const { t } = useTranslation()
	const [code, setCode] = useState('')

	const handleJoin = async () => {
		if (!code.trim()) return
		try {
			await onJoin(code)
			setCode('')
			onClose()
			toastManager.add({
				title: t('common:settings.devices.devicePaired'),
				type: 'success',
			})
		} catch (error) {
			console.error(error)
			toastManager.add({
				title: t('common:settings.devices.pairFailed'),
				type: 'error',
			})
		}
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					setCode('')
					onClose()
				}
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t('common:settings.devices.enterCode')}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t('common:settings.devices.joinHint')}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="px-6 pb-2">
					<Input
						value={code}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							setCode(event.target.value)
						}
						placeholder={t('common:settings.devices.codePlaceholder')}
						className="font-mono text-xs"
					/>
				</div>
				<AlertDialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						{t('common:cancel')}
					</Button>
					<Button
						type="button"
						disabled={isLoading || !code.trim()}
						onClick={handleJoin}
					>
						{t('common:settings.devices.pairDevice')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export function DevicesSettings() {
	const { t } = useTranslation()
	const {
		devices,
		pairingTicket,
		hostExpiresIn,
		isJoining,
		isLoading,
		isNodeReady,
		nodeStatus,
		openHostPairing,
		closeHostPairing,
		join,
		forget,
	} = usePairing()
	const [hostOpen, setHostOpen] = useState(false)
	const [joinOpen, setJoinOpen] = useState(false)

	if (!IS_DESKTOP) {
		return (
			<Frame>
				<FramePanel>
					<div className="space-y-2">
						<FrameTitle>{t('common:settings.devices.title')}</FrameTitle>
						<FrameDescription>
							{t('common:settings.devices.desktopOnly')}
						</FrameDescription>
					</div>
				</FramePanel>
			</Frame>
		)
	}

	if (!isNodeReady) {
		return (
			<Frame>
				<FramePanel>
					<div className="space-y-2">
						<FrameTitle>{t('common:settings.devices.title')}</FrameTitle>
						<FrameDescription>
							{t('common:settings.devices.nodeUnavailableTitle')}
						</FrameDescription>
						<p className="text-sm text-muted-foreground">
							{nodeStatus.reason
								? nodeStatus.reason
								: t('common:settings.devices.nodeUnavailableHint')}
						</p>
					</div>
				</FramePanel>
			</Frame>
		)
	}

	const openHost = async () => {
		setHostOpen(true)
		try {
			await openHostPairing()
		} catch (error) {
			console.error(error)
			setHostOpen(false)
			toastManager.add({
				title: t('common:settings.devices.pairFailed'),
				type: 'error',
			})
		}
	}

	const closeHost = async () => {
		setHostOpen(false)
		await closeHostPairing()
	}

	return (
		<>
			<Frame>
				<FramePanel className="flex flex-col gap-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="space-y-2 min-w-0">
							<FrameTitle>{t('common:settings.devices.title')}</FrameTitle>
							<FrameDescription>
								{t('common:settings.devices.description')}
							</FrameDescription>
						</div>
						<div className="flex flex-wrap gap-2 shrink-0">
							<Button
								type="button"
								size="sm"
								disabled={isLoading && hostOpen}
								onClick={openHost}
							>
								<QrCode className="w-4 h-4 mr-2" />
								{t('common:settings.devices.showQrCode')}
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => setJoinOpen(true)}
							>
								<Plus className="w-4 h-4 mr-2" />
								{t('common:settings.devices.enterCode')}
							</Button>
						</div>
					</div>

					{devices.length === 0 ? (
						<div className="py-8 text-center text-sm text-muted-foreground border-t">
							<p className="font-medium text-foreground mb-2">
								{t('common:settings.devices.noPairedDevices')}
							</p>
							<p>{t('common:settings.devices.noPairedDevicesHint')}</p>
						</div>
					) : (
						<ul className="divide-y border-t">
							{devices.map((device) => (
								<li
									key={device.endpoint_id}
									className="flex items-center justify-between gap-3 py-3 first:pt-4"
								>
									<div className="min-w-0">
										<p className="font-medium truncate">
											{device.display_name}
										</p>
										<p className="text-xs text-muted-foreground truncate font-mono">
											{device.endpoint_id.slice(0, 12)}…
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										aria-label={t('common:settings.devices.removeDevice')}
										onClick={async () => {
											try {
												await forget(device.endpoint_id)
												toastManager.add({
													title: t('common:settings.devices.deviceRemoved'),
													type: 'success',
												})
											} catch (error) {
												console.error(error)
												toastManager.add({
													title: t('common:settings.devices.removeFailed'),
													type: 'error',
												})
											}
										}}
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</li>
							))}
						</ul>
					)}
				</FramePanel>
			</Frame>

			<PairHostModal
				open={hostOpen}
				ticket={pairingTicket}
				isLoading={isLoading}
				expiresIn={hostExpiresIn}
				onClose={closeHost}
			/>
			<PairJoinModal
				open={joinOpen}
				isLoading={isJoining}
				onClose={() => setJoinOpen(false)}
				onJoin={join}
			/>
		</>
	)
}
