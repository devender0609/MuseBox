"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type Contribution = {
  id: number;
  contributor: string;
  kind: "memory" | "message" | "idea";
  memory: string;
  feeling?: string;
  votes: number;
  photo_url?: string | null;
};

export default function ContributionClient({ token }: { token: string }) {
  const [name,setName]=useState("");
  const [kind,setKind]=useState<"memory"|"message"|"idea">("memory");
  const [memory,setMemory]=useState("");
  const [feeling,setFeeling]=useState("");
  const [photo,setPhoto]=useState<File|null>(null);
  const [status,setStatus]=useState("");
  const [sending,setSending]=useState(false);
  const [loading,setLoading]=useState(true);
  const [title,setTitle]=useState("Group Song");
  const [contributions,setContributions]=useState<Contribution[]>([]);
  const voterToken = useMemo(() => {
    if (typeof window === "undefined") return "";
    const key = `cantoa-group-voter-${token}`;
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(key, created);
    return created;
  }, [token]);

  const refresh = useCallback(async()=>{
    try {
      const r=await fetch(`/api/contribute/${token}`,{cache:"no-store"});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||"Could not open this Group Song.");
      setTitle(d.title||"Group Song");
      setContributions(Array.isArray(d.contributions)?d.contributions:[]);
    } catch(e){ setStatus(e instanceof Error?e.message:"Could not open this Group Song."); }
    finally { setLoading(false); }
  },[token]);

  useEffect(()=>{ void refresh(); },[refresh]);

  const send=async()=>{
    setSending(true); setStatus("");
    try{
      const form=new FormData();
      form.set("contributor",name);
      form.set("kind",kind);
      form.set("memory",memory);
      form.set("feeling",feeling);
      if(photo) form.set("photo",photo);
      const r=await fetch(`/api/contribute/${token}`,{method:"POST",body:form});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||"Could not add your contribution.");
      setMemory(""); setFeeling(""); setPhoto(null);
      const input=document.getElementById("group-photo") as HTMLInputElement|null; if(input) input.value="";
      setStatus("Added. Your contribution is now part of this Group Song.");
      await refresh();
    }catch(e){setStatus(e instanceof Error?e.message:"Could not add your contribution.");}
    finally{setSending(false)}
  };

  const vote=async(id:number)=>{
    if(!voterToken) return;
    try{
      const r=await fetch(`/api/contribute/${token}/vote`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contributionId:id,voterToken})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||"Could not save your vote.");
      setStatus(d.removed?"Vote removed.":"Vote added.");
      await refresh();
    }catch(e){setStatus(e instanceof Error?e.message:"Could not save your vote.");}
  };

  return <section className="contribution-card group-song-v2">
    <a href="/" className="gift-brand">〽 Cantoa <span>Moments → Music</span></a>
    <p>GROUP SONG 2.0</p>
    <h1>{title}</h1>
    <span>Add a memory, message or idea. You can also add one photo and vote on the ideas that feel most important.</span>

    <div className="group-kind-tabs" role="group" aria-label="Contribution type">
      <button type="button" className={kind==="memory"?"active":""} onClick={()=>setKind("memory")}>Memory</button>
      <button type="button" className={kind==="message"?"active":""} onClick={()=>setKind("message")}>Message</button>
      <button type="button" className={kind==="idea"?"active":""} onClick={()=>setKind("idea")}>Song idea</button>
    </div>
    <label>Your name (optional)<input value={name} maxLength={80} onChange={e=>setName(e.target.value)} placeholder="First name or nickname" /></label>
    <label>{kind==="memory"?"Your memory":kind==="message"?"Your message":"Your song idea"}<textarea value={memory} maxLength={1200} onChange={e=>setMemory(e.target.value)} placeholder={kind==="memory"?"A favorite moment, inside detail, or story…":kind==="message"?"Something you want the person or group to hear…":"A lyric idea, theme, phrase, or detail worth including…"} /></label>
    <label>Feeling to leave behind (optional)<input value={feeling} maxLength={120} onChange={e=>setFeeling(e.target.value)} placeholder="e.g. grateful, joyful, proud, nostalgic" /></label>
    <label className="group-photo-label">Photo (optional)<input id="group-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]||null)} /><small>One JPG, PNG or WebP up to 5 MB. Add a memory above so the creator knows why it matters.</small></label>
    <button className="group-submit" onClick={send} disabled={sending||memory.trim().length<3}>{sending?"Adding…":"Add to Group Song"}</button>
    {status&&<small className="group-status">{status}</small>}

    <div className="group-ideas-head"><div><b>Shared ideas</b><small>{contributions.length?`${contributions.length} contribution${contributions.length===1?"":"s"}`:"Be the first to add one."}</small></div><button type="button" onClick={()=>void refresh()} disabled={loading}>{loading?"Loading…":"Refresh"}</button></div>
    {contributions.length>0&&<div className="group-contribution-list">{contributions.map(item=><article key={item.id}>
      {item.photo_url&&<img src={item.photo_url} alt="Contribution" loading="lazy" />}
      <div className="group-contribution-copy"><span className="group-kind-badge">{item.kind==="idea"?"SONG IDEA":item.kind.toUpperCase()}</span><b>{item.contributor||"Someone"}</b><p>{item.memory}</p>{item.feeling&&<small>Feeling: {item.feeling}</small>}</div>
      <button type="button" className="group-vote" onClick={()=>void vote(item.id)} aria-label={`Vote for contribution from ${item.contributor||"Someone"}`}>♡ <span>{item.votes||0}</span></button>
    </article>)}</div>}
    <em>Anyone with this unlisted link can contribute and see the shared ideas. Only the song creator can turn them into a Cantoa song.</em>
  </section>;
}
