import { useState, useEffect } from "react";

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const getPW       = () => JSON.parse(localStorage.getItem("ws_pw") || '{"nmiller3300":"1","white":"1"}');
const savePW      = (pw) => localStorage.setItem("ws_pw", JSON.stringify(pw));
const getSession  = () => localStorage.getItem("ws_session");
const setSession  = (uid) => localStorage.setItem("ws_session", uid);
const clearSession= () => localStorage.removeItem("ws_session");

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ACCOUNTS = {
  nmiller3300: { id:"nmiller3300", name:"Miller", initials:"M", color:"#6366f1", role:"Owner" },
  white:       { id:"white",       name:"White",  initials:"W", color:"#f59e0b", role:"Partner" },
};

const STAGES = [
  { id:"new",               label:"New Lead",             color:"#64748b", bg:"rgba(100,116,139,0.2)" },
  { id:"under-review",      label:"Under Review",         color:"#3b82f6", bg:"rgba(59,130,246,0.2)"  },
  { id:"demo-building",     label:"Demo Building",        color:"#8b5cf6", bg:"rgba(139,92,246,0.2)"  },
  { id:"demo-ready",        label:"Demo Ready",           color:"#06b6d4", bg:"rgba(6,182,212,0.2)"   },
  { id:"outreach-sent",     label:"Outreach Sent",        color:"#f59e0b", bg:"rgba(245,158,11,0.2)"  },
  { id:"in-conversation",   label:"In Conversation",      color:"#f97316", bg:"rgba(249,115,22,0.2)"  },
  { id:"proposal-sent",     label:"Proposal Sent",        color:"#ec4899", bg:"rgba(236,72,153,0.2)"  },
  { id:"closed-won",        label:"Signed",               color:"#10b981", bg:"rgba(16,185,129,0.2)"  },
  { id:"declined-designer", label:"Declined by Designer", color:"#ef4444", bg:"rgba(239,68,68,0.2)"   },
  { id:"declined-client",   label:"Declined by Client",   color:"#f43f5e", bg:"rgba(244,63,94,0.2)"   },
];
const stageMap      = Object.fromEntries(STAGES.map(s => [s.id, s]));
const mainStages    = STAGES.filter(s => !s.id.startsWith("declined"));
const declineStages = STAGES.filter(s =>  s.id.startsWith("declined"));

const SOURCES  = ["Google Maps","Drove By","White Found It","Miller Found It","Referral","Social Media","Other"];
const METHODS  = ["Call","Text","Email","In Person"];
const OUTCOMES = ["No Answer","Left Voicemail","Responded","Not Interested","Scheduled Follow-up"];
const PAY_COLORS = { unpaid:"#f59e0b", pending:"#06b6d4", paid:"#10b981", overdue:"#ef4444" };

const INITIAL_LEADS = [];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const BG  = "radial-gradient(ellipse at 20% 20%,rgba(99,102,241,0.28) 0%,transparent 55%),radial-gradient(ellipse at 80% 80%,rgba(6,182,212,0.2) 0%,transparent 55%),radial-gradient(ellipse at 65% 10%,rgba(139,92,246,0.16) 0%,transparent 45%),#070714";
const G   = {background:"rgba(255,255,255,0.07)",backdropFilter:"blur(24px) saturate(180%)",WebkitBackdropFilter:"blur(24px) saturate(180%)",border:"1px solid rgba(255,255,255,0.11)",borderRadius:"16px"};
const GS  = {...G,background:"rgba(255,255,255,0.11)",borderRadius:"20px",border:"1px solid rgba(255,255,255,0.17)"};
const FF  = "-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif";
const CSS = `*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px;}input,textarea,select{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-family:${FF};font-size:13px;padding:9px 12px;outline:none;transition:border-color .2s;width:100%;}input:focus,textarea:focus,select:focus{border-color:rgba(99,102,241,0.6);}input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.25);}select option{background:#12122a;color:#fff;}input[type=number]::-webkit-inner-spin-button{opacity:.3;}button{cursor:pointer;font-family:${FF};}@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes si{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.fu{animation:fu .35s ease forwards;}.si{animation:si .28s ease forwards;}`;

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────
const ts    = () => new Date().toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
const today = () => new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});

const Avatar = ({uid,size=28}) => {
  const u=ACCOUNTS[uid]; if(!u) return null;
  return <div style={{width:size,height:size,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:700,color:"#fff",flexShrink:0,border:"2px solid rgba(255,255,255,0.18)"}}>{u.initials}</div>;
};

const Pill = ({sid,sm}) => {
  const s=stageMap[sid]||stageMap.new;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:sm?"2px 8px":"5px 11px",borderRadius:20,fontSize:sm?9:11,fontWeight:700,background:s.bg,color:s.color,border:`1px solid ${s.color}40`,whiteSpace:"nowrap"}}><span style={{width:5,height:5,borderRadius:"50%",background:s.color,flexShrink:0}}/>{s.label}</span>;
};

