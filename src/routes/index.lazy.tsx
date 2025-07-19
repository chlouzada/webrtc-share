import {
  Button,
  Input,
  Stack,
  Title,
  Text,
  ActionIcon,
  Container,
  useMantineTheme,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const theme = useMantineTheme();
  const [roomName, setRoomName] = useState("");
  const [isPlaceHolder, setIsPlaceHolder] = useState(true);
  const navigate = useNavigate();

  const setRandomRoomName = () =>
    setRoomName(Math.random().toString(36).substring(2, 8));

  // Gerar nome de sala automaticamente ao carregar
  useEffect(() => {
    setRandomRoomName();
  }, []);

  return (
    <Container size="sm">
      <Stack align="center" gap="xl" className="w-full">
        <Stack align="center" gap="md" className="text-center">
          <Title order={1} size="2.5rem" fw={600}>
            WebRTC{" "}
            <Text
              component="span"
              c={theme.primaryColor}
              size="2.5rem"
              fw={600}
            >
              Share
            </Text>
          </Title>
          <Text size="lg" c="dimmed">
            Share files directly between devices
          </Text>
        </Stack>

        <form
          className="w-full max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const finalRoomName =
              roomName.trim() || Math.random().toString(36).substring(2, 8);
            navigate({ to: "/$roomName", params: { roomName: finalRoomName } });
          }}
        >
          <Stack gap="md">
            <Input
              size="lg"
              placeholder={roomName}
              value={isPlaceHolder ? "" : roomName}
              onChange={(e) => {
                if (isPlaceHolder === true) {
                  setIsPlaceHolder(false);
                }
                setRoomName(e.currentTarget.value);
              }}
              rightSection={
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    if (isPlaceHolder === true) {
                      setIsPlaceHolder(false);
                    }
                    setRandomRoomName();
                  }}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              }
            />

            <Button type="submit" size="lg" fullWidth>
              Create Room
            </Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
