# MEU SOCIO — ARQUITETURA COMPLETA DO SISTEMA
**Versao 1.0 | Março 2026**

---

## 1. OVERVIEW DO SISTEMA

### Filosofia do Produto

O Meu Socio nao e um ERP. Nao e um CRM enterprise. E o **caderninho digital** que o autonomo ja queria ter, mas nunca encontrou. Toda decisao arquitetural parte de 3 principios:

1. **Simplicidade brutal** — Se o usuario precisa pensar, ja perdemos. O MVP em HTML+localStorage prova que a essencia funciona com zero complexidade. A migracao para SaaS nao pode adicionar fricao.

2. **Mobile-first real** — 90%+ do uso sera no celular Android, em redes 4G medianas. Cada KB importa. Cada toque importa. Bottom tabs com 4 itens + "Mais". Modais que sobem do rodape. Nada de menus hamburger escondidos.

3. **5 minutos por dia** — O fluxo diario e: abrir → ver dashboard → confirmar atendimento → marcar como realizado → fechar. Se demorar mais que isso, falhamos.

### Decisoes Criticas Baseadas no Perfil do Usuario

| Decisao | Motivo |
|---------|--------|
| PWA, nao app nativo | Sem fricao de instalar pela loja. Link → "Adicionar a tela inicial" → pronto |
| Supabase Auth com Magic Link | Leigos esquecem senha. Magic link via email/WhatsApp e mais seguro e simples |
| Toda logica critica no banco | Usuario leigo = frontend vulneravel. RLS + functions no Postgres blindam os dados |
| Zero graficos complexos na v1 | Numeros grandes e coloridos > graficos de linha que ninguem le |
| Labels em portugues BR coloquial | "Clientes sumidos" > "Clientes inativos". "Quanto entrou" > "Receita bruta" |

---

## 2. ARQUITETURA DE ALTO NIVEL

### Diagrama Textual

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser/PWA)                     │
│  Next.js 14 (App Router) — React — Zustand — React Query        │
│  Hospedado na Vercel (CDN Global, Edge Network)                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS (REST + Realtime)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                  │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │  Auth         │  │  PostgreSQL   │  │  Edge Functions      │     │
│  │  (Magic Link, │  │  (Dados +     │  │  (Logica critica,   │     │
│  │   Google,     │  │   RLS +       │  │   webhooks,         │     │
│  │   Email)      │  │   Functions)  │  │   integracoes)      │     │
│  └──────────────┘  └──────────────┘  └─────────────────────┘     │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐                               │
│  │  Storage      │  │  Realtime     │                               │
│  │  (Fotos de   │  │  (Updates     │                               │
│  │   perfil)    │  │   live)       │                               │
│  └──────────────┘  └──────────────┘                               │
└──────────────────────┬─────────────┬────────────┬────────────────┘
                       │             │            │
              ┌────────▼──┐   ┌──────▼─────┐  ┌──▼───────────┐
              │ Mercado    │   │ WhatsApp   │  │ NFe.io       │
              │ Pago API   │   │ API        │  │ (NFS-e)      │
              │ (Pagtos +  │   │ (Twilio/   │  │              │
              │  Assina-   │   │  Z-API)    │  │              │
              │  turas)    │   │            │  │              │
              └───────────┘   └────────────┘  └──────────────┘
```

### Fluxo de Dados Completo

```
1. Usuario abre PWA → Next.js serve pagina estatica (ISR) via Vercel CDN
2. Supabase Auth valida sessao (JWT no cookie httpOnly)
3. Frontend faz queries via @supabase/ssr → PostgreSQL aplica RLS automaticamente
4. Escrita de dados: INSERT/UPDATE via Supabase Client → RLS valida user_id
5. Logica critica (ex: marcar atendimento como Realizado):
   → Frontend chama RPC (database function)
   → Function no Postgres: atualiza appointment + cria financial_entry + atualiza client_history
   → Tudo em uma transacao atomica
6. Webhooks externos (Mercado Pago, WhatsApp):
   → Chamam Edge Functions no Supabase
   → Edge Function valida assinatura → atualiza banco
```

### Como o Frontend Conversa com o Supabase

```typescript
// Inicializacao — arquivo: lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Leitura — o RLS filtra automaticamente pelo user_id do JWT
const { data: clients } = await supabase
  .from('clients')
  .select('*')
  .order('name')

// Escrita — user_id e injetado automaticamente via trigger
const { error } = await supabase
  .from('clients')
  .insert({ name: 'Maria', phone: '22999991234' })

// Logica critica — chama function no banco
const { data, error } = await supabase
  .rpc('complete_appointment', {
    p_appointment_id: 'uuid-aqui',
    p_final_value: 350.00,
    p_notes: 'Tudo ok'
  })
