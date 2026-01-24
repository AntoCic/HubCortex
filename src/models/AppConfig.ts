// src/models/AppConfig.ts
import { FirestoreModel, type Timestampble } from '../components/firestore/FirestoreModel'
import { LocalStorageKey } from '@shared/enums/LocalStorageKey'
import pkg from '../../package.json'
import { toast } from '../components/toast/toastController'
import { currentUserStore } from '../stores/currentUserStore'
import { UserPermission } from '@shared/enums/UserPermission'

export interface AppConfigData extends Partial<Timestampble> {
  id: string
  lastVersion: string
}

export class AppConfig extends FirestoreModel<AppConfigData> {
  static collectionName = 'appConfig'
  protected localStorageKey() { return LocalStorageKey.appConfig }

  lastVersion: string

  constructor(data: AppConfigData) {
    super(data)

    this.lastVersion = data.lastVersion
  }

  toData(): AppConfigData {
    return {
      id: this.id,
      lastVersion: this.lastVersion,
      ...this.timestampbleProps()
    }
  }

  async checkVersionAndUpdate(): Promise<any> {
    switch (this.versionVsLocalPackageJson()) {
      case 'next':
        if (currentUserStore.isLoggedIn && currentUserStore.user?.hasPermission(UserPermission.SUPERADMIN)) {
          toast.logError({
            title: '🔴⚠️🔴⚠️🔴',
            message: `Aggiorna la AppConfig.lastVersion per update app all user`,
            actions: [
              {
                icon: 'sync_arrow_up',
                onClick: () => this.setLastVersion(),
                color: "light",
                style: "background-color:rgba(223, 113, 255) !important; border-color:rgba(223, 113, 255) !important;",
              },
            ],
          }, null);
        }
        break;
      case 'previous':
        this.updateApp();
        break;

      default:
        // le versioni sono uguali
        break;
    }

    return
  }

  compareVersions(version: string = (pkg.version)): number {
    if (!pkg?.name || !pkg.version) {
      toast.logError({ title: 'Error package.json', message: 'Need fill package.json name and version' });
      throw new Error("arg version not found");
    }

    if (!this.isValidVersion(version)) {
      toast.logError({ title: 'Invalid version', message: `Version "${version}" is not valid` });
      throw new Error(`Invalid version string: "${version}"`);
    }

    const a = version;
    const b = this.lastVersion;
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);

    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] ?? 0;
      const nb = pb[i] ?? 0;

      if (na > nb) return 1;   // a > b
      if (na < nb) return -1;  // a < b
    }

    return 0; // uguali
  }


  isValidVersion(v: string): boolean {
    return typeof v === 'string' && /^[0-9]+(\.[0-9]+)*$/.test(v);   // es. 1 | 1.2 | 1.2.3 | 12.45.6
  }

  versionVsLocalPackageJson(): 'equal' | 'next' | 'previous' {
    const cmp = this.compareVersions();
    if (cmp < 0) { return 'previous' } else if (cmp > 0) { return 'next' } else { return 'equal' }
  }

  updateApp() {
    if (this.lastVersion === '0.0.0') {
      toast.log('Version appConfig db online "0.0.0"');
    }

    if (!('serviceWorker' in navigator)) {
      toast.warning('ℹ️ Aggiornamento disponibile, ma il browser non supporta i Service Worker');
      return;
    }

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (!reg) {
          toast.warning('ℹ️ Nessun Service Worker registrato');
          return;
        }
        toast.success('✨ Nuova versione disponibile, ricarico la pagina…');
        return reg
          .update()
          .then(() => new Promise((r) => setTimeout(r, 2000)));
      })
      .then(() => {
        window.location.reload();
      })
      .catch(() => {
        toast.error('Errore durante l’aggiornamento dell’app');
      });
  }

  setLastVersion(version?: string) {
    const v = version ?? pkg.version
    if (this.compareVersions(v) < 0) {
      toast.logError('Non è possibile fare un set di una versione precedente potrebbe causare un rerender in loop')
    } else {
      this.update({ lastVersion: v });
    }
  }

}
