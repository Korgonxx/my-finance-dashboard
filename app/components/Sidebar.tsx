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
    bg: "#080808", sidebar: "rgba(14,14,14,0.88)", card: "#111111", card2: "#181818",
    border: "rgba(255,255,255,0.07)", borderHov: "rgba(255,255,255,0.12)",
    yellow: "#f5ff5e", green: "#0df5a0", red: "#ff3d6b", blue: "#58b4ff", purple: "#a78bfa",
    white: "#ffffff", textPri: "#ffffff", textSec: "rgba(255,255,255,0.55)", textMut: "rgba(255,255,255,0.22)",
    pill: "rgba(255,255,255,0.06)", pillHov: "rgba(255,255,255,0.1)", glow: "rgba(245,255,94,0.08)",
  },
  light: {
    bg: "#f2f2f0", sidebar: "rgba(255,255,255,0.8)", card: "#ffffff", card2: "#f7f7f5",
    border: "rgba(0,0,0,0.07)", borderHov: "rgba(0,0,0,0.12)",
    yellow: "#d4a017", green: "#00875a", red: "#d92b3a", blue: "#1d6fa4", purple: "#7c3aed",
    white: "#000000", textPri: "#0a0a0a", textSec: "rgba(0,0,0,0.5)", textMut: "rgba(0,0,0,0.28)",
    pill: "rgba(0,0,0,0.04)", pillHov: "rgba(0,0,0,0.07)", glow: "rgba(0,0,0,0.02)",
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

  const handleNext = () => {
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
      const ok = changeAppPasscode(current, finalCode);
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
  const currentMode = hydrated ? (isWeb3 ? "web3" : "web2") : "web2";
  const cardIcon = hydrated && isWeb3 ? Wallet : CreditCard;
  const cardLabel = hydrated && isWeb3 ? "Wallets" : "Cards";

  const navLinks = [
    { href: "/",            icon: LayoutDashboard, label: "Dashboard" },
    { href: "/cards",       icon: cardIcon,        label: cardLabel   },
    { href: "/performance", icon: BarChart2,        label: "Performance" },
  ];

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{
      width:34,height:19,borderRadius:99,border:"none",cursor:"pointer",
      background:value?T.yellow:T.pill,position:"relative",transition:"background 0.2s",
      boxShadow:value?`0 2px 8px ${T.yellow}40`:"none",flexShrink:0,
    }}>
      <div style={{width:13,height:13,borderRadius:99,background:value?"#000":T.textMut,
        position:"absolute",top:3,left:value?18:3,transition:"left 0.2s"}}/>
    </button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800;900&display=swap');
        .nav-link{transition:all 0.18s!important;text-decoration:none!important;}
        .nav-link:hover{background:${T.pillHov}!important;color:${T.textPri}!important;}
        .sb-btn{transition:all 0.15s;}
        .sb-btn:hover{background:${T.pillHov}!important;}
        select option{background:${T.card};color:${T.textPri};}
      `}</style>

      <aside style={{width:230,minHeight:"100vh",background:T.sidebar,
        backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",
        borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",
        position:"fixed",left:0,top:0,bottom:0,zIndex:50,
        fontFamily:"'Outfit','Segoe UI',sans-serif"}}>

        {/* Logo */}
        <div style={{padding:"1.5rem 1.25rem 1.25rem",borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:11,
              background:`linear-gradient(135deg,${T.yellow},${T.yellow}bb)`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontWeight:900,fontSize:17,color:"#000",
              boxShadow:`0 4px 16px ${T.yellow}40`}}>K</div>
            <div>
              <div style={{fontWeight:900,fontSize:15,letterSpacing:"-0.03em",color:T.textPri}}>Korgon</div>
              <div style={{fontSize:9,color:T.textMut,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase"}}>Finance</div>
            </div>
          </div>
        </div>

        {/* Mode toggle — suppressed until hydrated */}
        <div style={{padding:"1rem 1.25rem 0.5rem"}}>
          <div style={{fontSize:9,color:T.textMut,fontWeight:700,letterSpacing:"0.1em",
            textTransform:"uppercase",marginBottom:7}}>Mode</div>
          <div style={{display:"flex",background:T.pill,borderRadius:10,padding:3,border:`1px solid ${T.border}`}}
            suppressHydrationWarning>
            {(["web2","web3"] as const).map(m => {
              const active = hydrated ? currentMode === m : m === "web2";
              return (
                <button key={m} onClick={()=>setMode(m)}
                  suppressHydrationWarning
                  style={{flex:1,padding:"7px 0",borderRadius:7,border:"none",cursor:"pointer",
                    fontFamily:"inherit",fontSize:11,fontWeight:700,transition:"all 0.2s",
                    background:active?T.yellow:"transparent",
                    color:active?"#000":T.textMut,
                    boxShadow:active?`0 2px 8px ${T.yellow}30`:"none"}}>
                  {m.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{padding:"0.5rem 0.75rem",flex:1}}>
          <div style={{fontSize:9,color:T.textMut,fontWeight:700,letterSpacing:"0.1em",
            textTransform:"uppercase",padding:"0.5rem 0.5rem 0.75rem"}}>Navigation</div>
          {navLinks.map(link => {
            const active = currentPath === link.href;
            return (
              <a key={link.href} href={link.href} className="nav-link"
                suppressHydrationWarning
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                  borderRadius:12,marginBottom:3,
                  color:active?"#000":T.textSec,
                  background:active?T.yellow:"transparent",
                  fontSize:13,fontWeight:600,
                  boxShadow:active?`0 4px 16px ${T.yellow}35`:"none"}}>
                <div style={{width:28,height:28,borderRadius:7,
                  background:active?"rgba(0,0,0,0.12)":T.pill,
                  display:"flex",alignItems:"center",justifyContent:"center"}}
                  suppressHydrationWarning>
                  <link.icon size={14} color={active?"#000":T.textSec}/>
                </div>
                {link.label}
                {active&&<ChevronRight size={12} style={{marginLeft:"auto"}} color="rgba(0,0,0,0.4)"/>}
              </a>
            );
          })}
        </nav>

        {/* Preferences */}
        <div style={{padding:"0.75rem 1.25rem",borderTop:`1px solid ${T.border}`}}>
          <div style={{fontSize:9,color:T.textMut,fontWeight:700,letterSpacing:"0.1em",
            textTransform:"uppercase",marginBottom:12}}>Preferences</div>
          {[
            {icon:isDark?<Moon size={12} color={T.textMut}/>:<Sun size={12} color={T.textMut}/>,
             label:"Dark Mode",value:isDark,onChange:()=>setIsDark(!isDark)},
            {icon:hideBalances?<EyeOff size={12} color={T.textMut}/>:<Eye size={12} color={T.textMut}/>,
             label:"Hide Balances",value:hideBalances,onChange:()=>setHideBalances(!hideBalances)},
          ].map(item=>(
            <div key={item.label} style={{display:"flex",alignItems:"center",
              justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                {item.icon}
                <span style={{fontSize:12,color:T.textSec,fontWeight:600}}>{item.label}</span>
              </div>
              <Toggle value={item.value} onChange={item.onChange}/>
            </div>
          ))}
          <div style={{marginTop:4}}>
            <div style={{fontSize:9,color:T.textMut,fontWeight:700,letterSpacing:"0.1em",
              textTransform:"uppercase",marginBottom:6}}>Currency</div>
            <select value={currency} onChange={e=>setCurrency(e.target.value as Currency)}
              style={{width:"100%",padding:"8px 10px",background:T.pill,
                border:`1px solid ${T.border}`,borderRadius:8,color:T.textPri,
                fontSize:12,fontFamily:"inherit",outline:"none",cursor:"pointer",
                WebkitAppearance:"none" as any}}>
              {currencies.map(c=><option key={c} value={c}>{c} {CURRENCY_SYMBOLS[c]}</option>)}
            </select>
          </div>
        </div>

        {/* Passcode */}
        <div style={{padding:"0.75rem",borderTop:`1px solid ${T.border}`}}>
          <button onClick={()=>setPasscodeModal(true)} className="sb-btn"
            style={{width:"100%",padding:"10px",borderRadius:10,background:T.pill,
              border:`1px solid ${T.border}`,color:T.textSec,fontSize:11,fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",
              display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            <Shield size={12}/> Change Passcode
          </button>
        </div>
      </aside>

      {passcodeModal&&<PasscodeModal T={T} onClose={()=>setPasscodeModal(false)}/>}
    </>
  );
}