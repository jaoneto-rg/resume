begin;

alter table public.projects add column if not exists description_en text;
alter table public.comments add column if not exists message_en text;

notify pgrst, 'reload schema';

commit;