```

### Onde Ficam as Regras de Negocio

| Camada | O que fica aqui | Exemplos |
|--------|----------------|----------|
| **PostgreSQL (Functions + Triggers)** | Toda logica que envolve consistencia de dados | Completar atendimento → gerar receita. Calcular status do cliente. Validar conflito de horario |
| **Edge Functions (Supabase)** | Integracoes externas + webhooks | Receber webhook do Mercado Pago. Enviar lembrete WhatsApp. Emitir NFS-e |
| **Frontend (Next.js)** | Apenas UI, validacao de formulario, estado local | Mascara de telefone. Validar campos obrigatorios. Navegacao entre telas |

**Regra de ouro:** Se a regra protege dinheiro ou dados, ela vai no banco. Se e cosmetica, vai no frontend.

---

## 3. MODELAGEM DE BANCO DE DADOS

### 3.1 Tabela: `profiles`

Supabase Auth ja cria a tabela `auth.users`. A tabela `profiles` estende com dados do negocio.

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  business_name TEXT NOT NULL DEFAULT 'Meu Negocio',
  trade         TEXT DEFAULT 'MEI',              -- ramo de atividade
  document      TEXT,                             -- CNPJ ou CPF
  phone         TEXT,
  email         TEXT,
  instagram     TEXT,
  website       TEXT,
  address       TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para criar profile automaticamente ao cadastrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 3.2 Tabela: `settings`

```sql
CREATE TABLE settings (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reactivation_days      INT NOT NULL DEFAULT 30,    -- dias sem retorno → "Reativar"
  recurrence_min_visits  INT NOT NULL DEFAULT 3,     -- visitas minimas → "Recorrente"
  monthly_goal           NUMERIC(10,2) DEFAULT 0,
  notify_birthday        BOOLEAN NOT NULL DEFAULT true,
  notify_das             BOOLEAN NOT NULL DEFAULT true,
  notify_inactive        BOOLEAN NOT NULL DEFAULT true,
  notify_fixed_expenses  BOOLEAN NOT NULL DEFAULT true,
  daily_cost_enabled     BOOLEAN NOT NULL DEFAULT false,
  daily_cost_value       NUMERIC(10,2) DEFAULT 0,
  show_upsell_field      BOOLEAN NOT NULL DEFAULT true,
  show_deposit_field     BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.3 Tabela: `services`

```sql
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration    TEXT,                                -- "1h", "2h", "1 dia"
  cost        NUMERIC(10,2) NOT NULL DEFAULT 0,   -- CMV do servico
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_service_name_user UNIQUE(user_id, name)
);

CREATE INDEX idx_services_user ON services(user_id);
```

### 3.4 Tabela: `clients`

```sql
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,                       -- codigo visivel: #00142
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  instagram   TEXT,
  birth_date  DATE,
  source      TEXT DEFAULT 'Indicacao',            -- como chegou
  notes       TEXT,
  custom_data JSONB DEFAULT '{}',                  -- campos personalizados
  is_removed_from_reactivation BOOLEAN DEFAULT false,
  is_removed_from_recurrence   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_name ON clients(user_id, name);
CREATE INDEX idx_clients_code ON clients(user_id, code);
CREATE UNIQUE INDEX uq_clients_code ON clients(user_id, code);
```

### 3.5 Tabela: `appointments`

```sql
CREATE TYPE appointment_status AS ENUM (
  'scheduled',    -- agendado
  'confirmed',    -- confirmado
  'completed',    -- realizado
  'rescheduled',  -- remarcou
  'no_show',      -- faltou
  'cancelled'     -- cancelou
);

CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name    TEXT NOT NULL,                    -- denormalizado para historico
  scheduled_date  DATE NOT NULL,
  scheduled_time  TIME NOT NULL,
  estimated_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_value     NUMERIC(10,2),                   -- preenchido ao completar
  status          appointment_status NOT NULL DEFAULT 'scheduled',
  is_free_return  BOOLEAN NOT NULL DEFAULT false,   -- retorno gratuito
  notes           TEXT,
  upsell_service  TEXT,
  upsell_value    NUMERIC(10,2) DEFAULT 0,
  next_return     DATE,                             -- proximo retorno sugerido
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_user_date ON appointments(user_id, scheduled_date);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(user_id, status);
CREATE INDEX idx_appointments_month ON appointments(user_id, scheduled_date)
  WHERE status = 'completed';
```

### 3.6 Tabela: `financial_entries`

```sql
CREATE TYPE entry_type AS ENUM ('income', 'expense');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'partial');
CREATE TYPE expense_category AS ENUM ('variable', 'fixed', 'cmv', 'daily_cost');

CREATE TABLE financial_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            entry_type NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  description     TEXT NOT NULL,
  entry_date      DATE NOT NULL,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name     TEXT,                             -- denormalizado
  service_name    TEXT,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  status          payment_status DEFAULT 'paid',    -- so para income
  expense_category expense_category,                -- so para expense
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_user_date ON financial_entries(user_id, entry_date);
CREATE INDEX idx_financial_type ON financial_entries(user_id, type);
CREATE INDEX idx_financial_month ON financial_entries(user_id, entry_date, type);
CREATE INDEX idx_financial_pending ON financial_entries(user_id, status)
  WHERE type = 'income' AND status = 'pending';
```

### 3.7 Tabela: `fixed_expenses`

```sql
CREATE TABLE fixed_expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  amount        NUMERIC(10,2) NOT NULL,
  due_day       INT CHECK (due_day BETWEEN 1 AND 31),
  category      TEXT DEFAULT 'Outros',
  notify        BOOLEAN NOT NULL DEFAULT true,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fixed_expenses_user ON fixed_expenses(user_id);
```

### 3.8 Tabela: `client_history`

```sql
CREATE TABLE client_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,    -- 'completed', 'cancelled', 'no_show', 'note'
  event_date      DATE NOT NULL,
  service_name    TEXT,
  value           NUMERIC(10,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_client ON client_history(client_id);
CREATE INDEX idx_history_user_date ON client_history(user_id, event_date);
```

### 3.9 Tabela: `custom_fields`

```sql
CREATE TABLE custom_fields (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  field_type  TEXT NOT NULL DEFAULT 'texto',  -- texto, select, checkbox, data
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_fields_user ON custom_fields(user_id);
```

### Diagrama de Relacionamentos

```
auth.users (Supabase)
    │
    ├── 1:1 ── profiles
    ├── 1:1 ── settings
    ├── 1:N ── services
    ├── 1:N ── clients ──────── 1:N ── client_history
    │              │
    │              └──────────── 1:N ── appointments ── 1:1 ── financial_entries
    │
    ├── 1:N ── financial_entries (tambem sem appointment)
    ├── 1:N ── fixed_expenses
    └── 1:N ── custom_fields
```

---

## 4. ROW LEVEL SECURITY (RLS)

### Principio Central

**O usuario NUNCA acessa dados de outro usuario.** Isso e garantido no banco, nao no frontend. Mesmo que alguem injete JavaScript no browser, o PostgreSQL bloqueia.

### Habilitando RLS em Todas as Tabelas

```sql
-- Habilitar RLS em cada tabela
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
```

### Policies — Profiles

```sql
-- Cada usuario so ve e edita seu proprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Policies — Padrao Multi-tenant (aplicar em todas as tabelas com user_id)

```sql
-- Template: aplicar para services, clients, appointments,
-- financial_entries, fixed_expenses, client_history, custom_fields

-- Exemplo completo para CLIENTS:
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);
```

### Auto-preenchimento do user_id via Trigger

```sql
-- Trigger para injetar user_id automaticamente em todo INSERT
-- Assim o frontend NUNCA precisa enviar user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar em cada tabela com user_id
CREATE TRIGGER set_user_id_clients
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_appointments
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_financial
  BEFORE INSERT ON financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- (repetir para services, fixed_expenses, client_history, custom_fields)
