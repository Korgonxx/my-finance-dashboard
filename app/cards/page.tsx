"use client";
import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useAppSettings } from "../context/AppSettingsContext";
import { encryptData, decryptData, maskData, hashPasscode, verifyPasscode } from "../utils/encryption";
import { MasterPasscodeGuard } from "../components/MasterPasscodeGuard";
import { Sidebar, THEME, type ThemeType } from "../components/Sidebar";
import { useWallets } from "@/lib/hooks/useWallets";
import { Plus, Trash2, Copy, X, Shield, Wallet, CreditCard, Check, AlertCircle, Lock, Unlock } from "lucide-react";

interface CryptoWallet {
  id:string;name:string;address:string;network:string;balance:number;createdAt:string;
  isEncrypted?:boolean;encryptedData?:{address:string;iv:string;salt:string};passcode?:string;
}
interface BankCard {
  id:string;name:string;number:string;type:"credit"|"debit";bank:string;balance:number;
  limit?:number;createdAt:string;isEncrypted?:boolean;
  encryptedData?:{number:string;iv:string;salt:string};passcode?:string;
}

const NETWORKS=[
  {name:"Ethereum",color:"#627eea"},{name:"Polygon",color:"#8247e5"},
  {name:"BSC",color:"#f0b90b"},{name:"Arbitrum",color:"#28a0f0"},
  {name:"Optimism",color:"#ff0420"},{name:"Base",color:"#0052ff"},
];

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}
function shortAddr(a:string){return a?`${a.slice(0,6)}…${a.slice(-4)}`:" ";}

function Modal({children,onClose,T,maxWidth=460}:{children:React.ReactNode;onClose:()=>void;T:ThemeType;maxWidth?:number}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",
      justifyContent:"center",zIndex:200,backdropFilter:"blur(20px)",padding:"1rem",fontFamily:"'Outfit',sans-serif"}}>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.93) translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <div style={{width:"100%",maxWidth,background:T.card,border:`1px solid ${T.border}`,borderRadius:24,
        padding:"2rem",animation:"popIn 0.25s ease",boxShadow:"0 40px 80px rgba(0,0,0,0.6)",maxHeight:"90vh",overflowY:"auto"}}>
        {children}
      </div>
    </div>
  );
}

function MH({title,sub,onClose,T}:{title:string;sub?:string;onClose:()=>void;T:ThemeType}){
  return(
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"1.5rem"}}>
      <div>
        <div style={{fontSize:17,fontWeight:900,letterSpacing:"-0.02em",color:T.textPri}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:T.textMut,marginTop:3}}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{width:32,height:32,borderRadius:9,background:T.pill,
        border:`1px solid ${T.border}`,cursor:"pointer",color:T.textSec,flexShrink:0,
        display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14}/></button>
    </div>
  );
}

function WCard({w,T,onDelete,onDecrypt,decAddr}:{w:any;T:ThemeType;onDelete:()=>void;onDecrypt:()=>void;decAddr?:string}){
  const[cp,setCp]=useState(false);
  const net=NETWORKS.find(n=>n.name===w.network);
  const disp=decAddr||w.address;
  const copy=()=>{navigator.clipboard.writeText(disp).catch(()=>{});setCp(true);setTimeout(()=>setCp(false),1500);};
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:"1.5rem",
      position:"relative",overflow:"hidden",transition:"transform 0.2s"}}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform="none"}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:net?.color||T.blue,borderRadius:"20px 20px 0 0"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:10,background:`${net?.color||T.blue}18`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Wallet size={17} color={net?.color||T.blue}/>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:T.textPri}}>{w.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:net?.color||T.blue}}/>
              <span style={{fontSize:11,color:T.textMut,fontWeight:600}}>{w.network}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {w.isEncrypted&&!decAddr&&(
            <button onClick={onDecrypt} style={{width:30,height:30,borderRadius:8,background:`${T.yellow}18`,
              border:`1px solid ${T.yellow}30`,cursor:"pointer",color:T.yellow,
              display:"flex",alignItems:"center",justifyContent:"center"}}><Unlock size={12}/></button>
          )}
          <button onClick={copy} style={{width:30,height:30,borderRadius:8,background:T.pill,
            border:`1px solid ${T.border}`,cursor:"pointer",color:cp?T.green:T.textMut,
            display:"flex",alignItems:"center",justifyContent:"center",transition:"color 0.2s"}}>
            {cp?<Check size={12}/>:<Copy size={12}/>}
          </button>
          <button onClick={onDelete} style={{width:30,height:30,borderRadius:8,background:`${T.red}0f`,
            border:`1px solid ${T.red}20`,cursor:"pointer",color:T.red,
            display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={12}/></button>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:9,color:T.textMut,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>Balance</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1.5rem",fontWeight:700,color:T.textPri,letterSpacing:"-0.03em"}}>
          ${w.balance.toLocaleString()}
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 12px"}}>
        {w.isEncrypted&&!decAddr
          ?<span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:T.textMut}}><Lock size={11}/>Encrypted</span>
          :<span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:T.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shortAddr(disp)}</span>
        }
      </div>
      <div style={{fontSize:10,color:T.textMut,marginTop:10}}>Added {w.createdAt}</div>
    </div>
  );
}

