"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CircleStop, Headphones, Keyboard, Layers3, Mic2, Music2, Play, Radio, RefreshCw, Sparkles, WandSparkles, Waves } from "lucide-react";

type World = { name:string; eyebrow:string; palette:string[]; notes:number[]; labels:string[]; mood:string };
const worlds: World[] = [
  { name:"Monsoon Palace", eyebrow:"RAIN · BRASS · ELECTRIC SKY", palette:["#8d5cff","#ee62b7","#ffb75d","#63e6da"], notes:[174.61,196,220,261.63,293.66,349.23,392,523.25], labels:["First rain","Marigold","Courtyard","Peacock","Thunder","Lanterns","Petrichor","Night sky"], mood:"warm, ceremonial and rain-soaked" },
  { name:"Glass Forest", eyebrow:"CRYSTAL · MOSS · MORNING LIGHT", palette:["#25c9a5","#92e85e","#f6cf65","#73a8ff"], notes:[164.81,220,246.94,293.66,329.63,392,440,493.88], labels:["Dew","Fern","Canopy","Ripple","Sunbeam","Wildflower","Creek","Open air"], mood:"bright, organic and weightless" },
  { name:"Neon Bazaar", eyebrow:"BASS · COLOR · MIDNIGHT PULSE", palette:["#ff477e","#ff8a4c","#ffe66d","#6c63ff"], notes:[146.83,196,233.08,261.63,311.13,349.23,466.16,523.25], labels:["Signal","Chrome","Rush","Spice","Arcade","Traffic","Rooftop","Midnight"], mood:"bold, rhythmic and kinetic" },
];
function hashPrompt(value:string){ return [...value].reduce((a,c)=>a+c.charCodeAt(0),0); }

