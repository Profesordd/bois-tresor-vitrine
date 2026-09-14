import { AlertTriangle, Flame, Building2, Truck } from 'lucide-react'
import Fill from '@/components/ui/Fill'

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
    text: 'Une adresse, un atelier, un numéro de téléphone, et un vrai humain qui décroche.',
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
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 font-serif">Qui sommes-nous</h1>
          <p className="text-brand-100">L’histoire derrière Bois Tresor</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">

        <div className="prose prose-gray max-w-none text-gray-700 space-y-6 text-base leading-relaxed">
          <h2 className="font-serif text-2xl font-bold text-ink">
            Nous, c’est Thomas et Julien — deux frères, une passion du bois.
          </h2>

          <p>
            Je m’appelle Thomas Vallée, j’ai 44 ans, et avec mon frère Julien, on a grandi au
            milieu des forêts du Jura. Chez nous, le bois n’a jamais été une mode écolo : c’était
            la vie. Notre père était bûcheron, notre grand-père aussi. On a appris à reconnaître
            un bon bois sec à l’oreille, rien qu’au son de deux bûches qu’on entrechoque.
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
            <div key={title} className="flex gap-4 bg-brand-50 rounded-2xl p-5">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
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
            c’est le client méfiant au départ qui nous rappelle l’hiver suivant en disant :
            « cette fois, je savais que je pouvais vous faire confiance. »
          </p>

          <p className="font-serif text-xl font-semibold text-ink">
            Bienvenue chez Bois Tresor. Cet hiver, vous serez au chaud — c’est notre métier, et
            notre engagement.
          </p>
        </div>

        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-10 mb-6">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            Il ne manque plus qu’une vraie photo de Thomas et Julien (ou de l’atelier) à la place
            de l’encadré ci-dessous — c’est ce détail qui achève de convaincre un visiteur méfiant.
          </p>
        </div>

        <div className="aspect-video rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 flex items-center justify-center">
          <p className="text-amber-700 text-sm font-medium px-6 text-center">
            Emplacement pour une vraie photo — <Fill>Thomas & Julien / l’atelier</Fill>
          </p>
        </div>
      </div>
    </div>
  )
}