```

### Policy para Settings (1:1)

```sql
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 5. MODULOS DO SISTEMA — TRADUCAO PARA ARQUITETURA

### 5.1 Dashboard

**Objetivo:** Em 3 segundos o usuario sabe como esta seu negocio hoje.

**Queries necessarias (todas com RLS automatico):**

```sql
-- 1. KPIs do mes (1 query unica com subqueries)
SELECT
  -- A receber
  (SELECT COALESCE(SUM(amount), 0) FROM financial_entries
   WHERE user_id = auth.uid() AND type = 'income' AND status = 'pending') AS pending_income,

  -- Atendimentos realizados no mes
  (SELECT COUNT(*) FROM appointments
   WHERE user_id = auth.uid() AND status = 'completed'
   AND scheduled_date >= date_trunc('month', CURRENT_DATE)) AS completed_this_month,

  -- Faturamento bruto do mes
  (SELECT COALESCE(SUM(final_value), 0) FROM appointments
   WHERE user_id = auth.uid() AND status = 'completed'
   AND scheduled_date >= date_trunc('month', CURRENT_DATE)
   AND is_free_return = false) AS revenue_this_month,

  -- Despesas do mes
  (SELECT COALESCE(SUM(amount), 0) FROM financial_entries
   WHERE user_id = auth.uid() AND type = 'expense'
   AND entry_date >= date_trunc('month', CURRENT_DATE)) AS expenses_this_month,

  -- Agendamentos hoje
  (SELECT COUNT(*) FROM appointments
   WHERE user_id = auth.uid() AND scheduled_date = CURRENT_DATE
   AND status IN ('scheduled', 'confirmed')) AS today_count;
```

```sql
-- 2. Proximo atendimento
SELECT a.*, c.name AS client_name
FROM appointments a
JOIN clients c ON c.id = a.client_id
WHERE a.user_id = auth.uid()
  AND a.scheduled_date >= CURRENT_DATE
  AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.scheduled_date, a.scheduled_time
LIMIT 1;
```

```sql
-- 3. Atendimentos de hoje (resumo do dia)
SELECT a.*, c.name AS client_name
FROM appointments a
JOIN clients c ON c.id = a.client_id
WHERE a.user_id = auth.uid()
  AND a.scheduled_date = CURRENT_DATE
ORDER BY a.scheduled_time;
```

**Estrategia de performance:**
- Todas as queries usam indices ja definidos (`idx_appointments_user_date`, `idx_financial_user_date`)
- Nenhum `COUNT(*)` sobre tabela inteira — sempre filtrado por mes/dia
- Dashboard faz **3 queries paralelas** via `Promise.all()` no frontend
- Cache via React Query com `staleTime: 30_000` (30s) — evita recarregar ao navegar entre abas
- **Sem graficos pesados** — apenas numeros, barras CSS simples, e listas curtas

### 5.2 Clientes

**Logica de status automatico — calculado dinamicamente via VIEW:**

```sql
CREATE OR REPLACE VIEW clients_with_status AS
SELECT
  c.*,
  stats.total_visits,
  stats.last_visit,
  stats.total_spent,
  stats.last_service,
  CASE
    WHEN c.is_removed_from_reactivation THEN NULL
    WHEN stats.last_visit IS NOT NULL
     AND stats.last_visit < CURRENT_DATE - (
       SELECT reactivation_days FROM settings WHERE user_id = c.user_id
     )
     AND NOT EXISTS (
       SELECT 1 FROM appointments
       WHERE client_id = c.id
         AND status IN ('scheduled', 'confirmed')
         AND scheduled_date >= CURRENT_DATE
     )
    THEN true
    ELSE false
  END AS needs_reactivation,
  CASE
    WHEN c.is_removed_from_recurrence THEN false
    WHEN stats.total_visits >= (
      SELECT recurrence_min_visits FROM settings WHERE user_id = c.user_id
    )
    THEN true
    ELSE false
  END AS is_recurrent
FROM clients c
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS total_visits,
    MAX(scheduled_date) AS last_visit,
    SUM(COALESCE(final_value, estimated_value)) AS total_spent,
    (SELECT service_name FROM appointments
     WHERE client_id = c.id AND status = 'completed'
     ORDER BY scheduled_date DESC LIMIT 1) AS last_service
  FROM appointments
  WHERE client_id = c.id AND status = 'completed'
) stats ON true;
```

**Por que VIEW e nao campo armazenado?**
- Status muda automaticamente com o tempo (dias sem retorno aumentam)
- Evita jobs de atualizacao e inconsistencia
- Performance aceitavel ate 100k clientes com os indices corretos
- A VIEW usa `LATERAL JOIN` que e eficiente no PostgreSQL

### 5.3 Agenda

**Estrutura de estados e transicoes:**

```
scheduled (agendado)
    ├── → confirmed (confirmado)
    │       ├── → completed (realizado) ──→ gera receita
    │       ├── → no_show (faltou)
    │       ├── → cancelled (cancelou)
    │       └── → rescheduled (remarcou) ──→ cria novo appointment
    ├── → completed
    ├── → no_show
    ├── → cancelled
    └── → rescheduled
```

**Impacto no financeiro (via Database Function):**

