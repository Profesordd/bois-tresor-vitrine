'use client'

export default function NewsletterForm({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: intégrer Resend
  }

  if (variant === 'light') {
    return (
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="votre@email.fr"
          className="flex-1 px-3 py-2 rounded text-gray-900 text-sm focus:outline-none"
        />
        <button
          type="submit"
          className="bg-brand-500 hover:bg-brand-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
        >
          OK
        </button>
      </form>
    )
  }

  return (
    <form
      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      onSubmit={handleSubmit}
    >
      <input
        type="email"
        placeholder="votre@email.fr"
        className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
      />
      <button
        type="submit"
        className="bg-white text-brand-600 hover:bg-brand-50 px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        S&apos;inscrire
      </button>
    </form>
  )
}
