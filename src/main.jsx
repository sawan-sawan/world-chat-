import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { io } from "socket.io-client";
import LogoIcon from "./components/LogoIcon";
import {
  DEFAULT_ENTRY_ANIMATION_ID,
} from "./data/entryAnimations";
import ChatPage from "./pages/ChatPage";
import AccountAuthPage from "./pages/AccountAuthPage";
import LoginPage from "./pages/LoginPage";
import { auth } from "./lib/firebase";
import {
  loadOrCreateProfile,
  loadStoredContacts,
  removeStoredRoomInvite,
  saveStoredContact,
  searchStoredProfile,
  sendStoredRoomInvite,
  subscribeStoredRoomInvites,
  updateStoredProfile,
} from "./lib/profileStore";
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

function ThemeButton({ theme, onToggleTheme, className = "" }) {
  return (
    <button
      className={`theme-toggle-btn ${className}`.trim()}
      type="button"
      onClick={onToggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <span className="theme-icon" aria-hidden="true">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}

function App() {
  const initialProfile = savedProfile();
  const inputRef = useRef(null);
  const [clientId] = useState(() => initialProfile.clientId || getClientId());
  const [showIntro, setShowIntro] = useState(true);
  const [accountReady, setAccountReady] = useState(false);
  const [accountUser, setAccountUser] = useState(null);
  const [accountProfile, setAccountProfile] = useState(null);
  const [savedContacts, setSavedContacts] = useState([]);
  const [roomInvites, setRoomInvites] = useState([]);
  const [name, setName] = useState(initialProfile.name || "");
  const [profilePhoto, setProfilePhoto] = useState(initialProfile.photoUrl || "");
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
  const [joinNotice, setJoinNotice] = useState(null);
  const [entryAnimationId, setEntryAnimationId] = useState(
    () =>
      localStorage.getItem("talknesty-entry-animation") ||
      DEFAULT_ENTRY_ANIMATION_ID
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("talknesty-theme") || "light"
  );

  const socketRef = useRef(null);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);
  const joinNoticeTimerRef = useRef(null);
  const entryAnimationIdRef = useRef(entryAnimationId);

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
    if (!accountUser) return undefined;
    return subscribeStoredRoomInvites(accountUser.uid, setRoomInvites, () => {
      setError("Room requests ke liye updated Firestore rules publish karein.");
    });
  }, [accountUser]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setAccountReady(false);
      setAccountUser(user);

      if (!user) {
        setAccountProfile(null);
        setSavedContacts([]);
        setSession(null);
        setAccountReady(true);
        return;
      }

      try {
        const profile = await loadOrCreateProfile(user);
        const profileName = profile.name || user.displayName || user.email?.split("@")[0] || "Talknesty User";
        const photoUrl = profile.photoUrl || "";
        setAccountProfile(profile);
        setName(profileName);
        setProfilePhoto(photoUrl);
        setSavedContacts(await loadStoredContacts(user.uid));
        enterRoom(initialProfile.roomId || roomInput, {
          name: profileName,
          photoUrl,
        });
      } catch {
        setError("Firebase profile load nahi hui. Firestore Database enable karke refresh karein.");
      } finally {
        setAccountReady(true);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("talknesty-theme", theme);
  }, [theme]);

  useEffect(() => {
    entryAnimationIdRef.current = entryAnimationId;
  }, [entryAnimationId]);

  useEffect(() => {
    return () => window.clearTimeout(joinNoticeTimerRef.current);
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
      socket.emit("room:join", {
        ...session,
        entryAnimationId: entryAnimationIdRef.current,
      });
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

  showJoinNotice({
    id: `self-${Date.now()}`,
    name: session.name,
    isMe: true,
    animationId: entryAnimationIdRef.current,
  });
});