```sql
CREATE OR REPLACE FUNCTION complete_appointment(
  p_appointment_id UUID,
  p_final_value NUMERIC,
  p_is_free_return BOOLEAN DEFAULT false,
  p_notes TEXT DEFAULT NULL,
  p_upsell_service TEXT DEFAULT NULL,
  p_upsell_value NUMERIC DEFAULT 0
)
RETURNS void AS $$
DECLARE
  v_appointment appointments%ROWTYPE;
  v_service_cost NUMERIC := 0;
BEGIN
  -- Buscar atendimento (RLS ja valida ownership)
  SELECT * INTO v_appointment FROM appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Atualizar status do atendimento
  UPDATE appointments SET
    status = 'completed',
    final_value = p_final_value,
    is_free_return = p_is_free_return,
    notes = COALESCE(p_notes, notes),
    upsell_service = p_upsell_service,
    upsell_value = p_upsell_value,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_appointment_id;

  -- Gerar receita (se nao for retorno gratuito)
  IF NOT p_is_free_return AND p_final_value > 0 THEN
    INSERT INTO financial_entries
      (user_id, type, amount, description, entry_date, client_id,
       client_name, service_name, appointment_id, status)
    VALUES
      (v_appointment.user_id, 'income', p_final_value + p_upsell_value,
       v_appointment.service_name, v_appointment.scheduled_date,
       v_appointment.client_id,
       (SELECT name FROM clients WHERE id = v_appointment.client_id),
       v_appointment.service_name, p_appointment_id, 'paid');
  END IF;

  -- Gerar despesa CMV automaticamente
  SELECT cost INTO v_service_cost FROM services
  WHERE id = v_appointment.service_id;

  IF v_service_cost > 0 THEN
    INSERT INTO financial_entries
      (user_id, type, amount, description, entry_date,
       appointment_id, expense_category)
    VALUES
      (v_appointment.user_id, 'expense', v_service_cost,
       'CMV: ' || v_appointment.service_name,
       v_appointment.scheduled_date, p_appointment_id, 'cmv');
  END IF;

  -- Registrar no historico do cliente
  INSERT INTO client_history
    (user_id, client_id, appointment_id, event_type, event_date,
     service_name, value, notes)
  VALUES
    (v_appointment.user_id, v_appointment.client_id, p_appointment_id,
     'completed', v_appointment.scheduled_date,
     v_appointment.service_name, p_final_value, p_notes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.4 Financeiro

**Modelagem:**

| Tipo | Onde vem | Status | CMV |
|------|----------|--------|-----|
| Receita automatica | `complete_appointment()` | `paid` | CMV gerado junto |
| Receita manual | Formulario "Nova Receita" | `paid` / `pending` / `partial` | N/A |
| Despesa variavel | Formulario "Nova Despesa" | N/A | N/A |
| Despesa fixa mensal | `fixed_expenses` → lancada no inicio do mes | N/A | N/A |
| CMV automatico | `complete_appointment()` | N/A | `cmv` |
| Custo diario | Lancado por dia com atendimento realizado | N/A | `daily_cost` |

**Retorno gratuito:**
- `is_free_return = true` no appointment
- A function `complete_appointment` **nao gera** financial_entry de income
- Mas **registra** no `client_history` normalmente
- Resultado: historico completo, financeiro limpo

### 5.5 Configuracoes

**Parametros por usuario** armazenados na tabela `settings` (1:1 com user):

```typescript
// Valores padrao no frontend (fallback se settings nao existe)
const DEFAULT_SETTINGS = {
  reactivation_days: 30,
  recurrence_min_visits: 3,
  monthly_goal: 0,
  notify_birthday: true,
  notify_das: true,
  notify_inactive: true,
  notify_fixed_expenses: true,
  daily_cost_enabled: false,
  daily_cost_value: 0,
  show_upsell_field: true,
  show_deposit_field: false,
}
```

---

## 6. BACKEND / API

### Quando Usar Apenas Supabase vs API Customizada

| Cenario | Solucao | Motivo |
|---------|---------|--------|
| CRUD simples (clientes, servicos, despesas) | Supabase Client direto | RLS ja protege. Zero codigo backend necessario |
| Completar atendimento | Database Function (RPC) | Transacao atomica: atualiza 3 tabelas de uma vez |
| Remarcar atendimento | Database Function (RPC) | Cria novo appointment + atualiza status do antigo |
| Receber webhook Mercado Pago | Edge Function | Precisa validar assinatura HMAC + acessar banco como service_role |
| Enviar lembrete WhatsApp | Edge Function (cron) | Precisa chamar API externa + rodar em schedule |
| Emitir NFS-e | Edge Function | Chamada para API externa NFe.io |
| Calcular dashboard | Database View + queries | Performance melhor que processar no frontend |

### Estrutura de Edge Functions

```
supabase/functions/
├── webhook-mercadopago/     # Recebe eventos de pagamento
│   └── index.ts
├── send-whatsapp/           # Envia mensagens via Twilio/Z-API
│   └── index.ts
├── emit-nfse/               # Emite nota fiscal via NFe.io
│   └── index.ts
├── daily-reminders/         # Cron: lembretes 24h antes
│   └── index.ts
└── generate-fixed-expenses/ # Cron: lanca despesas fixas no inicio do mes
    └── index.ts
```

### Exemplo: Edge Function de Webhook Mercado Pago

```typescript
// supabase/functions/webhook-mercadopago/index.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // service_role bypassa RLS
)

