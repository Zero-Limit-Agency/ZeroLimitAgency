import { TrainingAdminManager } from "@/components/admin/training/training-admin-manager";
import { loadTrainingAdminModel, listAuthUsersForAdmin } from "@/lib/learn-youtube/admin-catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration formations | Zero Limit Agency" };

export default async function AdminFormationsPage() {
  const [model, users] = await Promise.all([
    loadTrainingAdminModel(),
    listAuthUsersForAdmin({ page: 1, perPage: 100 })
  ]);

  return <TrainingAdminManager initialModel={{ ...model, users }} />;
}
