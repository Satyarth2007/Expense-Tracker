
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- trigram search on merchant/description


DO $$ 
BEGIN
  CREATE TYPE workspace_type AS ENUM ('personal', 'business');
EXCEPTION 
    WHEN duplicate_object THEN NULL; 
END $$;


DO $$ 
BEGIN
  CREATE TYPE category_type AS ENUM ('income', 'expense', 'transfer');
EXCEPTION 
    WHEN duplicate_object THEN NULL; 
END $$;


DO $$ 
BEGIN
  CREATE TYPE bank_account_type AS ENUM ('savings', 'current', 'credit_card', 'wallet', 'other');
EXCEPTION 
    WHEN duplicate_object THEN NULL; 
END $$;


DO $$ 
BEGIN
  CREATE TYPE import_status AS ENUM ('uploaded', 'parsing', 'review', 'committing', 'completed', 'failed');
EXCEPTION 
    WHEN duplicate_object THEN NULL; 
END $$;


DO $$ 
BEGIN
  CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'yearly');
EXCEPTION 
    WHEN duplicate_object THEN NULL; 
END $$;


DO $$ 
BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
EXCEPTION 
    WHEN duplicate_object THEN NULL; 
END $$;


DO $$ 
BEGIN
  CREATE TYPE transaction_source AS ENUM ('manual', 'csv_import', 'pdf_import', 'recurring', 'plaid');
EXCEPTION 
    WHEN duplicate_object THEN NULL; 
END $$;


DO $$ 
BEGIN
  CREATE TYPE ocr_status_type AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION 
    WHEN duplicate_object THEN NULL; 
END $$;


DO $$ 
BEGIN
  CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION 
    WHEN duplicate_object THEN NULL; 
END $$;


DO $$ 
BEGIN
  CREATE TYPE audit_operation AS ENUM ('INSERT', 'UPDATE', 'DELETE');
EXCEPTION 
    WHEN duplicate_object THEN NULL; 
END $$;


CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  base_currency CHAR(3) NOT NULL DEFAULT 'INR',
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  mfa_secret VARCHAR(255),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  reset_token_hash VARCHAR(255),
  reset_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));


DROP TRIGGER 
IF EXISTS 
    trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


COMMENT ON COLUMN users.mfa_secret IS
  'TOTP secret — must be encrypted at the application layer before storage, not just DB-access-controlled, since it must be decrypted (not compared as a hash) to verify codes.';


-- Table: workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  type workspace_type NOT NULL DEFAULT 'personal',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX IF NOT EXISTS idx_workspaces_user ON workspaces (user_id);


-- Enforce exactly one default workspace per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_one_default_per_user
  ON workspaces (user_id) WHERE is_default = true;

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON workspaces;
CREATE TRIGGER trg_workspaces_updated_at
BEFORE UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Table: categories 
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  type category_type NOT NULL DEFAULT 'expense',
  color VARCHAR(20),
  is_tax_deductible BOOLEAN NOT NULL DEFAULT false,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT categories_no_self_parent CHECK (id IS DISTINCT FROM parent_id)
);


CREATE INDEX IF NOT EXISTS idx_categories_workspace ON categories (workspace_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories (parent_id);


-- Prevent duplicate category names within the same workspace + parent level
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_name_per_parent
  ON categories (workspace_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), LOWER(name));


DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Table: bank_accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  nickname VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100),
  account_type bank_account_type NOT NULL DEFAULT 'savings',
  last4 VARCHAR(4),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bank_accounts_last4_check CHECK (last4 IS NULL OR last4 ~ '^[0-9]{4}$')
);


CREATE INDEX IF NOT EXISTS idx_bank_accounts_workspace ON bank_accounts (workspace_id);


DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated_at
BEFORE UPDATE ON bank_accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


COMMENT ON COLUMN bank_accounts.last4 IS
  'Last 4 digits only, for display/labeling purposes — never store a full account number.';


-- Table: import_batches
CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  status import_status NOT NULL DEFAULT 'uploaded',
  total_rows INTEGER NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  processed_rows INTEGER NOT NULL DEFAULT 0 CHECK (processed_rows >= 0),
  committed_rows INTEGER NOT NULL DEFAULT 0 CHECK (committed_rows >= 0),
  column_mapping JSONB,
  staging_rows JSONB,
  error_log JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT import_batches_row_counts_check
    CHECK (processed_rows <= total_rows AND committed_rows <= processed_rows)
);

