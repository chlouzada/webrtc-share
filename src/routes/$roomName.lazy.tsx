import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect,  } from "react";
import { Room as TrysteroRoom, joinRoom } from "trystero";
import { Group, Text, Table, rem, Badge } from "@mantine/core";
import { Dropzone, DropzoneProps, FileWithPath } from "@mantine/dropzone";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
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
  room?: TrysteroRoom;
  setRoom: (room?: TrysteroRoom) => void;
}>((set) => ({
  room: undefined,
  setRoom: (room) => set({ room }),
}));

export function Room() {
  const { roomName } = Route.useParams();

  const setPeerId = usePeerStore((state) => state.setPeerId);

  function join() {
    alert("RENDER")

    setPeerId(undefined);

    const room = joinRoom(
      { appId: "bjqHC6AlTOqa2yqVIMCrf2RUvez4BwwLgPvauYuxBCYsVyaK" },
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

  const room = join();

  // FIXME: not working (on initial load its not joining the room) (only dev kinda works)

  return <Joined room={room} />;
}

const Joined = ({ room }: { room: TrysteroRoom }) => {
  const peerId = usePeerStore((state) => state.peerId);

  return (
    <>
      <Badge size="xl" color={peerId ? "green" : "red"}>
        {peerId ? "CONNECTED" : "DISCONNECTED"}
      </Badge>

      <FileDropzone />
      <FileList room={room} />
    </>
  );
};

type RemoveFile = {
  name: string;
  size: number;
};

const useFileServerStore = create<{
  files: {
    remote: RemoveFile[];
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
  const addLocalFiles = useFileServerStore((state) => state.addLocalFiles);

  return (
    <Dropzone
      onDrop={addLocalFiles}
      onReject={(files) => console.log("rejected files", files)}
      maxSize={5 * 1024 ** 2}
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

function FileList({ room }: { room: TrysteroRoom }) {
  const TABLE_HEADERS = ["File Name", "Extension", "Size", ""] as const;

  const peerId = usePeerStore((state) => state.peerId);
  const files = useFileServerStore((state) => state.files);
  const setRemoteFiles = useFileServerStore((state) => state.setRemoteFiles);

  const [sendLocalFiles, onLocalFiles] = room.makeAction("local-files");

  const [sendRequestFileDowload, onRequestFileDownload] =
    room.makeAction("request-dl");

  const [sendDownload, onDownload] = room.makeAction("download");

  useEffect(() => {
    if (files.local.length === 0) return;

    const localFiles = files.local.map((file) => ({
      name: file.name,
      size: file.size,
    }));

    sendLocalFiles(localFiles, peerId);
  }, [files.local]);

  useEffect(() => {
    if (peerId === undefined) return;
    // receiveDrink((data, peerId) => console.log(`got a ${data} from ${peerId}`));

    onRequestFileDownload(async (idx, peerId) => {
      console.log(`got a request from ${peerId} to download file ${idx}`);
      console.log(files);

      const file = files.local[Number(idx)];

      const buffer = await file.arrayBuffer();

      sendDownload(buffer, peerId, {
        index: Number(idx),
      });
    });

    onLocalFiles((data, peerId) => {
      console.log(`got a file from ${peerId}`, data);
      setRemoteFiles(data as unknown as File[]);
    });

    onDownload((data, peerId, metadata: any) => {
      console.log(`got a buffer from ${peerId}`);
      const blob = new Blob([data as ArrayBuffer], {
        type: "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files.remote[metadata.index].name;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [peerId, files.local, files.remote]);

  const row = (map: Record<(typeof TABLE_HEADERS)[number] & string, string>) =>
    Object.values(TABLE_HEADERS).map((header) => (
      <Table.Td key={header}>{map[header]}</Table.Td>
    ));

  const rows = files.local.map((file, idx) => (
    <Table.Tr key={`tr-${idx}`}>
      {row({
        "File Name": file.name.split(".")[0],
        Extension: (file.name.split(".")[1] ?? "-").toUpperCase(),
        Size: `${Math.ceil(file.size / 1024)} KB`,
        "": "UPDATE | DELETE", // TODO: Add buttons
      })}
    </Table.Tr>
  ));

  const rows2 = files.remote.map((file, idx) => (
    <Table.Tr key={`tr-${idx}-2`}>
      {row({
        "File Name": file.name.split(".")[0],
        Extension: (file.name.split(".")[1] ?? "-").toUpperCase(),
        Size: `${Math.ceil(file.size / 1024)} KB`,
        "": (
          <Badge onClick={() => sendRequestFileDowload(idx, peerId)}>
            Download
          </Badge>
        ) as unknown as string,
      })}
    </Table.Tr>
  ));

  if (files.remote.length === 0 && files.local.length === 0) return <></>;

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