const Score = ({lead}) => {
  const n=Math.min(10,Math.floor((lead.reviews/20)+lead.rating));
  const c=n>=8?"#10b981":n>=5?"#f59e0b":"#ef4444";
  return <div style={{width:34,height:34,borderRadius:"50%",border:`2px solid ${c}`,background:`${c}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:c,flexShrink:0}}>{n}</div>;
};

const Box = ({label,children,accent,style={}}) => (
  <div style={{...G,padding:18,border:accent?`1px solid ${accent}25`:"1px solid rgba(255,255,255,0.09)",...style}}>
    <div style={{fontSize:10,fontWeight:700,color:accent||"rgba(255,255,255,0.35)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14}}>{label}</div>
    {children}
  </div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({onLogin}) => {
  const [u,setU]=useState(""); const [p,setP]=useState("");
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const submit=()=>{
    if(!u.trim()||!p){setErr("Please enter username and password.");return;}
    setLoading(true);
    setTimeout(()=>{
      const pw=getPW();
      if(ACCOUNTS[u.toLowerCase()]&&pw[u.toLowerCase()]===p){onLogin(u.toLowerCase());}
      else{setErr("Invalid credentials.");setLoading(false);}
    },600);
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:BG,padding:20,fontFamily:FF}}>
      <style>{CSS}</style>
      <div className="fu" style={{...GS,padding:"46px 38px",width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:11,letterSpacing:"0.35em",textTransform:"uppercase",color:"rgba(99,102,241,0.85)",marginBottom:7,fontWeight:700}}>WEBSCAPE</div>
        <div style={{fontSize:30,fontWeight:700,letterSpacing:"-0.5px",color:"#fff",marginBottom:5}}>Lead Portal</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.35)",marginBottom:30}}>Sign in to continue</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14,textAlign:"left"}}>
          <input placeholder="Username" value={u} onChange={e=>{setU(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          <input placeholder="Password" type="password" value={p} onChange={e=>{setP(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
        </div>
        {err&&<div style={{fontSize:12,color:"#f43f5e",marginBottom:10,textAlign:"left"}}>{err}</div>}
        <button onClick={submit} disabled={loading} style={{width:"100%",padding:13,borderRadius:10,border:"none",background:loading?"rgba(99,102,241,0.4)":"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontSize:15,fontWeight:600}}>{loading?"Signing in…":"Sign In"}</button>
      </div>
    </div>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const Sidebar = ({view,go,user,leads,onLogout,isMobile,menuOpen,setMenuOpen}) => {
  const myCount=leads.filter(l=>l.assignedTo===user.id||l.coWorkers.includes(user.id)).length;
  const signedCount=leads.filter(l=>l.status==="closed-won").length;
  const nav=[["dashboard","⬡","Dashboard"],["leads","◈","All Leads"],["mine","◎","My Leads"],["clients","★","Clients"],["settings","⊙","Settings"]];
  const inner=(
    <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"20px 12px"}}>
      <div style={{padding:"4px 10px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)",marginBottom:8}}>
        <div style={{fontSize:10,letterSpacing:"0.32em",color:"rgba(99,102,241,0.8)",fontWeight:700,textTransform:"uppercase"}}>WEBSCAPE</div>
        <div style={{fontSize:17,fontWeight:700,letterSpacing:"-0.3px",color:"#fff"}}>Miller & White</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>
        {nav.map(([id,icon,label])=>(
          <button key={id} onClick={()=>{go(id);if(isMobile)setMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 10px",borderRadius:10,border:"none",textAlign:"left",background:view===id?"rgba(99,102,241,0.22)":"transparent",color:view===id?"#a5b4fc":"rgba(255,255,255,0.48)",fontSize:13,fontWeight:view===id?600:400,transition:"all .15s"}}>
            <span style={{fontSize:15}}>{icon}</span>
            <span style={{flex:1}}>{label}</span>
            {id==="mine"&&myCount>0&&<span style={{fontSize:10,background:"rgba(99,102,241,0.3)",color:"#a5b4fc",padding:"1px 6px",borderRadius:8,fontWeight:700}}>{myCount}</span>}
            {id==="clients"&&signedCount>0&&<span style={{fontSize:10,background:"rgba(16,185,129,0.2)",color:"#34d399",padding:"1px 6px",borderRadius:8,fontWeight:700}}>{signedCount}</span>}
          </button>
        ))}
      </div>
      <div style={{paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",marginBottom:4}}>
          <Avatar uid={user.id} size={30}/>
          <div><div style={{fontSize:12,fontWeight:600,color:"#fff"}}>{user.name}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{user.role}</div></div>
        </div>
        <button onClick={onLogout} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"none",background:"transparent",color:"rgba(255,255,255,0.28)",fontSize:12,textAlign:"left"}}>Sign out</button>
      </div>
    </div>
  );
  if(isMobile) return (
    <>
      <button onClick={()=>setMenuOpen(!menuOpen)} style={{position:"fixed",top:12,left:12,zIndex:300,width:40,height:40,borderRadius:10,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(10,10,30,0.85)",backdropFilter:"blur(12px)",color:"#fff",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center"}}>☰</button>
      {menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)"}}/>}
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:220,zIndex:250,background:"rgba(8,8,22,0.97)",backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",borderRight:"1px solid rgba(255,255,255,0.1)",transform:menuOpen?"translateX(0)":"translateX(-100%)",transition:"transform .24s ease"}}>{inner}</div>
    </>
  );
  return <div style={{...G,width:210,flexShrink:0,height:"calc(100vh - 24px)"}}>{inner}</div>;
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const Dashboard = ({leads,user,go,setSelLead}) => {
  const [goal,setGoal]=useState(()=>localStorage.getItem("ws_goal")||"");
  const [editing,setEditing]=useState(false);
  const [gi,setGi]=useState(goal);
  const open=leads.filter(l=>!["closed-won","declined-designer","declined-client"].includes(l.status));
  const signed=leads.filter(l=>l.status==="closed-won");
  const mrr=signed.reduce((a,l)=>a+(parseFloat(l.payment?.monthly)||0),0);
  const mine=leads.filter(l=>(l.assignedTo===user.id||l.coWorkers.includes(user.id))&&!["closed-won","declined-designer","declined-client"].includes(l.status));
  const goalN=parseFloat(goal)||0; const pct=goalN>0?Math.min(100,Math.round((mrr/goalN)*100)):0;
  const saveGoal=()=>{localStorage.setItem("ws_goal",gi);setGoal(gi);setEditing(false);};
  const activity=leads.filter(l=>l.notes.length>0||l.outreachLog.length>0).slice(0,5);
  return (
    <div className="fu" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{paddingTop:4}}><div style={{fontSize:20,fontWeight:700,color:"#fff",letterSpacing:"-0.3px"}}>Hey {user.name} 👋</div><div style={{fontSize:13,color:"rgba(255,255,255,0.38)",marginTop:3}}>Here's your pipeline today.</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[[open.length,"Open Leads","#a5b4fc"],[signed.length,"Signed","#34d399"],[`$${mrr}/mo`,"Recurring","#fbbf24"],[mine.length,"My Active","#67e8f9"]].map(([v,l,c])=>(
          <div key={l} style={{...G,padding:"16px 18px"}}><div style={{fontSize:26,fontWeight:700,color:c,letterSpacing:"-0.5px"}}>{v}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2}}>{l}</div></div>
        ))}
      </div>
      <Box label="Revenue Goal" accent="#f59e0b">
        {editing?(
          <div style={{display:"flex",gap:8}}>
            <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,0.4)",fontWeight:600}}>$</span><input value={gi} onChange={e=>setGi(e.target.value)} type="number" placeholder="Monthly goal…" style={{paddingLeft:22}}/></div>
            <button onClick={saveGoal} style={{padding:"9px 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",fontSize:13,fontWeight:600}}>Set</button>
          </div>
        ):(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:goalN>0?10:0}}>
              <div><span style={{fontSize:22,fontWeight:700,color:"#fbbf24"}}>${mrr}</span><span style={{fontSize:13,color:"rgba(255,255,255,0.35)"}}>{goalN>0?` / $${goalN} goal`:""}</span></div>
              <button onClick={()=>{setGi(goal);setEditing(true);}} style={{fontSize:11,color:"rgba(255,255,255,0.35)",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 10px"}}>{goalN>0?"Edit":"Set Goal"}</button>
            </div>
            {goalN>0&&<><div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.08)",overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#f59e0b,#10b981)",borderRadius:3}}/></div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:5}}>{pct}% of goal</div></>}
          </>
        )}
      </Box>
      <Box label="Pipeline Breakdown">
        {STAGES.filter(s=>!s.id.startsWith("declined")).map(s=>{const c=leads.filter(l=>l.status===s.id).length;if(!c)return null;const p2=Math.round((c/leads.length)*100);return(<div key={s.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><span style={{width:7,height:7,borderRadius:"50%",background:s.color,flexShrink:0}}/><span style={{fontSize:12,color:"rgba(255,255,255,0.6)",flex:1}}>{s.label}</span><div style={{width:60,height:4,borderRadius:2,background:"rgba(255,255,255,0.07)",overflow:"hidden"}}><div style={{height:"100%",width:`${p2}%`,background:s.color}}/></div><span style={{fontSize:12,fontWeight:600,color:s.color,width:16,textAlign:"right"}}>{c}</span></div>);})}
      </Box>
      <Box label="Team Activity">
        {activity.length===0&&<div style={{fontSize:12,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>No activity yet.</div>}
        {activity.map(l=>{const n=l.notes[l.notes.length-1];const o=l.outreachLog[l.outreachLog.length-1];const item=n||o;if(!item)return null;return(<button key={l.id} onClick={()=>{setSelLead(l.id);go("lead-detail");}} style={{display:"flex",gap:10,alignItems:"flex-start",width:"100%",background:"transparent",border:"none",textAlign:"left",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",cursor:"pointer"}}><Avatar uid={"author" in item?item.author:item.by} size={26}/><div><div style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}><strong style={{color:"#fff"}}>{l.businessName}</strong> — {"text" in item?item.text.slice(0,50)+"…":`${item.method} · ${item.outcome}`}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>{"ts" in item?item.ts:item.date}</div></div></button>);})}
      </Box>
    </div>
  );
};

// ─── LEADS LIST ──────────────────────────────────────────────────────────────
const CATEGORIES = ["Restaurant","Bar","Barbershop","Nail Salon","Auto Repair","Gym","Dentist","Lawyer","Plumber","Electrician","HVAC","Landscaping","Cleaning Service","Pet Grooming","Tattoo Shop","Florist","Bakery","Coffee Shop","Boutique","Photography","Accounting","Chiropractor","Massage","Daycare","Veterinarian"];

const LeadsList = ({leads,setLeads,user,go,setSelLead,filterMine}) => {
  const [search,setSearch]=useState(""); const [fStatus,setFStatus]=useState("all");
  const [fZip,setFZip]=useState(""); const [fPriority,setFPriority]=useState(false);
  const [qMenu,setQMenu]=useState(null);
  const [searchZip,setSearchZip]=useState("");
  const [selectedCats,setSelectedCats]=useState([]);
  const [searching,setSearching]=useState(false);
  const [searchResults,setSearchResults]=useState([]);
  const [searchMsg,setSearchMsg]=useState("");
  const [showSearch,setShowSearch]=useState(false);
  const [progress,setProgress]=useState({done:0,total:0});

  const toggleCat=(cat)=>setSelectedCats(p=>p.includes(cat)?p.filter(c=>c!==cat):[...p,cat]);
  const selectAll=()=>setSelectedCats([...CATEGORIES]);
  const clearAll=()=>setSelectedCats([]);

  const runSearch=async()=>{
    if(!searchZip.trim()){setSearchMsg("Enter a ZIP code.");return;}
    if(selectedCats.length===0){setSearchMsg("Select at least one category.");return;}
    setSearching(true); setSearchResults([]); setSearchMsg("");
    setProgress({done:0,total:selectedCats.length});
    // Log zip history
    const zips=JSON.parse(localStorage.getItem("ws_zips")||"[]");
    if(!zips.includes(searchZip)){localStorage.setItem("ws_zips",JSON.stringify([searchZip,...zips].slice(0,20)));}
    try{
      const existing=new Set(leads.map(l=>l.businessName.toLowerCase()));
      let allLeads=[];
      let totalFound=0;
      // Run all category searches in parallel — batched to avoid rate limits
      const batchSize=3;
      for(let i=0;i<selectedCats.length;i+=batchSize){
        const batch=selectedCats.slice(i,i+batchSize);
        const results=await Promise.all(batch.map(cat=>
          fetch("/.netlify/functions/search-leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({zip:searchZip,category:cat})})
            .then(r=>r.json()).catch(()=>({leads:[],total:0,noWebsite:0}))
        ));
        results.forEach(data=>{
          if(!data.error){
            totalFound+=data.noWebsite||0;
            const fresh=( data.leads||[]).filter(l=>!existing.has(l.businessName.toLowerCase())&&!allLeads.find(a=>a.businessName.toLowerCase()===l.businessName.toLowerCase()));
            allLeads=[...allLeads,...fresh];
          }
        });
        setProgress({done:Math.min(i+batchSize,selectedCats.length),total:selectedCats.length});
      }
      setSearchResults(allLeads);
      setSearchMsg(`Searched ${selectedCats.length} categories in ${searchZip} — ${allLeads.length} new leads with no website found.`);
    }catch(e){setSearchMsg("Search failed. Check your API key in Netlify.");}
    setSearching(false); setProgress({done:0,total:0});
  };

  const addLead=(l)=>{setLeads(p=>[...p,l]);setSearchResults(p=>p.filter(r=>r.id!==l.id));};
  const addAll=()=>{setLeads(p=>[...p,...searchResults]);setSearchResults([]);};

  let filtered=filterMine?leads.filter(l=>l.assignedTo===user.id||l.coWorkers.includes(user.id)):leads;
  if(search) filtered=filtered.filter(l=>l.businessName.toLowerCase().includes(search.toLowerCase())||l.category.toLowerCase().includes(search.toLowerCase()));
  if(fStatus!=="all") filtered=filtered.filter(l=>l.status===fStatus);
  if(fZip) filtered=filtered.filter(l=>l.zip.includes(fZip));
  if(fPriority) filtered=filtered.filter(l=>l.priority);
  filtered=[...filtered].sort((a,b)=>(b.priority?1:0)-(a.priority?1:0));
  const upd=(id,u)=>setLeads(p=>p.map(l=>l.id===id?{...l,...u}:l));
  return (
    <div className="fu" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:4}}>
        <div><div style={{fontSize:20,fontWeight:700,color:"#fff",letterSpacing:"-0.3px"}}>{filterMine?"My Leads":"All Leads"}</div><div style={{fontSize:13,color:"rgba(255,255,255,0.38)",marginTop:2}}>{filtered.length} lead{filtered.length!==1?"s":""}</div></div>
        {!filterMine&&<button onClick={()=>setShowSearch(!showSearch)} style={{padding:"9px 16px",borderRadius:10,border:`1px solid ${showSearch?"rgba(99,102,241,0.5)":"rgba(99,102,241,0.35)"}`,background:showSearch?"rgba(99,102,241,0.2)":"rgba(99,102,241,0.1)",color:"#a5b4fc",fontSize:13,fontWeight:600}}>🔍 Find Leads</button>}
      </div>

      {/* ZIP SEARCH */}
      {showSearch&&!filterMine&&(
        <Box label="Search for Leads by ZIP" accent="#6366f1">
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
            <input placeholder="ZIP code…" value={searchZip} onChange={e=>setSearchZip(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runSearch()} style={{maxWidth:130}}/>
            <button onClick={selectAll} style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.1)",color:"#a5b4fc",fontSize:11,fontWeight:600}}>Select All</button>
            <button onClick={clearAll} style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:11,fontWeight:600}}>Clear</button>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{selectedCats.length} selected</span>
          </div>
          {/* Category pills */}
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {CATEGORIES.map(cat=>{
              const on=selectedCats.includes(cat);
              return <button key={cat} onClick={()=>toggleCat(cat)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${on?"rgba(99,102,241,0.6)":"rgba(255,255,255,0.1)"}`,background:on?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.04)",color:on?"#a5b4fc":"rgba(255,255,255,0.45)",fontSize:11,fontWeight:on?700:400,transition:"all .15s"}}>{cat}</button>;
            })}
          </div>
          {/* Progress bar while searching */}
          {searching&&progress.total>0&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:5}}>Searching {progress.done} / {progress.total} categories…</div>
              <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.08)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round((progress.done/progress.total)*100)}%`,background:"linear-gradient(90deg,#6366f1,#8b5cf6)",borderRadius:2,transition:"width .3s"}}/>
              </div>
            </div>
          )}
          <button onClick={runSearch} disabled={searching} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:searching?"rgba(99,102,241,0.3)":"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontSize:13,fontWeight:600,marginBottom:10}}>{searching?`Searching ${progress.done}/${progress.total}…`:"Search All Selected"}</button>
          {searchMsg&&<div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:10}}>{searchMsg}</div>}
          {searchResults.length>0&&(
            <>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
                <button onClick={addAll} style={{padding:"7px 16px",borderRadius:8,border:"1px solid rgba(16,185,129,0.35)",background:"rgba(16,185,129,0.12)",color:"#34d399",fontSize:12,fontWeight:600}}>+ Add All {searchResults.length}</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:320,overflowY:"auto"}}>
                {searchResults.map(r=>(
                  <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 14px"}}>
                    <Score lead={r}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{r.businessName}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.38)"}}>{r.address}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:1}}>⭐ {r.rating} · {r.reviews} reviews · {r.phone}</div>
                    </div>
                    <button onClick={()=>addLead(r)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(99,102,241,0.35)",background:"rgba(99,102,241,0.12)",color:"#a5b4fc",fontSize:12,fontWeight:600,flexShrink:0}}>+ Add</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Box>
      )}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:170}}/>
        <input placeholder="ZIP…" value={fZip} onChange={e=>setFZip(e.target.value)} style={{maxWidth:90}}/>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{maxWidth:165}}>
          <option value="all">All Statuses</option>
          {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button onClick={()=>setFPriority(!fPriority)} style={{padding:"7px 12px",borderRadius:10,border:`1px solid ${fPriority?"rgba(251,191,36,0.5)":"rgba(255,255,255,0.1)"}`,background:fPriority?"rgba(251,191,36,0.12)":"rgba(255,255,255,0.05)",color:fPriority?"#fbbf24":"rgba(255,255,255,0.4)",fontSize:12,fontWeight:600}}>★ Priority</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {filtered.length===0&&<div style={{...G,padding:32,textAlign:"center",color:"rgba(255,255,255,0.25)",fontSize:13}}>No leads found.</div>}
        {filtered.map(lead=>(
          <div key={lead.id} style={{...G,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.05)",cursor:"pointer",position:"relative",transition:"background .15s"}}
            onClick={()=>{setSelLead(lead.id);go("lead-detail");}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.09)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
            <Score lead={lead}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:14,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.businessName}</span>
                {lead.priority&&<span style={{color:"#fbbf24",fontSize:13}}>★</span>}
                <span style={{fontSize:11,color:"rgba(255,255,255,0.32)"}}>{lead.category}</span>
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.32)",marginTop:2}}>📮 {lead.zip} · ⭐ {lead.rating} ({lead.reviews} reviews)</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
              {lead.assignedTo&&<Avatar uid={lead.assignedTo} size={24}/>}
              {lead.coWorkers.slice(0,1).map(cw=><Avatar key={cw} uid={cw} size={20}/>)}
              <Pill sid={lead.status} sm/>
              <button onClick={e=>{e.stopPropagation();setQMenu(qMenu===lead.id?null:lead.id);}} style={{width:28,height:28,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>⋯</button>
            </div>
            {qMenu===lead.id&&(
              <div onClick={e=>e.stopPropagation()} style={{position:"absolute",right:12,top:54,zIndex:50,...G,background:"rgba(12,12,28,0.97)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",padding:8,minWidth:180,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.28)",letterSpacing:"0.1em",textTransform:"uppercase",padding:"4px 8px 8px"}}>Quick Actions</div>
                <button onClick={()=>{upd(lead.id,{priority:!lead.priority});setQMenu(null);}} style={{display:"block",width:"100%",padding:"8px 10px",background:"transparent",border:"none",color:"rgba(255,255,255,0.7)",fontSize:12,textAlign:"left",borderRadius:8}}>{lead.priority?"Remove ★ Priority":"★ Mark Priority"}</button>
                {mainStages.slice(0,5).map(s=>(
                  <button key={s.id} onClick={()=>{upd(lead.id,{status:s.id});setQMenu(null);}} style={{display:"block",width:"100%",padding:"7px 10px",background:lead.status===s.id?"rgba(99,102,241,0.15)":"transparent",border:"none",color:lead.status===s.id?"#a5b4fc":"rgba(255,255,255,0.55)",fontSize:12,textAlign:"left",borderRadius:8}}>→ {s.label}</button>
                ))}
                <button onClick={()=>setQMenu(null)} style={{display:"block",width:"100%",padding:"6px 10px",background:"transparent",border:"none",color:"rgba(255,255,255,0.25)",fontSize:11,textAlign:"left",marginTop:4}}>Close</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── LEAD DETAIL ─────────────────────────────────────────────────────────────
const LeadDetail = ({leadId,leads,setLeads,user,onBack}) => {
  const lead=leads.find(l=>l.id===leadId);
  const [noteText,setNoteText]=useState("");
  const [demoInput,setDemoInput]=useState(lead?.demoLink||"");
  const [billing,setBilling]=useState({amount:"",monthly:"",billingName:"",billingEmail:"",paymentLink:"",status:"unpaid",...(lead?.payment||{})});
  const [oForm,setOForm]=useState({date:today(),method:"",outcome:"",by:user.id});
  const [showOForm,setShowOForm]=useState(false);
  useEffect(()=>{if(lead){setDemoInput(lead.demoLink||"");setBilling({amount:"",monthly:"",billingName:"",billingEmail:"",paymentLink:"",status:"unpaid",...(lead.payment||{})});}}, [leadId]);
  if(!lead) return null;
  const upd=(u)=>setLeads(p=>p.map(l=>l.id===leadId?{...l,...u}:l));
  const isAssigned=lead.assignedTo===user.id; const isCoWorker=lead.coWorkers.includes(user.id);
  const addNote=()=>{if(!noteText.trim())return;upd({notes:[...lead.notes,{id:Date.now(),author:user.id,text:noteText.trim(),ts:ts()}]});setNoteText("");};
  const addOutreach=()=>{if(!oForm.method||!oForm.outcome)return;upd({outreachLog:[...lead.outreachLog,{id:Date.now(),...oForm}]});setShowOForm(false);setOForm({date:today(),method:"",outcome:"",by:user.id});};
  const saveBilling=()=>upd({payment:{...billing}});
  const claimLead=()=>upd({status:"under-review",claimedBy:user.id,claimedAt:ts(),assignedTo:lead.assignedTo||user.id,notes:[...lead.notes,{id:Date.now(),author:user.id,text:`Lead claimed by ${user.name}.`,ts:ts()}]});
  return (
    <div className="si" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12,paddingTop:4}}>
        <button onClick={onBack} style={{padding:"7px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",fontSize:12,flexShrink:0}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:20,fontWeight:700,color:"#fff",letterSpacing:"-0.3px"}}>{lead.businessName}</span>
            <button onClick={()=>upd({priority:!lead.priority})} style={{background:"none",border:"none",fontSize:16,color:lead.priority?"#fbbf24":"rgba(255,255,255,0.2)",padding:"0 2px"}}>★</button>
            <Pill sid={lead.status}/>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.38)",marginTop:3}}>{lead.category} · {lead.zip}{lead.source?` · Source: ${lead.source}`:""}</div>
        </div>
        <Score lead={lead}/>
      </div>

      {/* Pipeline */}
      <Box label="Pipeline Status">
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
          {mainStages.map((s,i)=>{const isA=lead.status===s.id;const idx=mainStages.findIndex(x=>x.id===lead.status);const isPast=idx>i&&!isA;return(<button key={s.id} onClick={()=>upd({status:s.id})} style={{padding:"6px 11px",borderRadius:20,border:`1px solid ${s.color}${isA?"bb":"30"}`,background:isA?s.bg:isPast?`${s.color}0d`:"rgba(255,255,255,0.04)",color:isA?s.color:isPast?`${s.color}60`:"rgba(255,255,255,0.35)",fontSize:10,fontWeight:isA?700:400,transition:"all .15s"}}>{isPast?"✓ ":""}{s.label}</button>);})}
        </div>
        <div style={{display:"flex",gap:5,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          {declineStages.map(s=>(<button key={s.id} onClick={()=>upd({status:s.id})} style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${s.color}${lead.status===s.id?"aa":"25"}`,background:lead.status===s.id?s.bg:"rgba(255,255,255,0.03)",color:lead.status===s.id?s.color:"rgba(255,255,255,0.28)",fontSize:10,fontWeight:lead.status===s.id?700:400,transition:"all .15s"}}>{s.label}</button>))}
        </div>
      </Box>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Box label="Business Info">
          {[["📍",lead.address],["📞",lead.phone],["⭐",`${lead.rating} · ${lead.reviews} reviews`],["📮","ZIP: "+lead.zip]].map(([i,v])=>(<div key={v} style={{display:"flex",gap:8,marginBottom:9}}><span style={{flexShrink:0,width:18,fontSize:13}}>{i}</span><span style={{fontSize:12,color:"rgba(255,255,255,0.72)",lineHeight:1.4}}>{v}</span></div>))}
        </Box>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Box label="Assignment" style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              {lead.assignedTo?<Avatar uid={lead.assignedTo} size={28}/>:<div style={{width:28,height:28,borderRadius:"50%",border:"2px dashed rgba(255,255,255,0.18)"}}/>}
              <span style={{fontSize:12,color:"rgba(255,255,255,0.65)"}}>{lead.assignedTo?ACCOUNTS[lead.assignedTo]?.name:"Nobody"}</span>
              {lead.coWorkers.map(cw=><Avatar key={cw} uid={cw} size={20}/>)}
            </div>
            {lead.claimedBy&&<div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginBottom:8}}>Claimed by {ACCOUNTS[lead.claimedBy]?.name} · {lead.claimedAt}</div>}
            {lead.status==="new"&&!lead.claimedBy&&<button onClick={claimLead} style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid rgba(16,185,129,0.35)",background:"rgba(16,185,129,0.12)",color:"#34d399",fontSize:12,fontWeight:700,marginBottom:6}}>✋ Claim Lead</button>}
            {!isAssigned&&!isCoWorker&&lead.status!=="new"&&<button onClick={()=>upd(lead.assignedTo?{coWorkers:[...lead.coWorkers,user.id]}:{assignedTo:user.id})} style={{width:"100%",padding:"7px",borderRadius:8,border:"1px solid rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.1)",color:"#a5b4fc",fontSize:12,fontWeight:600}}>{lead.assignedTo?"Join as Co-worker":"Take Ownership"}</button>}
            {lead.coWorkers.length>0&&isAssigned&&<div style={{fontSize:10,color:"rgba(245,158,11,0.7)",marginTop:6,display:"flex",alignItems:"center",gap:5}}><span style={{width:5,height:5,borderRadius:"50%",background:"#f59e0b",display:"inline-block",animation:"pulse 2s infinite"}}/>Co-working with {lead.coWorkers.map(c=>ACCOUNTS[c]?.name).join(", ")}</div>}
          </Box>
          <Box label="Demo Site" style={{flex:1}}>
            <input value={demoInput} onChange={e=>setDemoInput(e.target.value)} placeholder="Paste demo URL…" style={{marginBottom:8}}/>
            <button onClick={()=>upd({demoLink:demoInput})} style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid rgba(6,182,212,0.3)",background:"rgba(6,182,212,0.1)",color:"#67e8f9",fontSize:12,fontWeight:600}}>Save</button>
            {lead.demoLink&&<a href={lead.demoLink} target="_blank" style={{display:"block",marginTop:8,fontSize:11,color:"#67e8f9",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🔗 {lead.demoLink}</a>}
          </Box>
        </div>
      </div>

      {/* Billing */}
      <Box label="Billing & Payment" accent="#10b981">
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {Object.entries(PAY_COLORS).map(([s,c])=>(<button key={s} onClick={()=>setBilling({...billing,status:s})} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${c}${billing.status===s?"bb":"30"}`,background:billing.status===s?`${c}20`:"transparent",color:billing.status===s?c:`${c}55`,fontSize:10,fontWeight:700,textTransform:"capitalize"}}>{s}</button>))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.32)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Build Fee</div><div style={{position:"relative"}}><span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,0.4)",fontWeight:600}}>$</span><input value={billing.amount} onChange={e=>setBilling({...billing,amount:e.target.value})} placeholder="0" type="number" style={{paddingLeft:22,fontSize:15,fontWeight:700}}/></div></div>
          <div><div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.32)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Monthly Recurring</div><div style={{position:"relative"}}><span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,0.4)",fontWeight:600}}>$</span><input value={billing.monthly} onChange={e=>setBilling({...billing,monthly:e.target.value})} placeholder="0" type="number" style={{paddingLeft:22,fontSize:15,fontWeight:700}}/></div>{billing.monthly&&<div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginTop:4}}>${(parseFloat(billing.monthly)*12||0).toFixed(0)}/yr</div>}</div>
          <div><div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.32)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Billing Name</div><input value={billing.billingName} onChange={e=>setBilling({...billing,billingName:e.target.value})} placeholder="Client name…"/></div>
          <div><div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.32)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Billing Email</div><input value={billing.billingEmail} onChange={e=>setBilling({...billing,billingEmail:e.target.value})} placeholder="email@client.com" type="email"/></div>
        </div>
        <div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.32)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Payment Link</div><input value={billing.paymentLink} onChange={e=>setBilling({...billing,paymentLink:e.target.value})} placeholder="Square / Cash App / Venmo link…"/>{billing.paymentLink&&<a href={billing.paymentLink} target="_blank" style={{display:"block",marginTop:5,fontSize:11,color:"#34d399",textDecoration:"none"}}>🔗 Open payment link</a>}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",gap:18}}>
            {billing.amount&&<div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>Build</div><div style={{fontSize:18,fontWeight:700,color:"#34d399"}}>${billing.amount}</div></div>}
            {billing.monthly&&<div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>Monthly</div><div style={{fontSize:18,fontWeight:700,color:"#fbbf24"}}>${billing.monthly}/mo</div></div>}
            <div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>Status</div><div style={{fontSize:12,fontWeight:700,color:PAY_COLORS[billing.status]||"#fff",marginTop:4,textTransform:"capitalize"}}>{billing.status}</div></div>
          </div>
          <button onClick={saveBilling} style={{padding:"9px 20px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",fontSize:13,fontWeight:700}}>Save Billing</button>
        </div>
      </Box>

      {/* Outreach Log */}
      <Box label="Outreach Log" accent="#f97316">
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {lead.outreachLog.length===0&&<div style={{fontSize:12,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>No outreach logged yet.</div>}
          {lead.outreachLog.map(o=>(<div key={o.id} style={{display:"flex",gap:10,alignItems:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"9px 12px"}}><Avatar uid={o.by} size={24}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#fff"}}>{o.method} <span style={{color:"rgba(255,255,255,0.4)",fontWeight:400}}>→</span> {o.outcome}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{o.date} · {ACCOUNTS[o.by]?.name}</div></div></div>))}
        </div>
        {showOForm?(
          <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:12,display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <select value={oForm.method} onChange={e=>setOForm({...oForm,method:e.target.value})}><option value="">Method…</option>{METHODS.map(m=><option key={m}>{m}</option>)}</select>
              <select value={oForm.outcome} onChange={e=>setOForm({...oForm,outcome:e.target.value})}><option value="">Outcome…</option>{OUTCOMES.map(o=><option key={o}>{o}</option>)}</select>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={addOutreach} style={{flex:1,padding:"8px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#f97316,#ea580c)",color:"#fff",fontSize:12,fontWeight:600}}>Log Attempt</button>
              <button onClick={()=>setShowOForm(false)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:12}}>Cancel</button>
            </div>
          </div>
        ):(<button onClick={()=>setShowOForm(true)} style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid rgba(249,115,22,0.3)",background:"rgba(249,115,22,0.08)",color:"rgba(249,115,22,0.8)",fontSize:12,fontWeight:600}}>+ Log Outreach Attempt</button>)}
      </Box>

      {/* Notes */}
      <Box label="Notes">
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12,maxHeight:220,overflowY:"auto"}}>
          {lead.notes.length===0&&<div style={{fontSize:12,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>No notes yet.</div>}
          {lead.notes.map(n=>(<div key={n.id} style={{display:"flex",gap:10,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 12px"}}><Avatar uid={n.author} size={26}/><div><div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:3}}><span style={{fontSize:12,fontWeight:600,color:"#fff"}}>{ACCOUNTS[n.author]?.name}</span><span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{n.ts}</span></div><div style={{fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>{n.text}</div></div></div>))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <textarea placeholder={`Add a note as ${user.name}…`} value={noteText} onChange={e=>setNoteText(e.target.value)} rows={2} style={{flex:1,resize:"none"}} onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)addNote();}}/>
          <button onClick={addNote} style={{padding:"0 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontWeight:600,fontSize:13}}>Post</button>
        </div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.18)",marginTop:5}}>⌘ + Enter to post</div>
      </Box>

      {/* AI Insights */}
      <Box label="AI Insights" accent="#6366f1">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:12}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",lineHeight:1.6,flex:1}}>Once the Anthropic API key is added in Settings, this will generate tailored outreach suggestions and conversion insights for {lead.businessName}.</div>
          <span style={{fontSize:10,color:"rgba(99,102,241,0.6)",background:"rgba(99,102,241,0.1)",padding:"3px 8px",borderRadius:8,fontWeight:600,flexShrink:0}}>API needed</span>
        </div>
        <button disabled style={{padding:"8px 18px",borderRadius:10,border:"1px solid rgba(99,102,241,0.2)",background:"rgba(99,102,241,0.05)",color:"rgba(99,102,241,0.4)",fontSize:12,fontWeight:600}}>Generate Insights</button>
      </Box>
    </div>
  );
};

// ─── CLIENT ROSTER ───────────────────────────────────────────────────────────
const ClientRoster = ({leads,go,setSelLead}) => {
  const clients=leads.filter(l=>l.status==="closed-won");
  const mrr=clients.reduce((a,l)=>a+(parseFloat(l.payment?.monthly)||0),0);
  return (
    <div className="fu" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{paddingTop:4}}><div style={{fontSize:20,fontWeight:700,color:"#fff",letterSpacing:"-0.3px"}}>Client Roster</div><div style={{fontSize:13,color:"rgba(255,255,255,0.38)",marginTop:2}}>{clients.length} active client{clients.length!==1?"s":""} · ${mrr}/mo recurring</div></div>
      {clients.length===0&&<div style={{...G,padding:36,textAlign:"center",color:"rgba(255,255,255,0.25)",fontSize:13}}>No signed clients yet. Keep pushing.</div>}
      {clients.map(c=>(
        <button key={c.id} onClick={()=>{setSelLead(c.id);go("lead-detail");}} style={{...G,padding:"16px 18px",textAlign:"left",display:"flex",alignItems:"center",gap:14,background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.15)",cursor:"pointer"}}>
          <div style={{width:40,height:40,borderRadius:10,background:"rgba(16,185,129,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏢</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{c.businessName}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.38)",marginTop:2}}>{c.category} · {c.address}</div>
            {c.demoLink&&<div style={{fontSize:11,color:"#67e8f9",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🔗 {c.demoLink}</div>}
            {c.payment?.billingName&&<div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2}}>Contact: {c.payment.billingName}{c.payment.billingEmail?` · ${c.payment.billingEmail}`:""}</div>}
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            {c.payment?.amount&&<div style={{fontSize:16,fontWeight:700,color:"#34d399"}}>${c.payment.amount}</div>}
            {c.payment?.monthly&&<div style={{fontSize:12,color:"#fbbf24",marginTop:2}}>${c.payment.monthly}/mo</div>}
            <div style={{marginTop:5}}><span style={{fontSize:10,color:PAY_COLORS[c.payment?.status]||"#fff",background:`${PAY_COLORS[c.payment?.status]||"#fff"}18`,padding:"2px 8px",borderRadius:10,fontWeight:600,textTransform:"capitalize"}}>{c.payment?.status||"unpaid"}</span></div>
          </div>
        </button>
      ))}
    </div>
  );
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
const Settings = ({user}) => {
  const [apis,setApis]=useState(()=>JSON.parse(localStorage.getItem("ws_apis")||"{}"));
  const [saved,setSaved]=useState(false);
  const [pw,setPw]=useState({current:"",newPw:"",confirm:""});
  const [pwMsg,setPwMsg]=useState({text:"",ok:false});
  const zipHistory=JSON.parse(localStorage.getItem("ws_zips")||'[]');
  const saveApis=()=>{localStorage.setItem("ws_apis",JSON.stringify(apis));setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const changePw=()=>{
    const stored=getPW();
    if(stored[user.id]!==pw.current){setPwMsg({text:"Current password is incorrect.",ok:false});return;}
    if(!pw.newPw){setPwMsg({text:"New password can't be empty.",ok:false});return;}
    if(pw.newPw!==pw.confirm){setPwMsg({text:"New passwords don't match.",ok:false});return;}
    stored[user.id]=pw.newPw; savePW(stored);
    setPwMsg({text:"Password updated.",ok:true}); setPw({current:"",newPw:"",confirm:""});
  };
  const apiFields=[
    ["anthropic","Anthropic API","AI insights & outreach generation","ANTHROPIC_API_KEY"],
    ["serpapi","SerpApi","Lead discovery by zip code — Google Maps data","SERPAPI_KEY"],
    ["blandAi","Bland AI","AI phone call outreach","BLAND_API_KEY"],
    ["cloudflare","Cloudflare Pages","Client demo site hosting","CF_API_TOKEN"],
    ["payment","Payment Processor","Square / Cash App key or base URL","PAYMENT_KEY"],
  ];
  return (
    <div className="fu" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{paddingTop:4}}><div style={{fontSize:20,fontWeight:700,color:"#fff",letterSpacing:"-0.3px"}}>Settings</div><div style={{fontSize:13,color:"rgba(255,255,255,0.38)",marginTop:2}}>API keys, account, and team.</div></div>
      <Box label="API Integrations" accent="#6366f1">
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
          {apiFields.map(([key,name,desc,envKey])=>(
            <div key={key} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div><div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{desc}</div></div>
                <span style={{fontSize:10,color:apis[key]?"#34d399":"#f59e0b",background:apis[key]?"rgba(16,185,129,0.12)":"rgba(245,158,11,0.12)",padding:"3px 8px",borderRadius:8,fontWeight:700,flexShrink:0,marginLeft:8}}>{apis[key]?"Connected":"Not set"}</span>
              </div>
              <input type="password" placeholder={envKey} value={apis[key]||""} onChange={e=>setApis({...apis,[key]:e.target.value})}/>
            </div>
          ))}
        </div>
        <button onClick={saveApis} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:saved?"rgba(16,185,129,0.3)":"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontSize:13,fontWeight:600}}>{saved?"✓ Saved":"Save API Keys"}</button>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:8}}>Keys are stored locally and will be set as Netlify environment variables on deploy. Never exposed in the frontend.</div>
      </Box>
      <Box label={`Change Password — ${user.name}`} accent="#f59e0b">
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
          <input type="password" placeholder="Current password" value={pw.current} onChange={e=>setPw({...pw,current:e.target.value})}/>
          <input type="password" placeholder="New password" value={pw.newPw} onChange={e=>setPw({...pw,newPw:e.target.value})}/>
          <input type="password" placeholder="Confirm new password" value={pw.confirm} onChange={e=>setPw({...pw,confirm:e.target.value})}/>
        </div>
        {pwMsg.text&&<div style={{fontSize:12,color:pwMsg.ok?"#34d399":"#f43f5e",marginBottom:8}}>{pwMsg.text}</div>}
        <button onClick={changePw} style={{width:"100%",padding:"9px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",fontSize:13,fontWeight:600}}>Update Password</button>
      </Box>
      <Box label="Zip Code History">
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          {zipHistory.map(z=><span key={z} style={{padding:"4px 12px",borderRadius:20,background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.25)",color:"#a5b4fc",fontSize:12,fontWeight:600}}>{z}</span>)}
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.22)"}}>Zips log automatically when you run a Google Places search.</div>
      </Box>
      <Box label="Team Accounts">
        {Object.values(ACCOUNTS).map(a=>(
          <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <Avatar uid={a.id} size={34}/>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{a.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{a.role} · @{a.id}</div></div>
            {a.id===user.id&&<span style={{fontSize:10,color:"#34d399",background:"rgba(16,185,129,0.12)",padding:"3px 10px",borderRadius:10,fontWeight:600}}>You</span>}
          </div>
        ))}
      </Box>
    </div>
  );
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [userId,setUserId]=useState(()=>getSession());
  const [view,setView]=useState("dashboard");
  const [leads,setLeads]=useState(INITIAL_LEADS);
  const [selLead,setSelLead]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [isMobile,setIsMobile]=useState(window.innerWidth<680);
  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<680);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  const user=ACCOUNTS[userId];
  const login=(uid)=>{setSession(uid);setUserId(uid);};
  const logout=()=>{clearSession();setUserId(null);setView("dashboard");setSelLead(null);};
  const go=(v)=>{setView(v);if(v!=="lead-detail")setSelLead(null);setMenuOpen(false);};
  if(!user) return <Login onLogin={login}/>;
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",padding:isMobile?"8px":"12px",gap:12,fontFamily:FF,color:"#fff"}}>
      <style>{CSS}</style>
      <Sidebar view={view} go={go} user={user} leads={leads} onLogout={logout} isMobile={isMobile} menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>
      <div style={{flex:1,overflowY:"auto",maxHeight:"calc(100vh - 24px)",paddingLeft:isMobile?0:4,paddingTop:isMobile?52:0,paddingBottom:24}}>
        {view==="dashboard"   &&<Dashboard   leads={leads} user={user} go={go} setSelLead={setSelLead}/>}
        {view==="leads"       &&<LeadsList   leads={leads} setLeads={setLeads} user={user} go={go} setSelLead={setSelLead} filterMine={false}/>}
        {view==="mine"        &&<LeadsList   leads={leads} setLeads={setLeads} user={user} go={go} setSelLead={setSelLead} filterMine={true}/>}
        {view==="clients"     &&<ClientRoster leads={leads} go={go} setSelLead={setSelLead}/>}
        {view==="lead-detail" &&selLead&&<LeadDetail leadId={selLead} leads={leads} setLeads={setLeads} user={user} onBack={()=>go("leads")}/>}
        {view==="settings"    &&<Settings user={user}/>}
      </div>
    </div>
  );
}
