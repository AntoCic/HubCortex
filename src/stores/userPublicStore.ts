import { reactive } from 'vue'
import { UserPublic, type UserPublicData } from '../models/UserPublic'
import { FirestoreStore } from '../components/firestore/FirestoreStore'

class UserPublicStore extends FirestoreStore<UserPublic, UserPublicData> {
  constructor() {
    super(UserPublic)
  }


  get itemsActiveArraySortByName(): UserPublic[] {
    return Object.values(this.items).filter(m => !m.isDeleted)
      .sort((a, b) => {
        const aKey = `${a.name} ${a.surname}`.toLowerCase()
        const bKey = `${b.name} ${b.surname}`.toLowerCase()
        return aKey.localeCompare(bKey, 'it')
      })
  }
}

export const userPublicStore = reactive(new UserPublicStore())