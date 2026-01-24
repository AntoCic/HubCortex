export const _testoSorgente = `Comportatevi sempre in modo che il vostro capo si senta superiore a chi lo circonda. Per compiacerlo e far su di lui buona impressione non dovete eccedere nel mostrare capacità o talento, in questo modo rischiate di ottenere il contrario: ispirare timore e insicurezza.
Fate sì che i superiori appaiano più brillanti di quanto sono in realtà e raggiungerete le vette del potere.
Tutti hanno delle insicurezze: quando ci si espone e si mostrano agli altri le proprie capacità è facile suscitare risentimento, invidia e altre manifestazioni di insicurezza; è normale e non si può passare la vita a preoccuparsi delle meschinità altrui, ma con i propri superiori è diverso, in presenza del potere offuscare l’immagine del proprio capo è l’errore peggiore che si possa commettere.
L’uomo ha un profondo bisogno di credere in qualcosa. Diventate il punto focale di questo desiderio dando agli altri una causa, una nuova fede da seguire. Rimanete sul vago con le parole, ma siate prodighi di promesse, insistendo sul valore della razionalità e del pensiero conseguente. Date ai vostri nuovi discepoli dei rituali da seguire, chiedete che facciano sacrifici in vostro nome. In assenza di una religione organizzata o di grandi cause, questo sistema fideistico vi conferirà un potere inaspettato.
La ciarlataneria scientifica, ovvero come creare un culto in cinque facili mosse.
Se cercate un metodo per conquistare il massimo del potere con il minimo sforzo, vi accorgerete che uno dei più efficaci è quello di crearsi un seguito di natura carismatica.
Avere un grande seguito offrirà incommensurabili opportunità alla capacità di illudere la gente, i vostri seguaci non solo vi adoreranno ma vi proteggeranno dai vostri nemici e si assumeranno volentieri il compito di reclutare nuovi adepti.
Questo tipo di potere vi trasporterà in un nuovo mondo, non dovrete più lottare o ricorrere a sotterfugi per imporre la vostra volontà, vi adorano e per loro niente di quel che fate è sbagliato.
Crearsi un seguito non è un’impresa titanica: è semplice, tutti gli esseri umani hanno un disperato bisogno di credere in qualcosa e questo li rende estremamente suggestionabili; semplicemente non possono sopportare il dubbio, o il senso di vuoto che nasce dalla mancanza di qualcosa in cui credere per periodi troppo prolungati.`

/**
 * 1. Genera una stringa casuale da un testo sorgente fino a raggiungere 
 * la lunghezza massima di caratteri specificata.
 * @param {number} maxLunghezzaCaratteri - La lunghezza massima in caratteri della stringa risultante.
 * @param {string} testoSorgente - Il testo lungo da cui ricavare le parole.
 * @returns {string} La stringa di parole casuali generata.
 */
export function testoXCaratteri(
    maxLunghezzaCaratteri: number,
    testoSorgente: string = _testoSorgente,
): string {
    // 1. Pulizia e Preparazione
    // Separa il testo in parole. Rimuove la punteggiatura e usa solo spazi per separare.
    // L'espressione regolare separa il testo e rimuove stringhe vuote.
    const paroleOriginali = testoSorgente
        .toLowerCase() // Rende tutto minuscolo per trattare 'Parola' e 'parola' come uguali
        .replace(/[^a-z\s]/g, '') // Rimuove caratteri non alfanumerici (tranne spazi)
        .split(/\s+/) // Divide per uno o più spazi
        .filter(p => p.length > 0); // Filtra eventuali stringhe vuote

    if (paroleOriginali.length === 0) {
        return "Errore: Il testo sorgente non contiene parole valide.";
    }

    let risultato = '';

    // 2. Ciclo di generazione
    while (risultato.length < maxLunghezzaCaratteri) {
        // Sceglie un indice casuale
        const indiceCasuale = Math.floor(Math.random() * paroleOriginali.length);
        const parolaCasuale = paroleOriginali[indiceCasuale]!;

        // Se l'aggiunta della prossima parola supererà il limite
        // (considerando lo spazio che andrebbe aggiunto)
        if (risultato.length + parolaCasuale.length + 1 > maxLunghezzaCaratteri) {
            break; // Esce dal ciclo
        }

        // Aggiunge la parola (e uno spazio, se non è la prima)
        if (risultato.length > 0) {
            risultato += ' ';
        }
        risultato += parolaCasuale;
    }

    return risultato;
}


/**
 * 2. Genera una stringa casuale da un testo sorgente fino a raggiungere 
 * il numero massimo di parole specificato.
 * @param {number} maxQuantitaParole - Il numero massimo di parole da includere.
 * @param {string} testoSorgente - Il testo lungo da cui ricavare le parole.
 * @returns {string} La stringa di parole casuali generata.
 */
export function testoXParole(
    maxQuantitaParole: number,
    testoSorgente: string = _testoSorgente,
): string {
    // 1. Pulizia e Preparazione (Stesso processo di prima)
    const paroleOriginali = testoSorgente
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(p => p.length > 0);

    if (paroleOriginali.length === 0) {
        return "Errore: Il testo sorgente non contiene parole valide.";
    }

    let risultato: string[] = [];

    // 2. Ciclo di generazione
    for (let i = 0; i < maxQuantitaParole; i++) {
        // Sceglie un indice casuale
        const indiceCasuale = Math.floor(Math.random() * paroleOriginali.length);
        const parolaCasuale = paroleOriginali[indiceCasuale]!;

        risultato.push(parolaCasuale);
    }

    // 3. Unisce le parole con uno spazio
    return risultato.join(' ');
}