Deno.serve(async (req) => {
  // 1. Validar assinatura HMAC do Mercado Pago
  const signature = req.headers.get('x-signature')
  const body = await req.json()

  if (!validateSignature(signature, body)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // 2. Processar evento
  if (body.type === 'payment' && body.action === 'payment.updated') {
    const paymentId = body.data.id

    // Buscar detalhes do pagamento na API do Mercado Pago
    const payment = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` } }
    ).then(r => r.json())

    if (payment.status === 'approved') {
      // Atualizar status da assinatura no banco
      await supabase
        .from('subscriptions')
        .update({ status: 'active', paid_until: payment.date_approved })
        .eq('mp_subscription_id', payment.external_reference)
    }
  }

  return new Response('OK', { status: 200 })
})
```

### Validacao de Dados

**Onde validar:**

| Camada | O que valida | Como |
|--------|-------------|------|
| Frontend | Campos obrigatorios, formato (telefone, email) | Zod schema no formulario |
| Database | Constraints, tipos, NOT NULL, CHECK | DDL do PostgreSQL |
| Functions | Logica de negocio (ex: nao pode completar appointment ja completado) | IF/RAISE dentro da function |

```typescript
// Exemplo: schema Zod para validacao no frontend
import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(2, 'Nome obrigatorio'),
  phone: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  birth_date: z.string().optional(),
  source: z.string().default('Indicacao'),
})

export const appointmentSchema = z.object({
  client_id: z.string().uuid('Selecione um cliente'),
  service_id: z.string().uuid('Selecione um servico'),
  scheduled_date: z.string().min(1, 'Data obrigatoria'),
  scheduled_time: z.string().min(1, 'Horario obrigatorio'),
  estimated_value: z.number().min(0),
})
```

---

## 7. FRONTEND — FOCO TOTAL EM MOBILE

### Estrutura de Paginas (Next.js App Router)

```
app/
├── layout.tsx              # Shell: auth guard + bottom tabs + sidebar
├── page.tsx                # Redirect → /dashboard
├── (auth)/
│   ├── login/page.tsx      # Login com magic link / Google
│   └── signup/page.tsx     # Cadastro simples (nome + email)
├── (app)/                  # Layout autenticado com tabs
│   ├── layout.tsx          # Bottom tabs + sidebar desktop + topbar
│   ├── dashboard/page.tsx
│   ├── clients/
│   │   ├── page.tsx        # Lista de clientes
│   │   └── [id]/page.tsx   # Ficha do cliente
│   ├── schedule/
│   │   ├── page.tsx        # Agenda (dia/semana/mes)
│   │   └── new/page.tsx    # Novo atendimento
│   ├── finances/
│   │   ├── page.tsx        # Receitas
│   │   ├── expenses/page.tsx
│   │   ├── receivables/page.tsx
│   │   └── report/page.tsx
│   ├── profile/page.tsx
│   ├── settings/page.tsx
│   └── support/page.tsx
├── manifest.json           # PWA manifest
└── sw.ts                   # Service worker basico
```

### Navegacao por Abas (Bottom Tab)

```typescript
// components/BottomTabs.tsx
const TABS = [
  { key: 'dashboard', label: 'Inicio',   icon: LayoutDashboard, href: '/dashboard' },
  { key: 'clients',   label: 'Clientes', icon: Users,           href: '/clients' },
  { key: 'new',       label: 'Novo',     icon: PlusCircle,      href: '/schedule/new' },
  { key: 'schedule',  label: 'Agenda',   icon: Calendar,        href: '/schedule' },
  { key: 'more',      label: 'Mais',     icon: Menu,            action: 'drawer' },
]
// Visivel apenas em mobile (< 768px)
// 5 botoes — igual ao MVP atual
// O "Mais" abre drawer lateral com: Financeiro, Perfil, Config, Suporte
```

### Estrategia de Estado

```
┌─────────────────────────────────────────────┐
│ React Query (@tanstack/react-query)          │
│ → Dados do servidor: clientes, agenda,       │
│   financeiro, settings                       │
│ → Cache automatico + invalidacao             │
│ → staleTime: 30s (dados mudam pouco)         │
│ → Mutations com onMutate (optimistic UI)     │
└─────────────────────────────────────────────┘
              +
┌─────────────────────────────────────────────┐
│ Zustand (estado local leve)                  │
│ → UI: drawer aberto/fechado                  │
│ → Filtros ativos (aba clientes, periodo)     │
│ → Modal aberto + dados do modal              │
│ → Nao persiste — morre ao recarregar         │
└─────────────────────────────────────────────┘
```

**Por que essa combinacao:**
- React Query cuida de toda sincronia com Supabase (cache, refetch, loading states)
- Zustand e minimalista (< 1KB) para estado de UI
- **Nao usar Redux** — overengineering para esse tamanho de app
- **Nao usar Context API para dados** — causa re-renders desnecessarios

### Performance em Celular Simples

| Tecnica | Impacto |
|---------|---------|
| Next.js App Router com Server Components | HTML chega pronto do servidor. JS minimo no client |
| Dynamic imports para modais | Modais so carregam quando abrem: `const Modal = dynamic(() => import(...))` |
| Fonte unica (DM Sans via `next/font`) | Sem flash, sem requisicao extra ao Google Fonts |
| Imagens zero na v1 | Apenas emojis e SVG inline. Zero downloads de imagem |
| Service Worker com cache-first | Apos primeiro acesso, abre offline/instantaneo |
| Bundle < 100KB gzipped (meta) | Medir com `next build` + `@next/bundle-analyzer` |
| Sem biblioteca de componentes pesada | Nada de Material UI ou Chakra. CSS modules puro |

### UX para Usuario Leigo — Decisoes Praticas

| Situacao | Decisao | Motivo |
|----------|---------|--------|
| Primeiro acesso | Tour com 3 tooltips max | Leigo nao le onboarding longo |
| Formularios | Max 5 campos visiveis, resto em "Mais detalhes" | Formulario grande = abandono |
| Confirmacao de acao | Toast com undo (3s), nao modal "Tem certeza?" | Modal interrompe fluxo |
| Erros | Mensagem em portugues coloquial + o que fazer | "Nao conseguimos salvar. Tente de novo." |
| Navegacao | Sem breadcrumbs, sem menus aninhados | Botao "← Voltar" e suficiente |
| Numeros financeiros | Sempre com R$ e 2 decimais, verde = positivo, vermelho = negativo | Padrao visual que leigo entende |
| Datas | "Hoje", "Amanha", "Seg 24/03" — nunca ISO | Leigo nao le 2026-03-24 |

---

## 8. INTEGRACOES

### 8.1 WhatsApp (Twilio ou Z-API)

**Fluxo — Lembretes Automaticos:**

```
1. Cron Edge Function roda diariamente as 08:00
2. Query: appointments com scheduled_date = amanha E status IN (scheduled, confirmed)
3. Para cada appointment:
   a. Busca telefone do cliente na tabela clients
   b. Monta mensagem: "Ola {nome}! Lembrete: amanha as {hora} voce tem {servico} com {profissional}."
   c. Envia via Twilio/Z-API
   d. Registra envio em tabela notification_log
```

**Fluxo — Cobranças:**

```
1. Profissional clica "Enviar cobranca" na tela financeiro
2. Frontend chama Edge Function send-whatsapp
3. Edge Function:
   a. Monta mensagem com link de pagamento Mercado Pago
   b. Envia via WhatsApp API
   c. Retorna status
```

**Decisao Twilio vs Z-API:**

| Criterio | Twilio | Z-API |
|----------|--------|-------|
| Confiabilidade | Alta (empresa global) | Media (empresa BR) |
| Preco | ~$0.005/msg | R$0.03-0.05/msg |
| Setup | WhatsApp Business API oficial | Conecta WhatsApp pessoal |
| Aprovacao | Precisa de template aprovado pelo Meta | Sem aprovacao |
| Recomendacao | **Fase 3+** (escala) | **Fase 2** (MVP rapido) |

**Armazenamento:**

```sql
CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  client_id       UUID REFERENCES clients(id),
  channel         TEXT NOT NULL DEFAULT 'whatsapp',
  message_type    TEXT NOT NULL,  -- 'reminder', 'billing', 'birthday'
  status          TEXT NOT NULL,  -- 'sent', 'failed', 'delivered'
  external_id     TEXT,           -- ID do Twilio/Z-API
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 8.2 Mercado Pago (Assinatura + Cobranças)

**Fluxo de Assinatura do SaaS:**

```
1. Usuario finaliza trial de 7 dias
2. App redireciona para checkout Mercado Pago (preapproval)
3. Mercado Pago processa pagamento
4. Webhook chama Edge Function webhook-mercadopago
5. Edge Function:
   a. Valida assinatura HMAC
   b. Atualiza tabela subscriptions (status, paid_until)
   c. Se cancelado: marca usuario como free (acesso read-only)
```

**Fluxo de Cobranca para Clientes do Profissional:**

```
1. Profissional clica "Gerar cobranca" em receita pendente
2. Frontend chama Edge Function create-payment
3. Edge Function:
   a. Cria payment via API Mercado Pago (PIX ou boleto)
   b. Retorna link de pagamento + QR code PIX
4. Profissional compartilha link via WhatsApp
5. Cliente paga → webhook atualiza financial_entry.status = 'paid'
```

**Tabela de Assinaturas:**

```sql
CREATE TABLE subscriptions (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id),
  plan              TEXT NOT NULL DEFAULT 'trial',  -- trial, pro, early_adopter
  status            TEXT NOT NULL DEFAULT 'trial',  -- trial, active, cancelled, expired
  trial_ends_at     TIMESTAMPTZ,
  paid_until        TIMESTAMPTZ,
  mp_subscription_id TEXT,                           -- ID do Mercado Pago
  mp_customer_id    TEXT,
  price             NUMERIC(10,2) DEFAULT 39.90,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
```

### 8.3 NFe.io (Emissao de NFS-e)

**Fluxo:**

```
1. Profissional vai em Financeiro → Receita → clica "Emitir Nota"
2. Frontend chama Edge Function emit-nfse
3. Edge Function:
   a. Busca dados do profissional (CNPJ, razao social) de profiles
   b. Busca dados do servico e cliente
   c. Chama API NFe.io: POST /companies/{id}/serviceinvoices
   d. Armazena retorno (PDF URL, numero da nota) no financial_entry
4. Frontend mostra link para download do PDF
```

**Pre-requisitos:**
- Profissional precisa ter CNPJ MEI cadastrado no perfil
- Certificado digital (simplificado para MEI via NFe.io)
- **Fase 3+** — nao e MVP

---

## 9. ESCALABILIDADE

### De 1 a 100.000 Usuarios

| Fase | Usuarios | O que muda |
|------|----------|-----------|
| **MVP** | 1–100 | Supabase Free tier. 500MB banco. Sem cache. Tudo funciona |
| **Crescimento** | 100–5.000 | Supabase Pro ($25/mo). Indices ja criados dao conta. React Query faz cache local |
| **Escala** | 5.000–50.000 | Adicionar connection pooling (PgBouncer, ja incluso no Supabase). Monitorar slow queries |
| **Volume** | 50.000–100.000 | Particionar `financial_entries` e `appointments` por mes. Materializar views do dashboard |

### Estrategia de Cache

```
Camada 1: React Query (cliente)
├── staleTime: 30s para dashboard
├── staleTime: 60s para lista de clientes
├── staleTime: 5min para settings
└── Invalidacao: ao completar appointment, invalida ['dashboard', 'finances', 'clients']

Camada 2: Next.js ISR (servidor)
├── Paginas estaticas: login, signup, landing
└── Dados dinamicos: sempre client-side via React Query (nao SSR)

Camada 3: PostgreSQL (banco)
├── Indices compostos ja definidos
├── Views materializadas (so se necessario em 50k+ usuarios):
│   CREATE MATERIALIZED VIEW mv_dashboard_stats AS ...
│   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
│   (Cron a cada 5 minutos)
└── Connection pooling via PgBouncer (padrao Supabase Pro)
```

### Queries Pesadas — Dashboard

O dashboard e a tela mais visitada. Estrategia para mante-la rapida:

1. **Ate 10k usuarios:** As 3 queries paralelas com indices retornam em < 50ms
2. **10k–50k:** Adicionar `MATERIALIZED VIEW` para KPIs mensais, refresh a cada 5 min
3. **50k+:** Separar tabela `monthly_stats` atualizada por trigger ao completar appointment

```sql
-- Exemplo de materialized view para dashboard (so implementar se necessario)
CREATE MATERIALIZED VIEW mv_monthly_stats AS
SELECT
  user_id,
  date_trunc('month', scheduled_date) AS month,
  COUNT(*) AS total_appointments,
  SUM(final_value) FILTER (WHERE NOT is_free_return) AS revenue,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows
FROM appointments
GROUP BY user_id, date_trunc('month', scheduled_date);

CREATE UNIQUE INDEX ON mv_monthly_stats(user_id, month);
```

---

## 10. SEGURANCA

### Autenticacao (Supabase Auth)

```typescript
// Configuracao recomendada no Supabase Dashboard:
// Auth → Settings:
// - Enable Email: SIM (com magic link)
// - Enable Google OAuth: SIM
// - Disable Email/Password: NAO (manter como fallback)
// - Minimum password length: 8
// - Enable email confirmations: SIM
// - JWT expiry: 3600 (1 hora, refresh automatico)

// Login no frontend:
const { error } = await supabase.auth.signInWithOtp({
  email: 'usuario@email.com',
  options: {
    emailRedirectTo: `${window.location.origin}/dashboard`
  }
})
// Usuario recebe email → clica → ta logado. Sem senha.
```

### Protecao Contra Acesso Indevido

| Ameaca | Protecao |
|--------|----------|
| Acesso a dados de outro usuario | RLS no PostgreSQL — impossivel via query |
| Token JWT roubado | httpOnly cookie + short expiry (1h) + refresh token |
| XSS | Next.js escapa HTML por padrao. CSP headers na Vercel |
| CSRF | SameSite=Lax cookie + origin check |
| SQL Injection | Supabase usa prepared statements. Sem SQL raw no frontend |
| Forca bruta no login | Supabase Auth tem rate limit built-in (limitar por IP) |

### Rate Limiting

```typescript
// vercel.json — rate limiting na edge
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-RateLimit-Limit", "value": "100" },
        { "key": "X-RateLimit-Window", "value": "60" }
      ]
    }
  ]
}
```

Supabase Edge Functions ja tem rate limiting configuravel por funcao.

Para o Supabase Client, o proprio RLS e o melhor rate limiter: mesmo que alguem faca 1000 requests, so ve seus proprios dados.

### Protecao de Dados Sensiveis

| Dado | Onde armazena | Protecao |
|------|-------------|----------|
| Senha do usuario | Supabase Auth (bcrypt) | Nunca sai do banco |
| Token Mercado Pago | Supabase Vault (secrets) | Criptografado at rest |
| CNPJ do profissional | Tabela profiles | RLS + TLS in transit |
| Telefone do cliente | Tabela clients | RLS — so o dono ve |
| Dados financeiros | Tabela financial_entries | RLS + backup diario |

---

## 11. DEVOPS E DEPLOY

### Estrutura de Ambientes

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    DEV        │    │   STAGING     │    │    PROD       │
│               │    │               │    │               │
│ localhost:3000│    │ staging.      │    │ app.          │
│               │    │ meusocio.app  │    │ meusocio.app  │
│               │    │               │    │               │
│ Supabase      │    │ Supabase      │    │ Supabase      │
│ Local (CLI)   │    │ Project B     │    │ Project A     │
└──────────────┘    └──────────────┘    └──────────────┘
     │                    │                    │
     └────── Git ─────────┴──── Vercel ────────┘
           branch:dev      branch:staging    branch:main
```

