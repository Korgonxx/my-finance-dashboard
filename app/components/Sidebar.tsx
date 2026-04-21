"use client";
import { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useAppSettings, CURRENCY_SYMBOLS, type Currency } from "../context/AppSettingsContext";
import {
  LayoutDashboard, CreditCard, BarChart2, Wallet,
  Sun, Moon, Eye, EyeOff, ChevronRight,
  Shield, X, Check, Lock,
} from "lucide-react";

export const THEME = {
  dark: {
    bg: "#0c0c0c", sidebar: "rgba(18,18,18,0.95)", card: "#161616", card2: "#1e1e1e",
    border: "rgba(255,255,255,0.08)", borderHov: "rgba(255,255,255,0.15)",
    yellow: "#fef08a", green: "#bbf7d0", red: "#fecaca", blue: "#bfdbfe", purple: "#ddd6fe",
    white: "#ffffff", textPri: "#f8fafc", textSec: "#94a3b8", textMut: "#475569",
    pill: "rgba(255,255,255,0.05)", pillHov: "rgba(255,255,255,0.1)", glow: "rgba(254,240,138,0.1)",
  },
  light: {
    bg: "#f8f9fa", sidebar: "#ffffff", card: "#ffffff", card2: "#f1f5f9",
    border: "rgba(0,0,0,0.06)", borderHov: "rgba(0,0,0,0.1)",
    yellow: "#fef08a", green: "#bbf7d0", red: "#fecaca", blue: "#bfdbfe", purple: "#ddd6fe",
    white: "#000000", textPri: "#1e293b", textSec: "#64748b", textMut: "#94a3b8",
    pill: "rgba(0,0,0,0.03)", pillHov: "rgba(0,0,0,0.06)", glow: "rgba(0,0,0,0.02)",
  },
};
export type ThemeType = typeof THEME.dark;