CREATE INDEX IF NOT EXISTS idx_import_batches_workspace ON import_batches (workspace_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_bank_account ON import_batches (bank_account_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_staging_rows_gin ON import_batches USING GIN (staging_rows);

DROP TRIGGER IF EXISTS trg_import_batches_updated_at ON import_batches;
CREATE TRIGGER trg_import_batches_updated_at
BEFORE UPDATE ON import_batches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Table: recurring_rules
CREATE TABLE IF NOT EXISTS recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL,
  frequency recurring_frequency NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_run_date DATE NOT NULL,
  last_run_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT recurring_rules_date_check CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_recurring_rules_workspace ON recurring_rules (workspace_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_category ON recurring_rules (category_id);

-- Partial index: the BullMQ poller only ever queries active rules due to run
CREATE INDEX IF NOT EXISTS idx_recurring_rules_due
  ON recurring_rules (next_run_date) WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_recurring_rules_updated_at ON recurring_rules;
CREATE TRIGGER trg_recurring_rules_updated_at
BEFORE UPDATE ON recurring_rules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  merchant VARCHAR(255),
  amount NUMERIC(14,2) NOT NULL CHECK (amount <> 0),
  currency CHAR(3) NOT NULL,
  amount_base NUMERIC(14,2) NOT NULL,
  fx_rate_used NUMERIC(18,8),
  type transaction_type NOT NULL DEFAULT 'expense',
  description VARCHAR(500),
  transaction_date DATE NOT NULL,
  source transaction_source NOT NULL DEFAULT 'manual',
  source_ref_id UUID,
  receipt_url VARCHAR(500),
  receipt_public_id VARCHAR(255),
  ocr_status ocr_status_type,
  ocr_raw_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);


-- Composite index for the dashboard's #1 query pattern: recent transactions per workspace
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_date
  ON transactions (workspace_id, transaction_date DESC)
  WHERE deleted_at IS NULL;

-- Category-wise distribution (dashboard "top categories", budgets)
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_category
  ON transactions (workspace_id, category_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_bank_account
  ON transactions (bank_account_id)
  WHERE deleted_at IS NULL;

-- Lookup by polymorphic source (e.g. "all transactions from this recurring rule")
CREATE INDEX IF NOT EXISTS idx_transactions_source_ref
  ON transactions (source, source_ref_id);

-- Merchant/description search (matches the mockup's search bar)
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_trgm
  ON transactions USING GIN (merchant gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN transactions.source_ref_id IS
  'Polymorphic reference: points to recurring_rules.id when source = recurring, or import_batches.id when source = csv_import/pdf_import. No FK constraint by design — integrity enforced at the application layer.';


-- Table: budgets
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(14,2) NOT NULL CHECK (limit_amount > 0),
  period budget_period NOT NULL DEFAULT 'monthly',
  alert_threshold_pct INTEGER NOT NULL DEFAULT 80 CHECK (alert_threshold_pct BETWEEN 1 AND 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budgets_workspace ON budgets (workspace_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets (category_id);

-- Prevent duplicate active budgets for the same category/period
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_unique_active_category_period
  ON budgets (workspace_id, category_id, period)
  WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON budgets;
CREATE TRIGGER trg_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Table: fx_rates
CREATE TABLE IF NOT EXISTS fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency CHAR(3) NOT NULL,
  target_currency CHAR(3) NOT NULL,
  rate NUMERIC(18,8) NOT NULL CHECK (rate > 0),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fx_rates_distinct_currencies CHECK (base_currency <> target_currency)
);

-- Fast lookup of the latest rate for a given pair
CREATE INDEX IF NOT EXISTS idx_fx_rates_pair_latest
  ON fx_rates (base_currency, target_currency, fetched_at DESC);


-- Table: audit_logs 
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  table_name VARCHAR(50) NOT NULL,
  operation audit_operation NOT NULL,
  row_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_row ON audit_logs (table_name, row_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);


COMMIT;