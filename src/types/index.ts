export interface UserProfile {
  id: string
  username: string
  email: string
  phone?: string
  referral_code?: string
  referrer_id?: string
  wallet_balance: number
  total_earnings: number
  total_withdrawn: number
  referral_earnings: number
  daily_earnings: number
  is_admin: boolean
  registration_bonus_claimed: boolean
  registration_bonus_added: boolean
  created_at: string
}

export interface Package {
  id: string
  name: string
  group_name: string
  price: number
  daily_income: number
  duration_days: number
  description?: string
  image_url?: string
  is_active: boolean
}

export interface UserPackage {
  id: string
  user_id: string
  package_id: string
  status: 'pending' | 'active' | 'expired' | 'rejected'
  payment_proof?: string
  amount_paid: number
  buy_date?: string
  expiry_date?: string
  last_income_date?: string
  total_earned: number
  days_remaining?: number
  created_at: string
  package?: Package
  user?: UserProfile
}

export interface Wallet {
  id: string
  user_id: string
  network: 'MTN' | 'Airtel'
  phone_number: string
  full_name: string
  is_default: boolean
}

export interface RechargeRequest {
  id: string
  user_id: string
  amount: number
  network: string
  sender_phone: string
  sender_name: string
  payment_proof?: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note?: string
  created_at: string
  updated_at: string
  user?: UserProfile
}

export interface WithdrawalRequest {
  id: string
  user_id: string
  wallet_id?: string
  amount: number
  tax_amount: number
  net_amount: number
  network: string
  phone_number: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note?: string
  created_at: string
  updated_at: string
  user?: UserProfile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
}

export interface GiftCode {
  id: string
  code: string
  amount: number
  expires_at: string
  max_uses: number
  current_uses: number
  is_active: boolean
  created_at: string
}

export interface CheckIn {
  id: string
  user_id: string
  checked_at: string
  bonus_amount: number
}

export interface TeamMember {
  id: string
  username: string
  email: string
  phone?: string
  referral_code?: string
  wallet_balance: number
  total_earnings: number
  created_at: string
  level: number
  referrer_id?: string
}
