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
import ConversationsPage from "./pages/ConversationsPage";
import { auth } from "./lib/firebase";
import {
  deleteStoredContact,
  expireStoredOutgoingInvite,
  finishStoredRoomInvite,
  loadOrCreateProfile,
  loadStoredContacts,
  saveStoredContact,
  searchStoredProfile,
  sendStoredRoomInvite,
  subscribeStoredOutgoingInvites,
  subscribeStoredRoomInvites,
  updateStoredProfile,
} from "./lib/profileStore";
import "./styles.css";

const SERVER_URL =
  import.meta.env.VITE_SOCKET_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

const COLORS = ["#2563eb", "#18b8f5", "#7c3aed", "#f97316", "#ec4899", "#10b981"];

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
  const [outgoingInvites, setOutgoingInvites] = useState([]);
  const [name, setName] = useState(initialProfile.name || "");
  const [profilePhoto, setProfilePhoto] = useState(initialProfile.photoUrl || "");
  const [color] = useState(initialProfile.color || COLORS[0]);
  const [session, setSession] = useState(null);
  const [directContact, setDirectContact] = useState(null);
  const [conversationPreviews, setConversationPreviews] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
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
  const savedContactsRef = useRef(savedContacts);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);
  const joinNoticeTimerRef = useRef(null);
  const entryAnimationIdRef = useRef(entryAnimationId);

  const roomId = session?.roomId;
  const onlineCount = users.length;
  const currentUserId = session?.clientId || clientId;

  const otherContacts = contacts.filter((user) => user.id !== currentUserId);
  const primaryContact =
    otherContacts[0] ||
    (directContact ? { ...directContact, status: "offline" } : undefined);
  const contactPreviews = Object.fromEntries(
    savedContacts.map((contact) => [
      contact.id,
      conversationPreviews[privateRoomId(accountUser?.uid, contact.id)],
    ])
  );
  const contactUnreadCounts = Object.fromEntries(
    savedContacts.map((contact) => [
      contact.id,
      unreadCounts[privateRoomId(accountUser?.uid, contact.id)] || 0,
    ])
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 1300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!accountUser) return undefined;
    return subscribeStoredRoomInvites(accountUser.uid, setRoomInvites, () => {
      setError("Publish the updated Firestore rules to use room requests.");
    });
  }, [accountUser]);

  useEffect(() => {
    if (!accountUser) return undefined;
    return subscribeStoredOutgoingInvites(accountUser.uid, setOutgoingInvites, () => {
      setError("Publish the updated Firestore rules to use outgoing requests.");
    });
  }, [accountUser]);

  useEffect(() => {
    if (!accountUser) return undefined;
    const timers = outgoingInvites
      .filter((invite) => invite.status === "pending")
      .map((invite) => {
        const expiresAt = invite.expiresAt?.toMillis?.() || Date.now() + 5000;
        return window.setTimeout(() => {
          expireStoredOutgoingInvite(accountUser.uid, invite.id).catch(() => {
            setError("Room request status could not be updated. Publish the latest Firestore rules.");
          });
        }, Math.max(0, expiresAt - Date.now()));
      });
    return () => timers.forEach(window.clearTimeout);
  }, [accountUser, outgoingInvites]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setAccountReady(false);
      setAccountUser(user);

      if (!user) {
        setAccountProfile(null);
        setSavedContacts([]);
        setOutgoingInvites([]);
        setSession(null);
        setDirectContact(null);
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
      } catch {
        setError("Your Firebase profile could not be loaded. Enable Firestore Database and refresh.");
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
    savedContactsRef.current = savedContacts;
    subscribeToInbox(socketRef.current, accountUser?.uid, savedContacts);
  }, [accountUser, savedContacts]);

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
      subscribeToInbox(socket, accountUser?.uid, savedContactsRef.current);
    });

    socket.on("disconnect", () => setConnection("offline"));

    socket.on("connect_error", () => {
      setConnection("offline");
      setError("Unable to connect to the server. Check the server URL and deployment.");
    });

    socket.on("room:error", setError);

socket.on("room:history", ({ messages: history, users: roomUsers }) => {
  setMessages(history || []);
  setUsers(roomUsers || []);
  setContacts((current) => mergePresence(current, roomUsers || []));
  updateConversationPreview((history || []).filter((message) => !message.system).at(-1));

  showJoinNotice({
    id: `self-${Date.now()}`,
    name: session.name,
    isMe: true,
    animationId: entryAnimationIdRef.current,
  });
});

