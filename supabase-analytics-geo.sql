-- =============================================
-- BOIS TRESOR — Pays d'origine des visites
--
-- Le pays vient de l'en-tête x-vercel-ip-country, déduit de l'adresse IP
-- par Vercel. Il n'est stocké que sous forme de code à deux lettres :
-- l'adresse IP elle-même n'est jamais enregistrée, ce qui maintient la
-- mesure dans le cadre exempté de consentement.
-- =============================================

alter table analytics_sessions add column if not exists country text;

create index if not exists analytics_sessions_country_idx
  on analytics_sessions (country, started_at desc);
