import { useState } from 'react'
import { MonitorSmartphone } from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { SharingControlsProps } from '../../types/sender'
import { IS_DESKTOP } from '@/lib/platform'
import { Button } from '../ui/button'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from '../ui/sheet'
import { PairedDevicesPanel } from './PairedDevicesPanel'
import { ShareLinkPanel } from './ShareLinkPanel'

export function SharingActiveCard({
	selectedPaths,
	selectedPath,
	ticket,
	copySuccess,
	transferProgress,
	isTransporting,
	isCompleted,
	isBroadcastMode,
	activeConnectionCount = 0,
	pairedDevices = [],
	isNodeReady = false,
	pairedInviteStatus = {},
	onInvitePairedDevice,
	onCopyTicket,
	onStopSharing,
	onSetBroadcast,
}: SharingControlsProps) {
	const { t } = useTranslation()
	const [devicesOpen, setDevicesOpen] = useState(false)

	return (
		<>
			<div className="flex h-full flex-col">
				<ShareLinkPanel
					selectedPaths={selectedPaths}
					selectedPath={selectedPath}
					ticket={ticket}
					copySuccess={copySuccess}
					isTransporting={isTransporting}
					isCompleted={isCompleted}
					isBroadcastMode={isBroadcastMode}
					activeConnectionCount={activeConnectionCount}
					transferProgress={transferProgress}
					onCopyTicket={onCopyTicket}
					onSetBroadcast={onSetBroadcast}
					onStopSharing={onStopSharing}
				/>

				{IS_DESKTOP ? (
					<div className="mt-auto flex justify-center pt-4">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setDevicesOpen(true)}
						>
							<MonitorSmartphone className="h-4 w-4" />
							{t('common:sender.sharingActive.devicesButton')}
						</Button>
					</div>
				) : null}
			</div>

			{IS_DESKTOP ? (
				<Sheet open={devicesOpen} onOpenChange={setDevicesOpen}>
					<SheetContent side="right" className="sm:max-w-md">
						<SheetHeader>
							<SheetTitle>
								{t('common:sender.sharingActive.devices.title')}
							</SheetTitle>
							<SheetDescription>
								{t('common:sender.sharingActive.devices.hint')}
							</SheetDescription>
						</SheetHeader>
						<SheetPanel>
							<PairedDevicesPanel
								pairedDevices={pairedDevices}
								pairedInviteStatus={pairedInviteStatus}
								isNodeReady={isNodeReady}
								hasTicket={Boolean(ticket)}
								onInvitePairedDevice={onInvitePairedDevice}
								showHeader={false}
							/>
						</SheetPanel>
					</SheetContent>
				</Sheet>
			) : null}
		</>
	)
}
