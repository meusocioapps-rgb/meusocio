'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { FinancialEntry, FixedExpense } from '@/lib/types'
import { getCurrentMonth } from '@/lib/utils'

const supabase = createClient()

export function useFinancialEntries(month?: string) {
  const m = month || getCurrentMonth()

  return useQuery({
    queryKey: ['finances', 'entries', m],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_entries')
        .select('*')
        .gte('entry_date', m + '-01')
        .lte('entry_date', m + '-31')
        .order('entry_date', { ascending: false })
      if (error) throw error
      return data as FinancialEntry[]
    },
    staleTime: 30_000,
  })
}

export function useFixedExpenses() {
  return useQuery({
    queryKey: ['finances', 'fixed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('is_active', true)
        .order('due_day')
      if (error) throw error
      return data as FixedExpense[]
    },
    staleTime: 300_000,
  })
}

export function useCreateFixedExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (entry: { description: string; amount: number; due_day: number | null; category?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('fixed_expenses').insert({
        user_id: user.id,
        description: entry.description,
        amount: entry.amount,
        due_day: entry.due_day,
        category: entry.category || 'fixed',
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] })
    },
  })
}

export function useUpdateFixedExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; description?: string; amount?: number; due_day?: number | null }) => {
      const updates: Record<string, unknown> = {}
      if (params.description !== undefined) updates.description = params.description
      if (params.amount !== undefined) updates.amount = params.amount
      if (params.due_day !== undefined) updates.due_day = params.due_day
      const { error } = await supabase
        .from('fixed_expenses')
        .update(updates)
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] })
    },
  })
}

export function useDeleteFixedExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fixed_expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] })
    },
  })
}

export function useCreateIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: {
      amount: number
      description: string
      entry_date: string
      client_name?: string
      service_name?: string
      status?: 'paid' | 'pending' | 'partial'
    }) => {
      const { data, error } = await supabase
        .from('financial_entries')
        .insert({ ...entry, type: 'income' as const, status: entry.status || 'paid' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: {
      amount: number
      description: string
      entry_date: string
      expense_category?: 'variable' | 'fixed' | 'cmv'
    }) => {
      const { data, error } = await supabase
        .from('financial_entries')
        .insert({
          ...entry,
          type: 'expense' as const,
          expense_category: entry.expense_category || 'variable',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function usePendingEntries() {
  return useQuery({
    queryKey: ['finances', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_entries')
        .select('*')
        .in('status', ['pending', 'partial'])
        .order('entry_date', { ascending: true })
      if (error) throw error
      return data as FinancialEntry[]
    },
    staleTime: 30_000,
  })
}

export function useUpdateEntryStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; status: 'paid' | 'pending' | 'partial' }) => {
      const { data, error } = await supabase
        .from('financial_entries')
        .update({ status: params.status })
        .eq('id', params.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useFixedCategoryEntries() {
  return useQuery({
    queryKey: ['finances', 'fixed-category-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_entries')
        .select('*')
        .eq('type', 'expense')
        .eq('expense_category', 'fixed')
        .order('entry_date', { ascending: false })
      if (error) throw error
      return data as FinancialEntry[]
    },
    staleTime: 60_000,
  })
}

export function useFinancialSummary() {
  return useQuery({
    queryKey: ['finances', 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_financial_summary')
      if (error) throw error
      return data as {
        income_total: number
        income_paid: number
        income_pending: number
        expenses_total: number
        expenses_cmv: number
        fixed_expenses: number
      }
    },
    staleTime: 30_000,
  })
}
