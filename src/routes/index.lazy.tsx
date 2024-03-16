import { Badge, Button, Card, Group, Text, TextInput } from "@mantine/core";
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const [roomName, setRoomName] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <TextInput
        size="sm"
        value={roomName}
        onChange={(e) => setRoomName(e.currentTarget.value)}
      />

      <Link
        to="/$roomName"
        params={{
          roomName,
        }}
      >
        <Button color="blue" fullWidth mt="md" radius="md">
          Join
        </Button>
      </Link>
    </form>
  );
}
