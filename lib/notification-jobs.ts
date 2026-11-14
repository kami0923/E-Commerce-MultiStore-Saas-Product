import "server-only";

import { after } from "next/server";
import { dispatchPendingNotifications } from "@/lib/notification-dispatcher";

export function scheduleNotificationDispatch(limit = 10) {
  after(async () => {
    try { await dispatchPendingNotifications(limit); }
    catch (error) { console.error("Background notification dispatch failed", error); }
  });
}
