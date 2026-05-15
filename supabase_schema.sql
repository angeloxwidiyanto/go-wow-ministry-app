-- 1. Tabel `churches` (Master Data Gereja)
CREATE TABLE churches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel `ministry_roles` (Master Data Peran Pelayanan)
CREATE TABLE ministry_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel `people` (Master CRM)
-- Pusat data identitas tunggal jemaat/kontak. Ini adalah profil permanen.
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,                   -- Email Address
    whatsapp_number VARCHAR(25) UNIQUE,          -- Nomor Whatsapp
    full_name VARCHAR(150) NOT NULL,             -- Nama Lengkap
    church_title VARCHAR(100),                   -- Gelar Gerejawi (Pdt, Ev, dll)
    gender VARCHAR(20),                          -- Jenis Kelamin
    birth_date DATE,                             -- Menggantikan age (Usia) untuk kalkulasi dinamis
    church_id UUID REFERENCES churches(id) ON DELETE SET NULL, -- Relasi ke gereja asal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel `person_roles` (Mapping Many-to-Many People <-> Roles)
CREATE TABLE person_roles (
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    role_id UUID REFERENCES ministry_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (person_id, role_id)
);

-- 5. Tabel `events` (Data Acara/Event)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(50) DEFAULT 'SINGLE',     -- 'SINGLE', 'SERIES_PARENT', 'SERIES_CHILD'
    parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end_date TIMESTAMP WITH TIME ZONE,     -- Jika event berlangsung beberapa hari
    location VARCHAR(255),
    meeting_url TEXT,                            -- Virtual meeting URL (e.g. Zoom link)
    is_published BOOLEAN DEFAULT FALSE,
    theme_color VARCHAR(50) DEFAULT 'purple',
    cover_image_url TEXT,
    content_blocks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5.1 Tabel `ticket_tiers` (Tingkat Harga Tiket)
CREATE TABLE ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,                -- Misal: "Early Bird", "Regular", "Paket Rombongan"
    price NUMERIC NOT NULL,                    -- Harga per tiket untuk tier ini
    description TEXT,
    min_qty INTEGER DEFAULT 1,                 -- Minimum pembelian untuk tier ini aktif (misal 5 untuk grup)
    max_qty INTEGER,                           -- Maksimum pembelian (opsional)
    start_date TIMESTAMP WITH TIME ZONE,       -- Kapan harga ini mulai aktif
    end_date TIMESTAMP WITH TIME ZONE,         -- Kapan harga ini berakhir
    capacity INTEGER,                          -- Kuota tiket untuk tier ini (opsional)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5.2 Tabel `event_vouchers` (Daftar voucher diskon)
CREATE TABLE event_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount_amount NUMERIC NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'PERCENT', -- 'PERCENT' or 'FIXED'
    usage_limit INTEGER,                         -- Max times this voucher can be used
    usage_count INTEGER DEFAULT 0,               -- Current usage of this voucher
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, code)
);

-- 6. Tabel `registration_orders` (Data PIC / Transaksi)
-- Menyimpan data submitter (orang yang melakukan pendaftaran/pembayaran).
CREATE TABLE registration_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    pic_name VARCHAR(150) NOT NULL,
    pic_email VARCHAR(255) NOT NULL,
    pic_whatsapp VARCHAR(25) NOT NULL,
    total_tickets INTEGER NOT NULL,
    total_amount NUMERIC DEFAULT 0,              -- Total tagihan akhir setelah diskon
    applied_voucher VARCHAR(50),                 -- Kode voucher yang digunakan
    discount_amount NUMERIC DEFAULT 0,           -- Total nominal diskon
    payment_method VARCHAR(50),                  -- e.g., Bank Transfer, Credit Card, Qris, Cash
    payment_reference_id VARCHAR(255),           -- e.g., Bank Receipt ID, Stripe/Midtrans ID
    payment_proof_url TEXT,                      -- URL to uploaded payment proof image (Supabase Storage)
    status VARCHAR(50) DEFAULT 'PENDING',        -- 'PENDING', 'PAID', 'CANCELLED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel `event_attendees` (Data Peserta Event)
-- Menyimpan individu yang ikut acara. 
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES registration_orders(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id),        -- Nullable, diisi otomatis jika soft-match, atau manual oleh Admin
    ticket_tier_id UUID REFERENCES ticket_tiers(id) ON DELETE SET NULL, -- Tipe tiket yang dibeli
    registration_number VARCHAR(50) UNIQUE NOT NULL, -- No. Registrasi (misal: SING-771-1)
    registration_type VARCHAR(150) NOT NULL,         -- Mendaftar sebagai: (misal: EARLY BIRD) - bisa untuk historis jika tier dihapus
    attendee_name VARCHAR(150) NOT NULL,             -- Nama Lengkap
    attendee_email VARCHAR(255),                     -- Email Address (Nullable)
    attendee_whatsapp VARCHAR(25),                   -- Nomor Whatsapp (Nullable)
    church_title VARCHAR(100),                       -- Gelar Gerejawi (Nullable)
    gender VARCHAR(20),                              -- Jenis Kelamin (Nullable)
    birth_date DATE,                                 -- Tanggal Lahir/Usia (Nullable)
    origin_church VARCHAR(255),                      -- Gereja asal (Nullable)
    ministry_role VARCHAR(255),                      -- Pelayanan yang dilakukan (Nullable)
    attended_at TIMESTAMP WITH TIME ZONE,            -- Timestamp saat check-in (Nullable = belum check-in)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS) Configuration