socket.on("message:new", (message) => {
  updateConversationPreview(message);
  if (message.roomId !== session.roomId) {
    if (!message.system && message.sender?.id !== currentUserId) {
      setUnreadCounts((current) => ({
        ...current,
        [message.roomId]: (current[message.roomId] || 0) + 1,
      }));
    }
    return;
  }
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
  }, [accountUser, session]);

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

  function updateConversationPreview(message) {
    if (!message?.roomId || message.system) return;
    setConversationPreviews((current) => ({
      ...current,
      [message.roomId]: {
        createdAt: message.createdAt,
        mine: message.sender?.id === currentUserId,
        senderName: message.sender?.name || "",
        text: previewMessage(message),
      },
    }));
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
    const cleanRoom = String(nextRoomId || "").trim().toUpperCase();

    if (!cleanName || !cleanRoom) {
      setError("Name and Room ID are required.");
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

  async function sendVoiceMessage(blob, durationMs) {
    if (!blob?.size) return;

    const audioUrl = await blobToDataUrl(blob);
    if (audioUrl.length > 2_500_000) {
      setError("This voice message is too large. Record a shorter voice note.");
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
      setError("Only photos and videos can be sent.");
      return false;
    }

    const mediaUrl = await blobToDataUrl(file);
    if (mediaUrl.length > 28_000_000) {
      setError("This file is too large. Choose a photo or video under 20 MB.");
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

  function leaveRoom() {
    socketRef.current?.disconnect();
    setSession(null);
    setMessages([]);
    setUsers([]);
    setContacts([]);
    setTypingUsers(new Map());
    setConnection("idle");
    setDirectContact(null);
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
    if (outgoingInvites.some((invite) => invite.toUid === profile.id && invite.status === "pending")) {
      throw new Error("This request is waiting for a response. You can send it again after 5 seconds.");
    }
    await saveStoredContact(accountUser.uid, profile);
    await sendStoredRoomInvite({
      fromProfile: accountProfile,
      roomId,
      toProfile: profile,
    });
    setSavedContacts(await loadStoredContacts(accountUser.uid));
  }

  async function deleteContact(contact) {
    if (!accountUser || !contact?.id) return;
    await deleteStoredContact(accountUser.uid, contact.id);
    setSavedContacts(await loadStoredContacts(accountUser.uid));
  }

  async function openDirectChat(contact) {
    if (!accountUser || !contact?.id || contact.id === accountUser.uid) return;
    await saveStoredContact(accountUser.uid, contact);
    setSavedContacts(await loadStoredContacts(accountUser.uid));
    setDirectContact(contact);
    const nextRoomId = privateRoomId(accountUser.uid, contact.id);
    setUnreadCounts((current) => ({ ...current, [nextRoomId]: 0 }));
    enterRoom(nextRoomId);
  }

  async function acceptRoomInvite(invite) {
    if (!accountUser) return;
    await saveStoredContact(accountUser.uid, {
      id: invite.fromUid,
      name: invite.fromName,
      username: invite.fromUsername,
      photoUrl: invite.fromPhotoUrl,
    });
    const accepted = await finishStoredRoomInvite(accountUser.uid, invite, "accepted");
    if (!accepted) {
      setError("This room request has expired. Ask the sender to send it again.");
      return;
    }
    setSavedContacts(await loadStoredContacts(accountUser.uid));
    leaveRoom();
    enterRoom(invite.roomId);
  }

  async function dismissRoomInvite(invite, status = "declined") {
    if (!accountUser) return;
    await finishStoredRoomInvite(accountUser.uid, invite, status);
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
      <ConversationsPage
        accountProfile={accountProfile}
        contacts={savedContacts}
        conversationPreviews={contactPreviews}
        error={error}
        entryAnimationId={entryAnimationId}
        roomInvites={roomInvites}
        theme={theme}
        onAcceptRoomInvite={acceptRoomInvite}
        onDeleteContact={deleteContact}
        onDismissRoomInvite={dismissRoomInvite}
        onLogoutAccount={logoutAccount}
        onOpenChat={openDirectChat}
        onSearchAccount={searchAccount}
        onSelectEntryAnimation={selectEntryAnimation}
        onToggleTheme={toggleTheme}
        onUpdateAccountProfile={updateAccountProfile}
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
      theme={theme}
      typingText={typingText}
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
      activeContactId={directContact?.id}
      savedContacts={savedContacts}
      conversationPreviews={contactPreviews}
      unreadCounts={contactUnreadCounts}
      roomInvites={roomInvites}
      outgoingInvites={outgoingInvites}
      onAcceptRoomInvite={acceptRoomInvite}
      onDismissRoomInvite={dismissRoomInvite}
      onDeleteContact={deleteContact}
      onLogoutAccount={logoutAccount}
      onOpenChat={openDirectChat}
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

function privateRoomId(firstUid, secondUid) {
  const pair = [String(firstUid), String(secondUid)].sort().join(":");
  let hash = 2166136261;

  for (let index = 0; index < pair.length; index += 1) {
    hash ^= pair.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `DM-${(hash >>> 0).toString(36).toUpperCase()}`;
}

function subscribeToInbox(socket, uid, contacts) {
  if (!socket?.connected || !uid) return;
  socket.emit("inbox:subscribe", {
    roomIds: contacts.map((contact) => privateRoomId(uid, contact.id)),
  });
}

function previewMessage(message) {
  if (message.type === "voice") return "Voice message";
  if (message.type === "media") return message.mediaKind === "video" ? "Video" : "Photo";
  return String(message.text || "").trim();
}

createRoot(document.getElementById("root")).render(<App />);
