import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 30_000_000,
});

const rooms = new Map();
const MAX_VOICE_DATA_LENGTH = 2_500_000;
const MAX_VOICE_DURATION_MS = 30_000;
const MAX_MEDIA_DATA_LENGTH = 28_000_000;
const MAX_PROFILE_PHOTO_LENGTH = 500_000;
const MEDIA_EXPIRY_MS = 60 * 60 * 1000;
const DEFAULT_ENTRY_ANIMATION_ID = "classic-confetti";
const ENTRY_ANIMATION_IDS = new Set([
  "classic-confetti",
  "quick-burst",
  "soft-celebration",
  "legendary-aura-one",
  "legendary-aura-two",
  "legendary-aura-three",
  "legendary-aura-four",
  "legendary-aura-five",
  "legendary-aura-six",
  "legendary-aura-seven",
  "legendary-aura-eight",
  "legendary-aura-nine",
  "legendary-aura-ten",
]);

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      messages: [],
      users: new Map(),
    });
  }

  return rooms.get(roomId);
}

function roomUsers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];

  return Array.from(room.users.values()).map(({ id, name, color, photoUrl, entryAnimationId }) => ({
    id,
    name,
    color,
    photoUrl,
    entryAnimationId,
  }));
}

function cleanExpiredMessages(room) {
  const now = Date.now();
  room.messages = room.messages.filter(
    (message) => !message.expiresAt || new Date(message.expiresAt).getTime() > now
  );
}

function cleanProfilePhoto(photoUrl) {
  const safePhotoUrl = String(photoUrl || "");

  if (
    !safePhotoUrl.startsWith("data:image/") ||
    safePhotoUrl.length > MAX_PROFILE_PHOTO_LENGTH
  ) {
    return "";
  }

  return safePhotoUrl;
}

function cleanEntryAnimationId(animationId) {
  return ENTRY_ANIMATION_IDS.has(animationId)
    ? animationId
    : DEFAULT_ENTRY_ANIMATION_ID;
}

const cleanupTimer = setInterval(() => {
  rooms.forEach((room) => cleanExpiredMessages(room));
}, 5 * 60 * 1000);
cleanupTimer.unref?.();

function makeMessage({
  roomId,
  sender,
  text,
  system = false,
  type = "text",
  audioUrl = "",
  durationMs = 0,
  mediaUrl = "",
  mediaKind = "",
  fileName = "",
  expiresAt = "",
  entryAnimationId = "",
}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    roomId,
    sender,
    text,
    system,
    type,
    audioUrl,
    durationMs,
    mediaUrl,
    mediaKind,
    fileName,
    expiresAt,
    entryAnimationId,
    createdAt: new Date().toISOString(),
  };
}

