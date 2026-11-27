import { Button, Code, Stack, Text } from "@mantine/core";
import { ApiError, useHealth } from "../api";
import { AppAlert } from "./AppAlert";

export function HealthCheck() {
  const { data, error, isFetching, refetch } = useHealth();

  return (
    <Stack align="flex-start" gap="md">
      <Button loading={isFetching} onClick={() => refetch()}>
        Check API health
      </Button>
      {data && <Code block>{JSON.stringify(data, null, 2)}</Code>}
      {error && (
        <AppAlert kind="error" title="Request failed">
          <Text size="sm">
            {error instanceof ApiError
              ? `HTTP ${error.status}: ${JSON.stringify(error.body)}`
              : error.message}
          </Text>
        </AppAlert>
      )}
    </Stack>
  );
}
