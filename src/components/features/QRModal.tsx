import { X, Copy, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface QRModalProps {
  url: string
  onClose: () => void
}

export default function QRModal({ url, onClose }: QRModalProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=141826&color=4DA6FF&margin=10`

  const copyLink = () => {
    navigator.clipboard.writeText(url)
    toast.success('Referral link copied!')
  }

  const shareWhatsApp = () => {
    const text = `🎉 Join Samsung Earnings Platform - Uganda's #1 investment app!\n\nEarn daily income + get 7,000 UGX FREE registration bonus!\n\nJoin using my link: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5" onClick={onClose}>
      <div className="bg-samsung-card border border-samsung-border rounded-2xl p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg">Share Referral Link</h3>
          <button onClick={onClose} className="text-samsung-muted hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-5">
          <div className="bg-samsung-dark border border-samsung-border rounded-xl p-3">
            <img src={qrUrl} alt="QR Code" className="w-44 h-44 rounded-lg" />
          </div>
        </div>

        {/* Link preview */}
        <div className="bg-samsung-dark border border-samsung-border rounded-xl p-3 mb-4 break-all">
          <p className="text-samsung-accent text-xs">{url}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={copyLink}
            className="flex items-center justify-center gap-2 bg-samsung-blue/20 border border-samsung-blue/40 text-samsung-accent rounded-xl py-3 text-sm font-semibold hover:bg-samsung-blue/30 transition-colors">
            <Copy size={16} />
            Copy Link
          </button>
          <button onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl py-3 text-sm font-semibold hover:bg-green-600/30 transition-colors">
            <Share2 size={16} />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
