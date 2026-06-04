import React, { useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";
import { io } from "socket.io-client";
import {
  Camera,
  Copy,
  Link as LinkIcon,
  Image as ImageIcon,
  LogOut,
  Mic,
  RefreshCw,
  Send,
  Users,
  Video,
  X,
} from "lucide-react";
import LogoIcon from "./components/LogoIcon";
import ProfileAvatar from "./components/ProfileAvatar";
import VoiceMessagePlayer from "./components/VoiceMessagePlayer";
import joinRoomAnimation from "./assets/join-room-center.json";
import "./talknesty.css";

const SERVER_URL =
  import.meta.env.VITE_SOCKET_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

const PROFILE_KEY = "talknesty-room-profile";
const JOIN_NOTICE_MS = 4200;

function randomRoom() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export default function App() {
  const saved = loadProfile();
  const params = new URLSearchParams(window.location.search);
  const [roomInput, setRoomInput] = useState(params.get("room") || randomRoom());
  const [name, setName] = useState(saved.name || "");
  const [photoUrl, setPhotoUrl] = useState(saved.photoUrl || "");
  const [avatarColor, setAvatarColor] = useState(saved.avatarColor || "#5b6ee1");
  const [session, setSession] = useState(null);
  const photoInputRef = useRef(null);

  function joinRoom(event) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanRoom = roomInput.trim().toUpperCase();
    if (!cleanName || !cleanRoom) return;

    const profile = { name: cleanName, photoUrl, avatarColor };
    const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    saveProfile(profile);
    setSession({
      ...profile,
      roomId: cleanRoom,
      clientId,
      color: avatarColor,
    });
  }

  async function chooseProfilePhoto(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setPhotoUrl(await resizeImage(file, 220, 0.78));
  }

  if (session) {
    return <RoomChat session={session} onLeave={() => setSession(null)} />;
  }

  return (
    <main className="simple-shell">
      <section className="join-card">
        <div className="join-brand">
          <span><LogoIcon size={42} /></span>
          <div>
            <h1>talknesty</h1>
            <p>Fast realtime room chat</p>
          </div>
        </div>

        <div className="join-copy">
          <h2>Your room. Your people. Instant chat.</h2>
          <p>Choose a name, pick an avatar, join a room, and start talking in real time.</p>
        </div>

        <form className="join-form" onSubmit={joinRoom}>
          <section className="profile-setup">
            <button
              className="join-avatar-preview"
              type="button"
              onClick={() => photoInputRef.current?.click()}
              title="Add profile photo"
              style={{ "--avatar-color": avatarColor }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="" onError={() => setPhotoUrl("")} />
              ) : (
                <Camera size={26} />
              )}
            </button>
            <div>
              <strong>{name || "Add your avatar"}</strong>
              <small>Upload a photo or choose a clean avatar color.</small>
              <div className="avatar-actions">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => chooseProfilePhoto(event.target.files?.[0])}
                />
                <button type="button" onClick={() => photoInputRef.current?.click()}>
                  <Camera size={16} />
                  Photo
                </button>
                {photoUrl ? <button type="button" onClick={() => setPhotoUrl("")}>Remove</button> : null}
              </div>
            </div>
          </section>

          <div className="avatar-swatches" aria-label="Avatar colors">
            {["#5b6ee1", "#00897b", "#d97706", "#c026d3", "#0f766e", "#334155"].map((color) => (
              <button
                className={avatarColor === color ? "active" : ""}
                type="button"
                key={color}
                title={`Use ${color} avatar color`}
                style={{ "--swatch": color }}
                onClick={() => setAvatarColor(color)}
              />
            ))}
          </div>

          <label>
            <span>Your name</span>
            <input value={name} placeholder="Name..." onChange={(event) => setName(event.target.value)} />
          </label>

          <label>
            <span>Room code</span>
            <div className="room-code-input">
              <input value={roomInput} onChange={(event) => setRoomInput(event.target.value.toUpperCase())} />
              <button type="button" title="Generate new room" onClick={() => setRoomInput(randomRoom())}>
                <RefreshCw size={18} />
              </button>
            </div>
          </label>

          <button className="join-button" type="submit">Join chat</button>
        </form>
      </section>
    </main>
  );
}

