/**
 * Utility per la generazione di dati anagrafici fittizi (mock).
 *
 * - generaNome(genere?: 'm' | 'f'):
 *   restituisce un nome casuale. Se il genere è specificato, il nome viene scelto
 *   dalla lista maschile o femminile; se omesso, il nome è scelto da entrambe.
 *
 * - generaCognome():
 *   restituisce un cognome italiano casuale da una lista predefinita.
 *
 * - generaFullName(genere?: 'm' | 'f'):
 *   restituisce un nome completo nel formato "Nome Cognome", combinando
 *   generaNome e generaCognome; il genere è opzionale e influenza solo il nome.
 * 
 * - generaEmail(nome?: string, cognome?: string, dominio?: string):
 *   genera un indirizzo email realistico. Se nome e cognome sono forniti,
 *   l’email viene costruita nel formato "nome.cognome@dominio".
 *   In assenza di nome e/o cognome, vengono generati automaticamente.
 *   Il dominio è opzionale e di default viene usato "example.com".
 * 
 */

import type { Gender } from "../input/Gender/FieldGender.vue";
import type { PhoneNumber } from "../input/PhoneNumber/PhoneNumber";

export const _nomiM = [
  // Maschili
  'Alessandro',
  'Andrea',
  'Antonio',
  'Bruno',
  'Carlo',
  'Christian',
  'Claudio',
  'Davide',
  'Diego',
  'Emanuele',
  'Enrico',
  'Fabio',
  'Federico',
  'Filippo',
  'Francesco',
  'Gabriele',
  'Giovanni',
  'Giorgio',
  'Giuseppe',
  'Ivan',
  'Leonardo',
  'Lorenzo',
  'Luca',
  'Manuel',
  'Marco',
  'Matteo',
  'Michele',
  'Nicola',
  'Paolo',
  'Pietro',
  'Riccardo',
  'Roberto',
  'Salvatore',
  'Simone',
  'Stefano',
  'Tommaso',
  'Umberto',
  'Vincenzo',
];
export const _nomiF = [
  // Femminili
  'Alessia',
  'Alice',
  'Anna',
  'Arianna',
  'Beatrice',
  'Camilla',
  'Chiara',
  'Claudia',
  'Cristina',
  'Elena',
  'Elisa',
  'Emma',
  'Federica',
  'Francesca',
  'Gaia',
  'Giada',
  'Giulia',
  'Ilaria',
  'Laura',
  'Lucia',
  'Martina',
  'Melissa',
  'Miriam',
  'Monica',
  'Noemi',
  'Paola',
  'Rachele',
  'Roberta',
  'Sara',
  'Serena',
  'Silvia',
  'Sofia',
  'Valentina',
  'Vanessa',
  'Veronica',
  'Vittoria',
];


export function generaNome(genere?: 'm' | 'f'): string {
  switch (genere) {
    case 'm': {
      const index = Math.floor(Math.random() * _nomiM.length);
      return _nomiM[index]!;
    }
    case 'f': {
      const index = Math.floor(Math.random() * _nomiF.length);
      return _nomiF[index]!;
    }

    default: {
      const arr = _nomiM.concat(_nomiF);
      const index = Math.floor(Math.random() * arr.length);
      return arr[index]!;
    }
  }
}

