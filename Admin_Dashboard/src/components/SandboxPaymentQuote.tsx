import { useState } from 'react';
import { saveSandboxPaymentQuote } from '../api/adminPaymentQuote';
export function SandboxPaymentQuote({applicationId,status}:{applicationId:number;status:string}) {
 const [amount,setAmount]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 if(status!=='waiting_payment')return null;
 return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
  <h3 className="font-black text-[#173e56]">PayPal Sandbox — Approve payment amount</h3>
  <p className="mt-2 text-sm text-amber-800">Testing only. Use the approved amount for this specific application. This will not charge real money.</p>
  <div className="mt-4 flex flex-wrap gap-2"><input className="min-h-11 rounded-xl border border-slate-200 px-3" type="number" min="1" step="0.01" placeholder="USD amount" value={amount} onChange={e=>setAmount(e.target.value)}/><button type="button" className="rounded-xl bg-[#173e56] px-4 font-bold text-white disabled:opacity-50" disabled={busy||!amount} onClick={async()=>{setBusy(true);setMessage('');try{const r=await saveSandboxPaymentQuote(applicationId,Number(amount));setMessage(`Sandbox quote saved: $${r.amount}`)}catch(e){setMessage(e instanceof Error?e.message:'Error')}finally{setBusy(false)}}}>Save Sandbox Quote</button></div>
  {message&&<p role="status" className="mt-3 text-sm">{message}</p>}
 </section>;
}
