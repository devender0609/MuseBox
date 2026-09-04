import {NextRequest,NextResponse} from "next/server";
import {enforceRateLimit,refundMinutes,reserveMinutes,usageError} from "@/lib/usage";
export const maxDuration=300;
export async function POST(request:NextRequest){
  let reservation:{userId:string|null;remaining:number|null}|null=null;let charged=0;
  try{
    const key=process.env.ELEVENLABS_API_KEY;
    if(!key)return NextResponse.json({error:"Connect ELEVENLABS_API_KEY to remix uploaded audio."},{status:503});
    const incoming=await request.formData();const file=incoming.get("file");const prompt=String(incoming.get("prompt")||"").trim();const duration=Math.min(600,Math.max(10,Number(incoming.get("duration"))||60));
    if(!(file instanceof File))return NextResponse.json({error:"Upload an audio file first."},{status:400});
    if(prompt.length<8)return NextResponse.json({error:"Describe how you want to transform the audio."},{status:400});
    charged=duration/60;try{await enforceRateLimit(request,"remix",8,3600);reservation=await reserveMinutes(request,charged)}catch(error){const issue=usageError(error);return NextResponse.json({error:issue.error},{status:issue.status})}
    const upload=new FormData();upload.append("file",file);upload.append("extract_composition_plan","music_v2");
    const uploaded=await fetch("https://api.elevenlabs.io/v1/music/upload",{method:"POST",headers:{"xi-api-key":key},body:upload});
    if(!uploaded.ok){await refundMinutes(reservation?.userId||null,charged);return NextResponse.json({error:"The source audio could not be analyzed."},{status:uploaded.status})}
    const source=await uploaded.json();
    if(!source.composition_plan){await refundMinutes(reservation?.userId||null,charged);return NextResponse.json({error:"No musical structure could be extracted from this audio."},{status:422})}
    const planned=await fetch("https://api.elevenlabs.io/v1/music/plan",{method:"POST",headers:{"Content-Type":"application/json","xi-api-key":key},body:JSON.stringify({prompt,source_composition_plan:source.composition_plan,music_length_ms:duration*1000,model_id:"music_v2"})});
    if(!planned.ok){await refundMinutes(reservation?.userId||null,charged);return NextResponse.json({error:"The remix plan could not be created."},{status:planned.status})}
    const rawPlan=await planned.json();
    const composition_plan=rawPlan.composition_plan||rawPlan;
    const composed=await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192",{method:"POST",headers:{"Content-Type":"application/json","xi-api-key":key},body:JSON.stringify({composition_plan,model_id:"music_v2"})});
    if(!composed.ok){await refundMinutes(reservation?.userId||null,charged);return NextResponse.json({error:"The remix could not be rendered."},{status:composed.status})}
    return new NextResponse(await composed.arrayBuffer(),{headers:{"Content-Type":"audio/mpeg","Cache-Control":"private, no-store","X-Cantoa-Minutes-Remaining":String(reservation?.remaining??"")}});
  }catch(error){await refundMinutes(reservation?.userId||null,charged);return NextResponse.json({error:error instanceof Error?error.message:"Audio remix failed."},{status:500})}
}
