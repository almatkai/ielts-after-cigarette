import {
  CalendarSearch,
  Category,
  Chart,
  Setting2,
  Warning2,
  Weight,
} from 'iconsax-react'

export const primaryDashboardNavigation = [
  {
    label: 'Обзор',
    to: '/',
    icon: Category,
    exact: true,
  },
  {
    label: 'План подготовки',
    to: '/plan',
    icon: CalendarSearch,
    exact: false,
  },
  {
    label: 'Практика',
    to: '/practice',
    icon: Weight,
    exact: false,
  },
  {
    label: 'Ошибки',
    to: '/mistakes',
    icon: Warning2,
    exact: false,
  },
  {
    label: 'Прогресс',
    to: '/progress',
    icon: Chart,
    exact: false,
  },
] as const

export const settingsDashboardNavigation = {
  label: 'Настройки',
  to: '/settings',
  icon: Setting2,
  exact: false,
} as const

const secondaryDashboardPages = [
  { label: 'Listening', to: '/listening' },
  { label: 'Reading', to: '/reading' },
  { label: 'Writing', to: '/writing' },
  { label: 'Speaking', to: '/speaking' },
  { label: 'Full Mock', to: '/full-mocks' },
  { label: 'Профиль', to: '/profile' },
] as const

// Writer pages carry their own heading, so the shell header shows no title.
export function getDashboardPageTitle(pathname: string): string | null {
  if (pathname.startsWith('/writer/posts')) return null

  const navigationItem = [
    ...primaryDashboardNavigation,
    settingsDashboardNavigation,
    ...secondaryDashboardPages,
  ].find((item) => item.to === pathname)

  if (navigationItem) return navigationItem.label
  return 'Панель управления'
}
