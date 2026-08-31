import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request:NextRequest){
  try{
    const key=process.env.ELEVENLABS_API_KEY;
    if(!key)return NextResponse.json({error:"Add ELEVENLABS_API_KEY in Vercel to generate complete songs. You can use the instant music demo now."},{status:503});
    const body=await request.json();
    const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
    if(prompt.length<8||prompt.length>4000)return NextResponse.json({error:"Describe the song in at least 8 characters."},{status:400});
    const duration=Math.min(180,Math.max(10,Number(body.duration)||30));
    const response=await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",{
      method:"POST",headers:{"Content-Type":"application/json","xi-api-key":key},
      body:JSON.stringify({prompt,music_length_ms:duration*1000,model_id:"music_v2",force_instrumental:Boolean(body.instrumental)}),
    });
    if(!response.ok){const detail=await response.text();return NextResponse.json({error:detail||"The music provider could not generate this song."},{status:response.status})}
    return new NextResponse(await response.arrayBuffer(),{headers:{"Content-Type":"audio/mpeg","Cache-Control":"private, no-store"}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Song generation failed."},{status:500})}
}
