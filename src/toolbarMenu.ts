import type { OffcanvasTab } from 'cic-kit';
import { UserPermission } from '@shared/enums/UserPermission';
import { hasAppPermission } from './permissions';

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
    permission: UserPermission.PROJECT_READ,
  },
  {
    name: 'Notes',
    icon: 'sticky_note_2',
    to: { name: 'notes' },
    onlyAuth: true,
  },
  {
    name: 'Cmd',
    icon: 'terminal',
    to: { name: 'cmd' },
    onlyAuth: true,
  },
  {
    name: 'Tag',
    icon: 'sell',
    to: { name: 'tags' },
    onlyAuth: true,
  },
  {
    name: 'Chat AI',
    icon: 'chat',
    to: { name: 'ai-chat' },
    onlyAuth: true,
    permission: UserPermission.AI,
  },
  {
    name: 'Image AI',
    icon: 'image',
    to: { name: 'ai-image-chat' },
    onlyAuth: true,
    permission: UserPermission.AI,
  },
  {
    name: 'Prompt AI',
    icon: 'psychology',
    to: { name: 'agent-prompts' },
    onlyAuth: true,
    permission: UserPermission.AI,
  },
  {
    name: 'App Config',
    icon: 'settings',
    to: { name: 'app-config' },
    onlyAuth: true,
    permission: UserPermission.SUPERADMIN,
  },
  {
    name: 'Public Users',
    icon: 'groups',
    to: { name: 'public-users' },
    onlyAuth: true,
    permission: UserPermission.ADMIN,
  },
];

export function getToolbarOffcanvasTabs(isLoggedIn: boolean, permissions: string[]): OffcanvasTab[] {
  return toolbarOffcanvasTabConfigs.filter((tab) => {
    if (tab.onlyAuth && !isLoggedIn) return false;
    if (tab.permission && !hasAppPermission(permissions, tab.permission)) return false;
    return true;
  });
}
