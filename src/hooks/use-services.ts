'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/lib/types'

const supabase = createClient()

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data as Service[]
    },
    staleTime: 300_000,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (service: {
      name: string
      price: number
      duration?: string
      cost?: number
    }) => {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; price?: number; duration?: string; cost?: number; is_active?: boolean }) => {
      const { data, error } = await supabase.from('services').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }) },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }) },
  })
}
