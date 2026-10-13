import { createClient } from '@supabase/supabase-js'
import { SEED_BOMMAIS } from '../data/seed.js'
import { normalizeConfig, STEP_CAP } from '../data/options.js'

// One tiny interface over two backends:
//   - Supabase (shared, realtime) when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set
//   - an in-memory fallback so the prototype stays playable without a backend
// store.list()            -> Promise<Bommai[]>
// store.add(config, step) -> Promise<Bommai>; rejects with err.code 'step_full' | 'already_placed' | 'locked_step'
// store.subscribe(fn)     -> unsubscribe; fn(bommai) for every insert by anyone

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const COLUMNS = 'id,name,body,skin_tone,hair,hair_color,outfit,outfit_color,face,face_extras,accessory,pose,step,created_at'

function placementError(code, message) {
  return Object.assign(new Error(message), { code })
}

// The database enforces the rules (see the placement_rules migration); turn its errors into codes the UI understands.
function toPlacementError(e) {
  const msg = e?.message || ''
  if (msg.includes('already has a Bommai')) return placementError('already_placed', msg)
  if (msg.includes('is full')) return placementError('step_full', msg)
  if (e?.code === '23514' || e?.code === '42501') return placementError('locked_step', msg) // check constraint / RLS
  return e
}

function toRow(r) {
  return { ...normalizeConfig(r), id: r.id, step: r.step, created_at: r.created_at, seeded: !!r.seeded }
}

function memoryStore() {
  const rows = SEED_BOMMAIS.map(toRow)
  const subs = new Set()
  return {
    kind: 'memory',
    async list() {
      return [...rows]
    },
    async add(config, step) {
      if (!(step >= 1 && step <= 7)) throw placementError('locked_step', 'Only steps 1–7 are open to the community')
      if (rows.filter((r) => r.step === step).length >= STEP_CAP) throw placementError('step_full', `Step ${step} is full`)
      const row = toRow({ ...config, step, id: `local-${Date.now()}`, created_at: new Date().toISOString() })
      rows.push(row)
      subs.forEach((fn) => fn(row))
      return row
    },
    subscribe(fn) {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }
}

function supabaseStore() {
  const sb = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  let session = null
  async function ensureSession() {
    if (session) return session
    const { data } = await sb.auth.getSession()
    if (data.session) return (session = data.session)
    const { data: anon, error } = await sb.auth.signInAnonymously()
    if (error) throw error
    return (session = anon.session)
  }
  return {
    kind: 'supabase',
    async list() {
      const { data, error } = await sb.from('bommais').select(COLUMNS).order('created_at', { ascending: true }).limit(2000)
      if (error) throw error
      return data.map(toRow)
    },
    async add(config, step) {
      const s = await ensureSession()
      const c = normalizeConfig(config)
      const { data, error } = await sb
        .from('bommais')
        .insert({ ...c, name: c.name || 'A friend', step, user_id: s.user.id })
        .select(COLUMNS)
        .single()
      if (error) throw toPlacementError(error)
      return toRow(data)
    },
    subscribe(fn) {
      const ch = sb
        .channel('bommais-inserts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bommais' }, (p) => fn(toRow(p.new)))
        .subscribe()
      return () => sb.removeChannel(ch)
    },
  }
}

let store
try {
  store = URL && KEY ? supabaseStore() : memoryStore()
} catch (e) {
  console.warn('[golu] Supabase unavailable, using in-memory store', e)
  store = memoryStore()
}

// If the network call to Supabase fails (e.g. inside a sandboxed preview), fall back once.
export async function loadBommais() {
  try {
    return await store.list()
  } catch (e) {
    console.warn('[golu] could not reach Supabase, using in-memory store', e)
    store = memoryStore()
    return store.list()
  }
}
export const addBommai = (config, step) => store.add(config, step)
export const subscribeBommais = (fn) => store.subscribe(fn)
export const storeKind = () => store.kind
