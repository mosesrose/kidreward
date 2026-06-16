alter table public.challenges
  add column if not exists value text
    check (value is null or value in (
      'responsibility','kindness','patience','curiosity','courage','empathy'
    ));
