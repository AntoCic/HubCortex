import type { OffcanvasTab } from 'cic-kit';

type OffcanvasTabConfig = OffcanvasTab & {
  onlyAuth?: boolean;
  permission?: string;
};

const toolbarOffcanvasTabConfigs: OffcanvasTabConfig[] = [
  {
    name: 'Home',
    icon: 'home',
    to: { name: 'home' },
  },
  {
    name: 'Dashboard',
    icon: 'dashboard',
    to: { name: 'home-auth' },
    onlyAuth: true,
  },
  {
    name: 'Progetti',
    icon: 'workspaces',
    to: { name: 'projects' },
    onlyAuth: true,
  },
  {
    name: 'Prompt AI',
    icon: 'psychology',
    to: { name: 'agent-prompts' },
    onlyAuth: true,
    permission: 'AI',
  },
  {
    name: 'App Config',
    icon: 'settings',
    to: { name: 'app-config' },
    onlyAuth: true,
    permission: 'SUPERADMIN',
  },
  {
    name: 'Public Users',
    icon: 'groups',
    to: { name: 'public-users' },
    onlyAuth: true,
    permission: 'ADMIN',
  },
  {
    name: 'Profilo',
    icon: 'account_circle',
    to: { name: 'user' },
    onlyAuth: true,
  },
];

export function getToolbarOffcanvasTabs(isLoggedIn: boolean, permissions: string[]): OffcanvasTab[] {
  const permissionSet = new Set((permissions ?? []).map((item) => String(item ?? '').trim()));

  return toolbarOffcanvasTabConfigs.filter((tab) => {
    if (tab.onlyAuth && !isLoggedIn) return false;
    if (tab.permission && !permissionSet.has(tab.permission)) return false;
    return true;
  });
}
