import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for leads table
export interface Lead {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  socialMedia?: string;
  country: string;
  city?: string;
  businessType?: string;
  createdAt: string;
  updatedAt: string;
}