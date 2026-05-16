import { useState, useEffect, useRef } from "react";

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const getPW       = () => JSON.parse(localStorage.getItem("ws_pw") || '{"nmiller3300":"1","white":"1"}');
const savePW      = (pw) => localStorage.setItem("ws_pw", JSON.stringify(pw));
const getSession  = () => localStorage.getItem("ws_session");
const setSession  = (uid) => localStorage.setItem("ws_session", uid);
const clearSession= () => localStorage.removeItem("ws_session");

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ACCOUNTS = {
  nmiller3300: { id:"nmiller3300", name:"Miller", initials:"M", color:"#4B7BF5" , role:"Owner"   },
  white:       { id:"white",       name:"White",  initials:"W", color:"#F59E0B" , role:"Partner" },
};

const STAGES = [
  { id:"new",               label:"New",               color:"#64748B" },
  { id:"under-review",      label:"Under Review",      color:"#3B82F6" },
  { id:"demo-building",     label:"Demo Building",     color:"#8B5CF6" },
  { id:"demo-ready",        label:"Demo Ready",        color:"#06B6D4" },
  { id:"outreach-sent",     label:"Outreach Sent",     color:"#F59E0B" },
  { id:"in-conversation",   label:"In Conversation",   color:"#F97316" },
  { id:"proposal-sent",     label:"Proposal Sent",     color:"#EC4899" },
  { id:"closed-won",        label:"Signed",            color:"#22C55E" },
  { id:"declined-designer", label:"Declined · Us",     color:"#EF4444" },
  { id:"declined-client",   label:"Declined · Client", color:"#F43F5E" },
];
const stageMap   = Object.fromEntries(STAGES.map(s => [s.id, s]));
const mainStages = STAGES.filter(s => !s.id.startsWith("declined"));
const declineStages = STAGES.filter(s => s.id.startsWith("declined"));

const CATEGORIES = ["Restaurant","Bar","Barbershop","Nail Salon","Auto Repair","Gym","Dentist","Lawyer","Plumber","Electrician","HVAC","Landscaping","Cleaning Service","Pet Grooming","Tattoo Shop","Florist","Bakery","Coffee Shop","Boutique","Photography","Accounting","Chiropractor","Massage","Daycare","Veterinarian","Donut Shop","Other"];
const SOURCES    = ["Google Maps","Drove By","White Found It","Miller Found It","Referral","Social Media","Manual Entry","Other"];
const METHODS    = ["Call","Text","Email","In Person","AI Call"];
const OUTCOMES   = ["No Answer","Left Voicemail","Responded","Interested","Not Interested","Reached Manager","Scheduled Follow-up"];
const PAY_STATUS = { unpaid:"#F59E0B", pending:"#06B6D4", paid:"#22C55E", overdue:"#EF4444" };

const INITIAL_LEADS = [];

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const C = {
  bg:     "#0C1221",
  surf:   "#131C2E",
  panel:  "#1A2540",
  hover:  "#1F2D4A",
  border: "rgba(255,255,255,0.07)",
  bStrong:"rgba(255,255,255,0.14)",
  blue:   "#4B7BF5",
  blueDim:"rgba(75,123,245,0.12)",
  green:  "#22C55E",
  yellow: "#F59E0B",
  red:    "#EF4444",
  text:   "#F1F5F9",
  text2:  "#B8C5D6",
  text3:  "#6B7A96",
};

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.bg};color:${C.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
  input,textarea,select{
    background:${C.panel};border:1px solid ${C.bStrong};border-radius:6px;
    color:${C.text};font-family:inherit;font-size:13px;padding:8px 12px;
    outline:none;transition:border-color .15s;width:100%;
  }
  input:focus,textarea:focus,select:focus{border-color:${C.blue};}
  input::placeholder,textarea::placeholder{color:${C.text3};}
  select option{background:${C.surf};}
  button{cursor:pointer;font-family:inherit;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .anim{animation:fadeIn .25s ease forwards;}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const ts    = () => new Date().toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
const today = () => new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});

const Av = ({uid,size=26}) => {
  const u=ACCOUNTS[uid]; if(!u) return null;
  return <div style={{width:size,height:size,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:700,color:"#fff",flexShrink:0}}>{u.initials}</div>;
};

const StatusPill = ({sid,sm}) => {
  const s=stageMap[sid]||stageMap.new;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:5,
      padding:sm?"2px 8px":"4px 10px",
      borderRadius:4,fontSize:sm?10:11,fontWeight:600,
      background:`${s.color}18`,color:s.color,
      border:`1px solid ${s.color}30`,whiteSpace:"nowrap",
    }}>
      <span style={{width:5,height:5,borderRadius:"50%",background:s.color,flexShrink:0}}/>
      {s.label}
    </span>
  );
};

const ScoreBadge = ({lead}) => {
  const n=Math.min(10,Math.floor((lead.reviews/20)+lead.rating));
  const c=n>=8?C.green:n>=5?C.yellow:C.red;
  return (
    <div style={{
      width:30,height:30,borderRadius:6,
      border:`1.5px solid ${c}`,background:`${c}12`,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:11,fontWeight:700,color:c,flexShrink:0,
    }}>{n}</div>
  );
};

const Btn = ({onClick,children,variant="primary",disabled,style={}}) => {
  const v = {
    primary: {background:C.blue,color:"#fff",border:"none"},
    ghost:   {background:"transparent",color:C.text2,border:`1px solid ${C.bStrong}`},
    danger:  {background:"rgba(239,68,68,0.12)",color:C.red,border:`1px solid rgba(239,68,68,0.25)`},
    success: {background:"rgba(34,197,94,0.12)",color:C.green,border:`1px solid rgba(34,197,94,0.25)`},
    subtle:  {background:C.panel,color:C.text2,border:`1px solid ${C.border}`},
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:"7px 14px",borderRadius:6,fontSize:13,fontWeight:500,
      transition:"opacity .15s",opacity:disabled?.4:1,...v[variant],...style,
    }}>{children}</button>
  );
};

const Field = ({label,children,style={}}) => (
  <div style={{display:"flex",flexDirection:"column",gap:5,...style}}>
    <label style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</label>
    {children}
  </div>
);

