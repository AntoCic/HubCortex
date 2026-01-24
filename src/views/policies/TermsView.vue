<!-- src/views/TermsView.vue -->
<script setup lang="ts">
import { useChangeHeader } from '../../components/header/useChangeHeader';

useChangeHeader('Termini e condizioni')
</script>

<template>
    <div class="container terms-page overflow-auto h-100">
        <div class="row justify-content-center">
            <div class="col-12 col-lg-10">
                <div class="terms-hero text-center">
                    <div class="terms-hero__badge">📜</div>
                    <h1 class="terms-hero__title">Termini d’uso & Informativa sintetica</h1>
                    <p class="terms-hero__subtitle">
                        Questo sito è stato creato con finalità personali dal proprietario. Se decidi di registrarti,
                        leggi con attenzione quanto segue.
                    </p>
                </div>
            </div>
        </div>

        <div class="row justify-content-center mt-3">
            <div class="col-12 col-md-10 col-lg-8">
                <div class="terms-card">
                    <section class="mb-4">
                        <h2 class="h5">1) Scopo del servizio</h2>
                        <p class="mb-2">
                            L’applicazione è destinata a un <strong>uso personale</strong> del proprietario del sito.
                            Le funzionalità (es. note, relazioni di debito/credito, tornei, amici) sono fornite “così
                            come sono”,
                            senza garanzia di disponibilità continua o di assenza di errori.
                        </p>
                    </section>

                    <section class="mb-4">
                        <h2 class="h5">2) Registrazione e visibilità dei dati</h2>
                        <ul class="list-unstyled mb-2">
                            <li class="mb-1">
                                Se ti iscrivi, <strong>nome</strong> e <strong>cognome</strong> potranno essere
                                <strong>visibili a tutti gli utenti autenticati</strong> dell’applicazione per scopi di
                                identificazione nei flussi social (es. amicizie, relazioni).
                            </li>
                            <li class="mb-1">
                                Altri dati che potresti inserire (es. email, foto profilo, genere, descrizione) sono
                                utilizzati
                                per migliorare l’esperienza d’uso e potrebbero essere condivisi con gli utenti con cui
                                interagisci,
                                in base alle funzionalità attivate.
                            </li>
                            <li class="mb-1">
                                Non condividere informazioni sensibili nelle aree testuali (note/descrizioni):
                                potrebbero essere
                                viste dagli utenti con cui crei relazioni o condividi contenuti.
                            </li>
                        </ul>
                    </section>

                    <section class="mb-4">
                        <h2 class="h5">3) Trattamento dei dati (informativa breve)</h2>
                        <ul class="list-unstyled mb-2">
                            <li class="mb-1"><strong>Titolare</strong>: il proprietario del sito.</li>
                            <li class="mb-1"><strong>Finalità</strong>: uso personale dell’app da parte del titolare e
                                funzionalità social tra utenti registrati.</li>
                            <li class="mb-1"><strong>Basi giuridiche</strong>: consenso e legittimo interesse alla
                                fruizione del servizio.</li>
                            <li class="mb-1"><strong>Conservazione</strong>: finché mantieni l’account o finché
                                necessario al funzionamento delle funzionalità.</li>
                            <li class="mb-1"><strong>Condivisione con terzi</strong>:
                                servizi tecnici necessari (es. piattaforme di autenticazione, database/hosting) per
                                erogare l’applicazione.
                            </li>
                            <li class="mb-1"><strong>Diritti</strong>: accesso/correzione/cancellazione dei dati;
                                puoi richiedere la chiusura dell’account e la rimozione dei dati scrivendo al contatto
                                indicato sotto.
                            </li>
                        </ul>
                    </section>

                    <section class="mb-4">
                        <h2 class="h5">4) Sicurezza</h2>
                        <p class="mb-2">
                            Sono adottate misure tecniche ragionevoli per proteggere i dati, ma non è possibile
                            garantire
                            sicurezza assoluta. Usa password robuste e non riutilizzarle altrove.
                        </p>
                    </section>

                    <section class="mb-4">
                        <h2 class="h5">5) Condotta dell’utente</h2>
                        <ul class="list-unstyled mb-2">
                            <li class="mb-1">Non caricare contenuti illegali, diffamatori o che violino diritti altrui.
                            </li>
                            <li class="mb-1">Non tentare di accedere ai dati di utenti con cui non hai relazioni o
                                permessi.</li>
                            <li class="mb-1">Usa il servizio in modo lecito e rispettoso.</li>
                        </ul>
                    </section>

                    <section class="mb-4">
                        <h2 class="h5">6) Limitazione di responsabilità</h2>
                        <p class="mb-2">
                            Il servizio è fornito “as is”. Il titolare non risponde di perdite di dati, interruzioni,
                            malfunzionamenti o danni derivanti dall’uso dell’applicazione.
                        </p>
                    </section>

                    <section class="mb-4">
                        <h2 class="h5">7) Cookie e tecnologie simili</h2>
                        <p class="mb-2">
                            Potrebbero essere usati cookie/strumenti tecnici necessari per autenticazione e
                            funzionamento
                            dell’app. Non sono previsti cookie di profilazione.
                        </p>
                    </section>

                    <section class="mb-4">
                        <h2 class="h5">8) Modifiche</h2>
                        <p class="mb-2">
                            I presenti termini possono essere aggiornati. L’uso continuato del servizio implica
                            l’accettazione
                            delle modifiche. Data ultima revisione: <strong>1 settembre 2025</strong>.
                        </p>
                    </section>

                    <section>
                        <h2 class="h5">9) Contatti</h2>
                        <p class="mb-0">
                            Per richieste su privacy o rimozione account, contatta: <a
                                href="mailto:owner@example.com">owner@example.com</a>.
                        </p>
                    </section>
                </div>

                <div class="d-flex gap-2 justify-content-center mt-3">
                    <router-link class="btn btn-outline-secondary" :to="{ name: 'home' }">
                        Torna alla Home
                    </router-link>
                    <router-link class="btn btn-primary" :to="{ name: 'register' }">
                        Crea un account
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.terms-page {
    padding-top: 1.5rem;
    padding-bottom: 2rem;
}

.terms-hero {
    position: relative;
    padding: 2rem 1.25rem;
    border-radius: 1.25rem;
    background:
        radial-gradient(1200px 500px at 15% -20%, rgba(99, 102, 241, 0.10), transparent 60%),
        radial-gradient(1200px 500px at 110% 120%, rgba(16, 185, 129, 0.10), transparent 60%),
        #ffffff;
    box-shadow:
        0 2px 6px rgba(16, 24, 40, 0.06),
        0 12px 24px rgba(16, 24, 40, 0.06);
}

.terms-hero__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.12);
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.25);
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
}

.terms-hero__title {
    margin: 0.25rem 0;
    font-weight: 700;
}

.terms-hero__subtitle {
    color: #6b7280;
    margin: 0 auto;
    max-width: 46rem;
}

.terms-card {
    background: #fff;
    border-radius: 1rem;
    padding: 1.25rem 1.25rem 0.75rem;
    box-shadow:
        0 2px 6px rgba(16, 24, 40, 0.06),
        0 12px 24px rgba(16, 24, 40, 0.06);

    h2.h5 {
        margin-bottom: .5rem;
        font-weight: 700;
    }

    p,
    li {
        color: #374151;
    }

    /* gray-700 */
}

@media (min-width: 768px) {
    .terms-card {
        padding: 1.75rem 1.75rem 1rem;
    }

    .terms-hero {
        padding: 2.5rem 2rem;
    }
}
</style>
