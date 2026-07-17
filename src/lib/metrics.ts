import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type MetaRow = {
  metric_date: string
  campaign_id: string
  campaign_name: string
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpc: number
  cpm: number
  client_id: string
}

export type Period = { from: string; to: string }

export function lastNDays(n: number): Period {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - n + 1)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(from), to: iso(to) }
}

/** Métricas Meta Ads reais do período (RLS aplica o filtro por cliente). */
export function useMetaMetrics(period: Period, clientId?: string) {
  const [rows, setRows] = useState<MetaRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function run() {
      let q = supabase
        .from('meta_ads_campaign_metrics')
        .select('metric_date,campaign_id,campaign_name,impressions,clicks,spend,ctr,cpc,cpm,client_id')
        .gte('metric_date', period.from)
        .lte('metric_date', period.to)
        .order('metric_date', { ascending: true })
      if (clientId) q = q.eq('client_id', clientId)
      const { data, error } = await q
      if (!alive) return
      if (error) setError(error.message)
      else setRows((data ?? []) as MetaRow[])
    }
    run()
    return () => { alive = false }
  }, [period.from, period.to, clientId])

  return { rows, error, loading: rows === null && !error }
}

export type Creative = {
  ad_id: string
  ad_name: string | null
  status: string | null
  campaign_name: string | null
  adset_name: string | null
  thumbnail_url: string | null
  image_url: string | null
  object_type: string | null
}

/** Criativos ativos do cliente (Meta). */
export function useCreatives(clientId?: string) {
  const [rows, setRows] = useState<Creative[] | null>(null)
  useEffect(() => {
    let alive = true
    async function run() {
      let q = supabase
        .from('meta_ads_creatives')
        .select('ad_id,ad_name,status,campaign_name,adset_name,thumbnail_url,image_url,object_type')
        .order('updated_at', { ascending: false })
      if (clientId) q = q.eq('client_id', clientId)
      const { data } = await q
      if (alive) setRows((data ?? []) as Creative[])
    }
    run()
    return () => { alive = false }
  }, [clientId])
  return { creatives: rows, loading: rows === null }
}

/** Última sincronização registrada (sync_runs). */
export function useLastSync(clientId?: string) {
  const [last, setLast] = useState<{ status: string; finished_at: string; provider: string } | null>(null)
  useEffect(() => {
    let alive = true
    async function run() {
      let q = supabase
        .from('sync_runs')
        .select('status,finished_at,provider')
        .order('created_at', { ascending: false })
        .limit(1)
      if (clientId) q = q.eq('client_id', clientId)
      const { data } = await q
      if (alive && data?.[0]) setLast(data[0])
    }
    run()
    return () => { alive = false }
  }, [clientId])
  return last
}

/** Agregações usadas nos KPIs — apenas a partir de dados reais. */
export function aggregateMeta(rows: MetaRow[]) {
  const sum = (f: (r: MetaRow) => number) => rows.reduce((a, r) => a + (f(r) || 0), 0)
  const spend = sum(r => r.spend)
  const clicks = sum(r => r.clicks)
  const impressions = sum(r => r.impressions)
  return {
    spend,
    clicks,
    impressions,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    byDay: groupByDay(rows),
    byCampaign: groupByCampaign(rows),
  }
}

function groupByDay(rows: MetaRow[]) {
  const map = new Map<string, { date: string; spend: number; clicks: number; impressions: number }>()
  for (const r of rows) {
    const cur = map.get(r.metric_date) ?? { date: r.metric_date, spend: 0, clicks: 0, impressions: 0 }
    cur.spend += r.spend; cur.clicks += r.clicks; cur.impressions += r.impressions
    map.set(r.metric_date, cur)
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}

function groupByCampaign(rows: MetaRow[]) {
  const map = new Map<string, { name: string; spend: number; clicks: number; impressions: number }>()
  for (const r of rows) {
    const cur = map.get(r.campaign_id) ?? { name: r.campaign_name, spend: 0, clicks: 0, impressions: 0 }
    cur.spend += r.spend; cur.clicks += r.clicks; cur.impressions += r.impressions
    map.set(r.campaign_id, cur)
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend)
}

export const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const fmtNum = (v: number) => v.toLocaleString('pt-BR')
export const fmtPct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
