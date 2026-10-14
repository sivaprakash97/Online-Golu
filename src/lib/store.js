import { createClient } from '@supabase/supabase-js'
import { SEED_BOMMAIS } from '../data/seed.js'
import { normalizeConfig, spotsOnStep } from '../data/options.js'

// One tiny interface over two backends:
//   - Supabase (shared, realtime) when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set
//   - an in-memory fallback so the prototype stays playable without a backend
// store.list()                  -> Promise<Bommai[]>
// store.add(config, step, slot) -> Promise<Bommai>
// store.move(id, step, slot)    -> Promise<Bommai>   (only your own Bommai)
// store.update(id, config)      -> Promise<Bommai>   (only your own; changes the look and name, not the spot)
// store.subscribe(fn)           -> unsubscribe; fn(bommai) whenever anyone adds, moves or edits one
// add/move reject with err.code: 'slot_taken' | 'step_full' | 'already_placed' | 'locked_step' | 'move_unavailable'
// update rejects with err.code 'edit_unavailable' (not yours, or editing isn't switched on yet)

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const BASE_COLUMNS = 'id,name,body,skin_tone,hair,hair_color,outfit,outfit_color,face,face_extras,accessory,pose,step,created_at'

function placementError(code, message) {
  return Object.assign(new Error(message), { code })
}

// The database enforces the rules (see supabase/migrations); turn its errors into codes the UI understands.
function toPlacementError(e) {
  const msg = e?.message || ''
  if (e?.code === '23505') return placementError('slot_taken', msg) // unique (step, slot)
  if (msg.includes('bommais_slot_on_step')) return placementError('slot_taken', msg) // no such spot on that step
  if (msg.includes('already has a Bommai')) return placementError('already_placed', msg)
  if (msg.includes('is full')) return placementError('step_full', msg)
  if (e?.code === '23514' || e?.code === '42501') return placementError('locked_step', msg) // check constraint / RLS
  return e
}

function toRow(r) {
  return {
    ...normalizeConfig(r),
    id: r.id,
    step: r.step,
    slot: Number.isInteger(r.slot) ? r.slot : null,
    created_at: r.created_at,
    seeded: !!r.seeded,
  }
}

function memoryStore() {
  const rows = SEED_BOMMAIS.map(toRow)
  const subs = new Set()
  const check = (step, slot, id) => {
    if (!(step >= 1 && step <= 7)) throw placementError('locked_step', 'Only steps 1–7 are open to the community')
    if (!(slot >= 0 && slot < spotsOnStep(step))) throw placementError('slot_taken', 'No such spot')
    if (rows.some((r) => r.step === step && r.slot === slot && r.id !== id)) throw placementError('slot_taken', 'That spot is taken')
  }
  return {
    kind: 'memory',
    canMove: true,
    async list() {
      return [...rows]
    },
    async add(config, step, slot) {
      check(step, slot)
      const row = toRow({ ...config, step, slot, id: `local-${Date.now()}`, created_at: new Date().toISOString() })
      rows.push(row)
      subs.forEach((fn) => fn(row))
      return row
    },
    async move(id, step, slot) {
      check(step, slot, id)
      const i = rows.findIndex((r) => r.id === id)
      if (i < 0) throw placementError('move_unavailable', 'Not found')
      rows[i] = { ...rows[i], step, slot }
      subs.forEach((fn) => fn(rows[i]))
      return rows[i]
    },
    async update(id, config) {
      const i = rows.findIndex((r) => r.id === id)
      if (i < 0) throw placementError('edit_unavailable', 'Not found')
      const { id: _, step, slot, created_at, seeded } = rows[i]
      rows[i] = toRow({ ...normalizeConfig(config), id, step, slot, created_at, seeded })
      subs.forEach((fn) => fn(rows[i]))
      return rows[i]
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
  // Until the slots migration runs, the table has no `slot` column: keep working without spots
  // (the layout assigns them) and without moving.
  let hasSlots = true
  const columns = () => (hasSlots ? BASE_COLUMNS + ',slot' : BASE_COLUMNS)
  const missingColumn = (error) => error?.code === '42703' || (/slot/.test(error?.message || '') && /column/.test(error?.message || ''))

  async function ensureSession() {
    if (session) return session
    const { data } = await sb.auth.getSession()
    if (data.session) return (session = data.session)
    const { data: anon, error } = await sb.auth.signInAnonymously()
    if (error) throw error
    return (session = anon.session)
  }
  const store = {
    kind: 'supabase',
    canMove: true,
    async list() {
      const query = () => sb.from('bommais').select(columns()).order('created_at', { ascending: true }).limit(2000)
      let { data, error } = await query()
      if (error && hasSlots && missingColumn(error)) {
        hasSlots = false
        store.canMove = false
        ;({ data, error } = await query())
      }
      if (error) throw error
      return data.map(toRow)
    },
    async add(config, step, slot) {
      const s = await ensureSession()
      const c = normalizeConfig(config)
      const row = { ...c, name: c.name || 'A friend', step, user_id: s.user.id, ...(hasSlots ? { slot } : {}) }
      const { data, error } = await sb.from('bommais').insert(row).select(columns()).single()
      if (error) throw toPlacementError(error)
      return toRow(data)
    },
    async move(id, step, slot) {
      if (!hasSlots) throw placementError('move_unavailable', 'Moving needs the slots migration')
      await ensureSession()
      const { data, error } = await sb.from('bommais').update({ step, slot }).eq('id', id).select(columns()).single()
      if (error) throw error.code === 'PGRST116' ? placementError('move_unavailable', 'Not your Bommai') : toPlacementError(error)
      return toRow(data)
    },
    async update(id, config) {
      await ensureSession()
      // only the recipe and the name tag; the spot, owner and timestamps stay as they are
      const { data, error } = await sb.from('bommais').update(normalizeConfig(config)).eq('id', id).select(columns()).single()
      // PGRST116: no row came back (not yours); 42501: the edit migration hasn't been applied
      if (error) throw error.code === 'PGRST116' || error.code === '42501' ? placementError('edit_unavailable', error.message) : error
      return toRow(data)
    },
    subscribe(fn) {
      const ch = sb
        .channel('bommais-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bommais' }, (p) => fn(toRow(p.new)))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bommais' }, (p) => fn(toRow(p.new)))
        .subscribe()
      return () => sb.removeChannel(ch)
    },
  }
  return store
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
export const addBommai = (config, step, slot) => store.add(config, step, slot)
export const moveBommai = (id, step, slot) => store.move(id, step, slot)
export const updateBommai = (id, config) => store.update(id, config)
export const subscribeBommais = (fn) => store.subscribe(fn)
export const storeKind = () => store.kind
export const canMoveBommais = () => store.canMove