const Card = ({children,style={}}) => (
  <div style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:8,padding:16,...style}}>
    {children}
  </div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({onLogin}) => {
  const [u,setU]=useState(""); const [p,setP]=useState("");
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const submit=()=>{
    setLoading(true);
    setTimeout(()=>{
      const pw=getPW();
      if(ACCOUNTS[u.toLowerCase()]&&pw[u.toLowerCase()]===p){onLogin(u.toLowerCase());}
      else{setErr("Invalid credentials.");setLoading(false);}
    },500);
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,padding:20}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{marginBottom:32,textAlign:"center"}}>
          <div style={{fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:C.blue,fontWeight:600,marginBottom:8}}>WEBSCAPE</div>
          <div style={{fontSize:26,fontWeight:700,color:C.text}}>Lead Portal</div>
        </div>
        <Card style={{padding:24}}>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            <input placeholder="Username" value={u} onChange={e=>{setU(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            <input placeholder="Password" type="password" value={p} onChange={e=>{setP(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          {err&&<div style={{fontSize:12,color:C.red,marginBottom:10}}>{err}</div>}
          <button onClick={submit} disabled={loading} style={{
            width:"100%",padding:10,borderRadius:6,border:"none",
            background:loading?`${C.blue}60`:C.blue,color:"#fff",fontSize:14,fontWeight:600,
          }}>{loading?"Signing in…":"Sign In"}</button>
        </Card>
      </div>
    </div>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const Sidebar = ({view,go,user,leads,onLogout,isMobile,menuOpen,setMenuOpen}) => {
  const myCount=leads.filter(l=>l.assignedTo===user.id||l.coWorkers?.includes(user.id)).length;
  const signedCount=leads.filter(l=>l.status==="closed-won").length;
  const nav=[
    {id:"dashboard",icon:"▦",label:"Dashboard"},
    {id:"leads",icon:"≡",label:"All Leads",count:leads.filter(l=>!["closed-won","declined-designer","declined-client"].includes(l.status)).length},
    {id:"mine",icon:"◎",label:"My Leads",count:myCount},
    {id:"clients",icon:"★",label:"Clients",count:signedCount},
    {id:"settings",icon:"⊙",label:"Settings"},
  ];
  const inner=(
    <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"16px 12px"}}>
      <div style={{padding:"8px 8px 20px",borderBottom:`1px solid ${C.border}`,marginBottom:8}}>
        <div style={{fontSize:10,letterSpacing:"0.25em",color:C.blue,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>WEBSCAPE</div>
        <div style={{fontSize:15,fontWeight:700,color:C.text}}>Miller & White</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:1,flex:1}}>
        {nav.map(({id,icon,label,count})=>(
          <button key={id} onClick={()=>{go(id);if(isMobile)setMenuOpen(false);}} style={{
            display:"flex",alignItems:"center",gap:9,padding:"8px 10px",
            borderRadius:6,border:"none",textAlign:"left",
            background:view===id?`${C.blue}18`:"transparent",
            color:view===id?C.blue:C.text2,
            fontSize:13,fontWeight:view===id?600:400,transition:"all .1s",
          }}>
            <span style={{fontSize:14,opacity:.7,width:16,textAlign:"center"}}>{icon}</span>
            <span style={{flex:1}}>{label}</span>
            {count>0&&<span style={{fontSize:10,fontWeight:700,background:view===id?`${C.blue}25`:`${C.text3}30`,color:view===id?C.blue:C.text2,padding:"1px 6px",borderRadius:10}}>{count}</span>}
          </button>
        ))}
      </div>
      <div style={{paddingTop:12,borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",marginBottom:4}}>
          <Av uid={user.id} size={28}/>
          <div><div style={{fontSize:12,fontWeight:600,color:C.text}}>{user.name}</div><div style={{fontSize:10,color:C.text3}}>{user.role}</div></div>
        </div>
        <button onClick={onLogout} style={{width:"100%",padding:"6px 10px",borderRadius:6,border:"none",background:"transparent",color:C.text3,fontSize:12,textAlign:"left"}}>Sign out</button>
      </div>
    </div>
  );
  if(isMobile) return (
    <>
      <button onClick={()=>setMenuOpen(!menuOpen)} style={{position:"fixed",top:12,left:12,zIndex:300,width:38,height:38,borderRadius:8,border:`1px solid ${C.bStrong}`,background:C.surf,color:C.text,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>☰</button>
      {menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.6)"}}/>}
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:220,zIndex:250,background:C.surf,borderRight:`1px solid ${C.border}`,transform:menuOpen?"translateX(0)":"translateX(-100%)",transition:"transform .22s ease"}}>{inner}</div>
    </>
  );
  return <div style={{width:220,flexShrink:0,background:C.surf,borderRight:`1px solid ${C.border}`,height:"100vh",position:"sticky",top:0}}>{inner}</div>;
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const Dashboard = ({leads,user,go,setSelLead}) => {
  const [goal,setGoal]=useState(()=>localStorage.getItem("ws_goal")||"");
  const [editGoal,setEditGoal]=useState(false);
  const [gi,setGi]=useState("");
  const open=leads.filter(l=>!["closed-won","declined-designer","declined-client"].includes(l.status));
  const signed=leads.filter(l=>l.status==="closed-won");
  const mrr=signed.reduce((a,l)=>a+(parseFloat(l.payment?.monthly)||0),0);
  const mine=leads.filter(l=>(l.assignedTo===user.id||l.coWorkers?.includes(user.id))&&!["closed-won","declined-designer","declined-client"].includes(l.status));
  const goalN=parseFloat(goal)||0;
  const pct=goalN>0?Math.min(100,Math.round((mrr/goalN)*100)):0;
  const saveGoal=()=>{localStorage.setItem("ws_goal",gi);setGoal(gi);setEditGoal(false);};
  const recent=leads.slice(-5).reverse();

  const Stat=({label,value,color,sub})=>(
    <Card style={{flex:1,minWidth:140}}>
      <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>{label}</div>
      <div style={{fontSize:28,fontWeight:700,color:color||C.text,letterSpacing:"-0.5px",lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.text3,marginTop:5}}>{sub}</div>}
    </Card>
  );

  return (
    <div className="anim" style={{display:"flex",flexDirection:"column",gap:20,padding:24}}>
      <div>
        <div style={{fontSize:18,fontWeight:700,color:C.text}}>Good to see you, {user.name} 👋</div>
        <div style={{fontSize:13,color:C.text2,marginTop:3}}>Here's your pipeline overview.</div>
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <Stat label="Open Leads" value={open.length} color={C.blue}/>
        <Stat label="Signed" value={signed.length} color={C.green}/>
        <Stat label="Recurring" value={`$${mrr}/mo`} color={C.yellow}/>
        <Stat label="My Active" value={mine.length} color="#A78BFA"/>
      </div>

      {/* Revenue Goal */}
      <Card>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:goalN>0?14:0}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Revenue Goal</div>
            {editGoal?(
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <input value={gi} onChange={e=>setGi(e.target.value)} placeholder="Monthly goal…" type="number" style={{maxWidth:160}}/>
                <Btn onClick={saveGoal} variant="primary">Set</Btn>
                <Btn onClick={()=>setEditGoal(false)} variant="ghost">Cancel</Btn>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:2}}>
                <span style={{fontSize:24,fontWeight:700,color:C.yellow}}>${mrr}</span>
                {goalN>0&&<span style={{fontSize:13,color:C.text3}}>/ ${goalN} goal</span>}
              </div>
            )}
          </div>
          {!editGoal&&<Btn onClick={()=>{setGi(goal);setEditGoal(true);}} variant="ghost" style={{fontSize:11}}>{goalN>0?"Edit":"Set Goal"}</Btn>}
        </div>
        {goalN>0&&!editGoal&&(
          <>
            <div style={{height:6,borderRadius:3,background:C.panel,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.blue},${C.green})`,borderRadius:3,transition:"width .4s"}}/>
            </div>
            <div style={{fontSize:11,color:C.text3,marginTop:6}}>{pct}% of monthly goal</div>
          </>
        )}
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Pipeline */}
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.text2,marginBottom:14}}>Pipeline</div>
          {STAGES.filter(s=>!s.id.startsWith("declined")).map(s=>{
            const c=leads.filter(l=>l.status===s.id).length; if(!c) return null;
            return (
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                <span style={{fontSize:12,color:C.text2,flex:1}}>{s.label}</span>
                <div style={{width:80,height:3,borderRadius:2,background:C.panel,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.round((c/Math.max(leads.length,1))*100)}%`,background:s.color}}/>
                </div>
                <span style={{fontSize:12,fontWeight:600,color:s.color,width:16,textAlign:"right"}}>{c}</span>
              </div>
            );
          })}
        </Card>
        {/* Recent */}
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.text2,marginBottom:14}}>Recent Leads</div>
          {recent.length===0&&<div style={{fontSize:12,color:C.text3,fontStyle:"italic"}}>No leads yet.</div>}
          {recent.map(l=>(
            <button key={l.id} onClick={()=>{setSelLead(l.id);go("lead-detail");}} style={{
              display:"flex",alignItems:"center",gap:10,width:"100%",
              background:"transparent",border:"none",padding:"7px 0",
              borderBottom:`1px solid ${C.border}`,cursor:"pointer",textAlign:"left",
            }}>
              <ScoreBadge lead={l}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.businessName}</div>
                <div style={{fontSize:11,color:C.text3}}>{l.zip} · {l.category}</div>
              </div>
              <StatusPill sid={l.status} sm/>
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ─── LEADS LIST ──────────────────────────────────────────────────────────────
const LeadsList = ({leads,setLeads,user,go,setSelLead,filterMine}) => {
  const [search,setSearch]=useState(""); const [fStatus,setFStatus]=useState("all");
  const [fZip,setFZip]=useState(""); const [fPriority,setFPriority]=useState(false);
  const [qMenu,setQMenu]=useState(null);
  const [selecting,setSelecting]=useState(false); const [selected,setSelected]=useState([]);
  const [showSearch,setShowSearch]=useState(false); const [showManual,setShowManual]=useState(false);
  const [searchZip,setSearchZip]=useState(""); const [selectedCats,setSelectedCats]=useState([]);
  const [searching,setSearching]=useState(false); const [searchResults,setSearchResults]=useState([]);
  const [searchMsg,setSearchMsg]=useState(""); const [progress,setProgress]=useState({done:0,total:0});
  const [manual,setManual]=useState({businessName:"",category:"",phone:"",address:"",zip:"",rating:"",reviews:"",source:"Manual Entry"});

  const toggleCat=cat=>setSelectedCats(p=>p.includes(cat)?p.filter(c=>c!==cat):[...p,cat]);

  const runSearch=async()=>{
    if(!searchZip.trim()||selectedCats.length===0) return;
    setSearching(true); setSearchResults([]); setSearchMsg(""); setProgress({done:0,total:selectedCats.length});
    const zips=JSON.parse(localStorage.getItem("ws_zips")||"[]");
    if(!zips.includes(searchZip)) localStorage.setItem("ws_zips",JSON.stringify([searchZip,...zips].slice(0,20)));
    const existing=new Set(leads.map(l=>l.businessName.toLowerCase()));
    let all=[];
    for(let i=0;i<selectedCats.length;i+=3){
      const batch=selectedCats.slice(i,i+3);
      const results=await Promise.all(batch.map(cat=>
        fetch("/.netlify/functions/search-leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({zip:searchZip,category:cat})})
          .then(r=>r.json()).catch(()=>({leads:[]}))
      ));
      results.forEach(d=>{
        (d.leads||[]).filter(l=>!existing.has(l.businessName.toLowerCase())&&!all.find(a=>a.businessName.toLowerCase()===l.businessName.toLowerCase())).forEach(l=>all.push(l));
      });
      setProgress({done:Math.min(i+3,selectedCats.length),total:selectedCats.length});
    }
    setSearchResults(all);
    setSearchMsg(`${all.length} new businesses found without a website in ${searchZip}.`);
    setSearching(false); setProgress({done:0,total:0});
  };

  const addLead=l=>{setLeads(p=>[...p,l]);setSearchResults(p=>p.filter(r=>r.id!==l.id));};
  const addAll=()=>{setLeads(p=>[...p,...searchResults]);setSearchResults([]);};
  const submitManual=()=>{
    if(!manual.businessName.trim()) return;
    setLeads(p=>[...p,{id:`${Date.now()}-${Math.random().toString(36).slice(2,9)}`,businessName:manual.businessName,category:manual.category||"Other",phone:manual.phone||"Not listed",address:manual.address,zip:manual.zip,rating:parseFloat(manual.rating)||0,reviews:parseInt(manual.reviews)||0,status:"new",priority:false,source:manual.source,assignedTo:null,coWorkers:[],claimedBy:null,claimedAt:null,demoLink:"",notes:[],outreachLog:[],payment:{amount:"",monthly:"",billingName:"",billingEmail:"",paymentLink:"",status:"unpaid"}}]);
    setManual({businessName:"",category:"",phone:"",address:"",zip:"",rating:"",reviews:"",source:"Manual Entry"});
    setShowManual(false);
  };

  const upd=(id,u)=>setLeads(p=>p.map(l=>l.id===id?{...l,...u}:l));

  let filtered=filterMine?leads.filter(l=>l.assignedTo===user.id||l.coWorkers?.includes(user.id)):leads;
  if(search) filtered=filtered.filter(l=>l.businessName.toLowerCase().includes(search.toLowerCase())||l.category.toLowerCase().includes(search.toLowerCase()));
  if(fStatus!=="all") filtered=filtered.filter(l=>l.status===fStatus);
  if(fZip) filtered=filtered.filter(l=>l.zip?.includes(fZip));
  if(fPriority) filtered=filtered.filter(l=>l.priority);
  filtered=[...filtered].sort((a,b)=>(b.priority?1:0)-(a.priority?1:0));

  return (
    <div className="anim" style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Header */}
      <div style={{padding:"16px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,color:C.text}}>{filterMine?"My Leads":"All Leads"}</div>
          <div style={{fontSize:12,color:C.text3,marginTop:1}}>{filtered.length} lead{filtered.length!==1?"s":""}</div>
        </div>
        {!filterMine&&(
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>{setShowManual(!showManual);setShowSearch(false);}} variant={showManual?"primary":"subtle"}>+ Add Lead</Btn>
            <Btn onClick={()=>{setShowSearch(!showSearch);setShowManual(false);}} variant={showSearch?"primary":"subtle"}>🔍 Find Leads</Btn>
            <Btn onClick={()=>{setSelecting(!selecting);setSelected([]);}} variant={selecting?"danger":"subtle"}>{selecting?"Cancel":"☑ Select"}</Btn>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{padding:"10px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",background:C.surf}}>
        <input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:180}}/>
        <input placeholder="ZIP…" value={fZip} onChange={e=>setFZip(e.target.value)} style={{maxWidth:90}}/>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{maxWidth:160}}>
          <option value="all">All Statuses</option>
          {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button onClick={()=>setFPriority(!fPriority)} style={{padding:"7px 12px",borderRadius:6,border:`1px solid ${fPriority?"rgba(245,158,11,0.5)":C.bStrong}`,background:fPriority?"rgba(245,158,11,0.1)":"transparent",color:fPriority?C.yellow:C.text2,fontSize:12,fontWeight:500}}>★ Priority</button>
      </div>

      {/* Bulk bar */}
      {selecting&&selected.length>0&&(
        <div style={{padding:"10px 24px",background:"rgba(239,68,68,0.08)",borderBottom:"1px solid rgba(239,68,68,0.2)",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:13,color:C.text2,flex:1}}>{selected.length} selected</span>
          <Btn onClick={()=>setSelected(filtered.map(l=>l.id))} variant="ghost" style={{fontSize:11}}>Select All</Btn>
          <Btn onClick={()=>{if(window.confirm(`Remove ${selected.length} lead${selected.length!==1?"s":""}?`)){setLeads(p=>p.filter(l=>!selected.includes(l.id)));setSelected([]);setSelecting(false);}}} variant="danger">🗑 Remove {selected.length}</Btn>
        </div>
      )}

      {/* Find Leads Panel */}
      {showSearch&&(
        <div style={{padding:20,borderBottom:`1px solid ${C.border}`,background:C.surf}}>
          <div style={{fontSize:12,fontWeight:600,color:C.text2,marginBottom:12}}>Search by ZIP Code</div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
            <input placeholder="ZIP code…" value={searchZip} onChange={e=>setSearchZip(e.target.value)} style={{maxWidth:120}}/>
            <Btn onClick={()=>setSelectedCats([...CATEGORIES])} variant="ghost" style={{fontSize:11}}>All</Btn>
            <Btn onClick={()=>setSelectedCats([])} variant="ghost" style={{fontSize:11}}>Clear</Btn>
            <span style={{fontSize:11,color:C.text3}}>{selectedCats.length} selected</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
            {CATEGORIES.map(cat=>{
              const on=selectedCats.includes(cat);
              return <button key={cat} onClick={()=>toggleCat(cat)} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${on?C.blue:C.bStrong}`,background:on?C.blueDim:"transparent",color:on?C.blue:C.text2,fontSize:11,fontWeight:on?600:400}}>{cat}</button>;
            })}
          </div>
          {searching&&progress.total>0&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:C.text3,marginBottom:4}}>Searching {progress.done}/{progress.total} categories…</div>
              <div style={{height:3,borderRadius:2,background:C.panel}}><div style={{height:"100%",width:`${Math.round((progress.done/progress.total)*100)}%`,background:C.blue,borderRadius:2,transition:"width .3s"}}/></div>
            </div>
          )}
          <Btn onClick={runSearch} disabled={searching} variant="primary" style={{marginBottom:searchMsg?8:0}}>{searching?"Searching…":"Search"}</Btn>
          {searchMsg&&<div style={{fontSize:12,color:C.text2,marginTop:8}}>{searchMsg}</div>}
          {searchResults.length>0&&(
            <div style={{marginTop:12}}>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
                <Btn onClick={addAll} variant="success">+ Add All {searchResults.length}</Btn>
              </div>
              <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:1}}>
                {searchResults.map(r=>(
                  <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:C.panel,borderRadius:6}}>
                    <ScoreBadge lead={r}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:C.text}}>{r.businessName}</div>
                      <div style={{fontSize:11,color:C.text3}}>{r.address} · ⭐{r.rating} · {r.phone}</div>
                    </div>
                    <Btn onClick={()=>addLead(r)} variant="subtle" style={{fontSize:11}}>+ Add</Btn>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Add Panel */}
      {showManual&&(
        <div style={{padding:20,borderBottom:`1px solid ${C.border}`,background:C.surf}}>
          <div style={{fontSize:12,fontWeight:600,color:C.text2,marginBottom:14}}>Add Lead Manually</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <Field label="Business Name *" style={{gridColumn:"1/-1"}}>
              <input value={manual.businessName} onChange={e=>setManual({...manual,businessName:e.target.value})} placeholder="Business name…"/>
            </Field>
            <Field label="Category"><select value={manual.category} onChange={e=>setManual({...manual,category:e.target.value})}><option value="">Select…</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field>
            <Field label="Phone"><input value={manual.phone} onChange={e=>setManual({...manual,phone:e.target.value})} placeholder="(678) 555-0101"/></Field>
            <Field label="Address" style={{gridColumn:"1/-1"}}><input value={manual.address} onChange={e=>setManual({...manual,address:e.target.value})} placeholder="123 Main St, City GA"/></Field>
            <Field label="ZIP"><input value={manual.zip} onChange={e=>setManual({...manual,zip:e.target.value})} placeholder="30542"/></Field>
            <Field label="Source"><select value={manual.source} onChange={e=>setManual({...manual,source:e.target.value})}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></Field>
            <Field label="Rating"><input value={manual.rating} onChange={e=>setManual({...manual,rating:e.target.value})} placeholder="4.5" type="number" step="0.1" max="5"/></Field>
            <Field label="Reviews"><input value={manual.reviews} onChange={e=>setManual({...manual,reviews:e.target.value})} placeholder="87" type="number"/></Field>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={submitManual} variant="primary">Add Lead</Btn>
            <Btn onClick={()=>setShowManual(false)} variant="ghost">Cancel</Btn>
          </div>
        </div>
      )}

      {/* Lead Rows */}
      <div style={{flex:1,overflowY:"auto"}}>
        {filtered.length===0&&(
          <div style={{padding:48,textAlign:"center",color:C.text3,fontSize:13}}>No leads found.</div>
        )}
        {filtered.map(lead=>(
          <div key={lead.id} style={{
            display:"flex",alignItems:"center",gap:14,padding:"11px 24px",
            borderBottom:`1px solid ${C.border}`,cursor:"pointer",
            background:selected.includes(lead.id)?"rgba(239,68,68,0.05)":"transparent",
            transition:"background .1s",
          }}
            onClick={()=>{
              if(selecting){setSelected(p=>p.includes(lead.id)?p.filter(i=>i!==lead.id):[...p,lead.id]);}
              else{setSelLead(lead.id);go("lead-detail");}
            }}
            onMouseEnter={e=>{if(!selected.includes(lead.id))e.currentTarget.style.background=C.hover;}}
            onMouseLeave={e=>{e.currentTarget.style.background=selected.includes(lead.id)?"rgba(239,68,68,0.05)":"transparent";}}>
            {selecting&&<div style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${selected.includes(lead.id)?C.red:C.bStrong}`,background:selected.includes(lead.id)?C.red:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{selected.includes(lead.id)&&<span style={{color:"#fff",fontSize:9,fontWeight:700}}>✓</span>}</div>}
            <ScoreBadge lead={lead}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.businessName}</span>
                {lead.priority&&<span style={{color:C.yellow,fontSize:12,lineHeight:1}}>★</span>}
                <span style={{fontSize:11,color:C.text3}}>{lead.category}</span>
              </div>
              <div style={{fontSize:11,color:C.text3,marginTop:2}}>📮 {lead.zip||"—"} · ⭐ {lead.rating} ({lead.reviews})</div>
            </div>
            {!selecting&&(
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                {lead.assignedTo&&<Av uid={lead.assignedTo} size={22}/>}
                {lead.coWorkers?.slice(0,1).map(cw=><Av key={cw} uid={cw} size={20}/>)}
                <StatusPill sid={lead.status} sm/>
                <button onClick={e=>{e.stopPropagation();setQMenu(qMenu===lead.id?null:lead.id);}} style={{width:26,height:26,borderRadius:5,border:`1px solid ${C.bStrong}`,background:"transparent",color:C.text2,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>⋯</button>
              </div>
            )}
            {qMenu===lead.id&&(
              <div onClick={e=>e.stopPropagation()} style={{position:"absolute",right:24,zIndex:50,background:C.panel,border:`1px solid ${C.bStrong}`,borderRadius:8,padding:6,minWidth:170,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",marginTop:4}}>
                <button onClick={()=>{upd(lead.id,{priority:!lead.priority});setQMenu(null);}} style={{display:"block",width:"100%",padding:"7px 10px",background:"transparent",border:"none",color:C.text2,fontSize:12,textAlign:"left",borderRadius:5}}>{lead.priority?"Remove Priority":"★ Mark Priority"}</button>
                <div style={{height:1,background:C.border,margin:"4px 0"}}/>
                {mainStages.slice(0,5).map(s=>(
                  <button key={s.id} onClick={()=>{upd(lead.id,{status:s.id});setQMenu(null);}} style={{display:"block",width:"100%",padding:"7px 10px",background:lead.status===s.id?C.blueDim:"transparent",border:"none",color:lead.status===s.id?C.blue:C.text2,fontSize:12,textAlign:"left",borderRadius:5}}>→ {s.label}</button>
                ))}
                <div style={{height:1,background:C.border,margin:"4px 0"}}/>
                <button onClick={()=>{if(window.confirm(`Remove ${lead.businessName}?`)){setLeads(p=>p.filter(l=>l.id!==lead.id));setQMenu(null);}}} style={{display:"block",width:"100%",padding:"7px 10px",background:"transparent",border:"none",color:C.red,fontSize:12,textAlign:"left",borderRadius:5}}>🗑 Remove</button>
                <button onClick={()=>setQMenu(null)} style={{display:"block",width:"100%",padding:"5px 10px",background:"transparent",border:"none",color:C.text3,fontSize:11,textAlign:"left"}}>Close</button>
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
  const [tab,setTab]=useState("overview");
  const [noteText,setNoteText]=useState("");
  const [demoInput,setDemoInput]=useState(lead?.demoLink||"");
  const [billing,setBilling]=useState({amount:"",monthly:"",billingName:"",billingEmail:"",paymentLink:"",status:"unpaid",...(lead?.payment||{})});
  const [oForm,setOForm]=useState({date:today(),method:"",outcome:"",by:user.id});
  const [showOForm,setShowOForm]=useState(false);
  const [calling,setCalling]=useState(false); const [callMsg,setCallMsg]=useState("");
  const [insight,setInsight]=useState(""); const [loadingInsight,setLoadingInsight]=useState(false); const [insightErr,setInsightErr]=useState("");

  useEffect(()=>{if(lead){setDemoInput(lead.demoLink||"");setBilling({amount:"",monthly:"",billingName:"",billingEmail:"",paymentLink:"",status:"unpaid",...(lead.payment||{})});}setTab("overview");},[leadId]);

  if(!lead) return null;

  const upd=u=>setLeads(p=>p.map(l=>l.id===leadId?{...l,...u}:l));
  const addNote=()=>{if(!noteText.trim())return;upd({notes:[...(lead.notes||[]),{id:Date.now(),author:user.id,text:noteText.trim(),ts:ts()}]});setNoteText("");};
  const addOutreach=()=>{if(!oForm.method||!oForm.outcome)return;upd({outreachLog:[...(lead.outreachLog||[]),{id:Date.now(),...oForm}]});setShowOForm(false);setOForm({date:today(),method:"",outcome:"",by:user.id});};
  const saveBilling=()=>upd({payment:{...billing}});

  const makeCall=async()=>{
    if(!window.confirm(`AI call to ${lead.businessName} at ${lead.phone}?`))return;
    setCalling(true);setCallMsg("");
    try{
      const r=await fetch("/.netlify/functions/make-call",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(lead)});
      const d=await r.json();
      if(d.error)setCallMsg(`Error: ${d.error}`);
      else{setCallMsg(`✓ Call fired`);upd({outreachLog:[...(lead.outreachLog||[]),{id:Date.now(),date:today(),method:"AI Call",outcome:"In Progress",by:user.id,callId:d.callId}]});}
    }catch(e){setCallMsg("Failed.");}
    setCalling(false);
  };

  const generateInsight=async()=>{
    setLoadingInsight(true);setInsightErr("");setInsight("");
    try{
      const r=await fetch("/.netlify/functions/generate-insights",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(lead)});
      const d=await r.json();
      if(d.error)setInsightErr(d.error);
      else setInsight(d.insight);
    }catch(e){setInsightErr("Failed.");}
    setLoadingInsight(false);
  };

  const isAssigned=lead.assignedTo===user.id; const isCoWorker=lead.coWorkers?.includes(user.id);
  const idx=mainStages.findIndex(s=>s.id===lead.status);

  const TABS=["overview","outreach","billing","notes"];

  return (
    <div className="anim" style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Header */}
      <div style={{padding:"14px 24px",borderBottom:`1px solid ${C.border}`,background:C.surf}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <button onClick={onBack} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${C.bStrong}`,background:"transparent",color:C.text2,fontSize:12}}>← Back</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span style={{fontSize:17,fontWeight:700,color:C.text}}>{lead.businessName}</span>
              <button onClick={()=>upd({priority:!lead.priority})} style={{background:"none",border:"none",fontSize:14,color:lead.priority?C.yellow:C.text3,padding:0,lineHeight:1}}>★</button>
              <StatusPill sid={lead.status}/>
            </div>
            <div style={{fontSize:12,color:C.text3,marginTop:2}}>{lead.category} · {lead.zip}{lead.source?` · ${lead.source}`:""}</div>
          </div>
          <ScoreBadge lead={lead}/>
          <Btn onClick={()=>{if(window.confirm(`Remove ${lead.businessName}?`)){setLeads(p=>p.filter(l=>l.id!==leadId));onBack();}}} variant="danger" style={{fontSize:11}}>Remove</Btn>
        </div>
        {/* Pipeline bar */}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
          {mainStages.map((s,i)=>{
            const isA=lead.status===s.id; const isPast=idx>i&&!isA;
            return <button key={s.id} onClick={()=>upd({status:s.id})} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${isA?s.color+"90":isPast?s.color+"30":C.bStrong}`,background:isA?`${s.color}18`:isPast?`${s.color}08`:"transparent",color:isA?s.color:isPast?`${s.color}60`:C.text3,fontSize:10,fontWeight:isA?700:400,transition:"all .1s"}}>{isPast?"✓ ":""}{s.label}</button>;
          })}
        </div>
        <div style={{display:"flex",gap:4}}>
          {declineStages.map(s=><button key={s.id} onClick={()=>upd({status:s.id})} style={{padding:"3px 10px",borderRadius:4,border:`1px solid ${lead.status===s.id?s.color+"90":C.bStrong}`,background:lead.status===s.id?`${s.color}18`:"transparent",color:lead.status===s.id?s.color:C.text3,fontSize:10,fontWeight:lead.status===s.id?700:400}}>{s.label}</button>)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.surf,paddingLeft:24}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"10px 18px",border:"none",background:"transparent",
            fontSize:13,fontWeight:tab===t?600:400,
            color:tab===t?C.text:C.text2,
            borderBottom:tab===t?`2px solid ${C.blue}`:"2px solid transparent",
            marginBottom:-1,transition:"all .1s",textTransform:"capitalize",
          }}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{flex:1,overflowY:"auto",padding:24}}>

        {/* OVERVIEW */}
        {tab==="overview"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {/* Business Info */}
            <Card>
              <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Business Info</div>
              {[["📍","Address",lead.address||"—"],["📞","Phone",lead.phone||"—"],["⭐","Rating",`${lead.rating} stars · ${lead.reviews} reviews`],["📮","ZIP",lead.zip||"—"]].map(([i,l,v])=>(
                <div key={l} style={{display:"flex",gap:10,marginBottom:10}}>
                  <span style={{fontSize:13,width:18,flexShrink:0}}>{i}</span>
                  <div><div style={{fontSize:10,fontWeight:600,color:C.text3,marginBottom:2}}>{l}</div><div style={{fontSize:13,color:C.text2}}>{v}</div></div>
                </div>
              ))}
            </Card>

            {/* Assignment */}
            <Card>
              <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Assignment</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                {lead.assignedTo?<Av uid={lead.assignedTo} size={28}/>:<div style={{width:28,height:28,borderRadius:"50%",border:`1.5px dashed ${C.bStrong}`}}/>}
                <span style={{fontSize:13,color:C.text2}}>{lead.assignedTo?ACCOUNTS[lead.assignedTo]?.name:"Unassigned"}</span>
                {lead.coWorkers?.map(cw=><Av key={cw} uid={cw} size={22}/>)}
              </div>
              {lead.claimedBy&&<div style={{fontSize:11,color:C.text3,marginBottom:8}}>Claimed by {ACCOUNTS[lead.claimedBy]?.name} · {lead.claimedAt}</div>}
              {lead.status==="new"&&!lead.claimedBy&&(
                <Btn onClick={()=>upd({status:"under-review",claimedBy:user.id,claimedAt:ts(),assignedTo:lead.assignedTo||user.id,notes:[...(lead.notes||[]),{id:Date.now(),author:user.id,text:`Lead claimed by ${user.name}.`,ts:ts()}]})} variant="success" style={{width:"100%",marginBottom:8}}>✋ Claim Lead</Btn>
              )}
              {!isAssigned&&!isCoWorker&&lead.status!=="new"&&(
                <Btn onClick={()=>upd(lead.assignedTo?{coWorkers:[...(lead.coWorkers||[]),user.id]}:{assignedTo:user.id})} variant="subtle" style={{width:"100%"}}>{lead.assignedTo?"Join as Co-worker":"Take Ownership"}</Btn>
              )}
            </Card>

            {/* Demo Link */}
            <Card>
              <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Demo Site</div>
              <div style={{display:"flex",gap:8,marginBottom:lead.demoLink?8:0}}>
                <input value={demoInput} onChange={e=>setDemoInput(e.target.value)} placeholder="Paste demo URL…"/>
                <Btn onClick={()=>upd({demoLink:demoInput})} variant="primary" style={{flexShrink:0}}>Save</Btn>
              </div>
              {lead.demoLink&&<a href={lead.demoLink} target="_blank" style={{fontSize:12,color:C.blue,textDecoration:"none",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🔗 {lead.demoLink}</a>}
            </Card>

            {/* AI Insights */}
            <Card>
              <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>AI Insights</div>
              {insight&&<div style={{fontSize:12,color:C.text2,lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:12}}>{insight}</div>}
              {insightErr&&<div style={{fontSize:12,color:C.red,marginBottom:8}}>{insightErr}</div>}
              <Btn onClick={generateInsight} disabled={loadingInsight} variant={insight?"ghost":"primary"}>{loadingInsight?"Generating…":insight?"Regenerate":"Generate Insights"}</Btn>
            </Card>
          </div>
        )}

        {/* OUTREACH */}
        {tab==="outreach"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Call Action */}
            <Card>
              <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>AI Phone Call</div>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <Btn onClick={makeCall} disabled={calling||!lead.phone||lead.phone==="Not listed"} variant="primary" style={{fontSize:13,fontWeight:600}}>📞 {calling?"Calling…":"Fire AI Call"}</Btn>
                {lead.phone&&lead.phone!=="Not listed"&&<span style={{fontSize:12,color:C.text3}}>{lead.phone}</span>}
                {callMsg&&<span style={{fontSize:12,color:callMsg.startsWith("Error")||callMsg.startsWith("Failed")?C.red:C.green}}>{callMsg}</span>}
              </div>
            </Card>
            {/* Log */}
            <Card>
              <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Outreach Log</div>
              <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:14}}>
                {(!lead.outreachLog||lead.outreachLog.length===0)&&<div style={{fontSize:12,color:C.text3,fontStyle:"italic",padding:"8px 0"}}>No outreach logged yet.</div>}
                {(lead.outreachLog||[]).map(o=>(
                  <div key={o.id} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                    <Av uid={o.by} size={24}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,color:C.text}}>{o.method} <span style={{color:C.text3}}>→</span> {o.outcome}</div>
                      <div style={{fontSize:11,color:C.text3}}>{o.date} · {ACCOUNTS[o.by]?.name}</div>
                    </div>
                  </div>
                ))}
              </div>
              {showOForm?(
                <div style={{display:"flex",flexDirection:"column",gap:8,padding:14,background:C.panel,borderRadius:6}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <select value={oForm.method} onChange={e=>setOForm({...oForm,method:e.target.value})}><option value="">Method…</option>{METHODS.map(m=><option key={m}>{m}</option>)}</select>
                    <select value={oForm.outcome} onChange={e=>setOForm({...oForm,outcome:e.target.value})}><option value="">Outcome…</option>{OUTCOMES.map(o=><option key={o}>{o}</option>)}</select>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <Btn onClick={addOutreach} variant="primary">Log</Btn>
                    <Btn onClick={()=>setShowOForm(false)} variant="ghost">Cancel</Btn>
                  </div>
                </div>
              ):<Btn onClick={()=>setShowOForm(true)} variant="subtle">+ Log Attempt</Btn>}
            </Card>
          </div>
        )}

        {/* BILLING */}
        {tab==="billing"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Status */}
            <Card>
              <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Payment Status</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.entries(PAY_STATUS).map(([s,c])=>(
                  <button key={s} onClick={()=>setBilling({...billing,status:s})} style={{
                    padding:"6px 16px",borderRadius:6,
                    border:`1px solid ${billing.status===s?c+"90":C.bStrong}`,
                    background:billing.status===s?`${c}15`:"transparent",
                    color:billing.status===s?c:C.text2,
                    fontSize:12,fontWeight:billing.status===s?700:400,
                    textTransform:"capitalize",
                  }}>{s}</button>
                ))}
              </div>
            </Card>

            {/* Fees */}
            <Card>
              <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:14}}>Fees</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <Field label="Build Fee (one-time)">
                  <div style={{position:"relative"}}><span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.text3,fontWeight:600}}>$</span><input value={billing.amount} onChange={e=>setBilling({...billing,amount:e.target.value})} placeholder="0" type="number" style={{paddingLeft:22,fontSize:18,fontWeight:700}}/></div>
                </Field>
                <Field label="Monthly Recurring">
                  <div style={{position:"relative"}}><span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.text3,fontWeight:600}}>$</span><input value={billing.monthly} onChange={e=>setBilling({...billing,monthly:e.target.value})} placeholder="0" type="number" style={{paddingLeft:22,fontSize:18,fontWeight:700}}/></div>
                  {billing.monthly&&<div style={{fontSize:11,color:C.text3,marginTop:4}}>${(parseFloat(billing.monthly)*12||0).toFixed(0)}/yr</div>}
                </Field>
              </div>
              {/* Summary */}
              {(billing.amount||billing.monthly)&&(
                <div style={{display:"flex",gap:24,padding:14,background:C.panel,borderRadius:6,marginBottom:14}}>
                  {billing.amount&&<div><div style={{fontSize:10,color:C.text3,marginBottom:2}}>Build</div><div style={{fontSize:20,fontWeight:700,color:C.green}}>${billing.amount}</div></div>}
                  {billing.monthly&&<div><div style={{fontSize:10,color:C.text3,marginBottom:2}}>Monthly</div><div style={{fontSize:20,fontWeight:700,color:C.yellow}}>${billing.monthly}/mo</div></div>}
                  <div><div style={{fontSize:10,color:C.text3,marginBottom:2}}>Status</div><div style={{fontSize:13,fontWeight:700,color:PAY_STATUS[billing.status]||C.text,marginTop:3,textTransform:"capitalize"}}>{billing.status}</div></div>
                </div>
              )}
            </Card>

            {/* Contact */}
            <Card>
              <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:14}}>Billing Contact</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                <Field label="Name"><input value={billing.billingName} onChange={e=>setBilling({...billing,billingName:e.target.value})} placeholder="Client name…"/></Field>
                <Field label="Email"><input value={billing.billingEmail} onChange={e=>setBilling({...billing,billingEmail:e.target.value})} placeholder="email@client.com" type="email"/></Field>
              </div>
              <Field label="Payment Link">
                <input value={billing.paymentLink} onChange={e=>setBilling({...billing,paymentLink:e.target.value})} placeholder="Square / Cash App / Venmo link…"/>
              </Field>
              {billing.paymentLink&&<a href={billing.paymentLink} target="_blank" style={{fontSize:12,color:C.green,textDecoration:"none",display:"block",marginTop:6}}>🔗 Open link</a>}
            </Card>

            <Btn onClick={saveBilling} variant="success" style={{alignSelf:"flex-start",padding:"9px 24px",fontSize:13,fontWeight:600}}>Save Billing</Btn>
          </div>
        )}

        {/* NOTES */}
        {tab==="notes"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Composer */}
            <Card>
              <div style={{display:"flex",gap:10}}>
                <Av uid={user.id} size={28}/>
                <div style={{flex:1}}>
                  <textarea placeholder={`Add a note as ${user.name}…`} value={noteText} onChange={e=>setNoteText(e.target.value)} rows={3} style={{resize:"none",marginBottom:8}} onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)addNote();}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.text3}}>⌘ + Enter to post</span>
                    <Btn onClick={addNote} disabled={!noteText.trim()} variant="primary">Post Note</Btn>
                  </div>
                </div>
              </div>
            </Card>
            {/* Notes list */}
            {(!lead.notes||lead.notes.length===0)&&<div style={{fontSize:13,color:C.text3,fontStyle:"italic",padding:8}}>No notes yet.</div>}
            {[...(lead.notes||[])].reverse().map(n=>(
              <Card key={n.id}>
                <div style={{display:"flex",gap:10}}>
                  <Av uid={n.author} size={26}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:600,color:C.text}}>{ACCOUNTS[n.author]?.name}</span>
                      <span style={{fontSize:11,color:C.text3}}>{n.ts}</span>
                    </div>
                    <div style={{fontSize:13,color:C.text2,lineHeight:1.6}}>{n.text}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── CLIENT ROSTER ───────────────────────────────────────────────────────────
const ClientRoster = ({leads,go,setSelLead}) => {
  const clients=leads.filter(l=>l.status==="closed-won");
  const mrr=clients.reduce((a,l)=>a+(parseFloat(l.payment?.monthly)||0),0);
  return (
    <div className="anim" style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"16px 24px",borderBottom:`1px solid ${C.border}`,background:C.surf}}>
        <div style={{fontSize:16,fontWeight:700,color:C.text}}>Client Roster</div>
        <div style={{fontSize:12,color:C.text3,marginTop:1}}>{clients.length} clients · ${mrr}/mo recurring</div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {clients.length===0&&<div style={{padding:48,textAlign:"center",color:C.text3,fontSize:13}}>No signed clients yet.</div>}
        {clients.map(c=>(
          <button key={c.id} onClick={()=>{setSelLead(c.id);go("lead-detail");}} style={{
            display:"flex",alignItems:"center",gap:16,width:"100%",padding:"14px 24px",
            background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,
            cursor:"pointer",textAlign:"left",transition:"background .1s",
          }}
            onMouseEnter={e=>e.currentTarget.style.background=C.hover}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{width:36,height:36,borderRadius:8,background:`${C.green}15`,border:`1px solid ${C.green}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🏢</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>{c.businessName}</div>
              <div style={{fontSize:11,color:C.text3,marginTop:2}}>{c.category} · {c.address}</div>
              {c.demoLink&&<div style={{fontSize:11,color:C.blue,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🔗 {c.demoLink}</div>}
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              {c.payment?.amount&&<div style={{fontSize:15,fontWeight:700,color:C.green}}>${c.payment.amount}</div>}
              {c.payment?.monthly&&<div style={{fontSize:12,color:C.yellow,marginTop:1}}>${c.payment.monthly}/mo</div>}
              <div style={{marginTop:4}}><span style={{fontSize:10,color:PAY_STATUS[c.payment?.status]||C.text,background:`${PAY_STATUS[c.payment?.status]||C.text}15`,padding:"2px 8px",borderRadius:4,fontWeight:600,textTransform:"capitalize"}}>{c.payment?.status||"unpaid"}</span></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
const Settings = ({user}) => {
  const [pw,setPw]=useState({current:"",newPw:"",confirm:""});
  const [pwMsg,setPwMsg]=useState({text:"",ok:false});
  const [zipHistory,setZipHistory]=useState(()=>JSON.parse(localStorage.getItem("ws_zips")||"[]"));
  const [testPhone,setTestPhone]=useState(""); const [testCalling,setTestCalling]=useState(false); const [testMsg,setTestMsg]=useState("");

  const changePw=()=>{
    const stored=getPW();
    if(stored[user.id]!==pw.current){setPwMsg({text:"Current password incorrect.",ok:false});return;}
    if(!pw.newPw){setPwMsg({text:"New password can't be empty.",ok:false});return;}
    if(pw.newPw!==pw.confirm){setPwMsg({text:"Passwords don't match.",ok:false});return;}
    stored[user.id]=pw.newPw; savePW(stored);
    setPwMsg({text:"Password updated.",ok:true}); setPw({current:"",newPw:"",confirm:""});
  };

  const fireTestCall=async()=>{
    if(!testPhone.trim()){setTestMsg("Enter a phone number.");return;}
    setTestCalling(true); setTestMsg("");
    try{
      const r=await fetch("/.netlify/functions/make-call",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:testPhone,businessName:"Test Business",category:"Test",address:"Flowery Branch GA"})});
      const d=await r.json();
      if(d.error)setTestMsg(`Error: ${d.error}`);
      else setTestMsg(`✓ Call fired · ID: ${d.callId}`);
    }catch(e){setTestMsg("Failed.");}
    setTestCalling(false);
  };

  const integrations=[
    {name:"Anthropic API",desc:"AI insights generation",env:"ANTHROPIC_API_KEY"},
    {name:"SerpApi",desc:"Lead discovery by ZIP",env:"SERPAPI_KEY"},
    {name:"Bland AI",desc:"AI phone outreach",env:"BLAND_API_KEY"},
    {name:"Cloudflare Pages",desc:"Client demo hosting",env:"CF_API_TOKEN"},
  ];

  return (
    <div className="anim" style={{padding:24,display:"flex",flexDirection:"column",gap:16,maxWidth:640}}>
      <div><div style={{fontSize:16,fontWeight:700,color:C.text}}>Settings</div><div style={{fontSize:12,color:C.text3,marginTop:2}}>Account, APIs, and team.</div></div>

      {/* Test Call */}
      <Card>
        <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Test AI Call</div>
        <div style={{display:"flex",gap:8,marginBottom:testMsg?8:0}}>
          <input placeholder="Phone number…" value={testPhone} onChange={e=>setTestPhone(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fireTestCall()}/>
          <Btn onClick={fireTestCall} disabled={testCalling} variant="primary" style={{flexShrink:0,whiteSpace:"nowrap"}}>📞 {testCalling?"Calling…":"Test"}</Btn>
        </div>
        {testMsg&&<div style={{fontSize:12,color:testMsg.startsWith("Error")||testMsg.startsWith("Failed")?C.red:C.green}}>{testMsg}</div>}
      </Card>

      {/* Change PW */}
      <Card>
        <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Change Password — {user.name}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
          <input type="password" placeholder="Current password" value={pw.current} onChange={e=>setPw({...pw,current:e.target.value})}/>
          <input type="password" placeholder="New password" value={pw.newPw} onChange={e=>setPw({...pw,newPw:e.target.value})}/>
          <input type="password" placeholder="Confirm new password" value={pw.confirm} onChange={e=>setPw({...pw,confirm:e.target.value})}/>
        </div>
        {pwMsg.text&&<div style={{fontSize:12,color:pwMsg.ok?C.green:C.red,marginBottom:8}}>{pwMsg.text}</div>}
        <Btn onClick={changePw} variant="primary">Update Password</Btn>
      </Card>

      {/* API Keys */}
      <Card>
        <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>API Integrations</div>
        <div style={{fontSize:12,color:C.text3,marginBottom:14}}>Keys are set as Netlify environment variables — never stored in the frontend.</div>
        {integrations.map(i=>(
          <div key={i.env} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
            <div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{i.name}</div><div style={{fontSize:11,color:C.text3}}>{i.desc}</div></div>
            <code style={{fontSize:10,color:C.blue,background:C.blueDim,padding:"3px 8px",borderRadius:4}}>{i.env}</code>
          </div>
        ))}
      </Card>

      {/* Zip History */}
      <Card>
        <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>ZIP History</div>
        {zipHistory.length===0?<div style={{fontSize:12,color:C.text3,fontStyle:"italic"}}>No zips searched yet.</div>:(
          <>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {zipHistory.map(z=><span key={z} style={{padding:"3px 10px",borderRadius:4,background:C.blueDim,border:`1px solid ${C.blue}30`,color:C.blue,fontSize:12,fontWeight:500}}>{z}</span>)}
            </div>
            <Btn onClick={()=>{localStorage.removeItem("ws_zips");setZipHistory([]);}} variant="danger" style={{fontSize:11}}>Clear History</Btn>
          </>
        )}
      </Card>

      {/* Team */}
      <Card>
        <div style={{fontSize:11,fontWeight:600,color:C.text3,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Team</div>
        {Object.values(ACCOUNTS).map(a=>(
          <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
            <Av uid={a.id} size={32}/>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{a.name}</div><div style={{fontSize:11,color:C.text3}}>{a.role} · @{a.id}</div></div>
            {a.id===user.id&&<span style={{fontSize:10,color:C.green,background:`${C.green}15`,padding:"2px 8px",borderRadius:4,fontWeight:600}}>You</span>}
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [userId,setUserId]=useState(()=>getSession());
  const [view,setView]=useState("dashboard");
  const [leads,setLeadsRaw]=useState(()=>{try{const s=localStorage.getItem("ws_leads");return s?JSON.parse(s):INITIAL_LEADS;}catch{return INITIAL_LEADS;}});
  const setLeads=updater=>{setLeadsRaw(prev=>{const next=typeof updater==="function"?updater(prev):updater;try{localStorage.setItem("ws_leads",JSON.stringify(next));}catch{}return next;});};
  const [selLead,setSelLead]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [isMobile,setIsMobile]=useState(window.innerWidth<700);
  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<700);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  const user=ACCOUNTS[userId];
  const login=uid=>{setSession(uid);setUserId(uid);};
  const logout=()=>{clearSession();setUserId(null);setView("dashboard");setSelLead(null);};
  const go=v=>{setView(v);if(v!=="lead-detail")setSelLead(null);setMenuOpen(false);};

  if(!user) return <Login onLogin={login}/>;

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <style>{CSS}</style>
      <Sidebar view={view} go={go} user={user} leads={leads} onLogout={logout} isMobile={isMobile} menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflowY:"auto",paddingLeft:isMobile?0:0,paddingTop:isMobile?48:0}}>
        {view==="dashboard"   &&<Dashboard leads={leads} user={user} go={go} setSelLead={setSelLead}/>}
        {view==="leads"       &&<LeadsList leads={leads} setLeads={setLeads} user={user} go={go} setSelLead={setSelLead} filterMine={false}/>}
        {view==="mine"        &&<LeadsList leads={leads} setLeads={setLeads} user={user} go={go} setSelLead={setSelLead} filterMine={true}/>}
        {view==="clients"     &&<ClientRoster leads={leads} go={go} setSelLead={setSelLead}/>}
        {view==="lead-detail" &&selLead&&<LeadDetail leadId={selLead} leads={leads} setLeads={setLeads} user={user} onBack={()=>go("leads")}/>}
        {view==="settings"    &&<Settings user={user}/>}
      </div>
    </div>
  );
}
