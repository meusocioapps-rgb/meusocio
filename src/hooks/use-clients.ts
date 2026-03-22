'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ClientWithStatus } from '@/lib/types'

const supabase = createClient()

export function useClients(filter?: 'all' | 'recurrent' | 'reactivate') {
  return useQuery({
    queryKey: ['clients', filter],
    queryFn: async () => {
      let query = supabase
        .from('clients_with_status')
        .select('*')
        .order('name')

      if (filter === 'recurrent') {
        query = query.eq('is_recurrent', true)
      } else if (filter === 'reactivate') {
        query = query.eq('needs_reactivation', true)
      }

      const { data, error } = await query
      if (error) throw error
      return data as ClientWithStatus[]
    },
    staleTime: 60_000,
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients_with_status')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as ClientWithStatus
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (client: {
      name: string
      phone?: string
      email?: string
      instagram?: string
      birth_date?: string
      source?: string
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<{
      name: string
      phone: string
      email: string
      instagram: string
      birth_date: string
      source: string
      notes: string
      is_removed_from_reactivation: boolean
      is_removed_from_recurrence: boolean
    }>) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client'] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