socket.on("message:new", (message) => {
  setMessages((current) => [...current, message]);

  const text = message?.text || "";

  if (
    message?.system &&
    text.toLowerCase().includes("joined the room")
  ) {
    const joinedName = text
      .replace(/joined the room/i, "")
      .trim();

    const isMe =
      joinedName.toLowerCase() === session?.name?.toLowerCase();

    showJoinNotice({
      id: Date.now(),
      name: joinedName,
      isMe,
      animationId: message.entryAnimationId,
    });
  }
});

    socket.on("entry-animation:show", ({ id, clientId: senderId, name: senderName, animationId }) => {
      showJoinNotice({
        id,
        name: senderName,
        isMe: senderId === currentUserId,
        animationId,
        preview: true,
      });
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

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function showJoinNotice(notice) {
    window.clearTimeout(joinNoticeTimerRef.current);
    setJoinNotice(notice);
    joinNoticeTimerRef.current = window.setTimeout(() => {
      setJoinNotice(null);
    }, 4000);
  }

  function selectEntryAnimation(animationId) {
    localStorage.setItem("talknesty-entry-animation", animationId);
    setEntryAnimationId(animationId);
    entryAnimationIdRef.current = animationId;

    if (socketRef.current?.connected) {
      socketRef.current.emit("entry-animation:select", { animationId });
    } else {
      showJoinNotice({
        id: `self-${Date.now()}`,
        name: session?.name || name,
        isMe: true,
        animationId,
        preview: true,
      });
    }
  }

  function enterRoom(nextRoomId, profile = {}) {
    const cleanName = String(profile.name || name).trim();
    const cleanRoom = String(nextRoomId || roomInput).trim().toUpperCase();

    if (!cleanName || !cleanRoom) {
      setError("Name aur Room ID dono required hain.");
      return;
    }

    const nextSession = {
      name: cleanName,
      roomId: cleanRoom,
      color,
      clientId,
      photoUrl: profile.photoUrl ?? profilePhoto,
    };

    localStorage.setItem("talknesty-profile", JSON.stringify(nextSession));
    setRoomInput(cleanRoom);
    setSession(nextSession);
  }

  function joinRoom(event) {
    event.preventDefault();
    enterRoom(roomInput);
  }

  async function changeProfilePhoto(file) {
    setProfilePhoto(file ? await blobToDataUrl(file) : "");
  }

  function sendMessage(event) {
    event.preventDefault();

    const text = draft.trim();
    if (!text) return;

    socketRef.current?.emit("message:send", { text });
    socketRef.current?.emit("typing:stop");
    setDraft("");
  }

  async function sendVoiceMessage(blob, durationMs) {
    if (!blob?.size) return;

    const audioUrl = await blobToDataUrl(blob);
    if (audioUrl.length > 2_500_000) {
      setError("Voice message ka size zyada hai. Chhota voice note record karein.");
      return;
    }

    socketRef.current?.emit("voice:send", { audioUrl, durationMs });
    socketRef.current?.emit("typing:stop");
    setError("");
  }

  async function sendMediaMessage(file) {
    if (!file?.size) return false;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Sirf photos aur videos send kar sakte hain.");
      return false;
    }

    const mediaUrl = await blobToDataUrl(file);
    if (mediaUrl.length > 28_000_000) {
      setError("Photo ya video ka size zyada hai. Video 20 MB se chhota choose karein.");
      return false;
    }

    socketRef.current?.emit("media:send", {
      mediaUrl,
      mediaKind: isVideo ? "video" : "image",
      fileName: file.name,
    });
    setError("");
    return true;
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

  async function updateAccountProfile(updates) {
    if (!accountUser) return;
    const nextProfile = { ...accountProfile, ...updates };
    await updateStoredProfile(accountUser.uid, updates);
    setAccountProfile(nextProfile);
    setName(nextProfile.name || "");
    setProfilePhoto(nextProfile.photoUrl || "");
    setSession((current) => current ? {
      ...current,
      name: nextProfile.name || current.name,
      photoUrl: nextProfile.photoUrl || "",
    } : current);
    socketRef.current?.emit("profile:update", {
      name: nextProfile.name,
      photoUrl: nextProfile.photoUrl,
    });
  }

  async function searchAccount(searchTerm) {
    if (!accountUser) return null;
    return searchStoredProfile(searchTerm);
  }

  async function sendRoomInvite(profile) {
    if (!accountUser || !accountProfile || !profile || profile.id === accountUser.uid) return;
    await saveStoredContact(accountUser.uid, profile);
    await sendStoredRoomInvite({
      fromProfile: accountProfile,
      roomId,
      toUid: profile.id,
    });
    setSavedContacts(await loadStoredContacts(accountUser.uid));
  }

  async function acceptRoomInvite(invite) {
    if (!accountUser) return;
    await saveStoredContact(accountUser.uid, {
      id: invite.fromUid,
      name: invite.fromName,
      username: invite.fromUsername,
      photoUrl: invite.fromPhotoUrl,
    });
    await removeStoredRoomInvite(accountUser.uid, invite.id);
    setSavedContacts(await loadStoredContacts(accountUser.uid));
    leaveRoom();
    enterRoom(invite.roomId);
  }

  async function dismissRoomInvite(invite) {
    if (!accountUser) return;
    await removeStoredRoomInvite(accountUser.uid, invite.id);
  }

  async function logoutAccount() {
    socketRef.current?.disconnect();
    await signOut(auth);
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

  if (!accountReady) {
    return <main className="intro-screen"><p>Loading your account...</p></main>;
  }

  if (!accountUser) {
    return <AccountAuthPage />;
  }

  if (!session) {
    return (
      <LoginPage
        error={error}
        name={name}
        profilePhoto={profilePhoto}
        roomInput={roomInput}
        theme={theme}
        ThemeButton={ThemeButton}
        onToggleTheme={toggleTheme}
        onGenerateRoom={() => setRoomInput(randomRoom())}
        onNameChange={setName}
        onProfilePhotoChange={changeProfilePhoto}
        onRoomChange={setRoomInput}
        onSubmit={joinRoom}
      />
    );
  }

  return (
    <ChatPage
      connection={connection}
      contacts={contacts}
      currentUserId={currentUserId}
      draft={draft}
      error={error}
      inputRef={inputRef}
      listRef={listRef}
      messages={messages}
      onlineCount={onlineCount}
      primaryContact={primaryContact}
      roomId={roomId}
      roomStatus={roomStatus}
      theme={theme}
      ThemeButton={ThemeButton}
      typingText={typingText}
      onCopyInvite={copyInvite}
      onDraftChange={updateDraft}
      onLeaveRoom={leaveRoom}
      onSendMessage={sendMessage}
      onSendVoiceMessage={sendVoiceMessage}
      onSendMediaMessage={sendMediaMessage}
      onToggleTheme={toggleTheme}
      timeLabel={timeLabel}
      joinNotice={joinNotice}
      entryAnimationId={entryAnimationId}
      onSelectEntryAnimation={selectEntryAnimation}
      accountProfile={accountProfile}
      savedContacts={savedContacts}
      roomInvites={roomInvites}
      onAcceptRoomInvite={acceptRoomInvite}
      onDismissRoomInvite={dismissRoomInvite}
      onLogoutAccount={logoutAccount}
      onSearchAccount={searchAccount}
      onSendRoomInvite={sendRoomInvite}
      onUpdateAccountProfile={updateAccountProfile}
    />
  );
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
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