### Deploy com Vercel

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["gru1"],           // Sao Paulo — mais proximo do publico BR
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**Fluxo de deploy:**
1. Push em `main` → Vercel faz build automatico → deploy em producao
2. Push em `staging` → Vercel deploy em preview (staging.meusocio.app)
3. Pull Request → Vercel gera preview URL automatica para revisao

### Versionamento de Banco (Migrations)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar projeto local
supabase init

# Estrutura de migrations
supabase/
├── config.toml
├── migrations/
│   ├── 20260322000001_create_profiles.sql
│   ├── 20260322000002_create_settings.sql
│   ├── 20260322000003_create_services.sql
│   ├── 20260322000004_create_clients.sql
│   ├── 20260322000005_create_appointments.sql
│   ├── 20260322000006_create_financial_entries.sql
│   ├── 20260322000007_create_fixed_expenses.sql
│   ├── 20260322000008_create_client_history.sql
│   ├── 20260322000009_create_custom_fields.sql
│   ├── 20260322000010_create_rls_policies.sql
│   ├── 20260322000011_create_functions.sql
│   └── 20260322000012_create_views.sql
├── functions/
│   ├── webhook-mercadopago/
│   ├── send-whatsapp/
│   └── ...
└── seed.sql                    # Dados iniciais para dev

