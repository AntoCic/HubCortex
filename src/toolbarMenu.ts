import type { OffcanvasTab } from 'cic-kit';

type OffcanvasTabConfig = OffcanvasTab & {
  onlyAuth?: boolean;
  permission?: string;
};

const toolbarOffcanvasTabConfigs: OffcanvasTabConfig[] = [
  {
    name: 'Progetti',
    icon: 'workspaces',
    to: { name: 'project-dashboard' },
    onlyAuth: true,
  },
  {
    name: 'Chat AI',
    icon: 'chat',
    to: { name: 'ai-chat' },
    onlyAuth: true,
    permission: 'AI',
  },
  {
    name: 'Image AI',
    icon: 'image',
    to: { name: 'ai-image-chat' },
    onlyAuth: true,
    permission: 'AI',
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
];

export function getToolbarOffcanvasTabs(isLoggedIn: boolean, permissions: string[]): OffcanvasTab[] {
  const permissionSet = new Set((permissions ?? []).map((item) => String(item ?? '').trim()));

  return toolbarOffcanvasTabConfigs.filter((tab) => {
    if (tab.onlyAuth && !isLoggedIn) return false;
    if (tab.permission && !permissionSet.has(tab.permission)) return false;
    return true;
  });
}
