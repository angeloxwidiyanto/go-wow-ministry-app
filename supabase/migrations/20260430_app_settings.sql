-- App-wide settings table (key-value store for admin configuration)
create table if not exists app_settings (
  key   text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Seed a placeholder row so the settings page can display the current value
insert into app_settings (key, value)
values ('fonnte_token', '')
on conflict (key) do nothing;
