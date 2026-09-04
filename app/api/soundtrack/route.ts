import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, refundMinutes, reserveMinutes, usageError } from "@/lib/usage";
import { logGenerationEvent } from "@/lib/provider-observability";

export const maxDuration = 300;
const sleep = (ms:number)=>new Promise((resolve)=>setTimeout(resolve,ms));
function firstUrl(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record=value as Record<string,unknown>;
  for(const key of ["url","audio_url","mp3_url","wav_url","stream_url"]){const v=record[key];if(typeof v==="string"&&/^https:\/\//i.test(v))return v;}
  for(const key of ["choices","songs","results","data"]){const v=record[key];if(Array.isArray(v))for(const item of v){const found=firstUrl(item);if(found)return found;}}
  return null;
}
export async function POST(request:NextRequest){
  let reservation:{userId:string|null;remaining:number|null;plan?:string}|null=null;
  let charged=1;
  let requestSummary="";
  let requestType="visual_soundtrack";
  let attempted=false;
  const started=Date.now();
  try{
    const key=process.env.MUREKA_API_KEY;
    if(!key)return NextResponse.json({error:"Video soundtrack generation is available after MUREKA_API_KEY is connected."},{status:503});
    const incoming=await request.formData();
    const file=incoming.get("file");const prompt=String(incoming.get("prompt")||"").trim();requestSummary=prompt;
    if(!(file instanceof File)||file.size===0)return NextResponse.json({error:"Attach a video or image to score."},{status:400});
    if(prompt.length<8)return NextResponse.json({error:"Describe the soundtrack you want."},{status:400});
    const isVideo=file.type.startsWith("video/");requestType=isVideo?"video_soundtrack":"image_soundtrack";const limit=isVideo?100*1024*1024:50*1024*1024;
    if(file.size>limit)return NextResponse.json({error:`Keep ${isVideo?"video":"image"} uploads under ${isVideo?"100":"50"} MB.`},{status:413});
    try{await enforceRateLimit(request,"soundtrack",6,3600);reservation=await reserveMinutes(request,charged);}catch(error){const issue=usageError(error);return NextResponse.json({error:issue.error},{status:issue.status});}
    attempted=true;
    const upload=new FormData();upload.append("file",file);upload.append("purpose","soundtrack");
    const uploaded=await fetch("https://api.mureka.ai/v1/files/upload",{method:"POST",headers:{Authorization:`Bearer ${key}`},body:upload});
    if(!uploaded.ok)throw new Error("Cantoa could not upload this visual to the soundtrack provider.");
    const uploadedData=await uploaded.json() as Record<string,unknown>;const id=String(uploadedData.id||"");
    if(!id)throw new Error("The soundtrack provider did not return a media id.");
    const generated=await fetch("https://api.mureka.ai/v1/soundtrack/generate",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({[isVideo?"video_id":"image_id"]:id,model:"auto",prompt:prompt.slice(0,1024),n:1})});
    if(!generated.ok)throw new Error("The soundtrack provider could not start this score.");
    const task=await generated.json() as Record<string,unknown>;const taskId=String(task.id||"");
    if(!taskId)throw new Error("The soundtrack provider did not return a task id.");
    for(let attempt=0;attempt<45;attempt+=1){
      await sleep(attempt===0?1200:3000);
      const checked=await fetch(`https://api.mureka.ai/v1/song/query/${encodeURIComponent(taskId)}`,{headers:{Authorization:`Bearer ${key}`},cache:"no-store"});
      if(!checked.ok)continue;
      const data=await checked.json() as Record<string,unknown>;const status=String(data.status||"");
      if(status==="succeeded"){
        const url=firstUrl(data);if(!url)throw new Error("The soundtrack finished without a downloadable audio URL.");
        const audio=await fetch(url,{cache:"no-store"});if(!audio.ok)throw new Error("The generated soundtrack could not be downloaded.");
        await logGenerationEvent(request,{requestType,provider:"mureka",preferredProvider:"mureka",attemptedProviders:["mureka"],fallbackUsed:false,requestedSeconds:60,chargedMinutes:charged,latencyMs:Date.now()-started,status:"success",requestSummary,plan:reservation?.plan||null});
        return new NextResponse(await audio.arrayBuffer(),{headers:{"Content-Type":audio.headers.get("content-type")||"audio/mpeg","Cache-Control":"private, no-store","X-Cantoa-Provider":"mureka","X-Cantoa-Minutes-Remaining":String(reservation?.remaining??"")}});
      }
      if(["failed","timeouted","cancelled"].includes(status))throw new Error(String(data.failed_reason||"Soundtrack generation failed."));
    }
    throw new Error("Soundtrack generation timed out.");
  }catch(error){
    await refundMinutes(reservation?.userId||null,charged);
    await logGenerationEvent(request,{requestType,provider:null,preferredProvider:"mureka",attemptedProviders:attempted?["mureka"]:[],fallbackUsed:false,requestedSeconds:60,chargedMinutes:charged,latencyMs:Date.now()-started,status:"refunded",errorCode:error instanceof Error?error.message:"SOUNDTRACK_FAILED",requestSummary,plan:reservation?.plan||null});
    return NextResponse.json({error:error instanceof Error?error.message:"Soundtrack generation failed."},{status:500});
  }
}
