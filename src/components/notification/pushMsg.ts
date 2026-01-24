import { reactive } from 'vue';
import { toast } from '../toast/toastController';
import { httpsCallable } from 'firebase/functions';
import { functions, registerFcmToken } from '../../firebase';

export type PushMsgContent = NotificationOptions & {
    title: string
}

function normalizeContent(content: PushMsgContent | string): { title: string, options: NotificationOptions } {
    const contentToSend = typeof content === 'string' ? { title: content } : content;
    const { title, ...options } = contentToSend;
    if (!options.icon) options.icon = '/img/logo/pwa.png';
    if (!options.tag) options.tag = `default-${new Date().toISOString().slice(0, 10)}`;
    if (!options.data) options.data = { url: '/' };
    if (!options?.data?.url) options.data.url = '/';
    return { title, options };
}

export interface PushMsg {
    reg: ServiceWorkerRegistration | undefined;
    isNotificationSupported: boolean;
    permission: NotificationPermission;
    needToAskPermission: boolean;

    askPermission(): Promise<NotificationPermission>;
    send(content: string | PushMsgContent): Promise<void>;
    sendTo(uid: string, content: string | PushMsgContent): Promise<boolean>

}
//#####################################################
// pushMsg
export const pushMsg: PushMsg = reactive<PushMsg>({
    reg: undefined,
    isNotificationSupported: typeof Notification !== 'undefined',
    get permission(): NotificationPermission {
        return (this.isNotificationSupported ? Notification.permission : 'denied')
    },
    get needToAskPermission(): boolean {
        return (this.isNotificationSupported ? Notification.permission === "default" : false)
    },

    /** Chiede il permesso all’utente (solo nel main thread) */
    async askPermission(): Promise<NotificationPermission> {
        if (!pushMsg.isNotificationSupported) {
            toast.error('Le notifiche non sono supportate su questo dispositivo')
            return 'denied'
        }
        if (pushMsg.permission === 'denied') toast.warning('Notifiche disabilitate. Per abilitarle cercare nelle impostazioni del browser.')


        const perm = await Notification.requestPermission();
        
        if (perm !== 'granted') { toast.warning('Hai disabilitato le notifiche. Per abilitarle cercare nelle impostazioni del browser.') }
        else { registerFcmToken() }
        return perm
    },



    async send(content: PushMsgContent | string): Promise<void> {
        if (!this.isNotificationSupported) {
            toast.error('Le notifiche non sono supportate su questo dispositivo');
            return
        }

        if (this.permission !== 'granted') {
            const perm = await this.askPermission();
            if (perm !== 'granted') return
        }

        const { title, options } = normalizeContent(content)
        if (this.reg) {
            await this.reg.showNotification(title, options)
        } else {
            new Notification(title, options)
        }
    },

    async sendTo(uid: string, content: PushMsgContent | string): Promise<boolean> {
        let send = false
        try {
            const callable = httpsCallable(functions, 'sendUserPush');
            const { title, options } = normalizeContent(content);
            console.log({ title, options });

            await callable({
                toUid: uid,
                title,
                options
            })
            send = true
        } catch (err) {
            console.error(err)
            toast.error('Errore invio notifica')
        }
        return send
    }
});