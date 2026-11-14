import { Center, Paper, Title } from "@mantine/core";
import type { ReactNode } from "react";

// Centered card layout for the logged-out pages.
export function AuthCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="sm" radius="md" p="xl" w="100%" maw={420}>
        <Title order={2} mb="lg">
          {title}
        </Title>
        {children}
      </Paper>
    </Center>
  );
}