// COGNOMI
export const _cognomi = [
  'Rossi',
  'Russo',
  'Ferrari',
  'Esposito',
  'Bianchi',
  'Romano',
  'Colombo',
  'Ricci',
  'Marino',
  'Greco',
  'Bruno',
  'Gallo',
  'Costa',
  'Giordano',
  'Mancini',
  'Rizzo',
  'Lombardi',
  'Moretti',
  'Barbieri',
  'Fontana',
  'Santoro',
  'Mariani',
  'Rinaldi',
  'Caruso',
  'Ferrara',
  'Bianco',
  'De Luca',
  'De Santis',
  'D’Angelo',
  'Serra',
  'Sanna',
  'Martini',
  'Longo',
  'Leone',
  'Gentile',
  'Villa',
  'Coppola',
  'Conti',
  'Fabbri',
  'Cattaneo',
  'Palmieri',
  'Bernardi',
  'Messina',
  'Pellegrini',
  'Monti',
  'Grasso',
  'Testa',
  'Valentini',
  'Parisi',
  'Vitale',
  'Orlando',
  'Benedetti',
  'Farina',
  'Amato',
  'Piras',
  'Moro',
  'Basile',
  'De Angelis',
  'Rossetti',
  'Bellini',
  'Sartori',
  'Fiore',
  'D’Amico',
  'Pagano',
  'Puglisi',
  'Mazza',
  'Neri',
  'Sala',
  'D’Onofrio',
  'Guerra',
  'Ferretti',
  'Sorrentino',
  'Barone',
  'Landi',
  'Corsi',
  'Ruggiero',
  'Caputo',
  'Marchetti',
  'Ferraro',
  'Raimondi',
  'D’Auria',
  'Zanetti',
  'Silvestri',
  'Gatti',
  'Baldini',
  'Ceccarelli',
  'Donati',
  'Vitali',
  'Ferri',
  'Riva',
  'Siciliano',
  'Meli',
  'Pace',
  'Licata',
  'Cicala',
];
export function generaCognome(): string {
  return _cognomi[Math.floor(Math.random() * _cognomi.length)]!;
}

// --------------------------------------------------------------
// --------------------------------------------------------------
// FullName
export function generaFullName(genere?: 'm' | 'f'): string {
  return `${generaNome(genere)} ${generaCognome()}`;
}

// --------------------------------------------------------------
// --------------------------------------------------------------
// Email
export const _dominio = [
  'example.com',
  'test.com',
  'mail.com',
  'email.com',
  'demo.it',
  'prova.it',
  'azienda.it',
  'company.com',
  'mockmail.com',
  'sample.org',
  'fakemail.net',
];
export function generaEmail(
  nome?: string,
  cognome?: string,
): string {
  const n = (nome ?? generaNome()).toLowerCase();
  const c = (cognome ?? generaCognome()).toLowerCase();
  const dominio = _dominio[Math.floor(Math.random() * _dominio.length)];

  return `${n}.${c}@${dominio}`;
}

// --------------------------------------------------------------
// --------------------------------------------------------------
// Indirizzo

const _vie = [
  'Via Roma',
  'Via Garibaldi',
  'Via Dante',
  'Via Milano',
  'Via Torino',
  'Via Firenze',
  'Via Napoli',
  'Corso Italia',
  'Viale Europa',
  'Piazza Duomo',
  'Piazza Libertà',
];

const _citta = [
  'Roma',
  'Milano',
  'Torino',
  'Napoli',
  'Palermo',
  'Catania',
  'Bologna',
  'Firenze',
  'Genova',
  'Bari',
];

export function generaIndirizzo(): string {
  const via = _vie[Math.floor(Math.random() * _vie.length)];
  const numero = Math.floor(Math.random() * 200) + 1;
  const citta = _citta[Math.floor(Math.random() * _citta.length)];
  const cap = Math.floor(10000 + Math.random() * 90000);

  return `${via}, ${numero} - ${cap} ${citta}`;
}

// --------------------------------------------------------------
// --------------------------------------------------------------
// Numero di telefono

export function generaNumeroTelefono(
  formato: 'mobile' | 'fisso' = 'mobile',
): string {
  if (formato === 'fisso') {
    // prefissi fissi italiani comuni
    const prefissi = ['02', '06', '081', '091', '095', '051', '055'];
    const prefisso = prefissi[Math.floor(Math.random() * prefissi.length)];
    const numero = Math.floor(1000000 + Math.random() * 9000000);
    return `${prefisso}${numero}`;
  }

  // mobile italiano
  const prefissiMobile = ['320', '327', '328', '329', '330', '333', '340', '347', '348'];
  const prefisso = prefissiMobile[Math.floor(Math.random() * prefissiMobile.length)];
  const numero = Math.floor(1000000 + Math.random() * 9000000);

  return `${prefisso}${numero}`;
}
export function generaPhoneNumber(): PhoneNumber {
  return ['+39', generaNumeroTelefono()];
}


// --------------------------------------------------------------
// --------------------------------------------------------------
// Gender
export function generaGender(): Gender {
  const genders: Gender[] = ['m', 'f', 'o'];
  return genders[Math.floor(Math.random() * genders.length)]!;
}