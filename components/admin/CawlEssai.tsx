'use client'

import { useState, useEffect, useRef } from 'react'
import { CreditCard, Lock, AlertTriangle, Check, Loader2 } from 'lucide-react'

/**
 * Banc d'essai CAWL.
 *
 * Reproduit le parcours complet : saisie de la carte, création du
 * paiement, authentification 3-D Secure dans une iframe, puis capture.
 * Rien n'est enregistré, aucune commande n'est créée. L'écran affiche la
 * réponse brute de CAWL, c'est ce qu'on veut voir à ce stade.
 */

type Etape = 'saisie' | 'envoi' | '3ds' | 'capture' | 'fini' | 'erreur'

/* Mêmes règles que côté serveur, pour prévenir avant l'appel. */
function produitCawl(numero: string): number | null {
  const bin = numero.replace(/\D/g, '').slice(0, 8)
  if (/^4/.test(bin)) return 1
  if (/^5[1-5]/.test(bin) || /^2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(bin)) return 3
  if (/^(50|56|58|67)/.test(bin)) return 130
  return null
}

function luhn(n: string): boolean {
  let somme = 0
  let doubler = false
  for (let i = n.length - 1; i >= 0; i--) {
    let c = parseInt(n[i], 10)
    if (doubler) { c *= 2; if (c > 9) c -= 9 }
    somme += c
    doubler = !doubler
  }
  return somme % 10 === 0
}

const NOM_PRODUIT: Record<number, string> = { 1: 'Visa', 3: 'Mastercard', 130: 'CB' }