// ── Passcode Modal ─────────────────────────────────────────────────────────────
function PasscodeModal({ T, onClose }: { T: ThemeType; onClose: () => void }) {
  const { verifyAppPasscode, changeAppPasscode } = useAppSettings();
  const [step, setStep] = useState<"menu"|"verify"|"new"|"confirm">("menu");
  const [current, setCurrent] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeVal = step==="verify" ? current : step==="new" ? newCode : confirmCode;
  const setActiveVal = (v: string) => {
    if (step==="verify") setCurrent(v);
    else if (step==="new") setNewCode(v);
    else setConfirmCode(v);
  };

  const numpad = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  const handleNum = (n: string) => {
    if (!n) return;
    if (n==="⌫") { setActiveVal(activeVal.slice(0,-1)); setError(""); return; }
    if (activeVal.length >= 6) return;
    setActiveVal(activeVal + n);
    setError("");
  };

  const handleNext = async () => {
    if (step==="menu") { setStep("verify"); setCurrent(""); setError(""); return; }
    if (step==="verify") {
      const ok = verifyAppPasscode(current);
      if (!ok) { setError("Incorrect passcode"); setCurrent(""); return; }
      setStep("new"); setNewCode(""); setError("");
    } else if (step==="new") {
      if (newCode.length < 4) { setError("Min 4 digits"); return; }
      setStep("confirm"); setConfirmCode(""); setError("");
    } else if (step==="confirm") {
      if (newCode !== confirmCode) { setError("Codes don't match"); setConfirmCode(""); setStep("new"); setNewCode(""); return; }
      // Pad to 6 digits if needed
      const finalCode = newCode.length === 6 ? newCode : newCode.padEnd(6, "0");
      const ok = await changeAppPasscode(current, finalCode);
      if (ok) {
        setSuccess("Passcode changed!"); setStep("menu");
        setTimeout(() => { setSuccess(""); onClose(); }, 1500);
      } else {
        setError("Failed — use exactly 6 digits"); setStep("new"); setNewCode("");
      }
    }
  };

  useEffect(() => {
    if (activeVal.length === 6 && step !== "menu") setTimeout(handleNext, 150);
  }, [activeVal]);

  const dots = (val: string) => Array.from({length:6}).map((_,i) => (
    <div key={i} style={{
      width:10, height:10, borderRadius:"50%", transition:"all 0.15s",
      background: i < val.length ? T.yellow : T.border,
      transform: i < val.length ? "scale(1.3)" : "scale(1)",
    }}/>
  ));

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.75)",
      backdropFilter:"blur(20px)",display:"flex",alignItems:"center",
      justifyContent:"center",padding:"1rem",fontFamily:"'Outfit','Segoe UI',sans-serif"}}>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.9) translateY(16px)}to{opacity:1;transform:none}} .np-btn{transition:all 0.12s;cursor:pointer;} .np-btn:hover{filter:brightness(1.3);} .np-btn:active{transform:scale(0.92)!important;}`}</style>
      <div style={{width:"100%",maxWidth:340,background:T.card,border:`1px solid ${T.border}`,
        borderRadius:28,padding:"1.75rem",animation:"popIn 0.25s ease",
        boxShadow:"0 40px 80px rgba(0,0,0,0.6)"}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:`${T.yellow}18`,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Shield size={16} color={T.yellow}/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:800,letterSpacing:"-0.02em",color:T.textPri}}>App Passcode</div>
              <div style={{fontSize:10,color:T.textMut}}>Default: 888888</div>
            </div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,background:T.pill,
            border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",
            alignItems:"center",justifyContent:"center",color:T.textMut}}>
            <X size={13}/>
          </button>
        </div>

        {success && (
          <div style={{padding:"10px 16px",borderRadius:12,background:`${T.green}15`,
            border:`1px solid ${T.green}30`,color:T.green,fontSize:13,fontWeight:700,
            marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
            <Check size={14}/>{success}
          </div>
        )}

        {step==="menu" && !success && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontSize:13,color:T.textSec,marginBottom:4,lineHeight:1.6}}>
              Change your 6-digit app passcode. You'll need your current passcode first.
            </div>
            <button onClick={()=>{setStep("verify");setCurrent("");setError("");}}
              style={{width:"100%",padding:"13px 16px",borderRadius:14,
                background:T.pill,border:`1px solid ${T.border}`,color:T.textPri,
                fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Lock size={14} color={T.yellow}/>Change Passcode
              </div>
              <ChevronRight size={13} color={T.textMut}/>
            </button>
          </div>
        )}

        {step !== "menu" && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
            <div style={{fontSize:13,color:T.textSec,fontWeight:600,textAlign:"center"}}>
              {step==="verify"&&"Enter current passcode"}
              {step==="new"&&"Enter new passcode (6 digits)"}
              {step==="confirm"&&"Confirm new passcode"}
            </div>
            <div style={{display:"flex",gap:10}}>{dots(activeVal)}</div>
            {error&&(
              <div style={{fontSize:12,color:T.red,fontWeight:700,padding:"5px 14px",
                borderRadius:99,background:`${T.red}12`,border:`1px solid ${T.red}25`}}>
                {error}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,width:"100%"}}>
              {numpad.map((n,i)=>(
                <button key={i} onClick={()=>n&&handleNum(n)} className="np-btn"
                  style={{height:52,borderRadius:12,fontFamily:"'DM Mono',monospace",
                    fontSize:n==="⌫"?16:19,fontWeight:700,
                    background:n==="⌫"?`${T.red}0f`:n===""?"transparent":T.pill,
                    border:n===""?"none":`1px solid ${n==="⌫"?T.red+"22":T.border}`,
                    color:n==="⌫"?T.red:T.textPri,
                    cursor:n?"pointer":"default",visibility:n===""?"hidden":"visible"}}>
                  {n}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,width:"100%"}}>
              <button onClick={()=>{
                if(step==="verify"){setStep("menu");}
                else if(step==="new"){setStep("verify");setNewCode("");}
                else{setStep("new");setConfirmCode("");}
                setError("");
              }} style={{flex:1,padding:"11px",borderRadius:12,background:T.pill,
                border:`1px solid ${T.border}`,color:T.textSec,fontSize:12,
                fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                Back
              </button>
              <button onClick={handleNext} disabled={activeVal.length<4}
                style={{flex:2,padding:"11px",borderRadius:12,border:"none",
                  background:activeVal.length>=4?T.yellow:T.pill,
                  color:activeVal.length>=4?"#000":T.textMut,
                  fontSize:12,fontWeight:800,
                  cursor:activeVal.length>=4?"pointer":"not-allowed",
                  fontFamily:"inherit",transition:"all 0.2s",
                  boxShadow:activeVal.length>=4?`0 4px 14px ${T.yellow}35`:"none"}}>
                {step==="verify"?"Next →":step==="new"?"Next →":"Set Passcode ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function Sidebar({ isDark, setIsDark }: { isDark: boolean; setIsDark: (v: boolean) => void }) {
  const { isWeb3, setMode } = useWeb3();
  const { currency, setCurrency, hideBalances, setHideBalances } = useAppSettings();
  const [passcodeModal, setPasscodeModal] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  // ── KEY FIX: delay isWeb3-dependent rendering until after hydration ──
  const [hydrated, setHydrated] = useState(false);

  const T = isDark ? THEME.dark : THEME.light;

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    setHydrated(true);
  }, []);

  const currencies: Currency[] = ["USD","EUR","GBP","INR","JPY","AUD","CAD","CHF"];

  // Use stable values on server, real values after hydration
  // Check document class for initial mode to prevent jitter
  const initialMode = typeof document !== 'undefined' && document.documentElement.classList.contains('web3-mode') ? 'crypto' : 'banks';
  const currentMode = hydrated ? (isWeb3 ? "crypto" : "banks") : initialMode;
  const cardIcon = hydrated && isWeb3 ? Wallet : CreditCard;
  const cardLabel = hydrated && isWeb3 ? "Wallets" : "Cards";

  const navLinks = [
    { href: "/",            icon: LayoutDashboard, label: "Dashboard" },
    { href: "/cards",       icon: cardIcon,        label: cardLabel   },
    { href: "/performance", icon: BarChart2,        label: "Performance" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800;900&display=swap');
        .nav-link{transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1)!important;text-decoration:none!important;}
        .nav-link:hover{background:${T.pillHov}!important;transform:scale(1.05);}
        .sb-btn{transition:all 0.15s;}
        .sb-btn:hover{background:${T.pillHov}!important;}
      `}</style>

      <aside style={{width:80,minHeight:"100vh",background:T.sidebar,
        borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",
        alignItems:"center",position:"fixed",left:0,top:0,bottom:0,zIndex:50,
        padding:"1.5rem 0",fontFamily:"'Outfit','Segoe UI',sans-serif"}}>

        {/* Logo */}
        <div style={{marginBottom:"2rem"}}>
          <div style={{width:42,height:42,borderRadius:14,
            background:`linear-gradient(135deg,${T.yellow},${T.yellow}bb)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:900,fontSize:18,color:"#000",
            boxShadow:`0 4px 16px ${T.yellow}40`}}>K</div>
        </div>

        {/* Navigation */}
        <nav style={{display:"flex",flexDirection:"column",gap:12,flex:1}}>
          {navLinks.map(link => {
            const active = currentPath === link.href;
            return (
              <a key={link.href} href={link.href} className="nav-link"
                title={link.label}
                style={{width:48,height:48,borderRadius:16,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:active?"#000":T.textSec,
                  background:active?T.yellow:"transparent",
                  boxShadow:active?`0 8px 20px ${T.yellow}30`:"none"}}>
                <link.icon size={20} strokeWidth={active?2.5:2}/>
              </a>
            );
          })}
        </nav>

        {/* Preferences / Bottom Actions */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <button onClick={()=>setIsDark(!isDark)} className="nav-link"
            style={{width:48,height:48,borderRadius:16,display:"flex",
              alignItems:"center",justifyContent:"center",background:T.pill,
              border:"none",cursor:"pointer",color:T.textSec}}>
            {isDark?<Moon size={20}/>:<Sun size={20}/>}
          </button>
          <button onClick={()=>setPasscodeModal(true)} className="nav-link"
            style={{width:48,height:48,borderRadius:16,display:"flex",
              alignItems:"center",justifyContent:"center",background:T.pill,
              border:"none",cursor:"pointer",color:T.textSec}}>
            <Shield size={20}/>
          </button>
        </div>
      </aside>

      {passcodeModal&&<PasscodeModal T={T} onClose={()=>setPasscodeModal(false)}/>}
    </>
  );
}