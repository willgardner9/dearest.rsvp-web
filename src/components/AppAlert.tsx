import { Alert, type AlertProps } from "@mantine/core";
import type { ReactNode } from "react";

type Kind = "error" | "success";

const colors: Record<Kind, string> = { error: "red", success: "green" };

function Icon({ kind }: { kind: Kind }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      {kind === "error" ? (
        <>
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </>
      ) : (
        <path d="m8 12 3 3 5-6" />
      )}
    </svg>
  );
}

// Every alert in the app uses this component.
// An alert must have a title and an icon, so the title is required.
export function AppAlert({
  kind,
  title,
  ...props
}: Omit<AlertProps, "title" | "icon" | "color"> & { kind: Kind; title: ReactNode }) {
  return <Alert color={colors[kind]} title={title} icon={<Icon kind={kind} />} {...props} />;
}
