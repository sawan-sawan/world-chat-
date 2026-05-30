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
});

const rooms = new Map();

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

  return Array.from(room.users.values()).map(({ id, name, color }) => ({
    id,
    name,
    color,
  }));
}

function makeMessage({ roomId, sender, text, system = false }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    roomId,
    sender,
    text,
    system,
    createdAt: new Date().toISOString(),
  };
}

io.on("connection", (socket) => {
  socket.on("room:join", ({ roomId, name, color, clientId }) => {
    const safeRoomId = String(roomId || "").trim().slice(0, 32);
    const safeName = String(name || "Guest").trim().slice(0, 28);
    const safeColor = String(color || "#0f766e").trim().slice(0, 20);
    const safeClientId = String(clientId || socket.id).trim().slice(0, 80);

    if (!safeRoomId) {
      socket.emit("room:error", "Room code is required.");
      return;
    }

    socket.data.roomId = safeRoomId;
    socket.data.name = safeName;
    socket.data.color = safeColor;
    socket.data.clientId = safeClientId;
    socket.join(safeRoomId);

    const room = getRoom(safeRoomId);
    const existingUser = room.users.get(safeClientId);
    const isReconnect = Boolean(existingUser);

    room.users.set(safeClientId, {
      id: safeClientId,
      socketId: socket.id,
      name: safeName,
      color: safeColor,
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
      socket.emit("room:joined", {
        name: safeName,
      });

      socket.to(safeRoomId).emit("room:user-joined", {
        name: safeName,
      });

      socket.to(safeRoomId).emit("message:new", makeMessage({
        roomId: safeRoomId,
        sender: { id: "system", name: "World Chat", color: "#475569" },
        text: `${safeName} joined the room.`,
        system: true,
      }));
    }

    io.to(safeRoomId).emit("presence:update", roomUsers(safeRoomId));
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
      },
      text: cleanText,
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
