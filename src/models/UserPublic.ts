import { FirestoreModel, type Timestampble } from '../components/firestore/FirestoreModel'
import type { PhoneNumber } from '../components/input/PhoneNumber/PhoneNumber';

export interface UserPublicData extends Partial<Timestampble> {
  id: string;
  name: string
  surname: string
  email?: string
  birthDate?: string
  phoneNumber?: PhoneNumber
  photoURL?: string
  description?: string
  gender?: string
}

export class UserPublic extends FirestoreModel<UserPublicData> {
  static collectionName = 'users_public'

  name: string
  surname: string
  email?: string
  birthDate?: string
  phoneNumber?: PhoneNumber
  photoURL?: string
  description?: string
  gender?: string

  constructor(data: UserPublicData) {
    super(data)
    this.name = data.name
    this.surname = data.surname
    this.email = data.email
    this.birthDate = data.birthDate
    this.phoneNumber = data.phoneNumber
    this.photoURL = data.photoURL
    this.description = data.description
    this.gender = data.gender
  }


  toData(): UserPublicData {
    return {
      id: this.id,
      name: this.name,
      surname: this.surname,
      email: this.email,
      birthDate: this.birthDate,
      phoneNumber: this.phoneNumber,
      photoURL: this.photoURL,
      description: this.description,
      gender: this.gender,
      ...this.timestampbleProps()
    }
  }
  
  get fullName(): string {
    let fullName = (`${this.name} ${this.surname}`).trim();
    if (fullName === '') fullName = '-';
    return fullName
  }
}
