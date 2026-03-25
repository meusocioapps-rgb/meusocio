'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DashboardStats, NextAppointment } from '@/lib/types'

const supabase = createClient()

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      // Try RPC first, fallback to direct query
      const { data, error } = await supabase.rpc('get_dashboard_stats')
      if (!error && data) return data as DashboardStats

      // Fallback: calculate from tables directly
      const now = new Date()
      const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      const [incomeRes, expenseRes, todayRes, clientsRes] = await Promise.all([
        supabase.from('appointments').select('final_value, upsell_value, estimated_value').eq('status', 'completed').eq('is_free_return', false).gte('scheduled_date', monthStart),
        supabase.from('financial_entries').select('amount').eq('type', 'expense').gte('entry_date', monthStart),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('scheduled_date', todayLocal).in('status', ['scheduled', 'confirmed', 'completed']),
        supabase.from('appointments').select('client_id').eq('status', 'completed'),
      ])

      const revenue = (incomeRes.data ?? []).reduce((s, r) => s + (r.final_value ?? r.estimated_value ?? 0) + (r.upsell_value ?? 0), 0)
      const expenses = (expenseRes.data ?? []).reduce((s, r) => s + r.amount, 0)
      const uniqueClients = new Set((clientsRes.data ?? []).map((c) => c.client_id))

      return {
        revenue,
        expenses,
        profit: revenue - expenses,
        pending_income: 0,
        completed_count: incomeRes.data?.length ?? 0,
        today_count: todayRes.count ?? 0,
        active_clients: uniqueClients.size,
      } as DashboardStats
    },
    staleTime: 30_000,
  })
}

export function useNextAppointment() {
  return useQuery({
    queryKey: ['dashboard', 'next'],
    queryFn: async () => {
      // Try RPC first
      const { data, error } = await supabase.rpc('get_next_appointment')
      if (!error && data && data.id) return data as NextAppointment

      // Fallback: direct query
      const _now = new Date()
      const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`
      const { data: appts } = await supabase
        .from('appointments_with_client')
        .select('*')
        .gte('scheduled_date', today)
        .in('status', ['scheduled', 'confirmed'])
        .order('scheduled_date')
        .order('scheduled_time')
        .limit(1)

      if (!appts || appts.length === 0) return null

      const a = appts[0]
      return {
        id: a.id,
        client_id: a.client_id,
        service_id: a.service_id,
        client_name: a.client_name,
        client_phone: a.client_phone,
        service_name: a.service_name,
        scheduled_date: a.scheduled_date,
        scheduled_time: a.scheduled_time,
        estimated_value: a.estimated_value,
        status: a.status,
      } as NextAppointment
    },
    staleTime: 30_000,
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_notifications')
      if (error) throw error
      return data as Array<{
        type: string
        client_id?: string
        client_name?: string
        description?: string
        amount?: number
        days_until: number
        birth_date?: string
        due_day?: number
      }>
    },
    staleTime: 60_000,
  })
}
