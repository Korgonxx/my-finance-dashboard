"use client";
import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useAppSettings } from "../context/AppSettingsContext";
import { encryptData, decryptData, maskData, hashPasscode, verifyPasscode } from "../utils/encryption";
import { MasterPasscodeGuard } from "../components/MasterPasscodeGuard";
import { Sidebar, THEME, type ThemeType } from "../components/Sidebar";
import {
  Plus, Trash2, Copy, Eye, EyeOff, X, Shield,
  Wallet, CreditCard, Check, AlertCircle, ExternalLink,
  Lock, Unlock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CryptoWallet {
  id: string; name: string; address: string; network: string;
  balance: number; createdAt: string; isEncrypted?: boolean;
  encryptedData?: { address: string; iv: string; salt: string };
  passcode?: string;
}
interface BankCard {
  id: string; name: string; number: string; type: "credit"|"debit";
  bank: string; balance: number; limit?: number; createdAt: string;
  isEncrypted?: boolean;
  encryptedData?: { number: string; iv: string; salt: string };
  passcode?: string;
}

const NETWORKS = [
  { name:"Ethereum", color:"#627eea" }, { name:"Polygon", color:"#8247e5" },
  { name:"BSC", color:"#f0b90b" },      { name:"Arbitrum", color:"#28a0f0" },
  { name:"Optimism", color:"#ff0420" }, { name:"Base", color:"#0052ff" },
];
const shortAddr = (a:string) => a?`${a.slice(0,6)}…${a.slice(-4)}`:"";
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2); }

// ── Shared modal wrapper ───────────────────────────────────────────────────────
function Modal({ children, onClose, T }: { children:React.ReactNode; onClose:()=>void; T:ThemeType }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,
      backdropFilter:"blur(20px)",padding:"1rem",fontFamily:"'Outfit',sans-serif"}}>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.93) translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <div style={{width:"100%",maxWidth:460,background:T.card,
        border:`1px solid ${T.border}`,borderRadius:24,padding:"2rem",
        animation:"popIn 0.25s ease",boxShadow:"0 40px 80px rgba(0,0,0,0.6)",
        maxHeight:"90vh",overflowY:"auto"}}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose, T }: { title:string; subtitle?:string; onClose:()=>void; T:ThemeType }) {
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"1.5rem"}}>
      <div>
        <div style={{fontSize:17,fontWeight:900,letterSpacing:"-0.02em",color:T.textPri}}>{title}</div>
        {subtitle&&<div style={{fontSize:12,color:T.textMut,marginTop:3}}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{width:32,height:32,borderRadius:9,background:T.pill,
        border:`1px solid ${T.border}`,cursor:"pointer",color:T.textSec,flexShrink:0,
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <X size={14}/>
      </button>
    </div>
  );
}

function Inp({ label, T, ...props }: React.InputHTMLAttributes<HTMLInputElement>&{label:string;T:ThemeType}) {
  return (
    <div>
      <label style={{display:"block",fontSize:10,color:T.textMut,fontWeight:700,
        letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:5}}>
        {label}
      </label>
      <input {...props} style={{width:"100%",padding:"10px 14px",
        background:T.pill,border:`1px solid ${T.border}`,borderRadius:10,
        color:T.textPri,fontSize:14,fontFamily:"inherit",outline:"none",
        boxSizing:"border-box",...props.style}}/>
    </div>
  );
}