function BCard({c,T,onDelete,onDecrypt,decNum}:{c:BankCard;T:ThemeType;onDelete:()=>void;onDecrypt:()=>void;decNum?:string}){
  const isC=c.type==="credit";
  const used=isC&&c.limit?(c.balance/c.limit)*100:0;
  const acc=isC?T.purple:T.green;
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:"1.5rem",
      position:"relative",overflow:"hidden",transition:"transform 0.2s"}}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform="none"}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:acc,borderRadius:"20px 20px 0 0"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:10,background:`${acc}18`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <CreditCard size={17} color={acc}/>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:T.textPri}}>{c.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
              <span style={{fontSize:10,fontWeight:700,color:acc,padding:"1px 7px",borderRadius:99,background:`${acc}15`}}>{c.type.toUpperCase()}</span>
              <span style={{fontSize:11,color:T.textMut}}>{c.bank}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {c.isEncrypted&&!decNum&&(
            <button onClick={onDecrypt} style={{width:30,height:30,borderRadius:8,background:`${T.yellow}18`,
              border:`1px solid ${T.yellow}30`,cursor:"pointer",color:T.yellow,
              display:"flex",alignItems:"center",justifyContent:"center"}}><Unlock size={12}/></button>
          )}
          <button onClick={onDelete} style={{width:30,height:30,borderRadius:8,background:`${T.red}0f`,
            border:`1px solid ${T.red}20`,cursor:"pointer",color:T.red,
            display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={12}/></button>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:9,color:T.textMut,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>{isC?"Balance Owed":"Balance"}</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1.5rem",fontWeight:700,color:T.textPri,letterSpacing:"-0.03em"}}>${c.balance.toLocaleString()}</div>
      </div>
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 12px",marginBottom:isC&&c.limit?12:0}}>
        {c.isEncrypted&&!decNum
          ?<span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:T.textMut}}><Lock size={11}/>Encrypted</span>
          :<span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:T.textSec}}>{decNum||c.number}</span>
        }
      </div>
      {isC&&c.limit&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:10,color:T.textMut,fontWeight:600}}>Credit Used</span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:used>80?T.red:T.textSec,fontWeight:700}}>{used.toFixed(0)}%</span>
          </div>
          <div style={{height:4,background:T.pill,borderRadius:99}}>
            <div style={{height:"100%",borderRadius:99,background:used>80?T.red:used>50?T.yellow:T.green,width:`${used}%`,transition:"width 0.8s"}}/>
          </div>
          <div style={{fontSize:10,color:T.textMut,marginTop:4}}>${(c.limit-c.balance).toLocaleString()} available</div>
        </div>
      )}
    </div>
  );
}

