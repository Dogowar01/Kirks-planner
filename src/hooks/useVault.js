/* ============================================================
   Kirk's Daily — VAULT HOOK
   AES-256-GCM encryption, PBKDF2 key derivation.
   WebAuthn platform authenticator for biometric unlock.
   All data stays on device — nothing leaves localStorage.
   ============================================================ */
import { useState, useRef, useCallback, useEffect } from 'react'

const VAULT_KEY  = 'kirk_vault_v1'
const BIO_KEY    = 'kirk_vault_bio'
const LOCK_AFTER = 5 * 60 * 1000      // 5 minutes
const VERIFIER   = 'KIRK_VAULT_OK'

export const VAULT_TYPES = ['PASSWORD', 'PIN / CODE', 'WIFI', 'ACCOUNT', 'NOTE']

// ─── Helpers ────────────────────────────────────────────────
function uid() {
  return crypto.randomUUID ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)
}
function loadStore() {
  try { return JSON.parse(localStorage.getItem(VAULT_KEY)) } catch { return null }
}
function saveStore(data) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(data))
}

// ─── Crypto primitives ──────────────────────────────────────
async function deriveKey(pin, salt) {
  const raw = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  )
}

async function aesEncrypt(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key,
    new TextEncoder().encode(JSON.stringify(data))
  )
  return { iv: [...iv], ct: [...new Uint8Array(ct)] }
}

async function aesDecrypt(enc, key) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(enc.iv) }, key,
    new Uint8Array(enc.ct)
  )
  return JSON.parse(new TextDecoder().decode(pt))
}

async function wrapPin(pin, bioSecret) {
  const km = await crypto.subtle.importKey('raw', bioSecret, 'HKDF', false, ['deriveKey'])
  const k  = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(16), info: new TextEncoder().encode('pin-wrap') },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  )
  return aesEncrypt(pin, k)
}

async function unwrapPin(wrapped, bioSecret) {
  const km = await crypto.subtle.importKey('raw', bioSecret, 'HKDF', false, ['deriveKey'])
  const k  = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(16), info: new TextEncoder().encode('pin-wrap') },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  )
  return aesDecrypt(wrapped, k)
}

