'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { META_PIXEL_ID } from '@/lib/analytics/meta'
import MetaPageView from '@/components/analytics/MetaPageView'

/**
 * Pixel Meta (Facebook / Instagram) — mesure des campagnes publicitaires.
 *
 * Le script se contente d'initialiser le pixel. Le PageView n'est plus
 * déclenché ici : il part depuis MetaPageView, avec un identifiant partagé
 * avec l'envoi serveur, sans lequel Meta compterait l'événement deux fois.
 *
 * ⚠️ Rien n'est chargé sur l'espace partenaire ni sur l'administration :
 * ni le script, ni fbq, ni l'image noscript. Une vente du partenaire, ou
 * une visite du gérant, ne doit JAMAIS atteindre le Facebook de
 * bois-tresor. Ces pages sont, pour Meta, un autre site.
 */

/** Les pages hors mesure Meta : partenaire (canal distinct) et admin. */
function horsMeta(path: string): boolean {
  return path.startsWith('/partenaire')
    || path.startsWith('/commande/partenaire')
    || path.startsWith('/admin')
}
export default function MetaPixel() {
  const pathname = usePathname()
  /* Aucun pixel sur ces pages : elles appartiennent à un autre univers. */
  if (horsMeta(pathname)) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');`}
      </Script>

      <MetaPageView />

      {/* Le contenu du <noscript> est injecté en HTML brut, et non en JSX :
          rendu par React, l'image serait chargée même avec JavaScript actif,
          et chaque visite compterait deux fois dans Meta. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" />`,
        }}
      />
    </>
  )
}
