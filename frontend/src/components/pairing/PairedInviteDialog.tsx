import { invoke, downloadDir } from '@/lib/platform-api'
import { getRelayConfigArg } from '@/lib/relay'
import { IS_DESKTOP } from '@/lib/platform'
import { useTranslation } from '@/i18n'
import { useAppSettingStore } from '@/store/app-setting'
import { usePairedInviteStore } from '@/store/paired-invite-store'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogClose,
} from '../ui/alert-dialog'
import { Button } from '../ui/button'
import { toastManager } from '../ui/toast'

export function PairedInviteDialog() {
	const { t } = useTranslation()
	const invite = usePairedInviteStore((s) => s.invite)
	const setInvite = usePairedInviteStore((s) => s.setInvite)
	const downloadsPath = useAppSettingStore((s) => s.downloadsPath)

	const decline = () => {
		setInvite(null)
	}

	const accept = async () => {
		if (!invite) return

		try {
			let outputPath = downloadsPath.trim()
			if (!outputPath) {
				outputPath = await downloadDir()
			}

			await invoke<string>('receive_file', {
				ticket: invite.blob_ticket.trim(),
				outputPath,
				relay: getRelayConfigArg(),
			})
			setInvite(null)
		} catch (error) {
			console.error('Failed to accept paired invite:', error)
			toastManager.add({
				title: t('common:errors.receiveFailed'),
				description: String(error),
				type: 'error',
			})
		}
	}

	if (!IS_DESKTOP) return null

	return (
		<AlertDialog
			open={invite != null}
			onOpenChange={(open) => {
				if (!open) decline()
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t('common:receiver.receiveFromPairedTitle')}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{invite
							? t('common:receiver.receiveFromPairedDescription', {
									sender: invite.sender_name,
									count: invite.file_count,
									size: `${Math.round(invite.total_size / 1024)} KB`,
								})
							: ''}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose
						render={
							<Button size="sm" variant="outline">
								{t('common:receiver.declineInvite')}
							</Button>
						}
						onClick={decline}
					/>
					<Button size="sm" onClick={accept}>
						{t('common:receiver.acceptInvite')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