// ── Wallet Card ────────────────────────────────────────────────────────────────
function WalletCard({ w, T, isDark, onDelete, onCopy, onDecrypt, decryptedAddress }:{
  w:CryptoWallet; T:ThemeType; isDark:boolean;
  onDelete:()=>void; onCopy:(a:string)=>void;
  onDecrypt:()=>void; decryptedAddress?:string;
}) {
  const [copied, setCopied] = useState(false);
  const net = NETWORKS.find(n=>n.name===w.network);
  const displayAddr = decryptedAddress || w.address;

  const copy = () => {
    onCopy(displayAddr);
    setCopied(true);
    setTimeout(()=>setCopied(false),1500);
  };

  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,
      padding:"1.5rem",transition:"transform 0.2s,box-shadow 0.2s",cursor:"default",
      position:"relative",overflow:"hidden"}}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform="none"}>

      {/* Network color bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,
        background:net?.color||T.blue,borderRadius:"20px 20px 0 0"}}/>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:10,
            background:`${net?.color||T.blue}18`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Wallet size={17} color={net?.color||T.blue}/>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:T.textPri,letterSpacing:"-0.01em"}}>{w.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:net?.color||T.blue}}/>
              <span style={{fontSize:11,color:T.textMut,fontWeight:600}}>{w.network}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {w.isEncrypted&&!decryptedAddress&&(
            <button onClick={onDecrypt}
              title="Decrypt address"
              style={{width:30,height:30,borderRadius:8,background:`${T.yellow}18`,
                border:`1px solid ${T.yellow}30`,cursor:"pointer",color:T.yellow,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Unlock size={12}/>
            </button>
          )}
          <button onClick={copy}
            style={{width:30,height:30,borderRadius:8,background:T.pill,
              border:`1px solid ${T.border}`,cursor:"pointer",
              color:copied?T.green:T.textMut,
              display:"flex",alignItems:"center",justifyContent:"center",transition:"color 0.2s"}}>
            {copied?<Check size={12}/>:<Copy size={12}/>}
          </button>
          <button onClick={onDelete}
            style={{width:30,height:30,borderRadius:8,background:`${T.red}0f`,
              border:`1px solid ${T.red}20`,cursor:"pointer",color:T.red,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Trash2 size={12}/>
          </button>
        </div>
      </div>

      {/* Balance */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:9,color:T.textMut,fontWeight:700,
          letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>Balance</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1.5rem",
          fontWeight:700,color:T.textPri,letterSpacing:"-0.03em"}}>
          ${w.balance.toLocaleString()}
        </div>
      </div>

      {/* Address */}
      <div style={{background:T.card2||"rgba(255,255,255,0.04)",borderRadius:10,
        padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:T.textSec,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>
          {w.isEncrypted&&!decryptedAddress ? (
            <span style={{display:"flex",alignItems:"center",gap:5}}>
              <Lock size={11} color={T.textMut}/> Encrypted
            </span>
          ) : shortAddr(displayAddr)||displayAddr}
        </span>
      </div>

      <div style={{fontSize:10,color:T.textMut,marginTop:10,fontWeight:500}}>
        Added {w.createdAt}
      </div>
    </div>
  );
}

