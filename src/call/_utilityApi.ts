import { toast } from "@src/components/toast/toastController";

export function defaultCatch(err: any): Error {
  let message = err?.details || err?.message || 'Errore durante l’invio del punteggio';
  switch (message) {
    case 'internal':
      message = "Errore interno"
      break;
  }
  toast.danger(message);
  if (!import.meta.env.DEV) return new Error(message)

  // debug info
  if (err?.code === 'functions/internal') {
    toast.logError('Probabilmente la function non è stata caricata tra le cludFunction (need build)')
  };
  
  return new Error(message)
}
