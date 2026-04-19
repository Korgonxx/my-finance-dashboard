
"use client";
import { useEffect, useState } from "react";
import { Copy, Zap, X } from "lucide-react";
import { type ThemeType } from "./Sidebar"; // Import the shared ThemeType

interface CloudSyncModalProps {
  onClose: () => void;
  T: ThemeType;
}

// This is a simplified, non-functional version for UI display.
// A real implementation would require a backend and more complex state management.
export function CloudSyncModal({ onClose, T }: CloudSyncModalProps) {
  const [draftId, setDraftId] = useState("demo-sync-id-123");
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(draftId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleAction = (action: string) => {
    setLoading(true);
    setMessage("");
    setTimeout(() => {
      setLoading(false);
      setMessage(`${action} successful!`);
      setTimeout(() => setMessage(""), 2000);
    }, 1500);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,
      backdropFilter:"blur(12px)",padding:"1rem",animation:"fadeIn 0.2s"}}>
      <div style={{width:"100%",maxWidth:480,background:T.card,
        border:`1px solid ${T.border}`,borderRadius:32,padding:"2.5rem",
        animation:"popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",boxShadow:"0 30px 60px rgba(0,0,0,0.12)"}}>
        
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"2rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:48,height:48,borderRadius:16,background:`${T.blue}20`,display:"flex",alignItems:"center",justifyContent:"center",color:T.blue}}>
              <Zap size={24}/>
            </div>
            <div>
              <h2 style={{margin:0,color:T.textPri,fontSize:22,fontWeight:800,letterSpacing:"-0.03em"}}>Cloud Sync</h2>
              <p style={{margin:"4px 0 0",color:T.textSec,fontSize:13}}>Sync data across your devices.</p>
            </div>
          </div>
          <button onClick={onClose} style={{width:40,height:40,borderRadius:12,background:T.pill,
            border:"none",cursor:"pointer",color:T.textSec,
            display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
            <X size={18}/>
          </button>
        </div>

        <div style={{display:"grid",gap:18}}>
          <div>
            <label style={{fontSize:11,color:T.textSec,fontWeight:700,letterSpacing:"0.02em",marginBottom:8,display:"block",marginLeft:4}}>Your Sync ID</label>
            <div style={{display:"flex",gap:8}}>
              <input value={draftId} readOnly style={{flex:1,width:"100%",border:`1px solid ${T.border}`,borderRadius:16,padding:"14px 18px",background:T.pill,color:T.textPri,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={handleCopy} style={{width:52,height:52,borderRadius:16,background:T.pill,border:"none",cursor:"pointer",color:copySuccess?T.green:T.textSec,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Copy size={20}/>
              </button>
            </div>
            {copySuccess && <div style={{color:T.green,fontSize:12,marginTop:8,textAlign:"center"}}>ID copied!</div>}
          </div>

          <div style={{background:`${T.purple}15`,border:`1px solid ${T.purple}30`,borderRadius:20,padding:"1rem"}}>
            <p style={{margin:0,color:T.textSec,fontSize:13,lineHeight:1.6}}>
              To sync, copy this ID and paste it into the app on another device. Changes will be reflected automatically.
            </p>
          </div>

          {(loading || message) && (
            <div style={{borderRadius:16,padding:"14px 18px",fontWeight:700,fontSize:13,
              background:loading?`${T.blue}20`:`${T.green}20`,
              border:`1px solid ${loading?T.blue:T.green}`,
              color:loading?T.blue:T.green,textAlign:"center"}}>
              {loading ? "Syncing..." : message}
            </div>
          )}

          <div style={{display:"flex",gap:12,marginTop:"1rem"}}>
            <button onClick={()=>handleAction("Save")} disabled={loading} style={{flex:1,padding:"14px",background:T.pill,border:"none",borderRadius:16,color:T.textSec,cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700,opacity:loading?0.5:1}}>
              {loading?"Saving...":"Save to Cloud"}
            </button>
            <button onClick={()=>handleAction("Load")} disabled={loading} style={{flex:2,padding:"14px",background:T.yellow,border:"none",borderRadius:16,color:"#000",cursor:"pointer",fontSize:14,fontWeight:800,fontFamily:"inherit",boxShadow:`0 8px 20px ${T.yellow}40`,opacity:loading?0.5:1}}>
              {loading?"Loading...":"Load from Cloud"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
