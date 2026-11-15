import { Banknote, CreditCard, ReceiptText, RotateCcw } from "lucide-react";
import { recordPaymentAction, recordRefundAction } from "@/app/dashboard/payments/actions";
import { SectionPage } from "@/components/section-page";
import { getCurrentPermissions } from "@/data/auth";
import { getPaymentsWorkspace } from "@/data/payments";
import { paymentBalance, paymentState, refundableAmount } from "@/lib/payments";
import { formatMoney } from "@/lib/utils";

const providers = ["CASH_ON_DELIVERY", "BANK_TRANSFER", "PAYFAST", "EASYPAISA", "JAZZCASH", "STRIPE"] as const;
const input = "h-10 rounded-xl border border-[#dfe5df] bg-white px-3 text-xs outline-none focus:border-[#7fa27d]";

export default async function PaymentsPage() {
  const [{ orders, transactions }, permissions] = await Promise.all([getPaymentsWorkspace(), getCurrentPermissions()]);
  const canManage = permissions.includes("orders.manage");
  const canRefund = permissions.includes("orders.refund");
  const successful = transactions.filter(item => item.status === "SUCCEEDED");
  const collected = successful.filter(item => item.type === "PAYMENT").reduce((sum, item) => sum + item.amountMinor, 0);
  const refunded = successful.filter(item => item.type === "REFUND").reduce((sum, item) => sum + item.amountMinor, 0);
  const pending = orders.filter(order => paymentState(order.totalMinor, order.paymentTransactions) === "PENDING" || paymentState(order.totalMinor, order.paymentTransactions) === "UNPAID").length;
  const currency = orders[0]?.currency ?? "PKR";

  return <SectionPage eyebrow="Financial operations" title="Payments & settlements" description="Reconcile collections and refunds against each order. Only confirmed ledger entries affect paid and refundable balances." icon={CreditCard}>
    <section className="grid gap-3 sm:grid-cols-3"><Metric icon={Banknote} label="Confirmed collections" value={formatMoney(collected, currency)} /><Metric icon={RotateCcw} label="Confirmed refunds" value={formatMoney(refunded, currency)} /><Metric icon={ReceiptText} label="Orders awaiting payment" value={String(pending)} /></section>

    <section className="mt-5 space-y-3">{orders.map(order => {
      const balance = paymentBalance(order.paymentTransactions);
      const state = paymentState(order.totalMinor, order.paymentTransactions);
      const outstanding = Math.max(0, order.totalMinor - balance.net);
      const refundable = refundableAmount(order.paymentTransactions);
      const initialProvider = order.paymentTransactions.find(item => item.type === "PAYMENT")?.provider ?? "CASH_ON_DELIVERY";
      return <article key={order.id} className="overflow-hidden rounded-[22px] border border-[#e1e6e1] bg-white"><div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{order.orderNumber}</h2><PaymentStatus value={state} /><span className="text-xs text-[#87938b]">{order.store.name}</span></div><p className="mt-2 text-sm text-[#526158]">{order.customerName || "Customer"} · {order.customerEmail}</p><p className="mt-1 text-[11px] text-[#87938b]">Order {order.status} · {new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(order.placedAt)}</p></div><div className="grid grid-cols-3 gap-4 text-right text-xs"><Amount label="Order" value={formatMoney(order.totalMinor, order.currency)} /><Amount label="Net paid" value={formatMoney(balance.net, order.currency)} /><Amount label="Outstanding" value={formatMoney(outstanding, order.currency)} /></div></div>
        {(canManage || canRefund) && <div className="grid gap-3 border-t border-[#edf0ed] bg-[#fafcf9] p-4 lg:grid-cols-2">{canManage && outstanding > 0 && <details className="rounded-xl border border-[#e1e6e1] bg-white p-3"><summary className="cursor-pointer list-none text-xs font-black text-[#164b36]">Record payment</summary><form action={recordPaymentAction} className="mt-3 grid gap-2 sm:grid-cols-2"><Identity order={order} /><select name="provider" defaultValue={initialProvider} className={input}>{providers.map(provider => <option key={provider} value={provider}>{provider.replaceAll("_", " ")}</option>)}</select><input name="amount" type="number" min="0.01" max={(outstanding / 100).toFixed(2)} step="0.01" defaultValue={(outstanding / 100).toFixed(2)} className={input} required /><input name="providerReference" placeholder="Receipt / reference (optional)" className={input} /><input name="note" placeholder="Internal note" className={input} /><button className="sm:col-span-2 h-10 rounded-xl bg-[#164b36] text-xs font-black text-white">Confirm collection</button></form></details>}{canRefund && refundable > 0 && <details className="rounded-xl border border-[#eadbd6] bg-white p-3"><summary className="cursor-pointer list-none text-xs font-black text-[#9b5643]">Record refund</summary><form action={recordRefundAction} className="mt-3 grid gap-2 sm:grid-cols-2"><Identity order={order} /><select name="provider" defaultValue={initialProvider} className={input}>{providers.map(provider => <option key={provider} value={provider}>{provider.replaceAll("_", " ")}</option>)}</select><input name="amount" type="number" min="0.01" max={(refundable / 100).toFixed(2)} step="0.01" defaultValue={(refundable / 100).toFixed(2)} className={input} required /><input name="providerReference" placeholder="Refund reference" className={input} /><input name="note" placeholder="Refund reason" className={input} /><button className="sm:col-span-2 h-10 rounded-xl bg-[#9b5643] text-xs font-black text-white">Confirm refund</button></form></details>}</div>}
      </article>;
    })}{orders.length === 0 && <div className="rounded-[24px] border border-dashed border-[#ccd6cc] bg-white/60 p-12 text-center"><p className="font-bold">No payable orders yet</p><p className="mt-2 text-sm text-[#7c8981]">Payment records will appear after the first order.</p></div>}</section>

    <section className="mt-5 rounded-[24px] border border-[#e1e6e1] bg-white p-5 sm:p-6"><p className="text-lg font-black">Transaction ledger</p><p className="mb-4 text-xs text-[#7c8981]">Immutable confirmed entries and pending checkout intentions, newest first.</p><div className="divide-y divide-[#edf0ed]">{transactions.map(item => <div key={item.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto]"><div><p className="font-black">{item.type === "REFUND" ? "−" : "+"}{formatMoney(item.amountMinor, item.currency)} · {item.order.orderNumber}</p><p className="text-xs text-[#7c8981]">{item.store.name} · {item.provider.replaceAll("_", " ")} · {item.status}{item.providerReference ? ` · ${item.providerReference}` : ""}</p></div><p className="text-xs text-[#7c8981]">{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(item.processedAt ?? item.createdAt)} · {item.actor?.name ?? "Checkout"}</p></div>)}{transactions.length === 0 && <p className="py-8 text-center text-sm text-[#7c8981]">No payment transactions yet.</p>}</div></section>
  </SectionPage>;
}

function Identity({ order }: { order: { id: string; tenantId: string; storeId: string } }) { return <><input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="tenantId" value={order.tenantId} /><input type="hidden" name="storeId" value={order.storeId} /></>; }
function Metric({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) { return <article className="rounded-2xl border border-[#e1e6e1] bg-white p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#edf3e9] text-[#164b36]"><Icon className="size-4" /></span><div><p className="text-xs text-[#7c8981]">{label}</p><p className="text-xl font-black">{value}</p></div></div></article>; }
function Amount({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] uppercase tracking-wider text-[#87938b]">{label}</p><p className="mt-1 font-black">{value}</p></div>; }
function PaymentStatus({ value }: { value: string }) { const tone = value === "PAID" ? "bg-[#edf5df] text-[#4e7841]" : value.includes("REFUND") ? "bg-[#fff0e9] text-[#a95139]" : value.includes("PARTIALLY") ? "bg-[#e8eff9] text-[#46678d]" : "bg-[#fff1db] text-[#9b6721]"; return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${tone}`}>{value.replaceAll("_", " ")}</span>; }
