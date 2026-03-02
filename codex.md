# Codex Task Preferences

Quando in un task viene nominato `codex.md`, devi seguire questa lista come regola operativa.

- Dai priorita ai componenti gia pronti del pacchetto `cic-kit`.
- Organizza i file in cartelle in modo corretto e coerente con il progetto, preferendo una struttura per feature (es. `src/views/<feature>`, file di supporto nella stessa cartella della feature).
- Evita file monolitici: quando una pagina/componente cresce, dividila in file dedicati.
- Nei componenti preferisco l'uso di `<style scoped lang="scss">`.
- Per lo stile preferisco le classi Bootstrap; CSS custom solo quando serve per esigenze particolari.
- Se una view usa azioni nell'header, crea un file extra dedicato ai pulsanti (pattern `*HeaderExtra.vue`, es. `CmdHeaderExtra.vue`) invece di lasciare tutto nella view principale.
- Se richiedo esplicitamente un deploy, devi usare `npm run deploy:codex`.
- Per i `Btn`, preferisco l'uso di icone quando migliora la UX.
- Se inserisci icone Material Symbols senza passare una classe via prop, usa come default `material-symbols-outlined`.
- Se ci sono eventi o stati importanti (`error`, `warning`, `info`) da segnalare, usa la funzione di invio notifiche a HubCortex (`hub.*`).
- Nelle notifiche HubCortex si puo passare un `payload`, ma se possibile evita il payload e spiega in modo completo il contesto direttamente nel campo `message`.
- Passa il `payload` solo quando e realmente utile/necessario.
- Mi piace la presenza di emoji nel frontend: usale quando utili anche per log di debug e notifiche Hub (es. `:bug:` debug, `:white_check_mark:` successo, `:warning:` warning, `:rocket:` deploy).

Prompt da applicare:
"Quando ti chiedo un task e nomino `codex.md`, devi applicare tutte le regole della lista in questa pagina."

