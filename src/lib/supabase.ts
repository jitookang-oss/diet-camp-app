import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

// Proxy로 감싸서 실제 접근 시점에 클라이언트 초기화 (빌드 시점 오류 방지)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getClient() as never as Record<string | symbol, unknown>)[prop];
  },
});
