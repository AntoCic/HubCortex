// src/stores/appConfigStore.ts
import { reactive, type Reactive } from 'vue'
import { FirestoreStore } from '../components/firestore/FirestoreStore'
import { AppConfig, type AppConfigData } from '../models/AppConfig'
import pkg from '../../package.json'
import { toast } from '../components/toast/toastController'
class AppConfigStore extends FirestoreStore<AppConfig, AppConfigData> {
  constructor() {
    super(AppConfig)
  }

  async getAppConfig() {
    if (!pkg?.name) {
      toast.logError({ title: 'Error package.json', message: 'Need fill package.json name' });
      throw new Error("Need fill package.json name");
    }
    const item = await this.get()
    return item?.[pkg.name]
  }
}
export const appConfigStore: Reactive<AppConfigStore> = reactive(new AppConfigStore());
