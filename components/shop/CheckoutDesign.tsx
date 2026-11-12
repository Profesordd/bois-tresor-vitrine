'use client'

import { useState, type ChangeEvent, type FormEvent, type FocusEvent, type ReactNode } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, CreditCard, Lock, Minus, Plus, ShieldCheck, Truck } from 'lucide-react'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import './checkout-design.css'
// Avis transmis par le propriétaire le 12 novembre 2026, sans titre ni date ajoutés.
const TESTIMONIALS = [
  { initials: 'PL', name: 'Pierre L.', text: 'Livré en 5 jours, bois très sec et propre. Brûle parfaitement dans ma cheminée. Je recommande.' },
  { initials: 'MD', name: 'Marie D.', text: 'Les granulés sont de très bonne qualité, mon poêle fonctionne au top. Rapport qualité-prix imbattable.' },
  { initials: 'JB', name: 'Jean-Marc B.', text: 'Commande reçue en 4 jours, palette bien emballée. Le bois est sec et calibré. Deuxième commande chez eux.' },
]

interface Client {
  prenom: string; nom: string; email: string; telephone: string
  adresse: string; complement: string; codePostal: string; ville: string; pays: string
}
interface Carte { numero: string; mois: string; annee: string; cvv: string; titulaire: string }
interface Props {
  nom: string; image: string; reference?: string; detail?: string
  montant: number; total: number; quantite: number; maxQuantite: number
  livraison: string; partenaire?: boolean; logoHref: string
  client: Client; carte: Carte; pays: readonly { code: string; nom: string }[]
  majClient: (patch: Partial<Client>) => void
  majCarte: (patch: Partial<Carte>) => void
  saisirNumero: (event: ChangeEvent<HTMLInputElement>) => void
  setQuantite: (quantite: number) => void
  envoyer: (event: FormEvent<HTMLFormElement>) => void
  onBlur?: (event: FocusEvent<HTMLFormElement>) => void
  erreur: string; retourBanque?: string | null; champErreur: { id: string; message: string } | null
  apercu?: boolean; libellePaiement?: string; onEmailBlur?: () => void
  footerActions?: ReactNode
}

