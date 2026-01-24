import { toast } from "@src/components/toast/toastController"

export interface ShareLink { url: string, text?: string, title?: string }
export async function shareLink({ url, text, title }: ShareLink) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title ?? 'Condividi',
        text: text ?? '',
        url
      })
    } catch (err) {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiato negli appunti');
    }
  } else {
    await navigator.clipboard.writeText(url)
    toast.success('Link copiato negli appunti')
  }
}