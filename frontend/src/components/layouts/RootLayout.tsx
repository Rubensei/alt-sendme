import { Outlet } from 'react-router-dom'

import { AppFooter } from '../AppFooter'
import { TitleBar } from '../TitleBar'
import { useTranslation } from '@/i18n'
import { AppUpdater } from '../common/AppUpdater'
import { IS_ANDROID, IS_LINUX, IS_MACOS, IS_TAURI, IS_WEB } from '@/lib/platform'

export function RootLayout() {
	const { t } = useTranslation('common')
	return (
		<>
			{IS_TAURI && !IS_ANDROID && <AppUpdater />}
			<main className="h-dvh min-h-screen flex flex-col relative glass-background select-none bg-background">
				{IS_WEB && (
					<div className="shrink-0 border-b border-border bg-muted/60 px-4 py-2 text-center text-sm text-muted-foreground">
						{t('webPreview.banner')}
					</div>
				)}
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
