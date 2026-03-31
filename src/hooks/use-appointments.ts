'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AppointmentWithClient } from '@/lib/types'
import { getToday } from '@/lib/utils'

const supabase = createClient()

export function useAppointmentsByDate(date: string) {
  return useQuery({
    queryKey: ['appointments', 'date', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments_with_client')
        .select('*')
        .eq('scheduled_date', date)
        .order('scheduled_time')
      if (error) throw error
      return data as AppointmentWithClient[]
    },
    staleTime: 30_000,
  })
}

export function useTodayAppointments() {
  return useAppointmentsByDate(getToday())
}

export function useAppointmentsByRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['appointments', 'range', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments_with_client')
        .select('*')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date')
        .order('scheduled_time')
      if (error) throw error
      return data as AppointmentWithClient[]
    },
    staleTime: 30_000,
    enabled: !!startDate && !!endDate,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appointment: {
      client_id: string
      service_id?: string
      service_name: string
      scheduled_date: string
      scheduled_time: string
      estimated_value: number
      is_free_return?: boolean
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      p_appointment_id: string
      p_final_value: number
      p_is_free_return?: boolean
      p_notes?: string
      p_upsell_service?: string
      p_upsell_value?: number
    }) => {
      const { data, error } = await supabase.rpc('complete_appointment', params)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['finances'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      p_appointment_id: string
      p_new_date: string
      p_new_time: string
      p_notes?: string
    }) => {
      const { data, error } = await supabase.rpc('reschedule_appointment', params)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      p_appointment_id: string
      p_status: 'no_show' | 'cancelled'
      p_notes?: string
    }) => {
      const { data, error } = await supabase.rpc('mark_appointment_status', params)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
