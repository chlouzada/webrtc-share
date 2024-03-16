import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Room as TrysteroRoom, joinRoom } from "trystero/firebase";
import {
  Group,
  Text,
  Table,
  rem,
  Badge,
  ActionIcon,
  RingProgress,
} from "@mantine/core";
import { Dropzone, DropzoneProps, FileWithPath } from "@mantine/dropzone";
import {
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
  const { roomName } = Route.useParams();

  const setPeerId = usePeerStore((state) => state.setPeerId);
  const { setRoom, room } = useRoomStore();

  useEffect(() => {
    function join() {
      setPeerId(undefined);
      const room = joinRoom(
        {
          appId: "https://chlouzada-default-rtdb.firebaseio.com",
        },
        roomName
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

  if (!room) {
    return <></>;
  }

  return <Joined />;
}

const Joined = () => {
  const peerId = usePeerStore((state) => state.peerId);

  useSync();
  useDownload();

  return (
    <>
      <Badge size="xl" color={peerId ? "green" : "red"}>
        {peerId ? "CONNECTED" : "DISCONNECTED"}
      </Badge>

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
}));

function FileDropzone(props: Partial<DropzoneProps>) {
  const addLocalFiles = useFileStore((state) => state.addLocalFiles);

  return (
    <Dropzone
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
  );
}

const useSync = () => {
  const room = useRoomStore((state) => state.room);
  const files = useFileStore((state) => state.files);
  const peerId = usePeerStore((state) => state.peerId);
  const setRemoteFiles = useFileStore((state) => state.setRemoteFiles);

  const [sendLocalFiles, onLocalFiles] = room.makeAction("local-files");

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

  const files = useFileStore((state) => state.files);

  const row = (
    map: Record<(typeof TABLE_HEADERS)[number] & string, string | JSX.Element>
  ) =>
    Object.values(TABLE_HEADERS).map((header) => (
      <Table.Td key={header}>{map[header]}</Table.Td>
    ));

  const rows = files.local.map((file, idx) => (
    <Table.Tr key={`tr-${idx}`}>
      {row({
        "File Name": file.name.split(".")[0],
        Extension: (file.name.split(".")[1] ?? "-").toUpperCase(),
        Size: `${Math.ceil(file.size / 1024)} KB`,
        "": "TODO: UPDATE | DELETE",
      })}
    </Table.Tr>
  ));

  const rows2 = files.remote.map((file, idx) => (
    <Table.Tr key={`tr-${idx}-2`}>
      {row({
        "File Name": file.name.split(".")[0],
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

  const [requestFile, onRequestFile] = room.makeAction("request-dl");

  const [sendDownload, onDownload, onDownloadProgress] =
    room.makeAction("download");

  useEffect(() => {
    if (peerId === undefined) return;
    // receiveDrink((data, peerId) => console.log(`got a ${data} from ${peerId}`));

    onRequestFile(async (idx, peerId) => {
      console.log(`got a request from ${peerId} to download file ${idx}`);
      console.log(files);

      const file = files.local[Number(idx)];

      const buffer = await file.arrayBuffer();

      sendDownload(buffer, peerId, {
        index: Number(idx),
      });
    });

    onDownload((data, peerId, metadata: any) => {
      console.log(`got a buffer from ${peerId}`);
      const blob = new Blob([data as ArrayBuffer], {
        type: "application/octet-stream",
      });

      setBlobs((prev) => ({ ...prev, [metadata.index]: blob }));

      // const url = URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = files.remote[metadata.index].name;
      // a.click();
      // URL.revokeObjectURL(url);
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files.remote[index].name;
      a.click();
      URL.revokeObjectURL(url);
    },
  };
};

const DownloadButton = ({ fileIndex }: { fileIndex: number }) => {
  const { download, progress, save } = useDownload();

  const VARIANT = "transparent";
  const COLOR = "teal";

  const percentage = progress[fileIndex] ?? -1;

  const isDownloaded = percentage === 100;
  const isDownloading = percentage > 0 && percentage < 100;
  const isWaiting = percentage === -1;

  return (
    <>
      {isDownloaded && (
        <ActionIcon variant={VARIANT} color={COLOR} size={30}>
          <IconDeviceFloppy
            onClick={() => {
              alert("DOWNLOADED");
              save(fileIndex);
            }}
            size={22}
          />
        </ActionIcon>
      )}
      {isDownloading && (
        <RingProgress
          size={30}
          thickness={2}
          sections={[{ value: percentage, color: "teal" }]}
          label={
            <div className="flex justify-center">
              <IconDownload color="#12B886" size={18} />
            </div>
          }
        />
      )}
      {isWaiting && (
        <ActionIcon variant={VARIANT} color={COLOR} size={30}>
          <IconDownload size={18} onClick={() => download(fileIndex)} />
        </ActionIcon>
      )}
    </>
  );
};