-- Enable RLS for all tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anonymous users can insert registration orders and attendees
CREATE POLICY "Anon can insert orders" ON registration_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anon can insert attendees" ON event_attendees FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anon can view published events" ON events FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "Anon can view ticket tiers" ON ticket_tiers FOR SELECT TO anon USING (is_active = true);

-- Only authenticated users (admins) can view and modify everything else
CREATE POLICY "Admins full access people" ON people FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access orders" ON registration_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access attendees" ON event_attendees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access events" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access vouchers" ON event_vouchers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access ticket tiers" ON ticket_tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Transactional RPC for Event Registration
-- Menerima payload order dan array of attendees, lalu insert secara atomically.
CREATE OR REPLACE FUNCTION register_for_event(
    p_order_payload JSONB,
    p_attendees_payload JSONB
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_attendee JSONB;
    v_ticket_tier RECORD;
    v_ticket_capacity INTEGER;
    v_current_sold INTEGER;
    v_voucher_record RECORD;
BEGIN
    -- 1. If voucher applied, check and soft-lock voucher
    IF p_order_payload->>'applied_voucher' IS NOT NULL THEN
        SELECT * INTO v_voucher_record 
        FROM event_vouchers 
        WHERE event_id = (p_order_payload->>'event_id')::UUID 
          AND code = p_order_payload->>'applied_voucher'
          AND is_active = TRUE
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Voucher not found or inactive';
        END IF;

        IF v_voucher_record.usage_limit IS NOT NULL AND v_voucher_record.usage_count >= v_voucher_record.usage_limit THEN
            RAISE EXCEPTION 'Voucher usage limit reached';
        END IF;

        IF v_voucher_record.start_date IS NOT NULL AND CURRENT_TIMESTAMP < v_voucher_record.start_date THEN
            RAISE EXCEPTION 'Voucher is not yet active';
        END IF;

        IF v_voucher_record.end_date IS NOT NULL AND CURRENT_TIMESTAMP > v_voucher_record.end_date THEN
            RAISE EXCEPTION 'Voucher is expired';
        END IF;

        -- Update voucher usage count
        UPDATE event_vouchers 
        SET usage_count = usage_count + 1 
        WHERE id = v_voucher_record.id;
    END IF;

    -- 2. Insert Order
    INSERT INTO registration_orders (
        event_id, pic_name, pic_email, pic_whatsapp, total_tickets, 
        total_amount, applied_voucher, discount_amount, payment_method, payment_reference_id, status
    ) VALUES (
        (p_order_payload->>'event_id')::UUID,
        p_order_payload->>'pic_name',
        p_order_payload->>'pic_email',
        p_order_payload->>'pic_whatsapp',
        (p_order_payload->>'total_tickets')::INTEGER,
        (p_order_payload->>'total_amount')::NUMERIC,
        p_order_payload->>'applied_voucher',
        (p_order_payload->>'discount_amount')::NUMERIC,
        p_order_payload->>'payment_method',
        p_order_payload->>'payment_reference_id',
        COALESCE(p_order_payload->>'status', 'PENDING')
    ) RETURNING id INTO v_order_id;

    -- 3. Iterasi Attendees dan Validasi Tiket
    FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_attendees_payload)
    LOOP
        -- Soft-lock ticket tier to prevent race condition on capacity
        SELECT * INTO v_ticket_tier 
        FROM ticket_tiers 
        WHERE id = (v_attendee->>'ticket_tier_id')::UUID
        FOR UPDATE;
        
        IF NOT FOUND OR NOT v_ticket_tier.is_active THEN
            RAISE EXCEPTION 'Ticket tier % not found or inactive', (v_attendee->>'ticket_tier_id');
        END IF;

        IF v_ticket_tier.capacity IS NOT NULL THEN
            -- Check current sold for this tier
            SELECT COUNT(*) INTO v_current_sold 
            FROM event_attendees 
            WHERE ticket_tier_id = v_ticket_tier.id;
            
            IF v_current_sold >= v_ticket_tier.capacity THEN
                RAISE EXCEPTION 'Ticket tier % is sold out', v_ticket_tier.name;
            END IF;
        END IF;

        -- Insert Attendee
        INSERT INTO event_attendees (
            order_id, person_id, ticket_tier_id, registration_number, registration_type,
            attendee_name, attendee_email, attendee_whatsapp, church_title, gender, 
            birth_date, origin_church, ministry_role
        ) VALUES (
            v_order_id,
            NULLIF(v_attendee->>'person_id', '')::UUID,
            v_ticket_tier.id,
            v_attendee->>'registration_number', -- Could be auto-generated using a sequence as well
            v_ticket_tier.name,
            v_attendee->>'attendee_name',
            v_attendee->>'attendee_email',
            v_attendee->>'attendee_whatsapp',
            v_attendee->>'church_title',
            v_attendee->>'gender',
            NULLIF(v_attendee->>'birth_date', '')::DATE,
            v_attendee->>'origin_church',
            v_attendee->>'ministry_role'
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
