import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Room as TrysteroRoom } from "trystero";
import { joinRoom } from "trystero/firebase";
import {
  Group,
  Text,
  rem,
  ActionIcon,
  RingProgress,
  Loader,
  CopyButton,
  Tooltip,
  Badge,
  Stack,
  Title,
  Paper,
} from "@mantine/core";
import { Dropzone, DropzoneProps, FileWithPath } from "@mantine/dropzone";
import {
  IconCopy,
  IconDeviceFloppy,
  IconDownload,
  IconUpload,
  IconX,
  IconCloudUpload,
  IconCloudDown,
  IconFileText,
} from "@tabler/icons-react";
import { create } from "zustand";
import { useNotifications } from "../hooks/useNotifications";

export const Route = createLazyFileRoute("/$roomName")({
  component: Room,
});

const usePeerStore = create<{
  peerId?: string;
  setPeerId: (peerId?: string) => void;
}>((set) => ({
  peerId: undefined,
  setPeerId: (peerId) => set({ peerId }),
}));

const useRoomStore = create<{
  room: TrysteroRoom;
  setRoom: (room?: TrysteroRoom) => void;
}>((set) => ({
  room: undefined!,
  setRoom: (room) => set({ room }),
}));

export function Room() {
  const roomName = Route.useParams().roomName.toLowerCase();
  const { showError, showInfo } = useNotifications();

  const peerId = usePeerStore((state) => state.peerId);
  const setPeerId = usePeerStore((state) => state.setPeerId);
  const { setRoom, room } = useRoomStore();

  useEffect(() => {
    function join() {
      setPeerId(undefined);
      const room = joinRoom(
        {
          appId: import.meta.env.VITE_APP_FB_RTDB_URL,
          rootPath: "__webrtc-share__/rooms",
        },
        `${import.meta.env.VITE_APP_ROOM_NAME_PREFIX}-${roomName}`
      );

      room.onPeerJoin((peerId) => {
        const peers = room.getPeers();

        if (Object.keys(peers).length > 1) {
          showError("Room supports only 2 people", "Room full");
          throw new Error("ROOM IS MADE FOR 2 PEOPLE MAX");
        }

        console.log(`${peerId} joined`);
        showInfo(`User connected: ${peerId.substring(0, 8)}...`, "New connection");
        setPeerId(peerId);
      });

      room.onPeerLeave((peerId) => {
        console.log(`${peerId} left`);
        showInfo(`User disconnected: ${peerId.substring(0, 8)}...`, "Disconnection");
        setPeerId(undefined);
      });

      return room;
    }

    const joinedRoom = join();

    setRoom(joinedRoom);
    return () => joinedRoom.leave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  const link = document.location.href;

  if (!room || peerId === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Paper shadow="md" radius="lg" p="xl" maw={500} mx="auto">
          <Stack align="center" gap="lg">
            <div className="text-center">
              <Title order={2} mb="sm">
                Share this link
              </Title>
              <Text c="dimmed" size="sm">
                Send the link below for someone to connect to your room
              </Text>
            </div>

            <Paper withBorder p="md" radius="md" w="100%">
              <Group justify="space-between" wrap="nowrap">
                <Text size="sm" style={{ wordBreak: "break-all" }} flex={1}>
                  {link}
                </Text>
                <CopyButton value={link}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Copied!" : "Copy link"}
                      position="left"
                      withArrow
                    >
                      <ActionIcon 
                        variant={copied ? "filled" : "subtle"}
                        color={copied ? "teal" : "blue"}
                        onClick={copy}
                      >
                        <IconCopy size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Paper>

            <Stack align="center" gap="sm">
              <Text fw={500} c="dimmed">
                Waiting for connection...
              </Text>
              <Loader type="dots" size="md" />
            </Stack>
          </Stack>
        </Paper>
      </div>
    );
  }

  return <Joined />;
}

const Joined = () => {
  useSync();
  useDownload();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-2">
      <FileDropzone />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 w-full">
        <MyFiles />
        <PeerFiles />
      </div>
    </div>
  );
};