// ── Bank Card ──────────────────────────────────────────────────────────────────
function BankCardComponent({ c, T, onDelete, onDecrypt, decryptedNumber }:{
  c:BankCard; T:ThemeType;
  onDelete:()=>void; onDecrypt:()=>void; decryptedNumber?:string;
}) {
  const isCredit = c.type==="credit";
  const used = isCredit&&c.limit ? (c.balance/c.limit)*100 : 0;

  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,
      padding:"1.5rem",transition:"transform 0.2s",
      position:"relative",overflow:"hidden"}}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform="none"}>

      <div style={{position:"absolute",top:0,left:0,right:0,height:3,
        background:isCredit?T.purple:T.green,borderRadius:"20px 20px 0 0"}}/>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:10,
            background:isCredit?`${T.purple}18`:`${T.green}18`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <CreditCard size={17} color={isCredit?T.purple:T.green}/>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:T.textPri}}>{c.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
              <span style={{fontSize:11,fontWeight:700,
                color:isCredit?T.purple:T.green,
                padding:"1px 6px",borderRadius:99,
                background:isCredit?`${T.purple}15`:`${T.green}15`}}>
                {c.type.toUpperCase()}
              </span>
              <span style={{fontSize:11,color:T.textMut}}>{c.bank}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {c.isEncrypted&&!decryptedNumber&&(
            <button onClick={onDecrypt}
              style={{width:30,height:30,borderRadius:8,background:`${T.yellow}18`,
                border:`1px solid ${T.yellow}30`,cursor:"pointer",color:T.yellow,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Unlock size={12}/>
            </button>
          )}
          <button onClick={onDelete}
            style={{width:30,height:30,borderRadius:8,background:`${T.red}0f`,
              border:`1px solid ${T.red}20`,cursor:"pointer",color:T.red,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Trash2 size={12}/>
          </button>
        </div>
      </div>

      <div style={{marginBottom:14}}>
        <div style={{fontSize:9,color:T.textMut,fontWeight:700,
          letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>
          {isCredit?"Balance Owed":"Balance"}
        </div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1.5rem",
          fontWeight:700,color:T.textPri,letterSpacing:"-0.03em"}}>
          ${c.balance.toLocaleString()}
        </div>
      </div>

      {/* Card number */}
      <div style={{background:T.card2||"rgba(255,255,255,0.04)",borderRadius:10,
        padding:"10px 12px",marginBottom:c.limit?12:0}}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:T.textSec}}>
          {c.isEncrypted&&!decryptedNumber?(
            <span style={{display:"flex",alignItems:"center",gap:5}}>
              <Lock size={11} color={T.textMut}/> Encrypted
            </span>
          ):decryptedNumber||c.number}
        </span>
      </div>

      {/* Credit limit bar */}
      {isCredit&&c.limit&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:10,color:T.textMut,fontWeight:600}}>Credit Used</span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,
              color:used>80?T.red:T.textSec,fontWeight:700}}>{used.toFixed(0)}%</span>
          </div>
          <div style={{height:4,background:T.pill,borderRadius:99}}>
            <div style={{height:"100%",borderRadius:99,
              background:used>80?T.red:used>50?T.yellow:T.green,
              width:`${used}%`,transition:"width 0.8s ease"}}/>
          </div>
          <div style={{fontSize:10,color:T.textMut,marginTop:4}}>
            ${(c.limit-c.balance).toLocaleString()} available of ${c.limit.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
function CardsPage() {
  const { mode, setMode } = useWeb3();
  const { setCurrentPage } = useAppSettings();
  const isWeb3 = mode==="web3";
  const [isDark, setIsDark] = useState(true);
  const T = isDark ? THEME.dark : THEME.light;

  useEffect(()=>{
    try{const s=localStorage.getItem("theme");setIsDark(s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches);}
    catch{setIsDark(true);}
  },[]);
  useEffect(()=>{setCurrentPage("cards");},[setCurrentPage]);

  // ── Wallets (DB-backed) ────────────────────────────────────────────────────
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [walletsLoaded, setWalletsLoaded] = useState(false);

  useEffect(()=>{
    fetch("/api/wallets")
      .then(r=>r.json())
      .then(data=>{if(Array.isArray(data))setWallets(data);})
      .catch(()=>{})
      .finally(()=>setWalletsLoaded(true));
  },[]);

  // ── Cards (local) ─────────────────────────────────────────────────────────
  const [cards, setCards] = useState<BankCard[]>([]);
  useEffect(()=>{
    try{const s=localStorage.getItem("korgon_cards");if(s)setCards(JSON.parse(s));}catch{}
  },[]);
  useEffect(()=>{
    try{localStorage.setItem("korgon_cards",JSON.stringify(cards));}catch{}
  },[cards]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name:"",address:"",network:"Ethereum",number:"",type:"debit" as "debit"|"credit",bank:"",limit:"",
  });

  const [showEncrypt, setShowEncrypt] = useState(false);
  const [encPass, setEncPass] = useState(""); const [encPassConfirm, setEncPassConfirm] = useState("");
  const [encError, setEncError] = useState(""); const [encLoading, setEncLoading] = useState(false);

  const [showDecrypt, setShowDecrypt] = useState(false);
  const [decPass, setDecPass] = useState(""); const [decError, setDecError] = useState("");
  const [decItemId, setDecItemId] = useState<string|null>(null); const [decLoading, setDecLoading] = useState(false);
  const [decryptedData, setDecryptedData] = useState<Record<string,string>>({});

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeletePass, setShowDeletePass] = useState(false);
  const [delId, setDelId] = useState<string|null>(null);
  const [delType, setDelType] = useState<"wallet"|"card"|null>(null);
  const [delName, setDelName] = useState("");
  const [delPass, setDelPass] = useState(""); const [delError, setDelError] = useState("");
  const [delLoading, setDelLoading] = useState(false);

  const [copied, setCopied] = useState<string|null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormData({name:"",address:"",network:"Ethereum",number:"",type:"debit",bank:"",limit:""});
    setShowAdd(true);
  };

  const handleAdd = () => {
    if(isWeb3){if(!formData.name||!formData.address)return;}
    else{if(!formData.name||!formData.number||!formData.bank)return;}
    setShowAdd(false); setEncPass(""); setEncPassConfirm(""); setEncError("");
    setShowEncrypt(true);
  };

  const handleEncryptConfirm = async () => {
    if(!encPass||!encPassConfirm){setEncError("Enter and confirm passcode");return;}
    if(encPass!==encPassConfirm){setEncError("Passcodes don't match");return;}
    if(encPass.length<4){setEncError("Min 4 characters");return;}
    setEncLoading(true);
    try{
      const hashed = await hashPasscode(encPass);
      if(isWeb3){
        const enc = await encryptData(formData.address, encPass);
        const nw:CryptoWallet = {
          id:uid(), name:formData.name, address:maskData(formData.address),
          network:formData.network, balance:0,
          createdAt:new Date().toISOString().slice(0,10),
          isEncrypted:true,
          encryptedData:{address:enc.encryptedData,iv:enc.iv,salt:enc.salt},
          passcode:hashed,
        };
        setWallets(p=>[...p,nw]);
        fetch("/api/wallets",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({name:nw.name,address:formData.address,network:nw.network,balance:0})
        }).catch(()=>{});
      } else {
        const enc = await encryptData(formData.number, encPass);
        const nc:BankCard = {
          id:uid(), name:formData.name, number:maskData(formData.number),
          type:formData.type, bank:formData.bank, balance:0,
          limit:formData.type==="credit"&&formData.limit?parseFloat(formData.limit):undefined,
          createdAt:new Date().toISOString().slice(0,10),
          isEncrypted:true,
          encryptedData:{number:enc.encryptedData,iv:enc.iv,salt:enc.salt},
          passcode:hashed,
        };
        setCards(p=>[...p,nc]);
      }
      setShowEncrypt(false);
      setEncPass(""); setEncPassConfirm("");
      setFormData({name:"",address:"",network:"Ethereum",number:"",type:"debit",bank:"",limit:""});
    }catch(e){setEncError(e instanceof Error?e.message:"Encryption failed");}
    finally{setEncLoading(false);}
  };

  const handleDecryptStart = (id:string) => {
    setDecItemId(id); setDecPass(""); setDecError(""); setShowDecrypt(true);
  };

  const handleDecryptConfirm = async () => {
    if(!decPass||!decItemId){setDecError("Enter passcode");return;}
    setDecLoading(true);
    try{
      const item = isWeb3?wallets.find(w=>w.id===decItemId):cards.find(c=>c.id===decItemId);
      if(!item?.encryptedData)throw new Error("Item not found");
      const key = isWeb3?"address":"number";
      const raw = (item.encryptedData as any)[key];
      const dec = await decryptData(raw,decPass,item.encryptedData.salt,item.encryptedData.iv);
      setDecryptedData(p=>({...p,[decItemId]:dec}));
      setShowDecrypt(false);
    }catch{setDecError("Incorrect passcode");}
    finally{setDecLoading(false);}
  };

  const requestDelete = (type:"wallet"|"card",id:string,name:string)=>{
    setDelId(id); setDelType(type); setDelName(name);
    setDelPass(""); setDelError(""); setShowDeleteConfirm(true);
  };

  const confirmDelete = ()=>{
    setShowDeleteConfirm(false);
    const item = delType==="wallet"?wallets.find(w=>w.id===delId):cards.find(c=>c.id===delId);
    if(item?.passcode){setShowDeletePass(true);return;}
    performDelete();
  };

  const performDelete = ()=>{
    if(delType==="wallet"){
      setWallets(p=>p.filter(w=>w.id!==delId));
      fetch(`/api/wallets/${delId}`,{method:"DELETE"}).catch(()=>{});
    } else {
      setCards(p=>p.filter(c=>c.id!==delId));
    }
    setShowDeleteConfirm(false); setShowDeletePass(false);
    setDelId(null); setDelType(null); setDelName("");
  };

  const handleDeletePassConfirm = async ()=>{
    if(!delPass){setDelError("Enter passcode");return;}
    setDelLoading(true);
    try{
      const item = delType==="wallet"?wallets.find(w=>w.id===delId):cards.find(c=>c.id===delId);
      if(!item?.passcode){performDelete();return;}
      const ok = await verifyPasscode(delPass,item.passcode);
      if(!ok){setDelError("Incorrect passcode");setDelLoading(false);return;}
      performDelete();
    }catch{setDelError("Verification failed");}
    finally{setDelLoading(false);}
  };

  const copyAddr = (addr:string,id:string)=>{
    navigator.clipboard.writeText(addr).catch(()=>{});
    setCopied(id); setTimeout(()=>setCopied(null),1500);
  };

  const totalBalance = isWeb3
    ? wallets.reduce((s,w)=>s+w.balance,0)
    : cards.reduce((s,c)=>s+c.balance,0);

  const inp:React.CSSProperties = {width:"100%",padding:"10px 14px",
    background:T.pill,border:`1px solid ${T.border}`,borderRadius:10,
    color:T.textPri,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  const lbl:React.CSSProperties = {display:"block",fontSize:10,color:T.textMut,fontWeight:700,
    letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:5};

  return (
    <MasterPasscodeGuard isDark={isDark}>
      <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${T.bg};color:${T.textPri}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes popIn{from{opacity:0;transform:scale(0.93) translateY(14px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
        input::placeholder{color:${T.textMut}}
        option{background:${T.card};color:${T.textPri}}
        select{appearance:none;-webkit-appearance:none;}
      `}</style>

      <div style={{display:"flex",minHeight:"100vh",background:T.bg,
        fontFamily:"'Outfit','Segoe UI',sans-serif",color:T.textPri}}>

        <Sidebar isDark={isDark} setIsDark={setIsDark}/>

        <div style={{marginLeft:230,flex:1,display:"flex",flexDirection:"column"}}>

          {/* TOP BAR */}
          <div style={{padding:"1rem 2rem",display:"flex",alignItems:"center",
            justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,
            background:isDark?"rgba(8,8,8,0.85)":"rgba(242,242,240,0.9)",
            backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:40}}>
            <div>
              <div style={{fontSize:10,color:T.textMut,fontWeight:700,
                letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>
                {isWeb3?"Crypto":"Finance"}
              </div>
              <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.03em"}}>
                {isWeb3?"Wallets":"Cards"}
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {/* Web2/3 switch */}
              <div style={{display:"flex",background:T.pill,borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
                {(["web2","web3"] as const).map(m=>(
                  <button key={m} onClick={()=>setMode(m)} style={{
                    padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",
                    fontFamily:"inherit",fontSize:11,fontWeight:700,
                    background:(isWeb3?"web3":"web2")===m?T.yellow:"transparent",
                    color:(isWeb3?"web3":"web2")===m?"#000":T.textMut,transition:"all 0.15s",
                  }}>{m.toUpperCase()}</button>
                ))}
              </div>
              <button onClick={openAdd}
                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 18px",
                  borderRadius:99,background:T.yellow,border:"none",
                  color:"#000",fontSize:11,fontWeight:900,cursor:"pointer",
                  fontFamily:"inherit",boxShadow:`0 4px 14px ${T.yellow}40`}}>
                <Plus size={13}/> Add {isWeb3?"Wallet":"Card"}
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{padding:"1.5rem 2rem 4rem",flex:1,animation:"slideUp 0.4s ease"}}>

            {/* Summary card */}
            <div style={{background:isWeb3?T.green:T.yellow,borderRadius:20,
              padding:"1.5rem",marginBottom:"1.5rem",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",
                  textTransform:"uppercase",color:"rgba(0,0,0,0.45)",marginBottom:6}}>
                  Total {isWeb3?"Portfolio":"Balance"}
                </div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"2.5rem",
                  fontWeight:700,color:"#000",letterSpacing:"-0.04em",lineHeight:1}}>
                  ${totalBalance.toLocaleString()}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(0,0,0,0.45)",marginBottom:4}}>
                  {isWeb3?"Wallets":"Cards"} Connected
                </div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"2rem",
                  fontWeight:700,color:"#000"}}>
                  {isWeb3?wallets.length:cards.length}
                </div>
              </div>
            </div>

            {/* Grid */}
            {isWeb3?(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1rem"}}>
                {wallets.map(w=>(
                  <WalletCard key={w.id} w={w} T={T} isDark={isDark}
                    onDelete={()=>requestDelete("wallet",w.id,w.name)}
                    onCopy={addr=>copyAddr(addr,w.id)}
                    onDecrypt={()=>handleDecryptStart(w.id)}
                    decryptedAddress={decryptedData[w.id]}/>
                ))}
                {wallets.length===0&&walletsLoaded&&(
                  <div style={{gridColumn:"1/-1",padding:"4rem",textAlign:"center",
                    background:T.card,borderRadius:20,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:36,marginBottom:12,opacity:0.2}}>👛</div>
                    <div style={{color:T.textMut,fontSize:14,marginBottom:12}}>No wallets yet</div>
                    <button onClick={openAdd}
                      style={{padding:"10px 24px",borderRadius:99,background:T.yellow,
                        border:"none",color:"#000",cursor:"pointer",
                        fontWeight:800,fontSize:13,fontFamily:"inherit"}}>
                      Add Wallet →
                    </button>
                  </div>
                )}
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1rem"}}>
                {cards.map(c=>(
                  <BankCardComponent key={c.id} c={c} T={T}
                    onDelete={()=>requestDelete("card",c.id,c.name)}
                    onDecrypt={()=>handleDecryptStart(c.id)}
                    decryptedNumber={decryptedData[c.id]}/>
                ))}
                {cards.length===0&&(
                  <div style={{gridColumn:"1/-1",padding:"4rem",textAlign:"center",
                    background:T.card,borderRadius:20,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:36,marginBottom:12,opacity:0.2}}>💳</div>
                    <div style={{color:T.textMut,fontSize:14,marginBottom:12}}>No cards yet</div>
                    <button onClick={openAdd}
                      style={{padding:"10px 24px",borderRadius:99,background:T.yellow,
                        border:"none",color:"#000",cursor:"pointer",
                        fontWeight:800,fontSize:13,fontFamily:"inherit"}}>
                      Add Card →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ADD MODAL ── */}
      {showAdd&&(
        <Modal onClose={()=>setShowAdd(false)} T={T}>
          <ModalHeader
            title={isWeb3?"Add Wallet":"Add Card"}
            subtitle={isWeb3?"Your address will be encrypted":"Card details are encrypted locally"}
            onClose={()=>setShowAdd(false)} T={T}/>
          <div style={{display:"grid",gap:14}}>
            <div>
              <label style={lbl}>Name</label>
              <input style={inp} value={formData.name} placeholder={isWeb3?"e.g. My Main Wallet":"e.g. Chase Checking"}
                onChange={e=>setFormData(f=>({...f,name:e.target.value}))}/>
            </div>
            {isWeb3?(
              <>
                <div>
                  <label style={lbl}>Wallet Address</label>
                  <input style={inp} value={formData.address} placeholder="0x..."
                    onChange={e=>setFormData(f=>({...f,address:e.target.value}))}/>
                </div>
                <div>
                  <label style={lbl}>Network</label>
                  <select value={formData.network}
                    onChange={e=>setFormData(f=>({...f,network:e.target.value}))}
                    style={{...inp,cursor:"pointer"}}>
                    {NETWORKS.map(n=><option key={n.name} value={n.name}>{n.name}</option>)}
                  </select>
                </div>
              </>
            ):(
              <>
                <div>
                  <label style={lbl}>Card Number (last 4)</label>
                  <input style={inp} value={formData.number} placeholder="****1234"
                    onChange={e=>setFormData(f=>({...f,number:e.target.value}))}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <label style={lbl}>Bank</label>
                    <input style={inp} value={formData.bank} placeholder="e.g. Chase"
                      onChange={e=>setFormData(f=>({...f,bank:e.target.value}))}/>
                  </div>
                  <div>
                    <label style={lbl}>Type</label>
                    <select value={formData.type}
                      onChange={e=>setFormData(f=>({...f,type:e.target.value as any}))}
                      style={{...inp,cursor:"pointer"}}>
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                </div>
                {formData.type==="credit"&&(
                  <div>
                    <label style={lbl}>Credit Limit (optional)</label>
                    <input type="number" style={inp} value={formData.limit} placeholder="15000"
                      onChange={e=>setFormData(f=>({...f,limit:e.target.value}))}/>
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
            <button onClick={()=>setShowAdd(false)}
              style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,
                borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,
                fontFamily:"inherit",fontWeight:600}}>Cancel</button>
            <button onClick={handleAdd}
              style={{flex:2,padding:"11px",background:T.yellow,border:"none",
                borderRadius:12,color:"#000",cursor:"pointer",fontSize:13,
                fontWeight:900,fontFamily:"inherit"}}>
              Next — Set Passcode →
            </button>
          </div>
        </Modal>
      )}

      {/* ── ENCRYPT MODAL ── */}
      {showEncrypt&&(
        <Modal onClose={()=>setShowEncrypt(false)} T={T}>
          <ModalHeader title="Encrypt with Passcode"
            subtitle="Set a passcode to protect your sensitive data"
            onClose={()=>setShowEncrypt(false)} T={T}/>
          <div style={{padding:"12px 16px",borderRadius:12,background:`${T.yellow}10`,
            border:`1px solid ${T.yellow}25`,marginBottom:16,
            display:"flex",alignItems:"center",gap:10}}>
            <Shield size={14} color={T.yellow}/>
            <span style={{fontSize:12,color:T.textSec}}>
              Your {isWeb3?"wallet address":"card number"} will be encrypted. You'll need this passcode to view it.
            </span>
          </div>
          <div style={{display:"grid",gap:12}}>
            <div>
              <label style={lbl}>Passcode (min 4 digits)</label>
              <input type="password" style={inp} value={encPass} placeholder="••••••"
                onChange={e=>setEncPass(e.target.value)} inputMode="numeric"/>
            </div>
            <div>
              <label style={lbl}>Confirm Passcode</label>
              <input type="password" style={inp} value={encPassConfirm} placeholder="••••••"
                onChange={e=>setEncPassConfirm(e.target.value)} inputMode="numeric"/>
            </div>
            {encError&&(
              <div style={{display:"flex",alignItems:"center",gap:6,color:T.red,fontSize:12,fontWeight:600}}>
                <AlertCircle size={13}/>{encError}
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
            <button onClick={()=>{setShowEncrypt(false);setShowAdd(true);}}
              style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,
                borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>
              Back
            </button>
            <button onClick={handleEncryptConfirm} disabled={encLoading}
              style={{flex:2,padding:"11px",background:T.yellow,border:"none",
                borderRadius:12,color:"#000",cursor:encLoading?"not-allowed":"pointer",
                fontSize:13,fontWeight:900,fontFamily:"inherit",opacity:encLoading?0.7:1}}>
              {encLoading?"Encrypting…":"Save & Encrypt ✓"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── DECRYPT MODAL ── */}
      {showDecrypt&&(
        <Modal onClose={()=>setShowDecrypt(false)} T={T}>
          <ModalHeader title="Enter Passcode"
            subtitle="Enter your passcode to reveal the encrypted data"
            onClose={()=>setShowDecrypt(false)} T={T}/>
          <div style={{display:"grid",gap:12}}>
            <div>
              <label style={lbl}>Passcode</label>
              <input type="password" style={inp} value={decPass} placeholder="Enter passcode"
                onChange={e=>setDecPass(e.target.value)} inputMode="numeric"
                autoFocus/>
            </div>
            {decError&&(
              <div style={{display:"flex",alignItems:"center",gap:6,color:T.red,fontSize:12,fontWeight:600}}>
                <AlertCircle size={13}/>{decError}
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
            <button onClick={()=>setShowDecrypt(false)}
              style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,
                borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>
              Cancel
            </button>
            <button onClick={handleDecryptConfirm} disabled={decLoading}
              style={{flex:2,padding:"11px",background:T.yellow,border:"none",
                borderRadius:12,color:"#000",cursor:decLoading?"not-allowed":"pointer",
                fontSize:13,fontWeight:900,fontFamily:"inherit"}}>
              {decLoading?"Decrypting…":"Reveal ✓"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── DELETE CONFIRM ── */}
      {showDeleteConfirm&&(
        <Modal onClose={()=>setShowDeleteConfirm(false)} T={T}>
          <div style={{textAlign:"center"}}>
            <div style={{width:52,height:52,borderRadius:14,background:`${T.red}15`,
              display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem"}}>
              <Trash2 size={22} color={T.red}/>
            </div>
            <div style={{fontSize:17,fontWeight:900,marginBottom:8,letterSpacing:"-0.02em"}}>
              Delete "{delName}"?
            </div>
            <div style={{fontSize:13,color:T.textMut,marginBottom:"1.5rem",lineHeight:1.6}}>
              This {delType} will be permanently removed.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowDeleteConfirm(false)}
                style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,
                  borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>
                Cancel
              </button>
              <button onClick={confirmDelete}
                style={{flex:1,padding:"11px",background:T.red,border:"none",
                  borderRadius:12,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:900,fontFamily:"inherit"}}>
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── DELETE PASSCODE ── */}
      {showDeletePass&&(
        <Modal onClose={()=>setShowDeletePass(false)} T={T}>
          <ModalHeader title="Confirm Delete"
            subtitle="This item is encrypted — enter its passcode to delete"
            onClose={()=>setShowDeletePass(false)} T={T}/>
          <div style={{display:"grid",gap:12}}>
            <div>
              <label style={lbl}>Item Passcode</label>
              <input type="password" style={inp} value={delPass} placeholder="Enter passcode"
                onChange={e=>setDelPass(e.target.value)} inputMode="numeric" autoFocus/>
            </div>
            {delError&&(
              <div style={{display:"flex",alignItems:"center",gap:6,color:T.red,fontSize:12,fontWeight:600}}>
                <AlertCircle size={13}/>{delError}
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
            <button onClick={()=>setShowDeletePass(false)}
              style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,
                borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>
              Cancel
            </button>
            <button onClick={handleDeletePassConfirm} disabled={delLoading}
              style={{flex:2,padding:"11px",background:T.red,border:"none",
                borderRadius:12,color:"#fff",cursor:delLoading?"not-allowed":"pointer",
                fontSize:13,fontWeight:900,fontFamily:"inherit"}}>
              {delLoading?"Verifying…":"Confirm Delete"}
            </button>
          </div>
        </Modal>
      )}
      </>
    </MasterPasscodeGuard>
  );
}

export default CardsPage;