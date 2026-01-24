import { reactive } from 'vue'

export const loading = reactive({
    state: false,
    msg: "",

    defaultMsg: [
        "Carichiamo i dati… o forse stiamo solo prendendo un caffè!",
        "Metà del tempo di caricamento è stato dedicato a guardare gattini su Internet.",
        "Sei sicuro di volere davvero vedere cosa c'è dopo?",
        "Sintonizzando i bytes… quasi pronti!",
        "Ancora un attimo, i robot stanno finendo il caffè.",
        "I dati si stanno allacciando le scarpe…",
        "Stiamo cercando il bottone 'carica più veloce'!",
        "Nel frattempo, danza della pioggia per far caricare più in fretta!",
        "Tenetevi forte… stiamo caricando meraviglie!",
        "Hai aspettato così tanto che potresti essere un ninja adesso."
    ],

    on(msg?: string) {
        this.msg = msg ?? this.defaultMsg[Math.floor(Math.random() * this.defaultMsg.length)]!;
        this.state = true
    },
    off() { this.state = false },

    /**
  * Esegue una funzione con loading automatico.
  * - tipizzata
  * - safe
  * - supporta sync e async
  */
    async run<T>(
        fn: () => T | Promise<T>,
        msg?: string,
    ): Promise<T> {
        this.on(msg)
        try {
            return await fn()
        } finally {
            this.off()
        }
    },
})