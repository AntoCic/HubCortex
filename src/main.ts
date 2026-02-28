import { createApp } from 'vue';
import {
  CicKit,
  _CurrentUser,
  cicKitStore,
  headerStore,
  initAuth,
  initCicKitStore,
  setupFirebase,
} from 'cic-kit';
import pkg from '../package.json';
import App from './App.vue';
import { firebaseConfig, VAPID_PUBLIC_KEY } from './firebase-config';
import { router } from './router';
import './main.scss';

setupFirebase(firebaseConfig, VAPID_PUBLIC_KEY);

export const Auth = initAuth(_CurrentUser);
Auth.checkAuth();

initCicKitStore({
  packageJson: pkg,
  defaultViews: {
    ...cicKitStore.defaultViews,
    colorDark: '#30475E',
    colorAccent: '#F05454',
    colorSoft: '#F3F6FA',
  },
  loginCode: false,
  debugFirestore: true,
});

cicKitStore.isDev = import.meta.env.DEV;
headerStore.defaultTitle = 'HubCortex';
headerStore.title = 'HubCortex';
headerStore.defaultLogoUrl = '/img/logo/logo.png';
headerStore.logoUrl = '/img/logo/logo.png';

const app = createApp(App);
app.use(CicKit);
app.use(router);
app.mount('#app');
