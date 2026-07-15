import { useThemeStore } from '../store'
import { useEffect } from 'react'
import { isNamedTheme, resolveColorMode, type AppTheme } from '../types/app'

type Props = {
	children: React.ReactNode
}

function prefersDarkScheme() {
	return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme: AppTheme, setIsDark: (isDark: boolean) => void) {
	const resolved = resolveColorMode(theme, prefersDarkScheme())
	const root = document.documentElement

	root.classList.toggle('dark', resolved === 'dark')
	root.classList.toggle('light', resolved === 'light')

	if (isNamedTheme(theme)) {
		root.dataset.theme = theme
	} else {
		delete root.dataset.theme
	}

	setIsDark(resolved === 'dark')
}

export function AppThemeProvider({ children }: Props) {
	const theme = useThemeStore((state) => state.activeTheme)
	const setIsDark = useThemeStore((state) => state.setIsDark)

	useEffect(() => {
		applyTheme(theme, setIsDark)

		if (theme === 'auto') {
			const mq = window.matchMedia('(prefers-color-scheme: dark)')
			const handler = () => applyTheme('auto', setIsDark)
			mq.addEventListener('change', handler)
			return () => mq.removeEventListener('change', handler)
		}
	}, [theme, setIsDark])

	return <>{children}</>
}
