<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ContainerSubSettings from '../../../components/Container/ContainerSubSettings.vue';
import { useChangeHeader } from '../../../components/header/useChangeHeader';
import { FirebaseFolder } from '../../../components/File/FirebaseStrorage';
import type { UserPublic } from '../../../models/UserPublic';
import { FormValidator } from '../../../components/form-validator/FormValidator';
import { dateISO, email, maxLength, oneOf, required, url } from '../../../components/form-validator/Validator';
import { currentUserStore } from '../../../stores/currentUserStore';
import { toast } from '../../../components/toast/toastController';
import { userPublicStore } from '../../../stores/userPublicStore';
import { storage } from '../../../firebase';
import ImgUploader from '../../../components/File/ImgUploader.vue';
import type { PhoneNumber } from '../../../components/input/PhoneNumber/PhoneNumber';
import FieldPhoneNumber from '../../../components/input/PhoneNumber/FieldPhoneNumber.vue';
import FieldGender, { type Gender } from '../../../components/input/Gender/FieldGender.vue';

useChangeHeader('Utente', { name: "home" });

const folder = ref<FirebaseFolder | null>(null)
const currentUserPublic = ref<UserPublic | undefined>(undefined)


interface FormModel {
  name: string
  surname: string
  email: string
  birthDate: string
  phoneNumber: PhoneNumber
  photoURL: string
  description: string
  gender: Gender
  birthHideYear: boolean
}

const fv = new FormValidator<FormModel>({
  initialValues: {
    name: '',
    surname: '',
    email: '',
    birthDate: '',
    phoneNumber: ['', ''],
    photoURL: '',
    description: '',
    gender: '',
    birthHideYear: false,
  },
  syncWith: () => currentUserStore.user,
  validator: {
    name: [required(), maxLength(20)],
    surname: [required(), maxLength(20)],
    email: [required(), email()],
    birthDate: [required(), dateISO()],
    phoneNumber: [required()],
    photoURL: [required(), url()],
    description: [maxLength(250)],
    gender: [required(), oneOf<Gender>(['m', 'f', 'o'])],
  },
  // validateOnChange: { name: true, surname: false }, // opzionale
  onSubmit: async (_, touchedValues) => {
    if (!currentUserStore.isLoggedIn || !currentUserStore.user) {
      toast.error('Devi effettuare il login per salvare.')
      return
    }

    await currentUserStore.user.update(touchedValues)
    toast.success('Profilo aggiornato con successo!')
  },
  onInvalid: () => {
    toast.error('Controlla i campi evidenziati.')
  }
})

const { name, surname, email: _email, birthDate, phoneNumber, photoURL, gender, birthHideYear, description } = fv.fields()

const onFileChange = async (file: File) => {
  if (folder.value) {
    const photoFile = await folder.value.add('avatar.jpg', file, { contentType: file.type })
    currentUserPublic.value?.update({ photoURL: photoFile.url ?? undefined })
  }
}

onMounted(async () => {
  if (currentUserStore.isLoggedIn) {
    await userPublicStore.get();
    folder.value = new FirebaseFolder(storage, `auth/common/user/${currentUserStore.uid}/avatar`);
    currentUserPublic.value = await userPublicStore.findItemsById(currentUserStore.uid);
  }
})

</script>

<template>
  <ContainerSubSettings title="dati personali">
    <h1 class="h4 mb-4 text-center">User info</h1>

    <div class="mb-3" v-if="currentUserPublic">
      <ImgUploader :img-url="userPublicStore.findItemsById(currentUserStore.uid)?.photoURL"
        :initials="currentUserStore.user?.fullNameInitials" size="lg" :on-file-change="onFileChange" shape="octagon" />
    </div>

    <form @submit.prevent="fv.submit" novalidate>
      <div class="row g-3">
        <!-- Nome -->
        <div class="col-md-6">
          <label class="form-label" :for="fv.getFieldId('name')">Nome</label>
          <input type="text" v-model="name" v-bind="fv.getFieldProps('name')" class="form-control"
            placeholder="Mario" />
          <div :id="fv.getFieldIdError('name')" class="invalid-feedback">{{ fv.showError('name') }}</div>
        </div>

        <!-- Cognome -->
        <div class="col-md-6">
          <label class="form-label" :for="fv.getFieldId('surname')">Cognome</label>
          <input type="text" v-model="surname" v-bind="fv.getFieldProps('surname')" class="form-control"
            placeholder="Rossi" />
          <div :id="fv.getFieldIdError('surname')" class="invalid-feedback">{{ fv.showError('surname') }}</div>
        </div>

        <!-- Email -->
        <div class="col-md-6">
          <label class="form-label" :for="fv.getFieldId('email')">Email</label>
          <input type="text" v-model="_email" v-bind="fv.getFieldProps('email')" class="form-control"
            placeholder="mario.rossi@email.com" />
          <div :id="fv.getFieldIdError('email')" class="invalid-feedback">{{ fv.showError('email') }}</div>
        </div>

        <!-- Telefono -->
        <div class="col-md-6">
          <FieldPhoneNumber label="Telefono" v-model="phoneNumber" field="phoneNumber" :fv="fv" disabled />
        </div>

        <!-- Data di nascita -->
        <div class="col-md-6">
          <label class="form-label" :for="fv.getFieldId('birthDate')">Data di nascita</label>
          <input type="text" v-model="birthDate" v-bind="fv.getFieldProps('birthDate')" class="form-control" />
          <div :id="fv.getFieldIdError('birthDate')" class="invalid-feedback">{{ fv.showError('birthDate') }}
          </div>
        </div>

        <!-- Sesso -->
        <div class="col-md-6">
          <FieldGender label="Sesso" v-model="gender" field="gender" :fv="fv" />
        </div>

        <!-- URL foto profilo -->
        <div class="col-12">
          <label class="form-label" :for="fv.getFieldId('photoURL')">URL foto profilo</label>
          <input type="text" v-model="photoURL" v-bind="fv.getFieldProps('photoURL')" class="form-control"
            placeholder="https://..." />
          <div :id="fv.getFieldIdError('photoURL')" class="invalid-feedback">{{ fv.showError('photoURL') }}
          </div>
        </div>

        <!-- Descrizione -->
        <div class="col-12">
          <label class="form-label" :for="fv.getFieldId('description')">Descrizione</label>
          <textarea class="form-control" v-bind="fv.getFieldProps('description')" v-model="description" rows="3"
            placeholder="Una breve bio…"></textarea>
          <div :id="fv.getFieldIdError('description')" class="invalid-feedback">{{ fv.showError('description')
          }}</div>
        </div>

        <!-- Nascondi anno (boolean) -->
        <div class="col-12">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" v-model="birthHideYear"
              v-bind="fv.getFieldProps('birthHideYear')" />
            <label class="form-check-label" :for="fv.getFieldId('birthHideYear')">Nascondi l'anno di nascita nel
              profilo</label>
          </div>
          <div :id="fv.getFieldIdError('birthHideYear')" class="invalid-feedback">{{
            fv.showError('birthHideYear') }}</div>
        </div>
      </div>

      <div class="d-flex justify-content-end mt-4">
        <button class="btn btn-primary" type="submit" :disabled="!currentUserStore.isLoggedIn">
          Salva dati
        </button>
      </div>
    </form>
  </ContainerSubSettings>
</template>