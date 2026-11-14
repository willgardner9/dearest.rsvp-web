import { useNavigate } from "@tanstack/react-router";
import { AuthCard } from "../components/AuthCard";
import { WeddingNameForm } from "../components/WeddingNameForm";

// No link in the app points to this page. A future help page will link to it.
export function NewWeddingPage() {
  const navigate = useNavigate();
  return (
    <AuthCard title="Create another wedding">
      <WeddingNameForm
        submitLabel="Create wedding"
        onCreated={(tenant) =>
          void navigate({ to: "/w/$tenantId", params: { tenantId: tenant.id } })
        }
      />
    </AuthCard>
  );
}
