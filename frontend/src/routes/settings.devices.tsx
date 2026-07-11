import MobileSettingSidebar from '../components/setting-sidebar/mobile-setting-sidebar'
import { DevicesSettings } from '../components/settings/devices/devices-settings'
import { useTranslation } from '../i18n'

export function SettingDevicesPage() {
	const { t } = useTranslation()
	return (
		<>
			<MobileSettingSidebar>
				{t('settings.navItems.devices')}
			</MobileSettingSidebar>
			<DevicesSettings />
		</>
	)
}
