import {createClient} from "@supabase/supabase-js";

export function publicSupabase(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return null;
  return createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
}

export function adminSupabase(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

export async function authenticatedUser(request:Request){
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  const client=publicSupabase();
  if(!token||!client)return null;
  const {data,error}=await client.auth.getUser(token);
  return error?null:data.user;
}
