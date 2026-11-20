"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/data/auth";
import { db } from "@/lib/db";
import { provisionBusiness } from "@/lib/business-provisioning";
import { sendApplicationEmail } from "@/lib/merchant-applications";
import { getRequestOrigin } from "@/lib/request-origin";

export type OnboardingState = { status: "idle" | "success" | "error"; message?: string };
const verticalsSchema = z.array(z.enum(["CLOTHING", "SHOES", "JEWELLERY", "COSMETICS", "MULTI_CATEGORY"])).min(1).max(5);

export async function startApplicationReviewAction(formData: FormData) {
  const actor = await requirePlatformAdmin(); const id = z.string().min(1).parse(formData.get("applicationId"));
  const updated = await db.merchantApplication.updateMany({ where: { id, status: "PENDING" }, data: { status: "UNDER_REVIEW", reviewedById: actor.id } });
  if (updated.count) await db.securityEvent.create({ data: { userId: actor.id, action: "merchant_application.review_started", summary: "Started reviewing a merchant application", details: { applicationId: id } } });
  revalidatePath("/dashboard/onboarding");
}

export async function approveMerchantApplicationAction(_state: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const actor = await requirePlatformAdmin(); const id = z.string().min(1).parse(formData.get("applicationId"));
  const application = await db.merchantApplication.findUnique({ where: { id }, select: { id: true, businessName: true, ownerEmail: true, countryCode: true, baseCurrency: true, defaultLocale: true, verticals: true, status: true } });
  if (!application || !["PENDING", "UNDER_REVIEW"].includes(application.status)) return { status: "error", message: "This application is no longer available for approval." };
  const verticals = verticalsSchema.safeParse(application.verticals); if (!verticals.success) return { status: "error", message: "The requested store categories are invalid." };
  try {
    const result = await provisionBusiness({ actor, appUrl: await getRequestOrigin(), name: application.businessName, ownerEmail: application.ownerEmail, countryCode: application.countryCode === "PK" ? "PK" : "INTL", baseCurrency: application.baseCurrency === "PKR" ? "PKR" : "USD", defaultLocale: application.defaultLocale === "ur" ? "ur" : "en", verticals: verticals.data, applicationId: application.id });
    await db.securityEvent.create({ data: { userId: actor.id, action: "merchant_application.approved", summary: `Approved ${application.businessName}`, details: { applicationId: application.id, tenantId: result.tenantId } } });
    revalidatePath("/dashboard/onboarding"); revalidatePath("/dashboard/businesses"); revalidatePath("/dashboard/stores"); revalidatePath("/");
    return { status: "success", message: `${application.businessName} was approved. ${result.storeCount} store${result.storeCount === 1 ? "" : "s"} and the owner invitation were created.` };
  } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "The application could not be approved." }; }
}

export async function rejectMerchantApplicationAction(_state: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const parsed = z.object({ applicationId: z.string().min(1), reviewNotes: z.string().trim().min(10, "Explain the decision in at least 10 characters.").max(800) }).safeParse({ applicationId: formData.get("applicationId"), reviewNotes: formData.get("reviewNotes") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message || "Add a review note." };
  const actor = await requirePlatformAdmin();
  const application = await db.merchantApplication.findUnique({ where: { id: parsed.data.applicationId }, select: { id: true, businessName: true, ownerName: true, ownerEmail: true, status: true } });
  if (!application || !["PENDING", "UNDER_REVIEW"].includes(application.status)) return { status: "error", message: "This application is no longer available for rejection." };
  const updated = await db.merchantApplication.updateMany({ where: { id: application.id, status: { in: ["PENDING", "UNDER_REVIEW"] } }, data: { status: "REJECTED", reviewNotes: parsed.data.reviewNotes, reviewedById: actor.id, reviewedAt: new Date() } });
  if (updated.count !== 1) return { status: "error", message: "This application was reviewed by another administrator." };
  await db.securityEvent.create({ data: { userId: actor.id, action: "merchant_application.rejected", summary: `Rejected ${application.businessName}`, details: { applicationId: application.id } } });
  const delivered = await sendApplicationEmail({ recipient: application.ownerEmail, ownerName: application.ownerName, businessName: application.businessName, heading: "Update on your merchant application", message: `The application was not approved at this time. Review note: ${parsed.data.reviewNotes}`, idempotencyKey: `application/rejected/${application.id}` }).then(() => true).catch(() => false);
  revalidatePath("/dashboard/onboarding");
  return { status: "success", message: delivered ? "Application rejected and the owner was notified by email." : "Application rejected, but the email notification could not be delivered." };
}
