import { Alert, type AlertProps } from "@mantine/core";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

type Kind = "error" | "success";

const colors: Record<Kind, string> = { error: "red", success: "green" };

const icons: Record<Kind, ReactNode> = {
  error: <WarningCircleIcon size={20} aria-hidden="true" />,
  success: <CheckCircleIcon size={20} aria-hidden="true" />,
};

// Every alert in the app uses this component.
// An alert must have a title and an icon, so the title is required.
export function AppAlert({
  kind,
  title,
  ...props
}: Omit<AlertProps, "title" | "icon" | "color"> & { kind: Kind; title: ReactNode }) {
  return <Alert color={colors[kind]} title={title} icon={icons[kind]} {...props} />;
}
