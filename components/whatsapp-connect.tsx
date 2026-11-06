"use client";

import Script from "next/script";
import { CheckCircle2, LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { completeWhatsAppSignupAction } from "@/app/dashboard/whatsapp/actions";

type SignupData = { businessId?: string; wabaId?: string; phoneNumberId?: string };
type FacebookResponse = { authResponse?: { code?: string } };
type FacebookSdk = { init(input: Record<string, unknown>): void; login(callback: (response: FacebookResponse) => void, options: Record<string, unknown>): void };

declare global { interface Window { FB?: FacebookSdk; fbAsyncInit?: () => void } }

export function WhatsAppConnect({ tenantId, storeId, appId, configId, connected }: { tenantId: string; storeId: string; appId?: string; configId?: string; connected: boolean }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const signupData = useRef<SignupData>({});
  const configured = Boolean(appId && configId);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!["https://www.facebook.com", "https://web.facebook.com"].includes(event.origin)) return;
      let payload = event.data;
      if (typeof payload === "string") { try { payload = JSON.parse(payload); } catch { return; } }
      if (payload?.type !== "WA_EMBEDDED_SIGNUP") return;
      if (payload.event === "FINISH") signupData.current = {
        businessId: payload.data?.business_id,
        wabaId: payload.data?.waba_id,
        phoneNumberId: payload.data?.phone_number_id,
      };
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  function initialize() {
    if (!appId || !window.FB) return;
    window.FB.init({ appId, autoLogAppEvents: true, xfbml: true, version: "v22.0" });
    setSdkReady(true);
  }

  function connect() {
    setResult(null);
    signupData.current = {};
    if (!window.FB || !configId) return setResult({ ok: false, message: "Meta signup is not ready yet. Please try again." });
    window.FB.login((response) => {
      const code = response.authResponse?.code;
      const { businessId, wabaId, phoneNumberId } = signupData.current;
      if (!code) return setResult({ ok: false, message: "Meta signup was cancelled before authorization completed." });
      if (!wabaId || !phoneNumberId) return setResult({ ok: false, message: "Meta did not return the selected WhatsApp account. Please finish every signup step and try again." });
      startTransition(async () => setResult(await completeWhatsAppSignupAction({ tenantId, storeId, code, businessId, wabaId, phoneNumberId })));
    }, { config_id: configId, response_type: "code", override_default_response_type: true, extras: { setup: {}, featureType: "", sessionInfoVersion: "3" } });
  }

  return <div>
    {configured && <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="lazyOnload" onReady={initialize} />}
    <button type="button" onClick={connect} disabled={!configured || !sdkReady || pending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-xs font-black text-[#092c1b] shadow-[0_12px_28px_rgba(37,211,102,.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : connected ? <CheckCircle2 className="size-4" /> : <MessageCircle className="size-4" />}
      {pending ? "Securing account…" : connected ? "Link a different account" : "Continue with Facebook"}
    </button>
    {!configured && <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#9b6721]"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" />Meta Embedded Signup needs the platform App ID and Configuration ID before this button can be enabled.</p>}
    {result && <p role="status" className={`mt-3 rounded-xl px-3 py-2.5 text-xs font-bold ${result.ok ? "bg-[#e7f5df] text-[#386b32]" : "bg-[#fff0e9] text-[#a4472b]"}`}>{result.message}</p>}
  </div>;
}