# Comandos do dia-a-dia
supabase db diff --schema public  # Gera migration a partir de mudancas
supabase db push                  # Aplica migrations em staging/prod
supabase db reset                 # Reset local para testar migrations
```

### Monitoramento Basico

| O que monitorar | Ferramenta | Custo |
|----------------|-----------|-------|
| Erros no frontend | Sentry Free (10k events/mes) | $0 |
| Performance web | Vercel Analytics (gratuito) | $0 |
| Queries lentas | Supabase Dashboard → Logs | Incluso |
| Uptime | UptimeRobot Free (50 monitors) | $0 |
| Uso do banco | Supabase Dashboard → Usage | Incluso |

```typescript
// Sentry minimalista no Next.js
// app/layout.tsx
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% das requisicoes — suficiente para detectar problemas
  environment: process.env.NODE_ENV,
})
```

---

## 12. DECISOES DE PRODUTO

### Por que evitar features complexas

O usuario do Meu Socio **nao quer** um sistema completo. Ele quer um caderninho que funciona. Cada feature adicionada:
- Aumenta o tempo de aprendizado
- Aumenta a chance de bug
- Aumenta o custo de manutencao
- Diminui a velocidade do app

**Regra:** Se nao resolve uma dor listada na secao 1.1 do documento de visao, nao entra na v1.

### Por que nao usar graficos pesados na v1

1. **Chart.js ou Recharts adicionam 40-80KB ao bundle** — em celular Android basico com 4G, isso sao 2-3 segundos a mais
2. **O usuario leigo nao interpreta graficos de linha/barra** — ele quer saber "quanto entrou" e "quanto saiu", nao a tendencia dos ultimos 6 meses
3. **Barras CSS (`<div>` com width percentual)** fazem o mesmo trabalho visual com zero dependencia
4. **Graficos sao vanity features** para impressionar investidor, nao para resolver dor do usuario

**Quando adicionar graficos:** Fase 4, na tela Overview, com lazy loading. Nunca no Dashboard principal.

### Como garantir que o app seja utilizavel em 3 minutos

| Minuto | O que acontece |
|--------|---------------|
| 0:00 | Abre o link, ve tela de login limpa. "Entrar com Google" ou email |
| 0:30 | Logou. Dashboard vazio com tooltip: "Comece cadastrando um servico" |
| 1:00 | Vai em Config → Adiciona 1 servico (nome + preco) |
| 1:30 | Vai em Clientes → Cadastra 1 cliente (so nome + telefone) |
| 2:00 | Vai em Novo Atendimento → Seleciona cliente + servico + data/hora → Salvar |
| 2:30 | Dashboard mostra: 1 atendimento agendado, proximo atendimento |
| 3:00 | Usuario entendeu o ciclo completo. Pronto para usar no dia a dia |

**Principios que garantem isso:**
- Formularios com no maximo 3 campos obrigatorios
- Campos pre-preenchidos quando possivel (data = hoje, hora = proxima hora cheia)
- Zero configuracao obrigatoria — tudo tem defaults sensiveis
- Nenhuma tela exige scroll para completar a acao principal

---

## 13. ROADMAP TECNICO

### Fase 1 → Fase 2: MVP Firebase → SaaS Supabase (4-6 semanas)

```
Semana 1-2: Fundacao
├── Inicializar projeto Next.js 14 com App Router
├── Configurar Supabase (projeto, auth, banco)
├── Rodar todas as migrations (tabelas + RLS + functions + views)
├── Implementar auth (magic link + Google)
├── Criar layout principal (bottom tabs + sidebar + topbar)
└── PWA manifest + service worker basico