function CardsPage(){
  const{mode,setMode}=useWeb3();
  const{setCurrentPage,isDark,setIsDark}=useAppSettings();
  const[hydrated,setHydrated]=useState(false);
  
  // Stabilize isWeb3 after hydration to prevent jitter
  const isWeb3=hydrated?mode==="web3":false;
  const T=isDark?THEME.dark:THEME.light;

  useEffect(()=>{
    setHydrated(true);
  },[]);
  useEffect(()=>{setCurrentPage("cards");},[setCurrentPage]);

  const{wallets,loading:wLoading,addWallet,removeWallet}=useWallets();

  const[cards,setCards]=useState<BankCard[]>([]);
  useEffect(()=>{try{const s=localStorage.getItem("korgon_cards");if(s)setCards(JSON.parse(s));}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem("korgon_cards",JSON.stringify(cards));}catch{}},[cards]);

  const[showAdd,setShowAdd]=useState(false);
  const[form,setForm]=useState({name:"",address:"",network:"Ethereum",number:"",type:"debit" as "debit"|"credit",bank:"",limit:""});
  const[showEnc,setShowEnc]=useState(false);
  const[ep,setEp]=useState(""); const[epc,setEpc]=useState(""); const[ee,setEe]=useState(""); const[el,setEl]=useState(false);
  const[showDec,setShowDec]=useState(false);
  const[dp,setDp]=useState(""); const[de,setDe]=useState(""); const[dId,setDId]=useState<string|null>(null); const[dl,setDl]=useState(false);
  const[decData,setDecData]=useState<Record<string,string>>({});
  const[showDel,setShowDel]=useState(false); const[showDelP,setShowDelP]=useState(false);
  const[delId,setDelId]=useState<string|null>(null); const[delType,setDelType]=useState<"wallet"|"card"|null>(null);
  const[delName,setDelName]=useState(""); const[delP,setDelP]=useState(""); const[delE,setDelE]=useState(""); const[delL,setDelL]=useState(false);

  const openAdd=()=>{setForm({name:"",address:"",network:"Ethereum",number:"",type:"debit",bank:"",limit:""});setShowAdd(true);};
  const handleAdd=()=>{
    if(isWeb3&&(!form.name||!form.address))return;
    if(!isWeb3&&(!form.name||!form.number||!form.bank))return;
    setShowAdd(false);setEp("");setEpc("");setEe("");setShowEnc(true);
  };
  const handleEnc=async()=>{
    if(!ep||!epc){setEe("Enter and confirm passcode");return;}
    if(ep!==epc){setEe("Passcodes don't match");return;}
    if(ep.length<4){setEe("Min 4 characters");return;}
    setEl(true);
    try{
      const hashed=await hashPasscode(ep);
      if(isWeb3){
        const enc=await encryptData(form.address,ep);
        await addWallet({name:form.name,address:maskData(form.address),network:form.network,balance:0,
          isEncrypted:true,encryptedData:{address:enc.encryptedData,iv:enc.iv,salt:enc.salt},passcode:hashed} as any);
      } else {
        const enc=await encryptData(form.number,ep);
        const nc:BankCard={id:uid(),name:form.name,number:maskData(form.number),type:form.type,bank:form.bank,balance:0,
          limit:form.type==="credit"&&form.limit?parseFloat(form.limit):undefined,
          createdAt:new Date().toISOString().slice(0,10),isEncrypted:true,
          encryptedData:{number:enc.encryptedData,iv:enc.iv,salt:enc.salt},passcode:hashed};
        setCards(p=>[...p,nc]);
      }
      setShowEnc(false);setEp("");setEpc("");
    }catch(e){setEe(e instanceof Error?e.message:"Encryption failed");}
    finally{setEl(false);}
  };
  const startDec=(id:string)=>{setDId(id);setDp("");setDe("");setShowDec(true);};
  const handleDec=async()=>{
    if(!dp||!dId){setDe("Enter passcode");return;}
    setDl(true);
    try{
      const item=(isWeb3?wallets.find(w=>w.id===dId) as any:cards.find(c=>c.id===dId));
      if(!item?.encryptedData)throw new Error("Not encrypted");
      const key=isWeb3?"address":"number";
      const dec=await decryptData((item.encryptedData as any)[key],dp,item.encryptedData.salt,item.encryptedData.iv);
      setDecData(p=>({...p,[dId]:dec}));setShowDec(false);
    }catch{setDe("Incorrect passcode");}
    finally{setDl(false);}
  };
  const reqDel=(type:"wallet"|"card",id:string,name:string)=>{
    setDelId(id);setDelType(type);setDelName(name);setDelP("");setDelE("");setShowDel(true);
  };
  const confDel=()=>{
    setShowDel(false);
    const item=delType==="wallet"?(wallets as any[]).find(w=>w.id===delId):cards.find(c=>c.id===delId);
    if(item?.passcode){setShowDelP(true);return;}
    perfDel();
  };
  const perfDel=()=>{
    if(delType==="wallet")removeWallet(delId!);
    else setCards(p=>p.filter(c=>c.id!==delId));
    setShowDel(false);setShowDelP(false);setDelId(null);setDelType(null);setDelName("");
  };
  const confDelP=async()=>{
    if(!delP){setDelE("Enter passcode");return;}
    setDelL(true);
    try{
      const item=delType==="wallet"?(wallets as any[]).find(w=>w.id===delId):cards.find(c=>c.id===delId);
      if(!item?.passcode){perfDel();return;}
      const ok=await verifyPasscode(delP,item.passcode);
      if(!ok){setDelE("Incorrect passcode");setDelL(false);return;}
      perfDel();
    }catch{setDelE("Verification failed");}
    finally{setDelL(false);}
  };

  const total=hydrated?(isWeb3?wallets.reduce((s,w)=>s+w.balance,0):cards.reduce((s,c)=>s+c.balance,0)):0;
  const inp:React.CSSProperties={width:"100%",padding:"10px 14px",background:T.pill,border:`1px solid ${T.border}`,
    borderRadius:10,color:T.textPri,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  const lbl:React.CSSProperties={display:"block",fontSize:10,color:T.textMut,fontWeight:700,
    letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:5};

  return(
    <MasterPasscodeGuard isDark={isDark}>
      <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${T.bg};color:${T.textPri}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
        input::placeholder{color:${T.textMut}} select,option{background:${T.card};color:${T.textPri}}
        select{appearance:none;-webkit-appearance:none;}
      `}</style>
      <div style={{display:"flex",minHeight:"100vh",background:T.bg,fontFamily:"'Outfit','Segoe UI',sans-serif",color:T.textPri}}>
        <Sidebar isDark={isDark} setIsDark={setIsDark}/>
        <div style={{marginLeft:230,flex:1,display:"flex",flexDirection:"column"}}>

          {/* TOP BAR */}
          <div style={{padding:"1rem 2rem",display:"flex",alignItems:"center",justifyContent:"space-between",
            borderBottom:`1px solid ${T.border}`,
            background:isDark?"rgba(8,8,8,0.85)":"rgba(242,242,240,0.9)",
            backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:40}}>
            <div>
              <div style={{fontSize:10,color:T.textMut,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>
                {hydrated&&isWeb3?"Crypto":"Finance"}
              </div>
              <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.03em"}} suppressHydrationWarning>
                {hydrated&&isWeb3?"Wallets":"Cards"}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <div style={{display:"flex",background:T.pill,borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
                {(["web2","web3"] as const).map(m=>(
                  <button key={m} onClick={()=>setMode(m)} suppressHydrationWarning
                    style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",
                      fontFamily:"inherit",fontSize:11,fontWeight:700,transition:"all 0.15s",
                      background:(hydrated?isWeb3:false)===(m==="web3")?T.yellow:"transparent",
                      color:(hydrated?isWeb3:false)===(m==="web3")?"#000":T.textMut}}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
              <button onClick={openAdd}
                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 18px",borderRadius:99,
                  background:T.yellow,border:"none",color:"#000",fontSize:11,fontWeight:900,
                  cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${T.yellow}40`}}>
                <Plus size={13}/> Add {hydrated&&isWeb3?"Wallet":"Card"}
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{padding:"1.5rem 2rem 4rem",flex:1,animation:"slideUp 0.4s ease"}}>
            <div style={{background:hydrated&&isWeb3?T.green:T.yellow,borderRadius:20,
              padding:"1.5rem 2rem",marginBottom:"1.5rem",
              display:"flex",justifyContent:"space-between",alignItems:"center"}} suppressHydrationWarning>
              <div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(0,0,0,0.45)",marginBottom:6}}>
                  Total {hydrated&&isWeb3?"Portfolio":"Balance"}
                </div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"2.5rem",fontWeight:700,color:"#000",letterSpacing:"-0.04em",lineHeight:1}}>
                  ${total.toLocaleString()}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(0,0,0,0.4)",marginBottom:4}}>Connected</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"2.5rem",fontWeight:700,color:"#000"}}>
                  {hydrated?(isWeb3?wallets.length:cards.length):0}
                </div>
              </div>
            </div>

            {(!hydrated||isWeb3)?(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1rem"}}>
                {wLoading?Array.from({length:3}).map((_,i)=>(
                  <div key={i} style={{background:T.card,borderRadius:20,height:220,border:`1px solid ${T.border}`,animation:"pulse 1.5s ease infinite"}}/>
                )):wallets.length>0?wallets.map((w,_wi)=>(
                  <WCard key={w.id} w={w} T={T}
                    onDelete={()=>reqDel("wallet",w.id,w.name)}
                    onDecrypt={()=>startDec(w.id)}
                    decAddr={decData[w.id]}/>
                )):(
                  <div style={{gridColumn:"1/-1",padding:"4rem",textAlign:"center",background:T.card,borderRadius:20,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:40,marginBottom:12,opacity:0.2}}>👛</div>
                    <div style={{color:T.textMut,fontSize:14,marginBottom:16}}>No wallets yet</div>
                    <button onClick={openAdd} style={{padding:"10px 24px",borderRadius:99,background:T.yellow,
                      border:"none",color:"#000",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit"}}>
                      Add First Wallet →
                    </button>
                  </div>
                )}
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1rem"}}>
                {cards.length>0?cards.map(c=>(
                  <BCard key={c.id} c={c} T={T}
                    onDelete={()=>reqDel("card",c.id,c.name)}
                    onDecrypt={()=>startDec(c.id)}
                    decNum={decData[c.id]}/>
                )):(
                  <div style={{gridColumn:"1/-1",padding:"4rem",textAlign:"center",background:T.card,borderRadius:20,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:40,marginBottom:12,opacity:0.2}}>💳</div>
                    <div style={{color:T.textMut,fontSize:14,marginBottom:16}}>No cards yet</div>
                    <button onClick={openAdd} style={{padding:"10px 24px",borderRadius:99,background:T.yellow,
                      border:"none",color:"#000",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit"}}>
                      Add First Card →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd&&<Modal onClose={()=>setShowAdd(false)} T={T}>
        <MH title={isWeb3?"Add Wallet":"Add Card"} sub={isWeb3?"Address will be encrypted":"Card details encrypted locally"} onClose={()=>setShowAdd(false)} T={T}/>
        <div style={{display:"grid",gap:14}}>
          <div><label style={lbl}>Name</label><input style={inp} value={form.name} placeholder={isWeb3?"e.g. Main Wallet":"e.g. Chase Checking"} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
          {isWeb3?(
            <>
              <div><label style={lbl}>Wallet Address</label><input style={inp} value={form.address} placeholder="0x..." onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></div>
              <div><label style={lbl}>Network</label>
                <select value={form.network} onChange={e=>setForm(f=>({...f,network:e.target.value}))} style={{...inp,cursor:"pointer"}}>
                  {NETWORKS.map(n=><option key={n.name} value={n.name}>{n.name}</option>)}
                </select>
              </div>
            </>
          ):(
            <>
              <div><label style={lbl}>Card Number (last 4)</label><input style={inp} value={form.number} placeholder="****1234" onChange={e=>setForm(f=>({...f,number:e.target.value}))}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lbl}>Bank</label><input style={inp} value={form.bank} placeholder="e.g. Chase" onChange={e=>setForm(f=>({...f,bank:e.target.value}))}/></div>
                <div><label style={lbl}>Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as any}))} style={{...inp,cursor:"pointer"}}>
                    <option value="debit">Debit</option><option value="credit">Credit</option>
                  </select>
                </div>
              </div>
              {form.type==="credit"&&<div><label style={lbl}>Credit Limit (optional)</label><input type="number" style={inp} value={form.limit} placeholder="15000" onChange={e=>setForm(f=>({...f,limit:e.target.value}))}/></div>}
            </>
          )}
        </div>
        <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
          <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>Cancel</button>
          <button onClick={handleAdd} style={{flex:2,padding:"11px",background:T.yellow,border:"none",borderRadius:12,color:"#000",cursor:"pointer",fontSize:13,fontWeight:900,fontFamily:"inherit"}}>Next →</button>
        </div>
      </Modal>}

      {showEnc&&<Modal onClose={()=>setShowEnc(false)} T={T}>
        <MH title="Encrypt with Passcode" sub="Keep this passcode safe — you'll need it to view your data" onClose={()=>setShowEnc(false)} T={T}/>
        <div style={{padding:"12px 16px",borderRadius:12,background:`${T.yellow}10`,border:`1px solid ${T.yellow}25`,marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <Shield size={14} color={T.yellow}/>
          <span style={{fontSize:12,color:T.textSec}}>Your {isWeb3?"wallet address":"card number"} will be encrypted locally.</span>
        </div>
        <div style={{display:"grid",gap:12}}>
          <div><label style={lbl}>Passcode (min 4)</label><input type="password" style={inp} value={ep} placeholder="••••••" inputMode="numeric" onChange={e=>setEp(e.target.value)}/></div>
          <div><label style={lbl}>Confirm Passcode</label><input type="password" style={inp} value={epc} placeholder="••••••" inputMode="numeric" onChange={e=>setEpc(e.target.value)}/></div>
          {ee&&<div style={{display:"flex",alignItems:"center",gap:6,color:T.red,fontSize:12,fontWeight:600}}><AlertCircle size={13}/>{ee}</div>}
        </div>
        <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
          <button onClick={()=>{setShowEnc(false);setShowAdd(true);}} style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>Back</button>
          <button onClick={handleEnc} disabled={el} style={{flex:2,padding:"11px",background:T.yellow,border:"none",borderRadius:12,color:"#000",cursor:el?"not-allowed":"pointer",fontSize:13,fontWeight:900,fontFamily:"inherit",opacity:el?0.7:1}}>
            {el?"Encrypting…":"Save & Encrypt ✓"}
          </button>
        </div>
      </Modal>}

      {showDec&&<Modal onClose={()=>setShowDec(false)} T={T} maxWidth={380}>
        <MH title="Reveal Data" sub="Enter your passcode to decrypt" onClose={()=>setShowDec(false)} T={T}/>
        <div style={{display:"grid",gap:12}}>
          <div><label style={lbl}>Passcode</label><input type="password" style={inp} value={dp} placeholder="Enter passcode" inputMode="numeric" autoFocus onChange={e=>setDp(e.target.value)}/></div>
          {de&&<div style={{display:"flex",alignItems:"center",gap:6,color:T.red,fontSize:12,fontWeight:600}}><AlertCircle size={13}/>{de}</div>}
        </div>
        <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
          <button onClick={()=>setShowDec(false)} style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>Cancel</button>
          <button onClick={handleDec} disabled={dl} style={{flex:2,padding:"11px",background:T.yellow,border:"none",borderRadius:12,color:"#000",cursor:dl?"not-allowed":"pointer",fontSize:13,fontWeight:900,fontFamily:"inherit"}}>
            {dl?"Decrypting…":"Reveal ✓"}
          </button>
        </div>
      </Modal>}

      {showDel&&<Modal onClose={()=>setShowDel(false)} T={T} maxWidth={360}>
        <div style={{textAlign:"center"}}>
          <div style={{width:52,height:52,borderRadius:14,background:`${T.red}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem"}}><Trash2 size={22} color={T.red}/></div>
          <div style={{fontSize:17,fontWeight:900,marginBottom:8,letterSpacing:"-0.02em"}}>Delete "{delName}"?</div>
          <div style={{fontSize:13,color:T.textMut,marginBottom:"1.5rem",lineHeight:1.6}}>This {delType} will be permanently removed.</div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowDel(false)} style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>Cancel</button>
            <button onClick={confDel} style={{flex:1,padding:"11px",background:T.red,border:"none",borderRadius:12,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:900,fontFamily:"inherit"}}>Delete</button>
          </div>
        </div>
      </Modal>}

      {showDelP&&<Modal onClose={()=>setShowDelP(false)} T={T} maxWidth={380}>
        <MH title="Confirm Delete" sub="Enter the item's passcode to delete" onClose={()=>setShowDelP(false)} T={T}/>
        <div style={{display:"grid",gap:12}}>
          <div><label style={lbl}>Item Passcode</label><input type="password" style={inp} value={delP} placeholder="Enter passcode" inputMode="numeric" autoFocus onChange={e=>setDelP(e.target.value)}/></div>
          {delE&&<div style={{display:"flex",alignItems:"center",gap:6,color:T.red,fontSize:12,fontWeight:600}}><AlertCircle size={13}/>{delE}</div>}
        </div>
        <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
          <button onClick={()=>setShowDelP(false)} style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>Cancel</button>
          <button onClick={confDelP} disabled={delL} style={{flex:2,padding:"11px",background:T.red,border:"none",borderRadius:12,color:"#fff",cursor:delL?"not-allowed":"pointer",fontSize:13,fontWeight:900,fontFamily:"inherit"}}>
            {delL?"Verifying…":"Confirm Delete"}
          </button>
        </div>
      </Modal>}
      </>
    </MasterPasscodeGuard>
  );
}

export default CardsPage;