export default function Home(){
  const [prompt,setPrompt]=useState("A joyful monsoon night in Jaipur with thunder drums and glowing peacocks");
  const [world,setWorld]=useState(worlds[0]);
  const [energy,setEnergy]=useState(68);
  const [space,setSpace]=useState(42);
  const [active,setActive]=useState<number|null>(null);
  const [recording,setRecording]=useState(false);
  const [take,setTake]=useState<number[]>([]);
  const [mode,setMode]=useState<"song"|"world">("song");
  const [instrumental,setInstrumental]=useState(false);
  const [generating,setGenerating]=useState(false);
  const [songUrl,setSongUrl]=useState<string|null>(null);
  const [songMessage,setSongMessage]=useState("");
  const [demoPlaying,setDemoPlaying]=useState(false);
  const audio=useRef<AudioContext|null>(null);
  const demoTimer=useRef<number|null>(null);
  const getAudio=()=> audio.current ?? (audio.current=new AudioContext());
  const playPad=useCallback((index:number)=>{
    const ctx=getAudio(), now=ctx.currentTime, master=ctx.createGain(), filter=ctx.createBiquadFilter(), osc=ctx.createOscillator(), shimmer=ctx.createOscillator(), shimmerGain=ctx.createGain();
    osc.type=index%3===0?"triangle":index%3===1?"sine":"sawtooth"; shimmer.type="sine";
    osc.frequency.setValueAtTime(world.notes[index],now); shimmer.frequency.setValueAtTime(world.notes[index]*2.01,now);
    filter.type="lowpass"; filter.frequency.setValueAtTime(700+energy*32,now);
    master.gain.setValueAtTime(.0001,now); master.gain.exponentialRampToValueAtTime(.12+energy/900,now+.025); master.gain.exponentialRampToValueAtTime(.0001,now+.45+space/90);
    shimmerGain.gain.setValueAtTime(.025+space/2400,now); shimmerGain.gain.exponentialRampToValueAtTime(.0001,now+.65+space/70);
    osc.connect(filter).connect(master).connect(ctx.destination); shimmer.connect(shimmerGain).connect(ctx.destination);
    osc.start(now); shimmer.start(now); osc.stop(now+1.8); shimmer.stop(now+1.8);
    setActive(index); window.setTimeout(()=>setActive(v=>v===index?null:v),260); if(recording)setTake(v=>[...v,index]);
  },[energy,space,world,recording]);
  const generate=()=>{setWorld(worlds[hashPrompt(prompt)%worlds.length]);setTake([])};
  const stopDemo=()=>{if(demoTimer.current)window.clearInterval(demoTimer.current);demoTimer.current=null;setDemoPlaying(false)};
  const playDemo=()=>{
    if(demoPlaying){stopDemo();return}
    const ctx=getAudio(); let step=0; setDemoPlaying(true);
    const sequence=[0,2,4,2,5,4,2,1,0,2,4,7,5,4,2,1];
    demoTimer.current=window.setInterval(()=>{
      const now=ctx.currentTime, beat=step%16, root=world.notes[sequence[beat]%world.notes.length]/2;
      const bass=ctx.createOscillator(), gain=ctx.createGain(); bass.type="triangle";bass.frequency.value=root;
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(beat%4===0?.18:.07,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+.22);
      bass.connect(gain).connect(ctx.destination);bass.start(now);bass.stop(now+.25);
      if(beat%4===0){const kick=ctx.createOscillator(),kg=ctx.createGain();kick.frequency.setValueAtTime(120,now);kick.frequency.exponentialRampToValueAtTime(42,now+.12);kg.gain.setValueAtTime(.28,now);kg.gain.exponentialRampToValueAtTime(.0001,now+.14);kick.connect(kg).connect(ctx.destination);kick.start(now);kick.stop(now+.15)}
      step++;
    },250);
  };
  const generateSong=async()=>{
    setGenerating(true);setSongMessage("");stopDemo();
    try{
      const response=await fetch("/api/music",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,instrumental,duration:30})});
      if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"Music generation is not configured yet.")}
      const blob=await response.blob();setSongUrl(URL.createObjectURL(blob));setSongMessage("Your complete song is ready.");
    }catch(error){setSongMessage(error instanceof Error?error.message:"Music generation failed.");}
    finally{setGenerating(false)}
  };
  const keys=useMemo(()=>["A","S","D","F","J","K","L",";"],[]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{if((event.target as HTMLElement)?.tagName==="TEXTAREA")return;const index=keys.indexOf(event.key.toUpperCase());if(index>=0)playPad(index)};
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[keys,playPad]);
  return <main className="app-shell" style={{"--c1":world.palette[0],"--c2":world.palette[1],"--c3":world.palette[2],"--c4":world.palette[3]} as React.CSSProperties}>
    <nav className="topbar">
      <a className="brand" href="#"><span className="brand-mark"><Waves size={19}/></span><span>MuseBox</span><em>PLAYABLE WORLDS</em></a>
      <div className="navlinks"><a className="active" href="#create">Create</a><a href="#discover">Discover</a><a href="#how">How it works</a></div>
      <div className="nav-meta"><span><Sparkles size={15}/> 12 worlds</span><button className="avatar">DS</button></div>
    </nav>
    <section className="hero" id="create">
      <div className="hero-copy">
        <p className="kicker"><span/> AN IDEA BECOMES AN INSTRUMENT.</p>
        <h1>Don’t just listen.<br/><i>Play a world.</i></h1>
        <p className="lede">Describe any feeling, place or impossible idea. MuseBox turns it into an original musical world you can touch, perform and share.</p>
        <div className="proof"><span><Check/> No musical skill</span><span><Check/> Every touch sounds right</span><span><Check/> Ready in seconds</span></div>
        <div className="mini-stage" aria-hidden="true"><div className="orb orb-a"/><div className="orb orb-b"/><div className="orb orb-c"/><div className="mini-label"><span>LIVE WORLD</span><strong>{world.name}</strong></div><div className="equalizer">{[32,68,43,88,57,76,39,94,51,70,42,82].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div>
      </div>
      <div className="creator-card">
        <div className="mode-switch"><button className={mode==="song"?"active":""} onClick={()=>setMode("song")}><Music2/> Create a song</button><button className={mode==="world"?"active":""} onClick={()=>setMode("world")}><WandSparkles/> Create a world</button></div>
        <div className="card-head"><div><span>{mode==="song"?"NEW ORIGINAL SONG":"NEW PLAYABLE WORLD"}</span><h2>{mode==="song"?"Turn your idea into music.":"What do you want to play?"}</h2></div><b>LIVE PROTOTYPE</b></div>
        <label className="prompt-label" htmlFor="prompt">{mode==="song"?"Describe your song—theme, mood, genre and language":"Describe a place, feeling or impossible idea"}</label>
        <div className="prompt-box"><WandSparkles size={20}/><textarea id="prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3}/></div>
        <div className="chips"><button onClick={()=>setPrompt("A glass forest waking at sunrise")}>Glass forest</button><button onClick={()=>setPrompt("A neon bazaar after midnight")}>Neon bazaar</button><button onClick={()=>setPrompt("A joyful monsoon night in Jaipur")}>Monsoon Jaipur</button></div>
        {mode==="song"?<div className="song-options"><button className={!instrumental?"selected":""} onClick={()=>setInstrumental(false)}><Mic2/> Song with vocals</button><button className={instrumental?"selected":""} onClick={()=>setInstrumental(true)}><Music2/> Instrumental</button></div>:<div className="control-grid"><label>Energy <strong>{energy}%</strong><input aria-label="Energy" type="range" min="10" max="100" value={energy} onChange={e=>setEnergy(+e.target.value)}/></label><label>Space <strong>{space}%</strong><input aria-label="Space" type="range" min="0" max="100" value={space} onChange={e=>setSpace(+e.target.value)}/></label></div>}
        {mode==="song"?<><button className="generate" onClick={generateSong} disabled={generating}><Sparkles/> {generating?"Composing your song…":"Generate full song"} <ArrowRight/></button><button className="demo-button" onClick={playDemo}>{demoPlaying?<CircleStop/>:<Play/>}{demoPlaying?"Stop instant demo":"Play instant music demo"}</button>{songUrl&&<audio className="song-player" controls src={songUrl}/>} {songMessage&&<p className="song-message">{songMessage}</p>}<p className="prototype-note">Full songs use ElevenLabs Music when ELEVENLABS_API_KEY is configured. The instant demo works locally.</p></>:<><button className="generate" onClick={generate}><Sparkles/> Create my playable world <ArrowRight/></button><p className="prototype-note">Playable worlds generate instantly—no paid rendering.</p></>}
      </div>
    </section>
    <section className="studio" id="discover">
      <div className="studio-title"><div><p>{world.eyebrow}</p><h2>{world.name}</h2><span>Your prompt became something {world.mood}. Tap the world to perform it.</span></div><div className="studio-actions"><button onClick={()=>setTake([])}><RefreshCw/> Reset</button><button className={recording?"recording":""} onClick={()=>{setRecording(!recording);if(!recording)setTake([])}}>{recording?<CircleStop/>:<Radio/>}{recording?"Stop take":"Record take"}</button></div></div>
      <div className="instrument">
        <div className="visual-field"><div className="halo"/><div className="halo two"/><p><Headphones/> TAP, TOUCH OR USE YOUR KEYBOARD</p>
          <div className="pads">{world.labels.map((label,i)=><button key={label} className={active===i?"pad active":"pad"} onPointerDown={()=>playPad(i)} aria-label={`Play ${label}`}><span className="pad-light"/><b>{keys[i]}</b><em>{label}</em></button>)}</div>
          <div className="take-line">{take.length?<><span>{take.length} notes captured</span><div>{take.slice(-18).map((n,i)=><i key={i} style={{height:`${22+(n%5)*10}px`}}/>)}</div></>:<><span>Your performance will appear here</span><small>Press Record take, then play</small></>}</div>
        </div>
        <aside className="world-info"><p>WORLD DNA</p><h3>Built to be played,<br/>not merely watched.</h3><ul><li><span><Keyboard/></span><div><b>Eight expressive zones</b><small>Each pad has its own tone and visual response.</small></div></li><li><span><Layers3/></span><div><b>One musical universe</b><small>Every note belongs together, so there are no wrong moves.</small></div></li><li><span><Play/></span><div><b>Your performance</b><small>Record a take and turn exploration into something shareable.</small></div></li></ul><div className="now-playing"><i/><div><small>NOW PLAYING</small><b>{world.name}</b></div><Waves/></div></aside>
      </div>
    </section>
    <section className="how" id="how"><p>ONE PROMPT. INFINITE PERFORMANCES.</p><h2>A new creative medium,<br/><i>made for everyone.</i></h2><div><article><b>01</b><h3>Imagine it</h3><span>Describe a mood or world in ordinary language.</span></article><article><b>02</b><h3>Play it</h3><span>Tap, swipe and move. The instrument responds live.</span></article><article><b>03</b><h3>Make it yours</h3><span>Record a performance that nobody else could repeat.</span></article></div></section>
  </main>
}
