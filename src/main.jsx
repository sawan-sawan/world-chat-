import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  ArrowRight,
  CheckCheck,
  Copy,
  LogOut,
  MessageCircle,
  Send,
  Sparkles,
  User,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import "./styles.css";

const SERVER_URL =
  import.meta.env.VITE_SOCKET_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

const COLORS = ["#2563eb", "#18b8f5", "#7c3aed", "#f97316", "#ec4899", "#10b981"];

function randomRoom() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function savedProfile() {
  try {
    return JSON.parse(localStorage.getItem("talknesty-profile")) || {};
  } catch {
    return {};
  }
}

function getClientId() {
  const existingId = localStorage.getItem("talknesty-client-id");
  if (existingId) return existingId;

  const nextId =
    crypto.randomUUID?.() ||
    `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem("talknesty-client-id", nextId);
  return nextId;
}

function timeLabel(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function LogoIcon({ size = 28 }) {
  return <MessageCircle size={size} fill="currentColor" strokeWidth={2.4} />;
}

function App() {
  const initialProfile = savedProfile();

  const [clientId] = useState(() => initialProfile.clientId || getClientId());
  const [showIntro, setShowIntro] = useState(true);
  const [name, setName] = useState(initialProfile.name || "");
  const [roomInput, setRoomInput] = useState(initialProfile.roomId || randomRoom());
  const [color] = useState(initialProfile.color || COLORS[0]);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [draft, setDraft] = useState("");
  const [connection, setConnection] = useState("idle");
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);

  const roomId = session?.roomId;
  const onlineCount = users.length;
  const currentUserId = session?.clientId || clientId;

  const otherContacts = contacts.filter((user) => user.id !== currentUserId);
  const primaryContact = otherContacts[0];

  const roomStatus = primaryContact
    ? `${primaryContact.name} is ${primaryContact.status}`
    : `${onlineCount} online in this room`;

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 1300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!session) return undefined;

    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;
    setConnection("connecting");
    setError("");

    socket.on("connect", () => {
      setConnection("online");
      socket.emit("room:join", session);
    });

    socket.on("disconnect", () => setConnection("offline"));

    socket.on("connect_error", () => {
      setConnection("offline");
      setError("Server se connection nahi ho pa raha. Server URL/deployment check karein.");
    });

    socket.on("room:error", setError);

    socket.on("room:history", ({ messages: history, users: roomUsers }) => {
      setMessages(history || []);
      setUsers(roomUsers || []);
      setContacts((current) => mergePresence(current, roomUsers || []));
    });

    socket.on("message:new", (message) => {
      setMessages((current) => [...current, message]);
    });

    socket.on("presence:update", (roomUsers) => {
      setUsers(roomUsers || []);
      setContacts((current) => mergePresence(current, roomUsers || []));
    });

    socket.on("typing:update", ({ id, name: typingName, typing }) => {
      setTypingUsers((current) => {
        const next = new Map(current);
        if (typing) next.set(id, typingName);
        else next.delete(id);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session]);

  const typingText = useMemo(() => {
    const names = Array.from(typingUsers.values()).slice(0, 2);
    if (!names.length) return "";
    return `${names.join(", ")} typing...`;
  }, [typingUsers]);

  function joinRoom(event) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanRoom = roomInput.trim().toUpperCase();

    if (!cleanName || !cleanRoom) {
      setError("Name aur Room ID dono required hain.");
      return;
    }

    const nextSession = {
      name: cleanName,
      roomId: cleanRoom,
      color,
      clientId,
    };

    localStorage.setItem("talknesty-profile", JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function sendMessage(event) {
    event.preventDefault();

    const text = draft.trim();
    if (!text) return;

    socketRef.current?.emit("message:send", { text });
    socketRef.current?.emit("typing:stop");
    setDraft("");
  }

  function updateDraft(value) {
    setDraft(value);

    socketRef.current?.emit("typing:start");

    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      socketRef.current?.emit("typing:stop");
    }, 900);
  }

  async function copyInvite() {
    const text = `Join my Talknesty room: ${roomId}`;
    await navigator.clipboard?.writeText(text);
  }

  function leaveRoom() {
    socketRef.current?.disconnect();
    setSession(null);
    setMessages([]);
    setUsers([]);
    setContacts([]);
    setTypingUsers(new Map());
    setConnection("idle");
  }

  if (showIntro) {
    return (
      <main className="intro-screen">
        <div className="intro-logo">
          <LogoIcon size={44} />
        </div>
        <h1>talknesty</h1>
        <p>Chat freely. Connect deeply. Be you.</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="shell">
        <section className="auth-panel">
          <div className="brand-row hero-brand">
            <span className="brand-mark">
              <LogoIcon size={30} />
            </span>

            <div>
              <h1>talknesty</h1>
              <p>Join a room and start chatting instantly with anyone, anywhere.</p>
            </div>
          </div>

          <form className="join-form" onSubmit={joinRoom}>
            <label>
              Name
              <div className="input-icon">
                <User size={20} />
                <input
                  autoFocus
                  value={name}
                  maxLength={28}
                  placeholder="Name"
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </label>

            <label>
              Room ID
              <div className="input-action">
                <div className="input-icon">
                  <Users size={20} />
                  <input
                    value={roomInput}
                    maxLength={32}
                    placeholder="Room ID"
                    onChange={(event) => setRoomInput(event.target.value.toUpperCase())}
                  />
                </div>

                <button
                  type="button"
                  className="icon-button"
                  title="New room code"
                  onClick={() => setRoomInput(randomRoom())}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </label>

            {error ? <p className="error">{error}</p> : null}

            <button className="primary-button" type="submit">
              Login
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="chat-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark small">
            <LogoIcon size={24} />
          </span>
          <h1>talknesty</h1>
        </div>

        <div className="room-card">
          <div>
            <p className="eyebrow">Room</p>
            <h2>{roomId}</h2>
            <p className="room-subtitle">{onlineCount} online now</p>
          </div>

          <button className="icon-button" type="button" title="Copy invite" onClick={copyInvite}>
            <Copy size={18} />
          </button>
        </div>

        <div className={`status ${connection}`}>
          {connection === "online" ? <Wifi size={17} /> : <WifiOff size={17} />}
          <span />
          {connection === "online"
            ? "You are online"
            : connection === "connecting"
            ? "Connecting"
            : "You are offline"}
        </div>

        <section className="people">
          <h3>People</h3>

          {contacts.map((user) => (
            <div className={`person ${user.status}`} key={user.id}>
              <span className="person-avatar" style={{ background: user.color }}>
                {user.name.slice(0, 1).toUpperCase()}
              </span>

              <div>
                <p>{user.id === currentUserId ? "You" : user.name}</p>
                <small>{user.status === "online" ? "Online" : "Offline"}</small>
              </div>
            </div>
          ))}
        </section>

        <button className="secondary-button" type="button" onClick={leaveRoom}>
          <LogOut size={18} />
          Leave Room
        </button>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div className="chat-title">
            <span className="chat-mark">
              <Sparkles size={20} />
            </span>

            <div>
              <p className="eyebrow">Realtime chat</p>
              <h2>{primaryContact?.name || roomId}</h2>
              <p className="chat-subtitle">{roomStatus}</p>
            </div>
          </div>

          <div className="delivered">
            <CheckCheck size={18} />
            {connection === "online" ? "Live sync" : "Offline"}
          </div>
        </header>

        {error ? <p className="error inline">{error}</p> : null}

        <div className="messages" ref={listRef}>
          {messages.map((message) => {
            const mine = message.sender.id === currentUserId;

            return (
              <article
                className={`message ${mine ? "mine" : ""} ${message.system ? "system" : ""}`}
                key={message.id}
              >
                {!message.system ? (
                  <div className="avatar" style={{ background: message.sender.color }}>
                    {message.sender.name.slice(0, 1).toUpperCase()}
                  </div>
                ) : null}

                <div className="bubble">
                  {!message.system ? (
                    <div className="message-meta">
                      <strong>{mine ? "You" : message.sender.name}</strong>
                      <span>{timeLabel(message.createdAt)}</span>
                    </div>
                  ) : null}

                  <p>{message.text}</p>
                </div>
              </article>
            );
          })}

          {typingText ? <p className="typing">{typingText}</p> : null}
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <input
            value={draft}
            placeholder="Message likhein..."
            maxLength={1200}
            onChange={(event) => updateDraft(event.target.value)}
          />

          <button className="send-button" type="submit" title="Send message">
            <Send size={20} />
          </button>
        </form>
      </section>
    </main>
  );
}

function mergePresence(current, onlineUsers) {
  const onlineIds = new Set(onlineUsers.map((user) => user.id));
  const merged = new Map();

  current.forEach((user) => {
    merged.set(user.id, {
      ...user,
      status: onlineIds.has(user.id) ? "online" : "offline",
    });
  });

  onlineUsers.forEach((user) => {
    merged.set(user.id, {
      ...user,
      status: "online",
    });
  });

  return Array.from(merged.values()).sort((first, second) => {
    if (first.status !== second.status) return first.status === "online" ? -1 : 1;
    return first.name.localeCompare(second.name);
  });
}

createRoot(document.getElementById("root")).render(<App />);