function RoomChat({ session, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [recording, setRecording] = useState(false);
  const [joinNotice, setJoinNotice] = useState(null);
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const fileRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const joinNoticeTimerRef = useRef(null);

  const roomLink = `${window.location.origin}${window.location.pathname}?room=${session.roomId}`;
  const otherUsers = users.filter((user) => user.id !== session.clientId);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("online");
      socket.emit("room:join", session);
    });
    socket.on("disconnect", () => setStatus("offline"));
    socket.on("connect_error", () => {
      setStatus("offline");
      setError("Server is not connected. Start the backend or check deployment URL.");
    });
    socket.on("room:error", setError);
    socket.on("room:history", ({ messages: history, users: roomUsers }) => {
      setMessages(history || []);
      setUsers(roomUsers || []);
    });
    socket.on("message:new", (message) => {
      const joinedName = getJoinedName(message);
      if (joinedName) {
        window.clearTimeout(joinNoticeTimerRef.current);
        setJoinNotice({
          id: message.id,
          name: joinedName,
        });
        joinNoticeTimerRef.current = window.setTimeout(() => {
          setJoinNotice(null);
        }, JOIN_NOTICE_MS);
      }
      setMessages((current) => [...current, message]);
    });
    socket.on("presence:update", (roomUsers) => setUsers(roomUsers || []));

    return () => {
      window.clearTimeout(joinNoticeTimerRef.current);
      socket.disconnect();
    };
  }, [session]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onlineText = useMemo(() => {
    if (!users.length) return "Connecting";
    return `${users.length} online in this room`;
  }, [users.length]);

  function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    socketRef.current?.emit("message:send", { text });
    setDraft("");
  }

  async function pickAttachment(file) {
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Select only a photo or video.");
      return;
    }
    if (file.size > 20_000_000) {
      setError("File must be smaller than 20 MB.");
      return;
    }
    setAttachment({
      file,
      kind: isVideo ? "video" : "image",
      previewUrl: URL.createObjectURL(file),
    });
  }

  async function sendAttachment() {
    if (!attachment) return;
    const mediaUrl = await blobToDataUrl(attachment.file);
    socketRef.current?.emit("media:send", {
      mediaUrl,
      mediaKind: attachment.kind,
      fileName: attachment.file.name,
    });
    URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      const startedAt = Date.now();

      recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const audioUrl = await blobToDataUrl(blob);
        socketRef.current?.emit("voice:send", {
          audioUrl,
          durationMs: Math.max(1, Date.now() - startedAt),
        });
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone permission is needed for voice notes.");
    }
  }

  async function copyRoom() {
    await navigator.clipboard?.writeText(roomLink);
  }

  return (
    <main className="chat-shell">
      <aside className="desktop-room-panel">
        <div className="desktop-brand">
          <LogoIcon size={38} />
          <div>
            <h1>talknesty</h1>
            <p className={status}>{status === "online" ? "Realtime room" : status}</p>
          </div>
        </div>

        <section className="desktop-room-card">
          <p>Current room</p>
          <h2>{session.roomId}</h2>
          <span>{onlineText}</span>
          <button onClick={copyRoom}><LinkIcon size={17} /> Copy invite link</button>
        </section>

        <section className="desktop-members">
          <p><Users size={16} /> Online members</p>
          <div>
            {users.map((user) => (
              <article key={user.id}>
                <ProfileAvatar className="live" name={user.name} photoUrl={user.photoUrl} color={user.color} />
                <span>{user.clientId === session.clientId ? "You" : user.name}</span>
              </article>
            ))}
          </div>
        </section>

        <button className="desktop-leave" onClick={onLeave}><LogOut size={18} /> Leave room</button>
      </aside>

      <section className="chat-main">
        <header className="chat-topbar">
          <div className="app-title">
            <LogoIcon size={30} />
            <div>
              <h1>talknesty</h1>
              <p className={status}>{status === "online" ? "Live" : status}</p>
            </div>
          </div>
          <button className="top-icon" title="Copy room link" onClick={copyRoom}><Copy size={19} /></button>
          <button className="top-icon leave" title="Leave room" onClick={onLeave}><LogOut size={19} /></button>
        </header>

        <section className="room-header">
          <div>
            <p>Room</p>
            <h2>{session.roomId}</h2>
            <span>{onlineText}</span>
          </div>
        <div className="live-users" aria-label="Online users">
          {users.map((user) => (
            <ProfileAvatar key={user.id} className="live" name={user.name} photoUrl={user.photoUrl} color={user.color} />
          ))}
        </div>
      </section>

      {error ? <p className="simple-error">{error}</p> : null}

      <section className="messages-list" ref={listRef}>
        {joinNotice ? <JoinRoomOverlay key={joinNotice.id} name={joinNotice.name} /> : null}
        {messages.length ? messages.map((message) => (
          <Message key={message.id} message={message} mine={message.sender?.id === session.clientId} />
        )) : (
          <div className="empty-chat">
            <Users size={28} />
            <h3>No messages yet</h3>
            <p>Share the room link and start the first conversation.</p>
          </div>
        )}
      </section>

      {attachment ? (
        <div className="attachment-preview">
          {attachment.kind === "video" ? (
            <video src={attachment.previewUrl} muted playsInline />
          ) : (
            <img src={attachment.previewUrl} alt="" />
          )}
          <span>{attachment.file.name}</span>
          <button onClick={() => setAttachment(null)}><X size={18} /></button>
          <button className="send-attachment" onClick={sendAttachment}><Send size={18} /></button>
        </div>
      ) : null}

      <form className="message-composer" onSubmit={sendMessage}>
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={(event) => pickAttachment(event.target.files?.[0])} />
        <button type="button" title="Photo or video" onClick={() => fileRef.current?.click()}>
          <ImageIcon size={20} />
        </button>
        <input value={draft} placeholder="Message likhein..." onChange={(event) => setDraft(event.target.value)} />
        <button className={recording ? "recording" : ""} type="button" title="Voice note" onClick={toggleRecording}>
          {recording ? <Video size={20} /> : <Mic size={20} />}
        </button>
        <button className="send-button" title="Send message"><Send size={20} /></button>
      </form>
      </section>
    </main>
  );
}

