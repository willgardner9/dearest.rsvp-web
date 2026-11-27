import { Button, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { errorMessage, useCreateTenant } from "../api";
import { AppAlert } from "./AppAlert";
import type { Tenant } from "../api";

// The onboarding page and the new wedding page use this form.
export function WeddingNameForm({
  submitLabel,
  onCreated,
}: {
  submitLabel: string;
  onCreated: (tenant: Tenant) => void;
}) {
  const create = useCreateTenant();
  const form = useForm({ mode: "uncontrolled", initialValues: { name: "" } });

  const onSubmit = form.onSubmit((values) => create.mutate(values, { onSuccess: onCreated }));

  return (
    <form onSubmit={onSubmit}>
      <Stack>
        {create.isError && (
          <AppAlert kind="error" title="Could not create the wedding">
            {errorMessage(create.error)}
          </AppAlert>
        )}
        <TextInput
          label="Wedding name"
          placeholder="Alex & Sam"
          required
          key={form.key("name")}
          {...form.getInputProps("name")}
        />
        <Button type="submit" loading={create.isPending}>
          {submitLabel}
        </Button>
      </Stack>
    </form>
  );
}
