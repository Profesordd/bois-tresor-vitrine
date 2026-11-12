export type CawlProcessor = 'process-1' | 'walid'

export function orderCawlProcessor(value: unknown): CawlProcessor {
  if (value == null) return 'process-1'
  if (value !== 'process-1' && value !== 'walid') throw new Error('Compte bancaire inconnu.')
  return value
}
export function activeCawlProcessor(): CawlProcessor {
  return orderCawlProcessor(process.env.CAWL_ACTIVE_PROCESSOR ?? 'process-1')
}
export function cawlConfig(processor: CawlProcessor = activeCawlProcessor()) {
  orderCawlProcessor(processor)
  const prefix = processor === 'walid' ? 'CAWL_WALID_' : 'CAWL_'
  const config = {
    url: (process.env[prefix+'API_URL'] ?? 'https://payment.preprod.cawl-solutions.fr').replace(/\/$/, ''),
    merchant: process.env[prefix+'MERCHANT_ID'] ?? '',
    key: process.env[prefix+'API_KEY'] ?? '',
    secret: process.env[prefix+'SECRET_KEY'] ?? '',
  }
  if (!['https://payment.cawl-solutions.fr','https://payment.preprod.cawl-solutions.fr'].includes(config.url)) throw new Error('Configuration bancaire invalide.')
  return config
}
