export function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-UG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-UG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function getDaysRemaining(expiryDate: string): number {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getPhoneImage(phoneName: string): string {
  const images: Record<string, string> = {
    'Galaxy A05': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop',
    'Galaxy A15': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
    'Galaxy A25': 'https://images.unsplash.com/photo-1581993192873-6233c2b5f90d?w=300&h=300&fit=crop',
    'Galaxy A35': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&h=300&fit=crop',
    'Galaxy A55': 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=300&h=300&fit=crop',
    'Galaxy S23 FE': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&h=300&fit=crop',
    'Galaxy S24': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300&h=300&fit=crop',
    'Galaxy S24+': 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=300&h=300&fit=crop',
    'Galaxy S24 Ultra': 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=300&h=300&fit=crop',
    'Galaxy Z Flip6': 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=300&h=300&fit=crop',
    'Galaxy Z Fold6 VIP': 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=300&h=300&fit=crop',
  }
  return images[phoneName] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop'
}

export function getGroupColor(group: string): string {
  if (group === 'Group 1') return 'from-blue-600 to-blue-800'
  if (group === 'Group 2') return 'from-purple-600 to-purple-900'
  return 'from-samsung-gold/80 to-yellow-700'
}
