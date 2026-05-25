import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yxgrhyuzlsfimjimlwig.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RhdAz3ZgynrpMIkoJTEbOQ_278HUMWd";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
