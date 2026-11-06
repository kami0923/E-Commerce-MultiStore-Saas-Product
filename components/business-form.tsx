"use client";

import { useActionState } from "react";
import { Check, ChevronRight, Copy } from "lucide-react";
import { createBusinessAction, type CommerceActionState } from "@/app/dashboard/actions";

const initialState: CommerceActionState = { status: "idle" };
const verticals = [
  ["CLOTHING", "Clothing"], ["SHOES", "Shoes"], ["JEWELLERY", "Jewellery"], ["COSMETICS", "Cosmetics"], ["MULTI_CATEGORY", "Multi-category"],
] as const;

export function BusinessForm() {
  const [state, action, pending] = useActionState(createBusinessAction, initialState);
  if (state.status === "success") return <div className="rounded-[24px] border border-[#dce8d6] bg-[#f4fae9] p-7"><span className="grid size-11 place-items-center rounded-full bg-[#c9f269] text-[#164b36]"><Check className="size-5" /></span><h2 className="mt-5 text-2xl font-black tracking-[-.04em]">Business ready</h2><p className="mt-2 text-sm text-[#647269]">{state.message}</p><div className="mt-6 rounded-2xl border border-[#d5e1ce] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a968e]">Secure owner invitation · expires in 48 hours</p><div className="mt-2 flex items-center gap-3"><code className="min-w-0 flex-1 truncate text-xs text-[#385044]">{state.invitationUrl}</code><button type="button" onClick={() => state.invitationUrl && navigator.clipboard.writeText(state.invitationUrl)} className="grid size-9 place-items-center rounded-xl bg-[#edf3e9] text-[#164b36]" title="Copy invitation link"><Copy className="size-4" /></button></div></div></div>;

  return (
    <form action={action}>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Business name" name="name" placeholder="e.g. Northstar Collective" className="sm:col-span-2" error={state.errors?.name?.[0]} />
        <Field label="Owner email" name="ownerEmail" type="email" placeholder="owner@brand.com" error={state.errors?.ownerEmail?.[0]} />
        <Select label="Country" name="countryCode" options={[["PK","Pakistan"],["INTL","International"]]} />
        <Select label="Base currency" name="baseCurrency" options={[["PKR","PKR — Pakistani Rupee"],["USD","USD — US Dollar"]]} />
        <Select label="Default language" name="defaultLocale" options={[["en","English"],["ur","Urdu — اردو"]]} />
      </div>
      <fieldset className="mt-7"><legend className="text-xs font-bold text-[#536259]">Initial store verticals</legend><div className="mt-3 flex flex-wrap gap-2">{verticals.map(([value,label]) => <label key={value} className="cursor-pointer"><input className="peer sr-only" type="checkbox" name="verticals" value={value} defaultChecked={value === "CLOTHING"} /><span className="block rounded-full border border-[#dce3dc] bg-white px-3.5 py-2 text-xs font-bold text-[#657169] transition peer-checked:border-[#164b36] peer-checked:bg-[#164b36] peer-checked:text-white">{label}</span></label>)}</div>{state.errors?.verticals?.[0] && <p className="mt-2 text-xs font-semibold text-[#b6573a]">{state.errors.verticals[0]}</p>}</fieldset>
      {state.message && <p className="mt-5 rounded-xl bg-[#fff0e9] px-4 py-3 text-sm font-semibold text-[#a64f33]">{state.message}</p>}
      <div className="mt-10 flex justify-end"><button disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-[#164b36] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{pending ? "Creating…" : "Create business and stores"}<ChevronRight className="size-4" /></button></div>
    </form>
  );
}

function Field({label,error,className = "",...props}:{label:string;error?:string;className?:string;name:string;placeholder:string;type?:string}) { return <label className={className}><span className="text-xs font-bold text-[#536259]">{label}</span><input {...props} required className="mt-2 h-12 w-full rounded-xl border border-[#dce3dc] px-4 text-sm outline-none focus:border-[#7d9e7d] focus:ring-4 focus:ring-[#c9f269]/20" />{error && <span className="mt-1.5 block text-xs font-semibold text-[#b6573a]">{error}</span>}</label>; }
function Select({label,name,options}:{label:string;name:string;options:readonly (readonly [string,string])[]}) { return <label><span className="text-xs font-bold text-[#536259]">{label}</span><select name={name} className="mt-2 h-12 w-full rounded-xl border border-[#dce3dc] bg-white px-4 text-sm outline-none">{options.map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select></label>; }