// ─── Hook ───────────────────────────────────────────────────
export function useVault() {
  const [cryptoKey, setCryptoKey] = useState(null)
  const [entries,   setEntries]   = useState([])
  const [tick,      setTick]      = useState(0)    // bump to re-derive isSetup / isBioEnrolled
  const timerRef = useRef(null)

  // Derived synchronously from localStorage
  const isSetup = () => {
    try { return !!JSON.parse(localStorage.getItem(VAULT_KEY) || '{}').verifier }
    catch { return false }
  }
  const isUnlocked    = () => cryptoKey !== null
  const isBioEnrolled = () => {
    try { return !!JSON.parse(localStorage.getItem(BIO_KEY) || '{}').credId }
    catch { return false }
  }

  // Reset the auto-lock countdown
  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCryptoKey(null)
      setEntries([])
    }, LOCK_AFTER)
  }, [])

  // Manual lock
  const lock = useCallback(() => {
    setCryptoKey(null)
    setEntries([])
    clearTimeout(timerRef.current)
  }, [])

  // ─── Setup PIN (first time or re-key) ─────────────────────
  const setupPin = useCallback(async (pin, existingEntries = []) => {
    const salt     = crypto.getRandomValues(new Uint8Array(16))
    const key      = await deriveKey(pin, salt)
    const verifier = await aesEncrypt(VERIFIER, key)
    const enc      = await aesEncrypt(existingEntries, key)
    saveStore({ salt: [...salt], verifier, entries: enc })
    setCryptoKey(key)
    setEntries(existingEntries)
    resetTimer()
    setTick(t => t + 1)
    return true
  }, [resetTimer])

  // ─── Unlock with PIN ──────────────────────────────────────
  const unlockPin = useCallback(async (pin) => {
    const store = loadStore()
    if (!store) return false
    try {
      const key = await deriveKey(pin, new Uint8Array(store.salt))
      const ok  = await aesDecrypt(store.verifier, key)
      if (ok !== VERIFIER) return false
      const dec = await aesDecrypt(store.entries, key)
      setCryptoKey(key)
      setEntries(dec)
      resetTimer()
      return true
    } catch { return false }
  }, [resetTimer])

  // ─── Biometrics ───────────────────────────────────────────
  const bioAvailable = useCallback(async () => {
    if (!window.PublicKeyCredential) return false
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return false
    try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() }
    catch { return false }
  }, [])

  const enrollBio = useCallback(async (pin) => {
    try {
      const bioSecret = crypto.getRandomValues(new Uint8Array(32))
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      const cred = await navigator.credentials.create({ publicKey: {
        challenge,
        rp: { name: "Kirk's Daily", id: location.hostname },
        user: { id: bioSecret, name: 'vault', displayName: "Kirk's Vault" },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required',
          requireResidentKey: true,
        },
        timeout: 60000,
      }})
      if (!cred) return false
      const credId     = [...new Uint8Array(cred.rawId)]
      const wrappedPin = await wrapPin(pin, bioSecret)
      localStorage.setItem(BIO_KEY, JSON.stringify({ credId, wrappedPin }))
      setTick(t => t + 1)
      return true
    } catch (e) { console.error('Bio enrol:', e); return false }
  }, [])

  const unlockBio = useCallback(async () => {
    try {
      const bioData = JSON.parse(localStorage.getItem(BIO_KEY) || '{}')
      if (!bioData.credId) return false
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      const assertion = await navigator.credentials.get({ publicKey: {
        challenge,
        rpId: location.hostname,
        allowCredentials: [{ type: 'public-key', id: new Uint8Array(bioData.credId) }],
        userVerification: 'required',
        timeout: 60000,
      }})
      if (!assertion) return false
      const bioSecret = new Uint8Array(assertion.response.userHandle)
      const pin       = await unwrapPin(bioData.wrappedPin, bioSecret)
      return unlockPin(pin)
    } catch (e) { console.error('Bio unlock:', e); return false }
  }, [unlockPin])

  const removeBio = useCallback(() => {
    localStorage.removeItem(BIO_KEY)
    setTick(t => t + 1)
  }, [])

  // ─── Entry CRUD ───────────────────────────────────────────
  const persistEntries = useCallback(async (list, key) => {
    const store = loadStore()
    store.entries = await aesEncrypt(list, key)
    saveStore(store)
    setEntries(list)
    resetTimer()
  }, [resetTimer])

  const addEntry = useCallback(async (entry) => {
    if (!cryptoKey) return
    const list = [{ ...entry, id: uid(), created: new Date().toISOString() }, ...entries]
    await persistEntries(list, cryptoKey)
  }, [cryptoKey, entries, persistEntries])

  const updateEntry = useCallback(async (id, updates) => {
    if (!cryptoKey) return
    const list = entries.map(e => e.id === id ? { ...e, ...updates } : e)
    await persistEntries(list, cryptoKey)
  }, [cryptoKey, entries, persistEntries])

  const deleteEntry = useCallback(async (id) => {
    if (!cryptoKey) return
    const list = entries.filter(e => e.id !== id)
    await persistEntries(list, cryptoKey)
  }, [cryptoKey, entries, persistEntries])

  // ─── Change PIN (re-encrypts all entries) ─────────────────
  const changePin = useCallback(async (newPin) => {
    if (!cryptoKey) return false
    await setupPin(newPin, entries)
    return true
  }, [cryptoKey, entries, setupPin])

  // ─── Reset vault ──────────────────────────────────────────
  const resetVault = useCallback(() => {
    localStorage.removeItem(VAULT_KEY)
    localStorage.removeItem(BIO_KEY)
    setCryptoKey(null)
    setEntries([])
    clearTimeout(timerRef.current)
    setTick(t => t + 1)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])

  return {
    // State derived from localStorage (re-evaluated when tick changes)
    isSetup, isUnlocked, isBioEnrolled,
    entries, tick,
    // Auth
    setupPin, unlockPin, unlockBio, lock,
    // Bio
    bioAvailable, enrollBio, removeBio,
    // CRUD
    addEntry, updateEntry, deleteEntry,
    // Admin
    changePin, resetVault,
  }
}
