import "@mantine/core/styles.css";
import { Container, MantineProvider, Title } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { HealthCheck } from "./components/HealthCheck";
import { queryClient } from "./queryClient";
import { theme } from "./theme";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Container py="xl">
          <Title order={2} mb="md">
            RSVP
          </Title>
          <HealthCheck />
        </Container>
      </MantineProvider>
    </QueryClientProvider>
  );
}
