import { Button, Input } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight lg:text-5xl xl:text-6xl">
          Share files made easy.
        </h1>
        <p className=" text-gray-600 dark:text-gray-400">
          Peer-to-peer file sharing using WebRTC.
        </p>
      </div>

      <form
        className="flex flex-col justify-center gap-4 mt-8 lg:gap-6 lg:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/$roomName", params: { roomName } });
        }}
      >
        <Button
          variant="transparent"
          size="xs"
          onClick={() => {
            const randomRoomName = Math.random().toString(36).substring(7);
            setRoomName(randomRoomName);
          }}
        >
          <IconRefresh />
        </Button>
        <Input
          className="w-full lg:w-64"
          placeholder="Enter room name"
          value={roomName}
          onChange={(e) => setRoomName(e.currentTarget.value)}
        />
        <div className="w-full lg:w-1/5">
          <Button fullWidth type="submit">
            Join
          </Button>
        </div>
      </form>
    </>
  );
}
