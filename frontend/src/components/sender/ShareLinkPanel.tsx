import { CheckCircle, Copy } from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { TransferProgress } from '../../types/transfer'
import { PulseAnimation } from '../common/PulseAnimation'
import { TransferProgressBar } from '../common/TransferProgressBar'
import { Button } from '../ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { toastManager } from '../ui/toast'
import { useAppSettingStore } from '../../store/app-setting'
import { SharingActiveHeader } from './SharingActiveHeader'

interface ShareLinkPanelProps {
	selectedPaths: string[]
	selectedPath: string | null
	ticket: string | null
	copySuccess: boolean
	isTransporting: boolean
	isCompleted: boolean
	isBroadcastMode: boolean
	activeConnectionCount: number
	transferProgress: TransferProgress | null
	onCopyTicket: () => Promise<void>
	onSetBroadcast: (broadcast: boolean) => void
	onStopSharing: () => Promise<void>
}

export function ShareLinkPanel({
	selectedPaths,
	selectedPath,
	ticket,
	copySuccess,
	isTransporting,
	isCompleted,
	isBroadcastMode,
	activeConnectionCount,
	transferProgress,
	onCopyTicket,
	onSetBroadcast,
	onStopSharing,
}: ShareLinkPanelProps) {
	const { t } = useTranslation()

	const statusText = isCompleted
		? t('common:sender.transferCompleted')
		: isTransporting
			? t('common:sender.sharingInProgress')
			: t('common:sender.listeningForConnection')

	const clampedProgress = transferProgress
		? {
				...transferProgress,
				bytesTransferred: Math.min(
					Math.max(transferProgress.bytesTransferred, 0),
					transferProgress.totalBytes
				),
				percentage: Math.min(Math.max(transferProgress.percentage, 0), 100),
			}
		: null

	const defaultProgress = {
		bytesTransferred: 0,
		totalBytes: 0,
		speedBps: 0,
		percentage: 0,
	}

	const progressToDisplay = isTransporting
		? clampedProgress || defaultProgress
		: null

	return (
		<div className="flex flex-col gap-4">
			<SharingActiveHeader
				selectedPaths={selectedPaths}
				selectedPath={selectedPath}
				statusText={statusText}
				isCompleted={isCompleted}
				isTransporting={isTransporting}
				activeConnectionCount={activeConnectionCount}
				isBroadcastMode={isBroadcastMode}
				onStopSharing={onStopSharing}
			/>

			<div className="flex flex-col items-center gap-4">
				<PulseAnimation
					isTransporting={isTransporting && !isBroadcastMode}
					hasActiveConnections={isBroadcastMode && activeConnectionCount > 0}
					size={140}
					className="flex items-center justify-center"
				/>

				<p className="text-xs text-center text-muted-foreground">
					{t('common:sender.keepAppOpen')}
				</p>

				{!isTransporting && ticket && (
					<TicketDisplay
						ticket={ticket}
						copySuccess={copySuccess}
						onCopyTicket={onCopyTicket}
						isBroadcastMode={isBroadcastMode}
						onSetBroadcast={onSetBroadcast}
					/>
				)}

				{progressToDisplay && (
					<div className="w-full">
						<TransferProgressBar progress={progressToDisplay} />
					</div>
				)}
			</div>
		</div>
	)
}

interface TicketDisplayProps {
	ticket: string
	copySuccess: boolean
	onCopyTicket: () => Promise<void>
	isBroadcastMode: boolean
	onSetBroadcast: (broadcast: boolean) => void
}

function TicketDisplay({
	ticket,
	copySuccess,
	onCopyTicket,
	isBroadcastMode,
	onSetBroadcast,
}: TicketDisplayProps) {
	const { t } = useTranslation()
	const showBroadcastToggle = useAppSettingStore(
		(state) => state.showBroadcastToggle
	)

	const handleBroadcastChange = (next: boolean) => {
		onSetBroadcast(next)
		if (next) {
			const toastId = crypto.randomUUID()
			toastManager.add({
				title: t('common:sender.broadcastMode.on.label'),
				id: toastId,
				description: t('common:sender.broadcastMode.on.description'),
				type: 'info',
				actionProps: {
					children: t('common:undo'),
					onClick: () => {
						onSetBroadcast(false)
						toastManager.close(toastId)
					},
				},
			})
			setTimeout(() => {
				toastManager.close(toastId)
			}, 5000)
		}
	}

	return (
		<div className="w-full space-y-3">
			<div className="flex items-center justify-between">
				<p className="block text-sm font-medium">
					{t('common:sender.shareThisTicket')}
				</p>
				{showBroadcastToggle && (
					<div className="flex items-start gap-2">
						<Label htmlFor="broadcast-toggle" className="text-sm">
							{t('common:sender.broadcastMode.index')}
						</Label>
						<Switch
							id="broadcast-toggle"
							checked={isBroadcastMode}
							onCheckedChange={handleBroadcastChange}
						/>
					</div>
				)}
			</div>
			<InputGroup>
				<InputGroupInput
					type="text"
					value={ticket}
					className="text-ellipsis"
					readOnly
				/>
				<InputGroupAddon align="inline-end">
					<Button
						type="button"
						size="icon-xs"
						onClick={onCopyTicket}
						style={{
							backgroundColor: copySuccess
								? 'var(--app-primary)'
								: 'var(--color-foreground)',
							border: '1px solid var(--border)',
						}}
						title={t('common:sender.copyToClipboard')}
					>
						{copySuccess ? (
							<CheckCircle className="h-4 w-4" />
						) : (
							<Copy className="h-4 w-4" />
						)}
					</Button>
				</InputGroupAddon>
			</InputGroup>
			<p className="text-xs text-muted-foreground">
				{t('common:sender.sendThisTicket')}
			</p>
		</div>
	)
}
