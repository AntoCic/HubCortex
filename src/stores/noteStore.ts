import { reactive } from 'vue';
import { FirestoreStore } from 'cic-kit';
import { Note, type NoteData } from '../models/Note';

class NoteStore extends FirestoreStore<Note, NoteData> {
  constructor() {
    super(Note);
  }
}

export const noteStore = reactive(new NoteStore());