export default function CawlEssai({ reel }: { reel: boolean }) {
  const [etape, setEtape] = useState<Etape>('saisie')
  const [erreur, setErreur] = useState('')
  const [journal, setJournal] = useState<string[]>([])
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const paymentIdRef = useRef<string | null>(null)

  const [montant, setMontant] = useState('1.00')
  const [carte, setCarte] = useState({
    numero: '',
    mois: String(new Date().getMonth() + 1).padStart(2, '0'),
    annee: String(new Date().getFullYear() + 2),
    cvv: '',
    titulaire: '',
  })

  const noter = (l: string) => setJournal((j) => [...j, `${new Date().toLocaleTimeString('fr-FR')} · ${l}`])

  /* La page de retour, chargée dans l'iframe par la banque, prévient la
     page parente. Sans ce message, on ne sait pas que le 3-D Secure est
     terminé : la banque ne redirige que l'iframe. */
  useEffect(() => {
    function surMessage(e: MessageEvent) {
      if (e.data?.type !== 'CAWL_RETOUR') return
      const id = paymentIdRef.current
      if (!id) return
      noter('3-D Secure terminé, on capture')
      setIframeUrl(null)
      setEtape('capture')
      void capturer(id)
    }
    window.addEventListener('message', surMessage)
    return () => window.removeEventListener('message', surMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const produit = produitCawl(carte.numero)

  function valider(): string | null {
    const brut = carte.numero.replace(/\D/g, '')
    const cents = Math.round(Number(montant.replace(',', '.')) * 100)
    if (!Number.isInteger(cents) || cents <= 0) return 'Montant invalide'
    if (brut.length < 13 || !luhn(brut)) return 'Numéro de carte invalide'
    if (!produit) return 'Type de carte non reconnu (Visa, Mastercard ou CB)'
    if (!/^\d{3,4}$/.test(carte.cvv)) return 'Cryptogramme invalide'
    if (carte.titulaire.trim().length < 2) return 'Titulaire obligatoire'
    return null
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    const mauvais = valider()
    if (mauvais) { setErreur(mauvais); return }

    setErreur('')
    setJournal([])
    setEtape('envoi')
    noter('Création du paiement')

    try {
      const r = await fetch('/api/admin/cawl/create-payment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montantCents: Math.round(Number(montant.replace(',', '.')) * 100),
          numeroCarte: carte.numero,
          moisExpiration: carte.mois,
          anneeExpiration: carte.annee,
          cvv: carte.cvv,
          titulaire: carte.titulaire,
          produitId: produit,
          essai: `bt-${Date.now()}`,
          navigateur: {
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            colorDepth: window.screen.colorDepth,
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezoneOffsetUtcMinutes: new Date().getTimezoneOffset() * -1,
          },
        }),
      })
      const j = await r.json()
      if (!r.ok || !j.ok) throw new Error(j.error ?? `Erreur ${r.status}`)

      const id = j.data?.payment?.id ?? null
      const action = j.data?.merchantAction
      noter(`Paiement ${id} · statut ${j.data?.payment?.status}`)
      paymentIdRef.current = id

      if (action?.actionType === 'REDIRECT' && action.redirectData?.redirectURL) {
        noter('3-D Secure demandé, ouverture de la page bancaire')
        setIframeUrl(action.redirectData.redirectURL)
        setEtape('3ds')
      } else {
        noter('Pas de 3-D Secure, capture directe')
        setEtape('capture')
        await capturer(id)
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
      noter('Échec de la création')
      setEtape('erreur')
    }
  }

  async function capturer(paymentId: string) {
    try {
      const r = await fetch('/api/admin/cawl/capture-payment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })
      const j = await r.json()
      if (!r.ok || !j.ok) throw new Error(j.error ?? `Erreur ${r.status}`)
      noter(`Capturé · statut ${j.statut} · ${(j.montantCents / 100).toFixed(2)} €`)
      setEtape('fini')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
      noter('Échec de la capture')
      setEtape('erreur')
    }
  }

  const annees = Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i))

  return (
    <div className="space-y-5">
      {reel && (
        <p className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-4 text-[15px] text-red-800">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>Environnement réel.</strong> Toute carte saisie ici sera réellement débitée.
            Pour essayer sans risque, basculez <code>CAWL_API_URL</code> sur
            <code> payment.preprod.cawl-solutions.fr</code>.
          </span>
        </p>
      )}

      {etape === '3ds' && iframeUrl ? (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <p className="px-5 py-3 border-b border-gray-100 text-[15px] text-gray-600">
            Authentification bancaire en cours. Terminez-la ci-dessous.
          </p>
          <iframe
            title="Authentification 3-D Secure"
            src={iframeUrl}
            className="w-full h-[560px] border-0"
          />
        </div>
      ) : (
        <form onSubmit={envoyer} className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <div>
            <label htmlFor="cawl-montant" className="block text-[15px] font-semibold text-ink mb-1.5">
              Montant à débiter
            </label>
            <div className="flex items-center gap-2">
              <input
                id="cawl-montant"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                inputMode="decimal"
                className="w-32 rounded-lg border-2 border-gray-300 px-3.5 py-2.5 text-[17px] focus:outline-none focus:border-brand-600"
              />
              <span className="text-[17px] text-gray-600">€</span>
            </div>
          </div>

          <div>
            <label htmlFor="cawl-numero" className="block text-[15px] font-semibold text-ink mb-1.5">
              Numéro de carte
            </label>
            <input
              id="cawl-numero"
              value={carte.numero}
              onChange={(e) => setCarte({ ...carte, numero: e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim() })}
              inputMode="numeric"
              autoComplete="off"
              placeholder="4000 0000 0000 0002"
              className="w-full rounded-lg border-2 border-gray-300 px-3.5 py-2.5 text-[17px] font-mono focus:outline-none focus:border-brand-600"
            />
            {produit && (
              <p className="text-[13px] text-gray-500 mt-1">
                Reconnue comme <strong>{NOM_PRODUIT[produit]}</strong> (paymentProductId {produit})
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="cawl-mois" className="block text-[14px] font-semibold text-ink mb-1.5">Mois</label>
              <select
                id="cawl-mois"
                value={carte.mois}
                onChange={(e) => setCarte({ ...carte, mois: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-2 py-2.5 text-[16px] focus:outline-none focus:border-brand-600"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cawl-annee" className="block text-[14px] font-semibold text-ink mb-1.5">Année</label>
              <select
                id="cawl-annee"
                value={carte.annee}
                onChange={(e) => setCarte({ ...carte, annee: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-2 py-2.5 text-[16px] focus:outline-none focus:border-brand-600"
              >
                {annees.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cawl-cvv" className="block text-[14px] font-semibold text-ink mb-1.5">Crypto.</label>
              <input
                id="cawl-cvv"
                value={carte.cvv}
                onChange={(e) => setCarte({ ...carte, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                inputMode="numeric"
                autoComplete="off"
                className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 text-[16px] font-mono focus:outline-none focus:border-brand-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cawl-titulaire" className="block text-[15px] font-semibold text-ink mb-1.5">
              Titulaire
            </label>
            <input
              id="cawl-titulaire"
              value={carte.titulaire}
              onChange={(e) => setCarte({ ...carte, titulaire: e.target.value })}
              autoComplete="off"
              placeholder="JEAN DUPONT"
              className="w-full rounded-lg border-2 border-gray-300 px-3.5 py-2.5 text-[17px] focus:outline-none focus:border-brand-600"
            />
          </div>

          {erreur && (
            <p className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-[15px] text-red-800">
              <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" />
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={etape === 'envoi' || etape === 'capture'}
            className="w-full py-3.5 rounded-lg font-bold text-[17px] flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white"
          >
            {etape === 'envoi' || etape === 'capture'
              ? <><Loader2 size={19} className="animate-spin" /> En cours…</>
              : <><CreditCard size={19} /> Lancer le paiement</>}
          </button>

          <p className="flex items-center gap-2 text-[13px] text-gray-500">
            <Lock size={13} className="text-brand-600" />
            Les coordonnées saisies ici partent chez CAWL et ne sont jamais enregistrées.
          </p>
        </form>
      )}

      {etape === 'fini' && (
        <p className="flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 p-4 font-semibold text-brand-800">
          <Check size={19} className="text-brand-600" />
          Paiement capturé. La chaîne fonctionne de bout en bout.
        </p>
      )}

      {journal.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-900 p-4">
          <p className="text-[13px] font-semibold text-gray-300 mb-2">Déroulé</p>
          <ol className="space-y-1">
            {journal.map((l, i) => (
              <li key={i} className="font-mono text-[13px] text-gray-100 break-all">{l}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
