"use client";

import { useActionState, useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, Save, Send } from "lucide-react";
import { inviteTeamMemberAction, updateMemberAccessAction, type TeamActionState } from "@/app/dashboard/team/actions";

const initialState: TeamActionState = { status: "idle" };
const roles = [["ADMIN", "Administrator"], ["MANAGER", "Store manager"], ["CATALOG_MANAGER", "Catalog manager"], ["INVENTORY_MANAGER", "Inventory manager"], ["ORDER_MANAGER", "Order manager"], ["MARKETING_MANAGER", "Marketing manager"], ["ANALYST", "Analyst"], ["SUPPORT", "Support"], ["VIEWER", "Viewer"]];
const control = "h-11 w-full rounded-xl border border-[#dfe5df] bg-white px-3.5 text-sm outline-none focus:border-[#7fa27d]";
const subscribeToNothing = () => () => {};

function invitationUrlForOrigin(invitationUrl: string | undefined, origin: string) {
  if (!invitationUrl || !origin) return invitationUrl ?? "";

  try {
    const invitation = new URL(invitationUrl);
    return `${origin}${invitation.pathname}${invitation.search}${invitation.hash}`;
  } catch {
    return invitationUrl;
  }
}

export function TeamInviteForm({ tenants }: { tenants: { id: string; name: string; stores: { id: string; name: string }[] }[] }) {
  const [state, action, pending] = useActionState(inviteTeamMemberAction, initialState);
  const [tenantId, setTenantId] = useState(tenants[0]?.id || "");
  const tenant = tenants.find(item => item.id === tenantId);
  const [copiedUrl, setCopiedUrl] = useState("");
  const linkInput = useRef<HTMLInputElement>(null);
  const browserOrigin = useSyncExternalStore(subscribeToNothing, () => window.location.origin, () => "");
  const shareUrl = invitationUrlForOrigin(state.invitationUrl, browserOrigin);
  const copied = Boolean(shareUrl && copiedUrl === shareUrl);

  async function copyInvitation() {
    const text = shareUrl || state.invitationUrl;
    if (!text) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        linkInput.current?.focus();
        linkInput.current?.select();
        if (!document.execCommand("copy")) throw new Error("Copy was blocked");
      }
      setCopiedUrl(text);
    } catch {
      linkInput.current?.focus();
      linkInput.current?.select();
    }
  }

  return <form action={action} className="rounded-[24px] border border-[#dfe6df] bg-white p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#526158]">Business<select name="tenantId" value={tenantId} onChange={event => setTenantId(event.target.value)} className={`${control} mt-2`}>{tenants.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs font-bold text-[#526158]">Email address<input name="email" type="email" required placeholder="team@brand.com" className={`${control} mt-2`} /></label><label className="text-xs font-bold text-[#526158]">Role<select name="role" className={`${control} mt-2`}>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><fieldset><legend className="text-xs font-bold text-[#526158]">Assigned stores</legend><div className="mt-2 flex min-h-11 flex-wrap gap-2">{tenant?.stores.map(store => <label key={store.id} className="cursor-pointer"><input name="storeId" value={store.id} type="checkbox" className="peer sr-only" defaultChecked /><span className="inline-flex rounded-full border border-[#dfe5df] px-3 py-2 text-xs font-bold peer-checked:border-[#164b36] peer-checked:bg-[#edf5df] peer-checked:text-[#164b36]">{store.name}</span></label>)}</div></fieldset></div>{state.message && <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${state.status === "success" ? "bg-[#edf5df] text-[#4e7841]" : "bg-[#fff0e9] text-[#a95139]"}`}>{state.message}</p>}{state.invitationUrl && <div className="mt-4 flex gap-2 rounded-xl border border-[#dce5da] bg-[#f7faf5] p-2"><input ref={linkInput} readOnly value={shareUrl || state.invitationUrl} onFocus={event => event.currentTarget.select()} className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" /><button type="button" onClick={copyInvitation} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 text-xs font-black shadow-sm">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? "Copied" : "Copy"}</button></div>}<button disabled={pending || tenants.length === 0} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#164b36] px-5 text-sm font-black text-white disabled:opacity-40"><Send className="size-4" />{pending ? "Creating invitation…" : "Create secure invitation"}</button></form>;
}

export function MemberAccessForm({ tenantId, userId, currentRole, stores, assignedStoreIds }: { tenantId: string; userId: string; currentRole: string; stores: { id: string; name: string }[]; assignedStoreIds: string[] }) {
  return <form action={updateMemberAccessAction} className="mt-4 rounded-2xl bg-[#f7f9f6] p-4"><input type="hidden" name="tenantId" value={tenantId} /><input type="hidden" name="userId" value={userId} /><div className="grid gap-4 sm:grid-cols-[220px_1fr_auto] sm:items-end"><label className="text-xs font-bold text-[#526158]">Role<select name="role" defaultValue={currentRole} className={`${control} mt-2`}>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><fieldset><legend className="text-xs font-bold text-[#526158]">Store access</legend><div className="mt-2 flex flex-wrap gap-2">{stores.map(store => <label key={store.id} className="cursor-pointer"><input name="storeId" value={store.id} type="checkbox" defaultChecked={assignedStoreIds.includes(store.id)} className="peer sr-only" /><span className="inline-flex rounded-full border border-[#dfe5df] bg-white px-3 py-2 text-[11px] font-bold peer-checked:border-[#164b36] peer-checked:bg-[#e6f0e1]">{store.name}</span></label>)}</div></fieldset><button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#164b36] px-4 text-xs font-black text-white"><Save className="size-3.5" /> Save access</button></div></form>;
}

export function InvitationScope({ storeIds, stores }: { storeIds: unknown; stores: { id: string; name: string }[] }) { const ids = Array.isArray(storeIds) ? storeIds : []; return <span>{stores.filter(store => ids.includes(store.id)).map(store => store.name).join(", ") || "All stores"}</span>; }
