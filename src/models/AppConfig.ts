import { FirestoreModel, type Timestampble } from 'cic-kit';

export const APP_CONFIG_ID = 'main';

export type AppConfigFields = {
  appName: string;
  supportEmail: string;
  githubOrg: string;
};

export interface AppConfigData extends AppConfigFields, Partial<Timestampble> {
  id: string;
}

export const APP_CONFIG_DEFAULTS: AppConfigFields = {
  appName: 'HubCortex',
  supportEmail: 'support@hubcortex.local',
  githubOrg: 'your-org',
};

export function mergeAppConfigWithDefaults(data?: Partial<AppConfigData> | null): AppConfigData {
  return {
    id: APP_CONFIG_ID,
    ...APP_CONFIG_DEFAULTS,
    ...(data ?? {}),
  };
}

export class AppConfig extends FirestoreModel<AppConfigData> {
  static collectionName = 'appConfig';

  appName: string;
  supportEmail: string;
  githubOrg: string;

  constructor(data: AppConfigData) {
    const normalized = mergeAppConfigWithDefaults(data);
    super(normalized);
    this.appName = normalized.appName;
    this.supportEmail = normalized.supportEmail;
    this.githubOrg = normalized.githubOrg;
  }

  toData(): AppConfigData {
    return {
      id: this.id,
      appName: this.appName,
      supportEmail: this.supportEmail,
      githubOrg: this.githubOrg,
      ...this.timestampbleProps(),
    };
  }
}
