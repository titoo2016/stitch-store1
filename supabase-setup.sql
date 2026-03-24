-- Stitch Store / Supabase setup
-- شغّل هذا الملف كاملًا داخل Supabase SQL Editor مرة واحدة

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null default 0,
  category text not null,
  description text not null,
  image text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  customer_notes text,
  payment_method text not null default 'الدفع عند الاستلام',
  status text not null default 'جديد',
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- حذف السياسات القديمة لو كانت موجودة
DROP POLICY IF EXISTS "Public can read products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can manage products" ON public.products;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can delete orders" ON public.orders;

-- المنتجات: أي زائر يقدر يشوف المنتجات
create policy "Public can read products"
on public.products
for select
to public
using (true);

-- المنتجات: الأدمن المسجل فقط يقدر يضيف/يعدل/يحذف
create policy "Authenticated can manage products"
on public.products
for all
to authenticated
using (true)
with check (true);

-- الطلبات: أي عميل يقدر ينشئ طلب جديد
create policy "Public can create orders"
on public.orders
for insert
to public
with check (true);

-- الطلبات: الأدمن المسجل فقط يقدر يشوف/يعدل/يحذف الطلبات
create policy "Authenticated can read orders"
on public.orders
for select
to authenticated
using (true);

create policy "Authenticated can update orders"
on public.orders
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete orders"
on public.orders
for delete
to authenticated
using (true);

-- منتجات تجريبية أولية
insert into public.products (name, price, category, description, image)
select * from (
  values
    ('هودي Stitch Urban', 780, 'هودي', 'هودي رجالي بخامة مريحة وطابع ستريت وير مناسب للاستخدام اليومي.', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80'),
    ('بنطال Cargo Stitch', 560, 'بنطال', 'بنطال كارجو عملي بستايل حضري عصري وقصة مريحة.', 'https://images.unsplash.com/photo-1506629905607-d9a3171e3d16?auto=format&fit=crop&w=900&q=80'),
    ('جاكيت Bomber Stitch', 1150, 'جاكيت', 'جاكيت بومبر مميز بتفاصيل قوية ومظهر فاخر.', 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80'),
    ('تيشيرت Stitch Core', 320, 'تيشيرت', 'تيشيرت رجالي بخامة ناعمة وتصميم بسيط مناسب لكل يوم.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'),
    ('شورت Stitch Summer', 390, 'شورت', 'شورت مريح بخامة مناسبة للصيف وحركة أكثر.', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80')
) as seed(name, price, category, description, image)
where not exists (select 1 from public.products limit 1);
