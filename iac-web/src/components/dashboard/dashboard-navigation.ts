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
    to: '/dashboard',
    icon: Category,
    exact: true,
  },
  {
    label: 'План подготовки',
    to: '/dashboard/plan',
    icon: CalendarSearch,
    exact: false,
  },
  {
    label: 'Практика',
    to: '/dashboard/practice',
    icon: Weight,
    exact: false,
  },
  {
    label: 'Ошибки',
    to: '/dashboard/mistakes',
    icon: Warning2,
    exact: false,
  },
  {
    label: 'Прогресс',
    to: '/dashboard/progress',
    icon: Chart,
    exact: false,
  },
] as const

export const settingsDashboardNavigation = {
  label: 'Настройки',
  to: '/dashboard/settings',
  icon: Setting2,
  exact: false,
} as const

const secondaryDashboardPages = [
  { label: 'Listening', to: '/dashboard/listening' },
  { label: 'Reading', to: '/dashboard/reading' },
  { label: 'Writing', to: '/dashboard/writing' },
  { label: 'Speaking', to: '/dashboard/speaking' },
  { label: 'Full Mock', to: '/dashboard/full-mocks' },
  { label: 'Профиль', to: '/dashboard/profile' },
] as const

export function getDashboardPageTitle(pathname: string) {
  const navigationItem = [
    ...primaryDashboardNavigation,
    settingsDashboardNavigation,
    ...secondaryDashboardPages,
  ].find((item) => item.to === pathname)

  return navigationItem?.label ?? 'Панель управления'
}