Semana 3-4: Modulos Core
├── Dashboard (KPIs + proximo atendimento + resumo do dia)
├── Clientes (CRUD + ficha + status automatico)
├── Agenda (dia/semana/mes + novo atendimento)
├── Financeiro (receitas + despesas + CMV)
└── Completar atendimento (function RPC)

Semana 5-6: Polish + Deploy
├── Configuracoes (settings + servicos + campos custom)
├── Perfil do profissional
├── Notificacoes (aniversarios + clientes sumidos + despesas fixas)
├── Testes end-to-end basicos (Playwright, 5-10 fluxos criticos)
├── Deploy Vercel (staging → prod)
└── Dominio: app.meusocio.app
```

### Fase 2: Sistema de Pagamento (2-3 semanas)

```
├── Tabela subscriptions + migration
├── Integrar Mercado Pago (checkout + webhook)
├── Middleware de verificacao de assinatura (trial/active/expired)
├── Tela de planos + checkout
├── Edge Function webhook-mercadopago
├── Email transacional (welcome, trial ending, payment confirmed)
└── Taxa de setup R$89,90 como pagamento unico
```

### Fase 3: Integracoes (3-4 semanas)

```
├── WhatsApp API (Z-API inicialmente)
│   ├── Lembretes automaticos 24h antes
│   ├── Confirmacao de agendamento
│   └── Envio de cobranca com link PIX
├── Agenda publica
│   ├── Link compartilhavel: meusocio.app/agendar/{slug}
│   ├── Cliente escolhe servico + horario disponivel
│   └── Cria appointment automaticamente
├── Cobranca Mercado Pago para clientes do profissional
│   ├── Gerar link PIX / boleto
│   ├── Webhook para marcar como pago
│   └── Notificar profissional
└── NFe.io (NFS-e) — se demanda validada
```

### Fase 4: Escala e Comunidade (ongoing)

```
├── Materialized views para dashboard (se necessario)
├── Painel admin interno (metricas SaaS: MRR, churn, uso)
├── App nativo via PWA avancado (offline-first, push notifications)
├── Overview com graficos (Chart.js lazy-loaded)
├── Exportacao PDF/planilha
├── "Socios" — comunidade de usuarios
└── Expansao para novos segmentos (alem de beauty/fitness)
```

### Prioridade por Impacto

```
ALTO IMPACTO, BAIXO ESFORCO (fazer primeiro):
  ✅ Dashboard com numeros grandes
  ✅ CRUD de clientes com busca
  ✅ Agenda com completar atendimento → receita
  ✅ Magic link login (sem senha)

ALTO IMPACTO, ALTO ESFORCO (fazer na sequencia):
  ⏳ Mercado Pago (assinatura do SaaS)
  ⏳ WhatsApp lembretes
  ⏳ Agenda publica

BAIXO IMPACTO, BAIXO ESFORCO (fazer se sobrar tempo):
  📋 Exportar dados JSON/CSV
  📋 Campos personalizados

BAIXO IMPACTO, ALTO ESFORCO (nao fazer na v1):
  ❌ Graficos elaborados
  ❌ App nativo
  ❌ Multi-idioma
  ❌ Suporte a equipes
```

---

## APENDICE: CHECKLIST DE IMPLEMENTACAO

```
[ ] Projeto Next.js 14 inicializado
[ ] Supabase configurado (projeto + env vars)
[ ] Todas as migrations rodadas
[ ] RLS habilitado e testado em todas as tabelas
[ ] Auth funcionando (magic link + Google)
[ ] Layout responsivo (mobile + desktop)
[ ] Bottom tabs navegando
[ ] Dashboard renderizando KPIs
[ ] CRUD de clientes completo
[ ] Status automatico (recorrente/reativar) funcionando
[ ] Agenda com visualizacao dia/semana/mes
[ ] Novo atendimento com selecao de cliente + servico
[ ] complete_appointment RPC funcionando
[ ] Receitas e despesas com CRUD
[ ] Despesas fixas com notificacao
[ ] Configuracoes salvando no banco
[ ] Perfil do profissional salvando
[ ] Notificacoes (aniversarios, sumidos, DAS)
[ ] PWA manifest + service worker
[ ] Deploy Vercel em producao
[ ] Dominio configurado
[ ] Sentry configurado
[ ] Testes E2E basicos passando
```
