import { requireAdmin } from "@/lib/auth";
import { listNotifications } from "@/lib/notifications/queries";
import NotificationsClient from "./NotificationsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const { admin } = await requireAdmin();
  const items = await listNotifications(admin.organisationId, admin.id, {
    limit: 100,
  });
  return <NotificationsClient initialItems={items} />;
}
