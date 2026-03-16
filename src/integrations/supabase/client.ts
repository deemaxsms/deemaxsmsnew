// Supabase client stub — Supabase has been removed from this app.
// This stub prevents runtime errors if any leftover imports remain while the app
// is fully migrated to Firebase + Firestore.

// Do NOT import '@supabase/supabase-js' here — package may be removed.
export const supabase: any = {
  from: (tableName: string) => ({
    select: async (..._args: any[]) => ({ data: null, error: { message: 'Supabase disabled' } }),
    insert: async (..._args: any[]) => ({ data: null, error: { message: 'Supabase disabled' } }),
    update: async (..._args: any[]) => ({ data: null, error: { message: 'Supabase disabled' } }),
    delete: async (..._args: any[]) => ({ data: null, error: { message: 'Supabase disabled' } }),
  }),
  functions: {
    invoke: async (_name: string, _opts?: any) => ({ data: null, error: { message: 'Supabase functions disabled' } }),
  },
  auth: {
    signOut: async () => null,
    getUser: async () => ({ data: null }),
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: (_cb: any) => ({ subscription: { unsubscribe: () => {} } }),
  },
};