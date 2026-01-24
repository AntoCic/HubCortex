import { appConfigStore } from '../../stores/appConfigStore';
import { toast } from '../toast/toastController';

export default async function checkVersionPkg() {
    const appConfig = await appConfigStore.getAppConfig();
    if (appConfig) {
        return appConfig.checkVersionAndUpdate();
    } else {
        toast.logError('appConfig mai settato');
    }

}

