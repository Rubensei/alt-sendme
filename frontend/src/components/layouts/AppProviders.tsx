import { TranslationProvider } from '@/i18n'
import { IS_WEB } from '@/lib/platform'
import { WEB_APP_PORTAL_ID } from '@/lib/platformStyles'
import { AppThemeProvider } from '../AppThemeProvider'
import { WebPromoPanel } from '../WebPromoPanel'
import { AnchoredToastProvider, ToastProvider } from '../ui/toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function WebAppShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="web-app-layout">
			<div className="web-app-frame relative min-h-0">
				<div className="relative flex h-full min-h-0 w-full flex-col">
					{children}
					<div
						id={WEB_APP_PORTAL_ID}
						className="pointer-events-none absolute inset-0 z-[100] [&>*]:pointer-events-auto"
					/>
				</div>
			</div>
			<WebPromoPanel />
		</div>
	)
}

export function AppProviders({ children }: { children: React.ReactNode }) {
	const app = IS_WEB ? <WebAppShell>{children}</WebAppShell> : children

	return (
		<TranslationProvider>
			<QueryClientProvider client={queryClient}>
				<ToastProvider position="bottom-center" limit={1}>
					<AnchoredToastProvider>
						<AppThemeProvider>{app}</AppThemeProvider>
					</AnchoredToastProvider>
				</ToastProvider>
			</QueryClientProvider>
		</TranslationProvider>
	)
}
