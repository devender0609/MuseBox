import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticatedUser } from "@/lib/supabase";
export async function POST(request: NextRequest,{params}:{params:Promise<{id:string}>}){
  const user=await authenticatedUser(request);const admin=adminSupabase();if(!user)return NextResponse.json({error:"Sign in required."},{status:401});if(!admin)return NextResponse.json({error:"Cloud sharing is not configured."},{status:503});
  const {id}=await params;const body=await request.json().catch(()=>({}));const unlockAt=new Date(String(body.unlockAt||""));if(!Number.isFinite(unlockAt.getTime())||unlockAt.getTime()<=Date.now()+60_000)return NextResponse.json({error:"Choose a future unlock time."},{status:400});
  const {data:song,error:songError}=await admin.from("songs").select("id").eq("id",id).eq("user_id",user.id).maybeSingle();if(songError)return NextResponse.json({error:"The cloud library could not verify this song right now."},{status:503});if(!song)return NextResponse.json({error:"Song not found."},{status:404});
  const {error}=await admin.from("song_drops").upsert({song_id:id,owner_id:user.id,unlock_at:unlockAt.toISOString()},{onConflict:"song_id"});if(error)return NextResponse.json({error:/song_drops/i.test(error.message)?"Run the v18.8 Supabase setup before scheduling a Secret Drop.":error.message},{status:503});return NextResponse.json({ok:true,unlockAt:unlockAt.toISOString()});
}
