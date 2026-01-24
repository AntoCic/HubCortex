import { FirestoreModel } from '../components/firestore/FirestoreModel'
import { deleteField, setDoc } from 'firebase/firestore';
import { toast } from '../components/toast/toastController';
import type { PhoneNumber } from '../components/input/PhoneNumber/PhoneNumber';
import type { Gender } from '../components/input/Gender/FieldGender.vue';
import { LocalStorageKey } from '@shared/enums/LocalStorageKey';
import { UserPermission } from '@shared/enums/UserPermission';

export interface UserData {
  id: string;
  userPublicId: string
  name: string
  surname: string
  email: string
  birthDate?: string
  phoneNumber?: PhoneNumber
  photoURL?: string
  description?: string
  permissions: string[]
  gender?: Gender
  birthHideYear?: boolean
  fcmTokens?: string[]
}

export class User extends FirestoreModel<UserData> {
  static collectionName = 'users'
  protected localStorageKey() { return LocalStorageKey.currentUser }

  userPublicId: string
  name: string
  surname: string
  email: string
  birthDate?: string
  phoneNumber?: PhoneNumber
  photoURL?: string
  description?: string
  permissions: string[]
  gender?: Gender
  birthHideYear?: boolean
  fcmTokens?: string[]

  constructor(data: UserData) {
    super(data)
    this.userPublicId = data.userPublicId
    this.name = data.name
    this.surname = data.surname
    this.email = data.email
    this.birthDate = data.birthDate
    this.phoneNumber = data.phoneNumber
    this.photoURL = data.photoURL
    this.description = data.description
    this.permissions = data.permissions
    this.gender = data.gender
    this.birthHideYear = data.birthHideYear
    this.fcmTokens = data.fcmTokens
  }

  toData(): UserData {
    return {
      id: this.id,
      userPublicId: this.userPublicId,
      name: this.name,
      surname: this.surname,
      email: this.email,
      birthDate: this.birthDate,
      phoneNumber: this.phoneNumber,
      photoURL: this.photoURL,
      description: this.description,
      permissions: this.permissions,
      gender: this.gender,
      birthHideYear: this.birthHideYear,
      fcmTokens: this.fcmTokens,
    }
  }

  async create(): Promise<void> {
    try {
      const data = this.toData();
      const cleaned = Object.fromEntries(
        Object.entries(data).map(([key, value]) => {
          if (value === undefined || value === null) {
            return [key, deleteField()];
          }
          return [key, value];
        })
      );
      if (cleaned.permissions !== undefined) {
        delete cleaned.permissions
      }

      await setDoc(this.ref, cleaned, { merge: true });
    } catch (error) {
      toast.error(String(error))
      throw error;
    }
  }

  get fullName(): string {
    let fullName = (`${this.name} ${this.surname}`).trim();
    if (fullName === '') fullName = '-';
    return fullName
  }

  get fullNameInitials(): string {
    const name = this.fullName
    const parts = name.split(' ').filter(Boolean)
    const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
    return (initials || name?.[0] || '?').toUpperCase()
  }

  async updateName(name: string, surname: string) {
    await this.update({ name, surname })
  }

  async updateBirthDate(birthDate: string) {
    await this.update({ birthDate })
  }

  hasPermission(p: UserPermission): boolean {
    return Array.isArray(this.permissions) && this.permissions.includes(p)
  }
  hasAnyPermissions(): boolean {
    return Array.isArray(this.permissions) && this.permissions.length > 0
  }
  hasAnyPermissionsExclud(excluded: UserPermission[]): boolean {
    if (!Array.isArray(this.permissions) || this.permissions.length === 0) return false
    return this.permissions.some(p => !excluded.includes(p as UserPermission))
  }


  get offlineAllow(): boolean | undefined {
    return this.hasPermission(UserPermission.OFFLINE_ALLOW)
  }

  async addPermissions(permissions: UserPermission[] | UserPermission): Promise<boolean> {
    const list = Array.isArray(permissions) ? permissions : [permissions];
    const newOnes = list.filter(p => !this.permissions.includes(p))
    if (newOnes.length === 0) return false
    this.permissions.push(...newOnes);
    return this.update({ permissions: this.permissions }).then(() => true);
  }

  async deletePermissions(permissions: UserPermission[] | UserPermission): Promise<boolean> {
    const list = Array.isArray(permissions) ? permissions : [permissions];
    const beforeLength = this.permissions.length;
    const thisPermissions = this.permissions as UserPermission[]

    this.permissions = thisPermissions.filter(p => !list.includes(p));

    if (this.permissions.length === beforeLength) return false;

    return this.update({ permissions: this.permissions }).then(() => true);
  }



  /** Verifica se il token è già presente (su stato locale) */
  hasFcmToken(token: string): boolean {
    if (!token) return false;
    return (this.fcmTokens ?? []).includes(token);
  }


  /** Aggiunge un token FCM se non già presente */
  async addFcmToken(token: string): Promise<boolean> {
    if (!Array.isArray(this.fcmTokens)) this.fcmTokens = []
    if (this.hasFcmToken(token)) return false
    this.fcmTokens.push(token)
    return this.update({ fcmTokens: this.fcmTokens }).then(() => true)
  }

  /** Rimuove un token FCM se presente */
  async removeFcmToken(token: string): Promise<boolean> {
    if (!Array.isArray(this.fcmTokens) || this.fcmTokens.length === 0) return false

    const before = this.fcmTokens.length
    this.fcmTokens = this.fcmTokens.filter(t => t !== token)
    if (this.fcmTokens.length === before) return false

    return this.update({ fcmTokens: this.fcmTokens }).then(() => true)
  }

}
