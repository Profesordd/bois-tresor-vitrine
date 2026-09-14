import Image from 'next/image'
import { Flame, Building2, Truck } from 'lucide-react'

export const metadata = { title: 'Qui sommes-nous' }

const PROMISES = [
  {
    icon: Flame,
    title: 'Un bois sec, prêt à brûler',
    text: 'Moins de 20 % d’humidité, séché entre 18 et 24 mois. Pas de bois vert qui fume et qui ne chauffe pas.',
  },
  {
    icon: Building2,
    title: 'Une vraie entreprise française',
    text: 'Une adresse, un atelier, une vraie adresse e-mail, et un vrai humain qui vous répond.',
  },
  {
    icon: Truck,
    title: 'Une livraison suivie jusque chez vous',
    text: 'Un suivi à chaque étape — parce qu’on sait que la pire angoisse, c’est de payer et d’attendre dans le vide.',
  },
]

export default function AProposPage() {
  return (
    <div>
      <div className="bg-brand-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 font-serif">Qui sommes-nous</h1>
          <p className="text-brand-100">L’histoire derrière Bois Tresor</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">

        <div className="prose prose-gray max-w-none text-gray-700 space-y-6 text-base leading-relaxed">
          <h2 className="font-serif text-2xl font-bold text-ink">
            Nous, c’est Jean-Paul et Julien — deux frères, une passion du bois.
          </h2>
        </div>

        <figure className="my-8">
          <div className="relative aspect-[16/10] rounded-lg overflow-hidden shadow-sm">
            <Image
              src="/equipe.jpg"
              alt="Jean-Paul et Julien devant leur stock de bûches de bois"
              fill
              className="object-cover"
              priority
            />
          </div>
          <figcaption className="text-center text-sm text-gray-400 mt-2">
            Jean-Paul (à gauche) et Julien (à droite), dans leur dépôt de bois.
          </figcaption>
        </figure>

        <div className="prose prose-gray max-w-none text-gray-700 space-y-6 text-base leading-relaxed">
          <p>
            Je m’appelle Jean-Paul, j’ai 44 ans, et avec mon frère Julien, on a grandi au
            milieu des forêts du Jura. Chez nous, le bois n’a jamais été une mode écolo : c’était
            la vie. Notre père était bûcheron, notre grand-père aussi. On a appris à reconnaître
            un bon bois sec à l’oreille, rien qu’au son de deux bûches qu’on entrechoque.
          </p>

          <p className="font-semibold text-ink">
            On se chauffe nous-mêmes au bois, comme vous : on sait ce que c’est d’attendre une
            livraison en plein hiver, et de se demander si elle arrivera.
          </p>

          <p>
            Il y a quelques années, un voisin nous a raconté comment il s’était fait avoir en
            commandant du bois sur internet : payé d’avance, jamais livré, et impossible de
            joindre qui que ce soit. Ça nous a mis en colère. On s’est dit qu’on pouvait faire ce
            métier autrement — honnêtement, comme on nous l’a appris.
          </p>

          <p className="font-semibold text-ink">
            C’est comme ça qu’est né Bois Tresor. On y a mis tout ce qui nous aurait rassurés,
            nous, en tant que clients :
          </p>
        </div>

        <div className="grid gap-6 my-10">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 bg-brand-50 rounded-lg p-5">
              <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon size={22} className="text-brand-600" />
              </div>
              <div>
                <h3 className="font-bold text-ink mb-1">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="prose prose-gray max-w-none text-gray-700 space-y-6 text-base leading-relaxed">
          <p>
            On ne sera jamais le site le moins cher d’internet, et c’est assumé : on veut être
            celui sur lequel vous pouvez compter, année après année. Notre plus belle récompense,
            c’est le client méfiant au départ qui revient commander l’hiver suivant en nous
            écrivant : « cette fois, je savais que je pouvais vous faire confiance. »
          </p>

          <p className="font-serif text-xl font-semibold text-ink">
            Bienvenue chez Bois Tresor. Cet hiver, vous serez au chaud — c’est notre métier, et
            notre engagement.
          </p>
        </div>
      </div>
    </div>
  )
}
