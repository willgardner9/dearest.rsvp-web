import { useNavigate } from "@tanstack/react-router";
import { AuthCard } from "../components/AuthCard";
import { WeddingNameForm } from "../components/WeddingNameForm";

export function OnboardingPage() {
  const navigate = useNavigate();
  return (
    <AuthCard title="Create your wedding">
      <WeddingNameForm
        submitLabel="Create wedding"
        onCreated={(tenant) =>
          void navigate({ to: "/w/$tenantId", params: { tenantId: tenant.id } })
        }
      />
    </AuthCard>
  );
}
