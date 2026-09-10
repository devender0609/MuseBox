import {NextRequest,NextResponse} from "next/server";
import {enforceRateLimit,ensureGenerationAccess,usageError} from "@/lib/usage";

export const maxDuration=60;

export async function POST(request:NextRequest){
  try{
    try{await ensureGenerationAccess(request,0);await enforceRateLimit(request,"transcribe",12,3600)}catch(error){const issue=usageError(error);return NextResponse.json({error:issue.error},{status:issue.status})}
    const key=process.env.ELEVENLABS_API_KEY;
    if(!key)return NextResponse.json({error:"Voice input is not connected on this deployment."},{status:503});
    const incoming=await request.formData();
    const file=incoming.get("file");
    if(!(file instanceof File)||file.size===0)return NextResponse.json({error:"No voice recording was received."},{status:400});
    if(file.size>15*1024*1024)return NextResponse.json({error:"Keep voice descriptions under two minutes."},{status:413});
    const form=new FormData();
    form.append("file",file,file.name||"song-idea.webm");
    form.append("model_id","scribe_v2");
    form.append("tag_audio_events","false");
    form.append("diarize","false");
    const response=await fetch("https://api.elevenlabs.io/v1/speech-to-text",{method:"POST",headers:{"xi-api-key":key},body:form});
    if(!response.ok){const detail=await response.text();return NextResponse.json({error:/quota|credit/i.test(detail)?"The connected voice-transcription allowance has been reached.":"Cantoa could not understand that recording. Please try again."},{status:response.status})}
    const data=await response.json() as {text?:string;language_code?:string};
    const text=data.text?.trim();
    if(!text)return NextResponse.json({error:"No speech was detected. Try speaking closer to the microphone."},{status:422});
    return NextResponse.json({text,language:data.language_code||null});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Voice transcription failed."},{status:500})}
}
