import { Center, Image, Paper, Stack, Title } from "@mantine/core";
import type { ReactNode } from "react";

// Centered card layout for the logged-out pages.
export function AuthCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <Center mih="100vh" p="md" bg="rose.9">
      <Stack align="center" gap="xl" w="100%" maw={420}>
        <Image src="/dearest.svg" alt="Dearest" w={160} h="auto" />
        <Paper radius="lg" shadow="xl" p={{ base: "lg", xs: "xl" }} w="100%" bg="white">
          <Title order={2} mb="lg" c="stone.9">
            {title}
          </Title>
          {children}
        </Paper>
      </Stack>
    </Center>
  );
}