const useFileStore = create<{
  files: {
    remote: {
      name: string;
      size: number;
    }[];
    local: FileWithPath[];
  };
  setRemoteFiles: (files: File[]) => void;
  addLocalFiles: (files: FileWithPath[]) => void;
  removeLocalFile: (index: number) => void;
}>((set) => ({
  files: {
    local: [],
    remote: [],
  },
  setRemoteFiles: (files) =>
    set((state) => ({ files: { ...state.files, remote: files } })),
  addLocalFiles: (files) =>
    set((state) => ({
      files: { ...state.files, local: [...state.files.local, ...files] },
    })),
  removeLocalFile: (index) => {
    set((state) => ({
      files: {
        ...state.files,
        local: state.files.local.filter((_, i) => i !== index),
      },
    }));
  },
}));

function FileDropzone(props: Partial<DropzoneProps>) {
  const addLocalFiles = useFileStore((state) => state.addLocalFiles);
  const { showSuccess, showError } = useNotifications();

  return (
    <Paper shadow="sm" radius="lg" p="md" withBorder>
      <Dropzone
        radius="md"
        onDrop={(files) => {
          addLocalFiles(files);
          showSuccess(`${files.length} file(s) added successfully!`);
        }}
        onReject={(files) => {
          console.log("rejected files", files);
          showError(`${files.length} file(s) rejected. Check type or size.`);
        }}
        {...props}
      >
        <Group
          justify="center"
          gap="md"
          mih={90}
          style={{ pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <IconUpload
              style={{
                width: rem(36),
                height: rem(36),
                color: "var(--mantine-color-teal-6)",
              }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{
                width: rem(36),
                height: rem(36),
                color: "var(--mantine-color-red-6)",
              }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconCloudUpload
              style={{
                width: rem(36),
                height: rem(36),
                color: "var(--mantine-color-gray-6)",
              }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <Stack align="center" gap="xs">
            <Text size="md" fw={500}>
              Drag files or click to select
            </Text>
            <Text size="xs" c="dimmed">
              no size limit
            </Text>
          </Stack>
        </Group>
      </Dropzone>
    </Paper>
  );
}

const useSync = () => {
  const room = useRoomStore((state) => state.room);
  const files = useFileStore((state) => state.files);
  const peerId = usePeerStore((state) => state.peerId);
  const setRemoteFiles = useFileStore((state) => state.setRemoteFiles);

  const [sendLocalFiles, onLocalFiles] = room.makeAction<
    {
      name: string;
      size: number;
    }[]
  >("local-files");

  useEffect(() => {
    sendLocalFiles(
      files.local.map((file) => ({
        name: file.name,
        size: file.size,
      })),
      peerId
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.local]);

  useEffect(() => {
    if (peerId === undefined) return;

    onLocalFiles((data, peerId) => {
      console.log(`got a file from ${peerId}`, data);
      setRemoteFiles(data as unknown as File[]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, files.local]);
};

const MyFiles = () => {
  const { files, removeLocalFile } = useFileStore();

  return (
    <Paper shadow="sm" radius="md" p="md" withBorder className="h-fit">
      <Group mb="md">
        <IconCloudUpload size={20} color="var(--mantine-color-teal-6)" />
        <Title order={4}>My Files</Title>
        <Badge color="teal" variant="light">
          {files.local.length}
        </Badge>
      </Group>
      
      {files.local.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No files sent yet.
          <br />
          Drag files above to share.
        </Text>
      ) : (
        <Stack gap="xs">
          {files.local.map((file, idx) => (
            <Paper key={idx} p="sm" withBorder radius="sm" bg="var(--mantine-color-teal-0)">
              <Group justify="space-between">
                <Group gap="sm">
                  <IconFileText size={16} />
                  <div>
                    <Text size="sm" fw={500}>
                      {file.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {Math.ceil(file.size / 1024)} KB
                    </Text>
                  </div>
                </Group>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={() => removeLocalFile(idx)}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

const PeerFiles = () => {
  const { files } = useFileStore();

  return (
    <Paper shadow="sm" radius="md" p="md" withBorder className="h-fit">
      <Group mb="md">
        <IconCloudDown size={20} color="var(--mantine-color-blue-6)" />
        <Title order={4}>Peer Files</Title>
        <Badge color="blue" variant="light">
          {files.remote.length}
        </Badge>
      </Group>
      
      {files.remote.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Waiting for peer files...
          <br />
          Shared files will appear here.
        </Text>
      ) : (
        <Stack gap="xs">
          {files.remote.map((file, idx) => (
            <Paper key={idx} p="sm" withBorder radius="sm" bg="var(--mantine-color-blue-0)">
              <Group justify="space-between">
                <Group gap="sm">
                  <IconFileText size={16} />
                  <div>
                    <Text size="sm" fw={500}>
                      {file.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {Math.ceil(file.size / 1024)} KB
                    </Text>
                  </div>
                </Group>
                <DownloadButton fileIndex={idx} />
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

const useDownload = () => {
  const room = useRoomStore((state) => state.room);
  const files = useFileStore((state) => state.files);
  const peerId = usePeerStore((state) => state.peerId);
  const { showSuccess, showError, showInfo } = useNotifications();

  const [progress, setProgress] = useState<{
    [K in number]: number;
  }>({});

  const [blobs, setBlobs] = useState<{
    [K in number]: Blob;
  }>({});

  const [requestFile, onRequestFile] = room.makeAction<number>("request-dl");

  const [sendDownload, onDownload, onDownloadProgress] =
    room.makeAction<ArrayBuffer>("download");

  useEffect(() => {
    if (peerId === undefined) return;

    onRequestFile(async (index, peerId) => {
      console.log(`got a request from ${peerId} to download file ${index}`);

      const file = files.local[Number(index)];

      if (!file) {
        showError(`File not found at index ${index}`);
        throw new Error(`File not found at index ${index}`);
      }

      const buffer = await file.arrayBuffer();

      sendDownload(buffer, peerId, {
        index: Number(index),
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDownload((data, peerId, metadata: any) => {
      console.log(`got a buffer from ${peerId}`);
      const blob = new Blob([data], {
        type: "application/octet-stream",
      });
      setBlobs((prev) => ({ ...prev, [metadata.index]: blob }));
      showSuccess(`Download completed: ${files.remote[metadata.index]?.name || 'file'}`);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDownloadProgress((percent, peerId, metadata: any) => {
      console.log(`${percent * 100}% done receiving from ${peerId}`, metadata);
      setProgress((prev) => ({
        ...prev,
        [metadata.index]: percent * 100,
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, files.local, files.remote]);

  return {
    download: async (index: number) => {
      requestFile(index, peerId);
      showInfo(`Starting download: ${files.remote[index]?.name || 'file'}`);
    },
    progress: progress,
    save: (index: number) => {
      const blob = blobs[index];

      if (!blob) {
        showError(`File not available for saving`);
        throw new Error(`Blob not found at index ${index}`);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files.remote[index]?.name || "default";
      a.click();
      URL.revokeObjectURL(url);
      showSuccess(`File saved: ${files.remote[index]?.name || 'file'}`);
    },
  };
};

const DownloadButton = ({ fileIndex }: { fileIndex: number }) => {
  const { download, progress, save } = useDownload();

  const percentage = progress[fileIndex];

  const isDownloaded = percentage === 100;
  const isDownloading = percentage && percentage > 0 && percentage < 100;

  if (isDownloaded) {
    return (
      <ActionIcon
        size="sm"
        variant="filled"
        color="green"
        onClick={() => save(fileIndex)}
      >
        <IconDeviceFloppy size={14} />
      </ActionIcon>
    );
  }

  if (isDownloading) {
    return (
      <RingProgress
        size={24}
        thickness={3}
        sections={[{ value: percentage, color: "blue" }]}
        label={
          <Text size="xs" ta="center">
            {Math.round(percentage)}%
          </Text>
        }
      />
    );
  }

  return (
    <ActionIcon
      size="sm"
      variant="subtle"
      color="blue"
      onClick={() => download(fileIndex)}
    >
      <IconDownload size={14} />
    </ActionIcon>
  );
};
