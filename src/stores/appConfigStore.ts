import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { APP_CONFIG_ID, AppConfig, mergeAppConfigWithDefaults, type AppConfigData } from '../models/AppConfig';

class AppConfigStore extends FirestoreStore<AppConfig, AppConfigData> {
  constructor() {
    super(AppConfig);
  }

  getConfig() {
    return this.items?.[APP_CONFIG_ID];
  }

  getConfigData() {
    if (typeof window !== 'undefined' && !this.getConfig()) {
      this.localGet();
    }
    return mergeAppConfigWithDefaults(this.getConfig()?.toData());
  }
}

export const appConfigStore = reactive(new AppConfigStore());