/** Présentation seule : les deux formulaires gardent leurs API, validations et suivis propres. */
export default function CheckoutDesign(p: Props) {
  const [avis, setAvis] = useState(0)
  const temoignages = TESTIMONIALS.slice(0, 3)
  const temoignage = temoignages[avis]
  const classe = (id: string) => p.champErreur?.id === id ? 'checkout-invalid' : undefined
  const resume = <>
    <div className="checkout-product-heading">
      <div className="checkout-product-image">
        {p.image ? <Image src={p.image} alt={p.nom} fill sizes="80px" className="checkout-object" /> : <Truck size={28} aria-hidden="true" />}
      </div>
      <h2>{p.nom}</h2>
    </div>
    <div className="checkout-category fixed-category">
      {p.reference && <strong>{p.reference}</strong>}
      {p.detail && <p>{p.detail}</p>}
      <p>{p.livraison}</p>
    </div>
    <div className="summary-line"><span>Prix unitaire TTC</span><strong>{formatPrice(p.montant)}</strong></div>
    <div className="summary-line"><span>Quantité</span>
      {p.maxQuantite > 1 ? <div className="quantity-control">
        <button type="button" aria-label="Retirer une unité" disabled={p.quantite <= 1} onClick={() => p.setQuantite(Math.max(1, p.quantite - 1))}><Minus size={14} /></button>
        <span aria-live="polite">{p.quantite}</span>
        <button type="button" aria-label="Ajouter une unité" disabled={p.quantite >= p.maxQuantite} onClick={() => p.setQuantite(Math.min(p.maxQuantite, p.quantite + 1))}><Plus size={14} /></button>
      </div> : <strong>{p.quantite}</strong>}
    </div>
    <div className="summary-total" aria-live="polite"><span>Total TTC</span><strong>{formatPrice(p.total)}</strong></div>
  </>
  return <div className="bois-checkout" data-checkout={p.partenaire ? 'partenaire' : 'principal'}>
    <header className={`public-header checkout-header${p.partenaire ? ' partner-checkout-header' : ''}`}>
      {p.partenaire
        ? <Image src="/checkout/bois-burban-trustpilot.png" alt="Bois Burban depuis 1995 — Trustpilot : 3 167 avis, Excellent, 4,8 sur 5" width={1280} height={300} priority unoptimized className="partner-checkout-banner" />
        : <a className="checkout-logo" href={p.logoHref} aria-label="Bois Trésor"><span>Bois</span> <span>Trésor</span></a>}
    </header>
    {p.apercu && <p className="checkout-preview-note">Aperçu — aucun paiement ni commande</p>}
    <div className="checkout-main">
      <h1 className="checkout-sr-only">Finaliser ma commande</h1>
      <div className="checkout-timer"><Truck size={19} aria-hidden="true" /><div>
        <span>{p.livraison}</span>
        <small>{p.partenaire ? 'Commande auprès de votre vendeur' : 'Livraison à domicile'}</small>
      </div><strong>Paiement sécurisé</strong></div>
      <details className="mobile-order-summary"><summary><span>Récapitulatif de la commande</span><strong>{formatPrice(p.total)}</strong></summary><div className="mobile-summary-content">{resume}</div></details>
      <div className="checkout-grid">
        <form onSubmit={p.envoyer} onBlur={p.onBlur} noValidate>
          {p.retourBanque && <p className="checkout-return-notice" role="status"><AlertTriangle size={19} />{p.retourBanque}</p>}
          {p.erreur && <p className="checkout-error" role="alert"><AlertTriangle size={19} />{p.erreur}</p>}
          <section className="checkout-section shopify-contact">
            <h2>Contact</h2>
            <label htmlFor="email">Adresse e-mail</label>
            <input id="email" type="email" inputMode="email" autoComplete="email" placeholder="Adresse e-mail" className={classe('email')} value={p.client.email} onBlur={p.onEmailBlur} onChange={e => p.majClient({ email: e.target.value })} />
          </section>
          <section className="checkout-section">
            <h2>Adresse de livraison</h2>
            <div className="two-fields">
              <div><label htmlFor="prenom">Prénom</label><input id="prenom" autoComplete="given-name" className={classe('prenom')} value={p.client.prenom} onChange={e => p.majClient({ prenom: e.target.value })} /></div>
              <div><label htmlFor="nom">Nom</label><input id="nom" autoComplete="family-name" className={classe('nom')} value={p.client.nom} onChange={e => p.majClient({ nom: e.target.value })} /></div>
            </div>
            <label htmlFor="telephone">Téléphone</label><input id="telephone" type="tel" inputMode="tel" autoComplete="tel" className={classe('telephone')} value={p.client.telephone} onChange={e => p.majClient({ telephone: e.target.value })} />
            <label htmlFor="adresse">Adresse de livraison</label><input id="adresse" autoComplete="street-address" className={classe('adresse')} value={p.client.adresse} onChange={e => p.majClient({ adresse: e.target.value })} />
            <label htmlFor="complement">Complément d’adresse (facultatif)</label><input id="complement" autoComplete="address-line2" value={p.client.complement} onChange={e => p.majClient({ complement: e.target.value })} />
            <div className="two-fields">
              <div><label htmlFor="cp">Code postal</label><input id="cp" inputMode="numeric" autoComplete="postal-code" className={classe('cp')} value={p.client.codePostal} onChange={e => p.majClient({ codePostal: e.target.value })} /></div>
              <div><label htmlFor="ville">Ville</label><input id="ville" autoComplete="address-level2" className={classe('ville')} value={p.client.ville} onChange={e => p.majClient({ ville: e.target.value })} /></div>
            </div>
            <label htmlFor="pays">Pays</label><select id="pays" autoComplete="country" value={p.client.pays} onChange={e => p.majClient({ pays: e.target.value })}>{p.pays.map(pays => <option key={pays.code} value={pays.code}>{pays.nom}</option>)}</select>
          </section>
          <section className="checkout-section shopify-payment">
            <h2>Paiement <CreditCard size={18} aria-hidden="true" /></h2>
            <p className="payment-caption">Paiement sécurisé par CAWL. Votre numéro de carte n’est pas conservé.</p>
            <div className="accepted-cards"><strong className="card-method">Carte de crédit</strong><div className="card-brand-logos">
              <Image src="/checkout/visa.svg" alt="Visa" width={38} height={25} />
              <Image src="/checkout/mastercard.svg" alt="Mastercard" width={38} height={25} />
              <span className="cb-logo" aria-label="CB">CB</span>
            </div></div>
            <fieldset disabled={p.apercu}>
              <legend className="checkout-sr-only">Coordonnées de la carte bancaire</legend>
              <label htmlFor="carte">Numéro de carte</label><input id="carte" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" className={classe('carte')} value={p.carte.numero} onChange={p.saisirNumero} />
              <div className="checkout-card-dates">
                <div><label htmlFor="mois">Mois</label><select id="mois" autoComplete="cc-exp-month" className={classe('mois')} value={p.carte.mois} onChange={e => p.majCarte({ mois: e.target.value })}><option value="">MM</option>{Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m}>{m}</option>)}</select></div>
                <div><label htmlFor="annee">Année</label><select id="annee" autoComplete="cc-exp-year" className={classe('mois')} value={p.carte.annee} onChange={e => p.majCarte({ annee: e.target.value })}><option value="">AAAA</option>{Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i)).map(a => <option key={a}>{a}</option>)}</select></div>
                <div><label htmlFor="cvv">Cryptogramme</label><input id="cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={3} className={classe('cvv')} value={p.carte.cvv} onChange={e => p.majCarte({ cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })} /></div>
              </div>
              <label htmlFor="titulaire">Nom inscrit sur la carte</label><input id="titulaire" autoComplete="cc-name" className={classe('titulaire')} value={p.carte.titulaire} onChange={e => p.majCarte({ titulaire: e.target.value })} />
            </fieldset>
            <button className="button primary full checkout-pay" type="submit" disabled={p.apercu}><Lock size={16} />{p.apercu ? 'Aperçu — paiement désactivé' : p.libellePaiement || `Payer ${formatPrice(p.total)}`}</button>
          </section>
          <div className="checkout-reassurance">
            <div className="checkout-benefits client-benefit-badges">
              <div><Truck /><span><strong>{p.livraison}</strong><small>À domicile</small></span></div>
              <div><Lock /><span><strong>Paiement sécurisé</strong><small>Avec CAWL</small></span></div>
              <div><ShieldCheck /><span><strong>Vérification bancaire</strong><small>Authentification sécurisée</small></span></div>
            </div>
            <section className="checkout-reviews" aria-label="Avis clients sur Trustpilot">
              <div className="reviews-heading"><h3>Avis clients</h3><Image src="/checkout/avis-etoiles.png" alt="Avis clients Trustpilot : cinq étoiles" width={128} height={24} /><span className="reviews-brand"><span aria-hidden="true">★</span> Trustpilot</span></div>
              <article aria-live="polite"><p>{temoignage.text}</p><footer><span className="review-initials" aria-hidden="true">{temoignage.initials}</span><em>{temoignage.name}</em></footer></article>
              <div className="review-navigation"><button type="button" aria-label="Avis précédent" onClick={() => setAvis((avis + 2) % 3)}><ChevronLeft size={22} /></button><button type="button" aria-label="Avis suivant" onClick={() => setAvis((avis + 1) % 3)}><ChevronRight size={22} /></button></div>
              <p className="reviews-caption">Découvrez les avis de nos clients · {avis + 1} sur 3</p>
            </section>
          </div>
        </form>
        <aside className="checkout-summary panel" aria-label="Récapitulatif de la commande">{resume}</aside>
      </div>
      {!p.partenaire && <footer className="checkout-footer"><a href="/cgv/">Conditions générales de vente</a><a href="/confidentialite/">Confidentialité</a><a href="/contact/">Contact</a>{p.footerActions}</footer>}
    </div>
    {p.champErreur && <div className="checkout-validation" role="alert"><AlertTriangle size={19} />{p.champErreur.message}</div>}
  </div>
}
