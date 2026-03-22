// =====================================================
// MEU SOCIO — TIPOS TYPESCRIPT
// =====================================================

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'rescheduled'
  | 'no_show'
  | 'cancelled'

export type EntryType = 'income' | 'expense'
export type PaymentStatus = 'paid' | 'pending' | 'partial'
export type ExpenseCategory = 'variable' | 'fixed' | 'cmv' | 'daily_cost'

export interface Profile {
  id: string
  full_name: string | null
  business_name: string
  trade: string
  document: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  website: string | null
  address: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Settings {
  user_id: string
  reactivation_days: number
  recurrence_min_visits: number
  monthly_goal: number
  notify_birthday: boolean
  notify_das: boolean
  notify_inactive: boolean
  notify_fixed_expenses: boolean
  daily_cost_enabled: boolean
  daily_cost_value: number
  show_upsell_field: boolean
  show_deposit_field: boolean
}

export interface Service {
  id: string
  user_id: string
  name: string
  price: number
  duration: string | null
  cost: number
  is_active: boolean
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  code: string
  name: string
  phone: string | null
  email: string | null
  instagram: string | null
  birth_date: string | null
  source: string
  notes: string | null
  custom_data: Record<string, unknown>
  is_removed_from_reactivation: boolean
  is_removed_from_recurrence: boolean
  created_at: string
  updated_at: string
}

export interface ClientWithStatus extends Client {
  total_visits: number
  last_visit: string | null
  total_spent: number
  last_service: string | null
  needs_reactivation: boolean
  is_recurrent: boolean
  activity_status: 'new' | 'active' | 'inactive'
}

export interface Appointment {
  id: string
  user_id: string
  client_id: string
  service_id: string | null
  service_name: string
  scheduled_date: string
  scheduled_time: string
  estimated_value: number
  final_value: number | null
  status: AppointmentStatus
  is_free_return: boolean
  notes: string | null
  upsell_service: string | null
  upsell_value: number
  next_return: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentWithClient extends Appointment {
  client_name: string
  client_phone: string | null
}

export interface FinancialEntry {
  id: string
  user_id: string
  type: EntryType
  amount: number
  description: string
  entry_date: string
  client_id: string | null
  client_name: string | null
  service_name: string | null
  appointment_id: string | null
  status: PaymentStatus
  expense_category: ExpenseCategory | null
  created_at: string
}

export interface FixedExpense {
  id: string
  user_id: string
  description: string
  amount: number
  due_day: number | null
  category: string
  notify: boolean
  is_active: boolean
  created_at: string
}

export interface DashboardStats {
  revenue: number
  expenses: number
  profit: number
  pending_income: number
  completed_count: number
  today_count: number
  active_clients: number
  month_start: string
}

export interface NextAppointment {
  id: string
  client_name: string
  client_phone: string | null
  service_name: string
  scheduled_date: string
  scheduled_time: string
  estimated_value: number
  status: AppointmentStatus
}

export interface Notification {
  type: 'birthday' | 'fixed_expense' | 'inactive_client'
  client_id?: string
  client_name?: string
  description?: string
  amount?: number
  days_until: number
}
