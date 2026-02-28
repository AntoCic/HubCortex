import { reactive } from 'vue';
import { _PublicUser, FirestoreStore, type _PublicUserData } from 'cic-kit';

class PublicUserStore extends FirestoreStore<_PublicUser, _PublicUserData> {
  constructor() {
    super(_PublicUser);
  }
}

export const publicUserStore = reactive(new PublicUserStore());
