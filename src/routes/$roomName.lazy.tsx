import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Room as TrysteroRoom } from "trystero";
import { joinRoom } from "trystero/firebase";
import {
  Group,
  Text,
  Table,
  rem,
  ActionIcon,
  RingProgress,
  Card,
  Loader,
  TextInput,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import { Dropzone, DropzoneProps, FileWithPath } from "@mantine/dropzone";
import {
  IconCopy,
  IconDeviceFloppy,
  IconDownload,
  IconPhoto,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { create } from "zustand";

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

  const [opened, setOpened] = useState(false);

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
          // TODO:
          alert("ROOM IS MADE FOR 2 PEOPLE MAX");
          throw new Error("ROOM IS MADE FOR 2 PEOPLE MAX");
        }

        console.log(`${peerId} joined`);
        setPeerId(peerId);
      });

      room.onPeerLeave((peerId) => {
        console.log(`${peerId} left`);
        setPeerId(undefined);
      });

      return room;
    }

    const joinedRoom = join();

    setRoom(joinedRoom);

    // const setIntervalId = setInterval(() => {
    //   console.log("peers", joinedRoom.getPeers());
    // }, 500);

    return () => joinedRoom.leave();
  }, [roomName]);

  if (!room || peerId === undefined) {
    return (
      <div className="flex flex-col items-center gap-3">
        <h1 className="font-bold text-xl">Share this link with a peer.</h1>
        <div className="flex gap-2 items-center">
          <TextInput readOnly value={roomName} />

          <CopyButton value={`${window.location.origin}/#/${roomName}`}>
            {({ copied, copy }) => (
              <Tooltip
                label="Copied!"
                position="right"
                withArrow
                opened={opened}
              >
                <ActionIcon
                  variant="transparent"
                  onClick={() => {
                    copy();
                    setOpened(true);
                    setTimeout(() => setOpened(false), 1000);
                  }}
                >
                  <IconCopy {...(copied && { color: "gray" })} />
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </div>
        <h2 className=" font-bold text-sm text-gray-500 mt-3">
          Waiting for peer to join...
        </h2>
        <Loader type="dots" h={12} size={24} />
      </div>
    );
  }

  return <Joined />;
}

const Joined = () => {
  useSync();
  useDownload();

  return (
    <>
      <FileDropzone />
      <FileList />
    </>
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

  return (
    <Card shadow="lg" m={8}>
      <Dropzone
        px={24}
        onDrop={addLocalFiles}
        onReject={(files) => console.log("rejected files", files)}
        // maxSize={5 * 1024 ** 2}
        {...props}
      >
        <Group
          justify="center"
          gap="xl"
          mih={220}
          style={{ pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <IconUpload
              style={{
                width: rem(52),
                height: rem(52),
                color: "var(--mantine-color-blue-6)",
              }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{
                width: rem(52),
                height: rem(52),
                color: "var(--mantine-color-red-6)",
              }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto
              style={{
                width: rem(52),
                height: rem(52),
                color: "var(--mantine-color-dimmed)",
              }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag images here or click to select files
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Attach as many files as you like, each file should not exceed 5mb
            </Text>
          </div>
        </Group>
      </Dropzone>
    </Card>
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
  }, [files.local]);

  useEffect(() => {
    if (peerId === undefined) return;

    onLocalFiles((data, peerId) => {
      console.log(`got a file from ${peerId}`, data);
      setRemoteFiles(data as unknown as File[]);
    });
  }, [peerId, files.local]);
};

function FileList() {
  const TABLE_HEADERS = ["File Name", "Extension", "Size", ""] as const;

  const { files, removeLocalFile } = useFileStore();

  const row = (
    map: Record<(typeof TABLE_HEADERS)[number] & string, string | JSX.Element>
  ) =>
    Object.values(TABLE_HEADERS).map((header) => (
      <Table.Td key={header}>{map[header]}</Table.Td>
    ));

  const rows = files.local.map((file, idx) => (
    <Table.Tr key={`tr-${idx}`}>
      {row({
        "File Name": file.name.split(".")[0]!,
        Extension: (file.name.split(".")[1] ?? "-").toUpperCase(),
        Size: `${Math.ceil(file.size / 1024)} KB`,

        // TODO: update feature
        // TODO: if a file requested by peer, remove option to delete
        // TODO: show a progress bar if file is being downloaded
        "": (
          <ActionIcon
            size={30}
            variant="transparent"
            color="red"
            onClick={() => removeLocalFile(idx)}
          >
            <IconX size={18} />
          </ActionIcon>
        ),
      })}
    </Table.Tr>
  ));

  const rows2 = files.remote.map((file, idx) => (
    <Table.Tr key={`tr-${idx}-2`}>
      {row({
        "File Name": file.name.split(".")[0]!,
        Extension: (file.name.split(".")[1] ?? "-").toUpperCase(),
        Size: `${Math.ceil(file.size / 1024)} KB`,
        "": <DownloadButton fileIndex={idx} />,
      })}
    </Table.Tr>
  ));

  if (files.remote.length === 0 && files.local.length === 0) {
    return <></>;
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          {TABLE_HEADERS.map((header, idx) => (
            <Table.Th key={`th-${idx}`}>{header}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {rows2}
      </Table.Tbody>
    </Table>
  );
}

const useDownload = () => {
  const room = useRoomStore((state) => state.room);
  const files = useFileStore((state) => state.files);
  const peerId = usePeerStore((state) => state.peerId);

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
        // TODO: alert user
        throw new Error(`File not found at index ${index}`);
      }

      const buffer = await file.arrayBuffer();

      sendDownload(buffer, peerId, {
        index: Number(index),
      });
    });

    onDownload((data, peerId, metadata: any) => {
      console.log(`got a buffer from ${peerId}`);
      const blob = new Blob([data], {
        type: "application/octet-stream",
      });
      setBlobs((prev) => ({ ...prev, [metadata.index]: blob }));
    });

    onDownloadProgress((percent, peerId, metadata: any) => {
      console.log(`${percent * 100}% done receiving from ${peerId}`, metadata);
      setProgress((prev) => ({
        ...prev,
        [metadata.index]: percent * 100,
      }));
    });
  }, [peerId, files.local, files.remote]);

  return {
    download: async (index: number) => {
      requestFile(index, peerId);
    },
    progress: progress,
    save: (index: number) => {
      const blob = blobs[index];

      if (!blob) {
        //TODO: alert user
        throw new Error(`Blob not found at index ${index}`);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files.remote[index]?.name || "default";
      a.click();
      URL.revokeObjectURL(url);
    },
  };
};

const DownloadButton = ({ fileIndex }: { fileIndex: number }) => {
  const { download, progress, save } = useDownload();

  const percentage = progress[fileIndex];

  const isDownloaded = percentage === 100;
  const isDownloading = percentage && percentage > 0 && percentage < 100;
  const isWaiting = percentage === undefined;

  return (
    <>
      {isDownloaded && (
        <ActionIcon size={30} variant="transparent">
          <IconDeviceFloppy onClick={() => save(fileIndex)} size={22} />
        </ActionIcon>
      )}
      {isDownloading && (
        <RingProgress
          size={30}
          thickness={2}
          sections={[{ value: percentage, color: "teal" }]}
          label={
            <div className="flex justify-center p-1">
              <IconDownload size={16} />
            </div>
          }
        />
      )}
      {isWaiting && (
        <ActionIcon size={30} variant="transparent">
          <IconDownload size={18} onClick={() => download(fileIndex)} />
        </ActionIcon>
      )}
    </>
  );
};
