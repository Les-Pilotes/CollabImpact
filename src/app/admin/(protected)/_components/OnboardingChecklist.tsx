import { getOnboardingProgress } from "@/lib/onboarding/progress";
import OnboardingChecklistClient from "./OnboardingChecklistClient";

type Props = {
  organisationId: string;
  isSuperAdmin: boolean;
};

export default async function OnboardingChecklist({
  organisationId,
  isSuperAdmin,
}: Props) {
  const progress = await getOnboardingProgress({ organisationId, isSuperAdmin });
  return <OnboardingChecklistClient progress={progress} />;
}
