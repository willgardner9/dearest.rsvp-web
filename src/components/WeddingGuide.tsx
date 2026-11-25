import { Badge, Button, Card, Collapse, Group, List, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { GUIDE_INTRO, GUIDE_PATHS, GUIDE_STEPS } from "../onboarding/guideContent";

// The guide on the wedding home page. It has no props, so every member sees the same guide.
// A card is not a link until its feature ships.
export function WeddingGuide() {
  const [pathsOpen, { toggle }] = useDisclosure(false);

  return (
    <Stack>
      <Text>{GUIDE_INTRO}</Text>
      {GUIDE_STEPS.map((step) => (
        <Card key={step.id} withBorder>
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <Text fw={500}>{step.title}</Text>
            <Badge variant="light" style={{ flexShrink: 0 }}>
              Coming soon
            </Badge>
          </Group>
          <Text size="sm" c="dimmed" mt="xs">
            {step.description}
          </Text>
        </Card>
      ))}
      <div>
        <Button
          variant="subtle"
          px={0}
          onClick={toggle}
          aria-expanded={pathsOpen}
          aria-controls="example-paths"
        >
          {pathsOpen ? "Hide example paths" : "See example paths"}
        </Button>
        <Collapse expanded={pathsOpen} id="example-paths">
          <List mt="xs">
            {GUIDE_PATHS.map((path) => (
              <List.Item key={path}>{path}</List.Item>
            ))}
          </List>
        </Collapse>
      </div>
    </Stack>
  );
}
