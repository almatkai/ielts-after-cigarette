import {
  BarChart3,
  CalendarRange,
  Dumbbell,
  Headphones,
  LayoutDashboard,
  Settings2,
  TriangleAlert,
} from 'lucide-react'

export const primaryDashboardNavigation = [
  {
    label: 'Обзор',
    to: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'План подготовки',
    to: '/dashboard/plan',
    icon: CalendarRange,
    exact: false,
  },
  {
    label: 'Практика',
    to: '/dashboard/practice',
    icon: Dumbbell,
    exact: false,
  },
  {
    label: 'Listening',
    to: '/dashboard/listening',
    icon: Headphones,
    exact: false,
  },
  {
    label: 'Ошибки',
    to: '/dashboard/mistakes',
    icon: TriangleAlert,
    exact: false,
  },
  {
    label: 'Прогресс',
    to: '/dashboard/progress',
    icon: BarChart3,
    exact: false,
  },
] as const

export const settingsDashboardNavigation = {
  label: 'Настройки',
  to: '/dashboard/settings',
  icon: Settings2,
  exact: false,
} as const

const profileDashboardPage = {
  label: 'Профиль',
  to: '/dashboard/profile',
} as const

export function getDashboardPageTitle(pathname: string) {
  const navigationItem = [
    ...primaryDashboardNavigation,
    settingsDashboardNavigation,
    profileDashboardPage,
  ].find((item) => item.to === pathname)

  return navigationItem?.label ?? 'Панель управления'
}