io.on("connection", (socket) => {
  socket.on("room:join", ({ roomId, name, color, clientId, photoUrl, entryAnimationId }) => {
    const safeRoomId = String(roomId || "").trim().slice(0, 32);
    const safeName = String(name || "Guest").trim().slice(0, 28);
    const safeColor = String(color || "#0f766e").trim().slice(0, 20);
    const safeClientId = String(clientId || socket.id).trim().slice(0, 80);
    const safePhotoUrl = cleanProfilePhoto(photoUrl);
    const safeEntryAnimationId = cleanEntryAnimationId(entryAnimationId);

    if (!safeRoomId) {
      socket.emit("room:error", "Room code is required.");
      return;
    }

    socket.data.roomId = safeRoomId;
    socket.data.name = safeName;
    socket.data.color = safeColor;
    socket.data.clientId = safeClientId;
    socket.data.photoUrl = safePhotoUrl;
    socket.data.entryAnimationId = safeEntryAnimationId;
    socket.join(safeRoomId);

    const room = getRoom(safeRoomId);
    cleanExpiredMessages(room);
    const existingUser = room.users.get(safeClientId);
    const isReconnect = Boolean(existingUser);

    room.users.set(safeClientId, {
      id: safeClientId,
      socketId: socket.id,
      name: safeName,
      color: safeColor,
      photoUrl: safePhotoUrl,
      entryAnimationId: safeEntryAnimationId,
    });

    if (existingUser?.socketId && existingUser.socketId !== socket.id) {
      const oldSocket = io.sockets.sockets.get(existingUser.socketId);
      oldSocket?.leave(safeRoomId);
      oldSocket?.disconnect(true);
    }

    socket.emit("room:history", {
      roomId: safeRoomId,
      messages: room.messages.slice(-100),
      users: roomUsers(safeRoomId),
    });

    if (!isReconnect) {
      socket.to(safeRoomId).emit("message:new", makeMessage({
        roomId: safeRoomId,
        sender: { id: "system", name: "World Chat", color: "#475569" },
        text: `${safeName} joined the room.`,
        system: true,
        entryAnimationId: safeEntryAnimationId,
      }));
    }

    io.to(safeRoomId).emit("presence:update", roomUsers(safeRoomId));
  });

  socket.on("entry-animation:select", ({ animationId }) => {
    const roomId = socket.data.roomId;
    const room = roomId ? rooms.get(roomId) : null;
    if (!room) return;

    const clientId = socket.data.clientId || socket.id;
    const entryAnimationId = cleanEntryAnimationId(animationId);
    const user = room.users.get(clientId);

    socket.data.entryAnimationId = entryAnimationId;
    if (user) user.entryAnimationId = entryAnimationId;

    io.to(roomId).emit("presence:update", roomUsers(roomId));
    io.to(roomId).emit("entry-animation:show", {
      id: `${Date.now()}-${clientId}`,
      clientId,
      name: socket.data.name || "Guest",
      animationId: entryAnimationId,
    });
  });

  socket.on("message:send", ({ text }) => {
    const roomId = socket.data.roomId;
    const room = roomId ? rooms.get(roomId) : null;

    if (!room) {
      socket.emit("room:error", "Join a room before sending messages.");
      return;
    }

    const cleanText = String(text || "").trim().slice(0, 1200);
    if (!cleanText) return;

    const message = makeMessage({
      roomId,
      sender: {
        id: socket.data.clientId || socket.id,
        name: socket.data.name || "Guest",
        color: socket.data.color || "#0f766e",
        photoUrl: socket.data.photoUrl || "",
      },
      text: cleanText,
    });

    room.messages.push(message);
    room.messages = room.messages.slice(-100);
    io.to(roomId).emit("message:new", message);
  });

  socket.on("voice:send", ({ audioUrl, durationMs }) => {
    const roomId = socket.data.roomId;
    const room = roomId ? rooms.get(roomId) : null;

    if (!room) {
      socket.emit("room:error", "Join a room before sending voice messages.");
      return;
    }

    const safeAudioUrl = String(audioUrl || "");
    const safeDurationMs = Math.round(Number(durationMs) || 0);

    if (
      !safeAudioUrl.startsWith("data:audio/") ||
      safeAudioUrl.length > MAX_VOICE_DATA_LENGTH ||
      safeDurationMs < 1 ||
      safeDurationMs > MAX_VOICE_DURATION_MS
    ) {
      socket.emit("room:error", "Voice message is invalid or too large.");
      return;
    }

    const message = makeMessage({
      roomId,
      sender: {
        id: socket.data.clientId || socket.id,
        name: socket.data.name || "Guest",
        color: socket.data.color || "#0f766e",
        photoUrl: socket.data.photoUrl || "",
      },
      text: "Voice message",
      type: "voice",
      audioUrl: safeAudioUrl,
      durationMs: safeDurationMs,
    });

    room.messages.push(message);
    room.messages = room.messages.slice(-100);
    io.to(roomId).emit("message:new", message);
  });

  socket.on("media:send", ({ mediaUrl, mediaKind, fileName }) => {
    const roomId = socket.data.roomId;
    const room = roomId ? rooms.get(roomId) : null;

    if (!room) {
      socket.emit("room:error", "Join a room before sending media.");
      return;
    }

    const safeMediaUrl = String(mediaUrl || "");
    const safeMediaKind = mediaKind === "video" ? "video" : "image";
    const safeFileName = String(fileName || "media").trim().slice(0, 80);
    const expectedPrefix = safeMediaKind === "video" ? "data:video/" : "data:image/";

    if (
      !safeMediaUrl.startsWith(expectedPrefix) ||
      safeMediaUrl.length > MAX_MEDIA_DATA_LENGTH
    ) {
      socket.emit("room:error", "Photo or video is invalid or too large.");
      return;
    }

    cleanExpiredMessages(room);

    const message = makeMessage({
      roomId,
      sender: {
        id: socket.data.clientId || socket.id,
        name: socket.data.name || "Guest",
        color: socket.data.color || "#0f766e",
        photoUrl: socket.data.photoUrl || "",
      },
      text: safeMediaKind === "video" ? "Video" : "Photo",
      type: "media",
      mediaUrl: safeMediaUrl,
      mediaKind: safeMediaKind,
      fileName: safeFileName,
      expiresAt: new Date(Date.now() + MEDIA_EXPIRY_MS).toISOString(),
    });

    room.messages.push(message);
    room.messages = room.messages.slice(-100);
    io.to(roomId).emit("message:new", message);
  });

  socket.on("typing:start", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("typing:update", {
      id: socket.data.clientId || socket.id,
      name: socket.data.name || "Guest",
      typing: true,
    });
  });

  socket.on("typing:stop", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("typing:update", {
      id: socket.data.clientId || socket.id,
      name: socket.data.name || "Guest",
      typing: false,
    });
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const clientId = socket.data.clientId || socket.id;
    const room = rooms.get(roomId);
    const user = room?.users.get(clientId);

    if (user?.socketId !== socket.id) {
      return;
    }

    room?.users.delete(clientId);

    if (room && room.users.size === 0 && room.messages.length === 0) {
      rooms.delete(roomId);
      return;
    }

    if (user) {
      socket.to(roomId).emit("message:new", makeMessage({
        roomId,
        sender: { id: "system", name: "World Chat", color: "#475569" },
        text: `${user.name} is now offline.`,
        system: true,
      }));
    }

    io.to(roomId).emit("presence:update", roomUsers(roomId));
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Realtime chat server running on http://${HOST}:${PORT}`);
});