function JoinRoomOverlay({ name }) {
  return (
    <div className="join-room-overlay" aria-live="polite">
      <div className="join-room-lottie">
        <Lottie animationData={joinRoomAnimation} loop={false} />
      </div>
      <strong>{name}</strong>
      <span>joined the room</span>
    </div>
  );
}

function Message({ message, mine }) {
  if (message.system) {
    const joinedName = getJoinedName(message);
    if (!joinedName) {
      return <p className="system-message">{message.text}</p>;
    }

    return (
      <p className="system-message">
        <span>{joinedName || "Someone"}</span> joined the room
      </p>
    );
  }

  return (
    <article className={`simple-message ${mine ? "mine" : ""}`}>
      {!mine ? <ProfileAvatar name={message.sender?.name} photoUrl={message.sender?.photoUrl} color={message.sender?.color} /> : null}
      <div className="simple-bubble">
        {!mine ? <strong>{message.sender?.name}</strong> : null}
        {message.type === "voice" ? (
          <VoiceMessagePlayer audioUrl={message.audioUrl} durationMs={message.durationMs} />
        ) : message.type === "media" ? (
          message.mediaKind === "video" ? (
            <video className="bubble-media" src={message.mediaUrl} controls playsInline />
          ) : (
            <img className="bubble-media" src={message.mediaUrl} alt={message.fileName || "Shared media"} />
          )
        ) : (
          <p>{message.text}</p>
        )}
        <span>{formatTime(message.createdAt)}</span>
      </div>
    </article>
  );
}

function getJoinedName(message) {
  if (!message?.system) return "";
  const text = String(message.text || "");
  const match = text.match(/^(.+?)\s+joined the room\.?$/i);
  return match?.[1]?.trim() || "";
}

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function resizeImage(file, size, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const crop = Math.min(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = size;
        canvas.height = size;
        context.drawImage(
          image,
          (image.naturalWidth - crop) / 2,
          (image.naturalHeight - crop) / 2,
          crop,
          crop,
          0,
          0,
          size,
          size
        );
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
