import type { CSSProperties } from 'react'
import {
	AE,
	AU,
	BD,
	BH,
	BR,
	CA,
	CN,
	CZ,
	DE,
	ES,
	FR,
	GB,
	HU,
	ID,
	IE,
	IN,
	IR,
	IT,
	JP,
	KH,
	KR,
	NO,
	PL,
	RS,
	RU,
	SA,
	SE,
	SG,
	TH,
	TR,
	TW,
	UA,
	US,
	UZ,
	ZA,
} from 'country-flag-icons/react/3x2'
import { cn } from '@/lib/utils'

/** Flags used by language switcher + relay region hints. Bundled locally (CSP-safe). */
const FLAGS = {
	AE,
	AU,
	BD,
	BH,
	BR,
	CA,
	CN,
	CZ,
	DE,
	ES,
	FR,
	GB,
	HU,
	ID,
	IE,
	IN,
	IR,
	IT,
	JP,
	KH,
	KR,
	NO,
	PL,
	RS,
	RU,
	SA,
	SE,
	SG,
	TH,
	TR,
	TW,
	UA,
	US,
	UZ,
	ZA,
} as const

type FlagCode = keyof typeof FLAGS

type CountryFlagProps = {
	countryCode: string
	title?: string
	className?: string
	style?: CSSProperties
	'aria-label'?: string
}

export function CountryFlag({
	countryCode,
	title,
	className,
	style,
	'aria-label': ariaLabel,
}: CountryFlagProps) {
	const code = countryCode.toUpperCase()
	if (!(code in FLAGS)) return null

	const Flag = FLAGS[code as FlagCode]
	const label = ariaLabel ?? title ?? code

	return (
		<Flag
			title={title ?? code}
			aria-label={label}
			className={cn(className)}
			style={style}
		/>
	)
}
