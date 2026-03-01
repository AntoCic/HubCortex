import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { Cmd, type CmdData } from '../models/Cmd';

class CmdStore extends FirestoreStore<Cmd, CmdData> {
  constructor() {
    super(Cmd);
  }
}

export const cmdStore = reactive(new CmdStore());
