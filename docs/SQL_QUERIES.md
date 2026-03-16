# SQL Queries Used in SMSGlobe Project

This document contains all the SQL queries and database migrations used throughout the SMSGlobe project.

## Database Schema Creation

### 1. Profiles Table
```sql
-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  cashback NUMERIC DEFAULT 0,
  api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 2. Activations Table
```sql
-- Create activations table for purchased numbers
CREATE TABLE IF NOT EXISTS public.activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activation_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  service TEXT NOT NULL,
  country_code INTEGER NOT NULL,
  country_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  sms_code TEXT,
  sms_text TEXT,
  operator TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own activations"
  ON public.activations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activations"
  ON public.activations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activations"
  ON public.activations FOR UPDATE
  USING (auth.uid() = user_id);
```

### 3. Balance Transactions Table
```sql
-- Create balance_transactions table
CREATE TABLE IF NOT EXISTS public.balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their own transactions"
  ON public.balance_transactions FOR SELECT
  USING (auth.uid() = user_id);
```

### 4. Payment Methods Table
```sql
-- Create payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert payment methods
INSERT INTO public.payment_methods (name, code) VALUES
  ('Stripe', 'stripe'),
  ('Flutterwave', 'flutterwave'),
  ('Cashapp', 'cashapp');

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Anyone can view payment methods"
  ON public.payment_methods FOR SELECT
  USING (true);
```

### 5. Deposits Table
```sql
-- Create deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own deposits"
  ON public.deposits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposits"
  ON public.deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Database Functions and Triggers

### 1. Update Timestamp Function
```sql
-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activations_updated_at
  BEFORE UPDATE ON public.activations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. New User Profile Creation
```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger to execute on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Referral System

### 1. Add Referral Columns
```sql
-- Add referral system to profiles
ALTER TABLE profiles 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referral_count INTEGER DEFAULT 0,
ADD COLUMN referral_earnings NUMERIC DEFAULT 0,
ADD COLUMN referred_by UUID REFERENCES profiles(id),
ADD COLUMN use_cashback_first BOOLEAN DEFAULT false;
```

### 2. Referral Code Generation Function
```sql
-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$;
```

### 3. Updated New User Handler with Referral Code
```sql
-- Update handle_new_user to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, referral_code)
  VALUES (NEW.id, NEW.email, generate_referral_code());
  RETURN NEW;
END;
$$;
```

### 4. Apply Referral Bonus Function
```sql
-- Function to apply referral bonuses
CREATE OR REPLACE FUNCTION apply_referral_bonus(referrer_code TEXT, new_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_id UUID;
  referrer_balance NUMERIC;
  bonus_amount NUMERIC := 1.00;
BEGIN
  -- Find referrer by code
  SELECT id, balance INTO referrer_id, referrer_balance
  FROM profiles
  WHERE referral_code = referrer_code;
  
  -- Exit if referrer not found
  IF referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update referrer's balance and stats
  UPDATE profiles
  SET 
    balance = balance + bonus_amount,
    referral_count = referral_count + 1,
    referral_earnings = referral_earnings + bonus_amount
  WHERE id = referrer_id;
  
  -- Update new user's referred_by
  UPDATE profiles
  SET referred_by = referrer_id
  WHERE id = new_user_id;
  
  -- Create transaction record for referrer
  INSERT INTO balance_transactions (user_id, type, amount, balance_after, description)
  SELECT 
    referrer_id,
    'referral',
    bonus_amount,
    balance,
    'Referral bonus from new user signup'
  FROM profiles
  WHERE id = referrer_id;
  
  RETURN TRUE;
END;
$$;
```

### 5. Generate Referral Codes for Existing Users
```sql
-- Generate referral codes for existing users
UPDATE profiles 
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;
```

## Activation Enhancements

### Add Rental and Voice Support
```sql
-- Add rental and voice support to activations table
ALTER TABLE public.activations 
ADD COLUMN IF NOT EXISTS activation_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS rental_days INTEGER,
ADD COLUMN IF NOT EXISTS rental_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_voice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_get_another_sms BOOLEAN DEFAULT false;
```

## Common Queries Used in Application

### User Balance Query
```sql
SELECT balance, cashback 
FROM profiles 
WHERE id = $user_id;
```

### User Activations Query
```sql
SELECT * 
FROM activations 
WHERE user_id = $user_id 
ORDER BY created_at DESC;
```

### Transaction History Query
```sql
SELECT * 
FROM balance_transactions 
WHERE user_id = $user_id 
ORDER BY created_at DESC;
```

### Update User Balance
```sql
UPDATE profiles 
SET balance = balance + $amount 
WHERE id = $user_id 
RETURNING balance;
```

### Create New Activation
```sql
INSERT INTO activations (
  user_id, 
  activation_id, 
  phone_number, 
  service, 
  country_code, 
  country_name, 
  price, 
  status,
  operator,
  activation_type,
  rental_days
) VALUES (
  $user_id,
  $activation_id,
  $phone_number,
  $service,
  $country_code,
  $country_name,
  $price,
  'waiting',
  $operator,
  $activation_type,
  $rental_days
) RETURNING *;
```

### Create Transaction Record
```sql
INSERT INTO balance_transactions (
  user_id,
  type,
  amount,
  balance_after,
  description
) VALUES (
  $user_id,
  $type,
  $amount,
  $balance_after,
  $description
);
```

### Create Deposit Record
```sql
INSERT INTO deposits (
  user_id,
  amount,
  payment_method,
  status,
  transaction_id
) VALUES (
  $user_id,
  $amount,
  'flutterwave',
  'pending',
  $transaction_id
);
```

### Update Deposit Status
```sql
UPDATE deposits 
SET 
  status = 'completed',
  completed_at = now()
WHERE id = $deposit_id;
```

### Find Deposit by Transaction Reference
```sql
SELECT * 
FROM deposits 
WHERE transaction_id = $tx_ref 
  AND user_id = $user_id;
```

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data through RLS policies
- Sensitive operations use SECURITY DEFINER functions
- Foreign keys ensure referential integrity
- Default values prevent null errors on inserts
