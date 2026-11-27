import { Badge, Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { ArrowBendDownRightIcon } from "@phosphor-icons/react";
import { GUIDE_GROUPS, guideStep } from "../onboarding/guideContent";
import type { GuideStep } from "../onboarding/guideContent";
import { STEP_ICONS } from "../onboarding/stepIcons";

// The guide on the wedding home page. It has no props, so every member sees the same guide.
// A card is not a link until its feature ships.
export function WeddingGuide() {
  return (
    <Stack gap="xl">
      {GUIDE_GROUPS.map((group) => (
        <Stack key={group.id} gap="sm">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">
            {group.title}
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {group.steps.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
}

function StepCard({ step }: { step: GuideStep }) {
  const StepIcon = STEP_ICONS[step.id];
  return (
    <Card withBorder padding="lg" h="100%">
      <Group justify="space-between" wrap="nowrap" align="flex-start" mb="md">
        <ThemeIcon variant="light" size={40} radius="md" aria-hidden>
          <StepIcon size={22} />
        </ThemeIcon>
        <Badge variant="light" color="stone" size="sm" style={{ flexShrink: 0 }}>
          Coming soon
        </Badge>
      </Group>
      <Text fw={600}>{step.title}</Text>
      <Text size="sm" c="dimmed" mt={4}>
        {step.description}
      </Text>
      {step.needs.length > 0 && (
        <Group gap={6} mt="md" wrap="nowrap" c="dimmed">
          <ArrowBendDownRightIcon size={14} aria-hidden style={{ flexShrink: 0 }} />
          <Text size="xs">Needs: {step.needs.map((id) => guideStep(id).shortName).join(", ")}</Text>
        </Group>
      )}
    </Card>
  );
}
