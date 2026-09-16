import Script from 'next/script'
import { META_PIXEL_ID } from '@/lib/analytics/meta'
import MetaPageView from '@/components/analytics/MetaPageView'

/**
 * Pixel Meta (Facebook / Instagram) — mesure des campagnes publicitaires.
 *
 * Le script se contente d'initialiser le pixel. Le PageView n'est plus
 * déclenché ici : il part depuis MetaPageView, avec un identifiant partagé
 * avec l'envoi serveur, sans lequel Meta compterait l'événement deux fois.
 */
export default function MetaPixel() {
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
