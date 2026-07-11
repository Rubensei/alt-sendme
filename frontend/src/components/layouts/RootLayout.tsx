import { Outlet } from 'react-router-dom'

import { AppFooter } from '../AppFooter'
import { TitleBar } from '../TitleBar'
import { useTranslation } from '@/i18n'
import { AppUpdater } from '../common/AppUpdater'
import { DeviceNodeSync } from '../pairing/DeviceNodeSync'
import { PairedInviteDialog } from '../pairing/PairedInviteDialog'
import {
	IS_ANDROID,
	IS_DESKTOP,
	IS_LINUX,
	IS_MACOS,
	IS_TAURI,
	IS_WEB,
} from '@/lib/platform'

export function RootLayout() {
	const { t } = useTranslation('common')
	return (
		<>
			{IS_TAURI && !IS_ANDROID && <AppUpdater />}
			{IS_DESKTOP && <DeviceNodeSync />}
			{IS_DESKTOP && <PairedInviteDialog />}
			<main
				className={
					IS_WEB
						? 'h-full flex flex-col relative glass-background select-none bg-background'
						: 'h-dvh min-h-screen flex flex-col relative glass-background select-none bg-background'
				}
			>
				{IS_LINUX && !IS_ANDROID && <TitleBar title={t('appTitle')} />}

				{IS_MACOS && (
					<div className="absolute w-full h-10 z-10" data-tauri-drag-region />
				)}
				<Outlet />
				<AppFooter />
			</main>
		</>
	)
}
