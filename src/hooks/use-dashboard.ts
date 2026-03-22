'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DashboardStats, NextAppointment } from '@/lib/types'

const supabase = createClient()

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats')
      if (error) throw error
      return data as DashboardStats
    },
    staleTime: 30_000,
  })
}

export function useNextAppointment() {
  return useQuery({
    queryKey: ['dashboard', 'next'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_next_appointment')
      if (error) throw error
      if (!data || !data.id) return null
      return data as NextAppointment
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
