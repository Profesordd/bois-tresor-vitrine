-- Bascule bancaire additive. Historique sur process-1 ; aucun statut/montant réécrit.
begin;
set local lock_timeout = '5s';
alter table public.commandes add column if not exists cawl_processor text not null default 'process-1' check (cawl_processor in ('process-1','walid'));

create or replace function public.preserve_cawl_processor() returns trigger language plpgsql set search_path = public as $$
begin
  if new.cawl_processor is distinct from old.cawl_processor then raise exception 'Compte bancaire immuable'; end if;
  return new;
end; $$;
drop trigger if exists preserve_cawl_processor on public.commandes;
create trigger preserve_cawl_processor before update on public.commandes for each row execute function public.preserve_cawl_processor();
notify pgrst, 'reload schema';
commit;
