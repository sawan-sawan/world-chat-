import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCheck,
  ContactRound,
  MessageCircle,
  Menu,
  Mic,
  Paperclip,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import LogoIcon from "../components/LogoIcon";
import ProfileAvatar from "../components/ProfileAvatar";
import ProfileSidebar from "../components/ProfileSidebar";
import ContactsPanel from "../components/ContactsPanel";
import AppSettingsPanel from "../components/AppSettingsPanel";
import EntryMedia from "../components/EntryMedia";
import RoomInviteBanner from "../components/RoomInviteBanner";
import VoiceMessagePlayer from "../components/VoiceMessagePlayer";
import { getEntryAnimation } from "../data/entryAnimations";
import EntryAnimationsPage from "./EntryAnimationsPage";
import "./ChatPage.css";

export default function ChatPage({
  connection,
  contacts,
  currentUserId,
  draft,
  error,
  inputRef,
  listRef,
  messages,
  onlineCount,
  primaryContact,
  roomId,
  theme,
  typingText,
  onDraftChange,
  onLeaveRoom,
  onSendMessage,
  onSendMediaMessage,
  onSendVoiceMessage,
  onToggleTheme,
  timeLabel,
  joinNotice,
  entryAnimationId,
  onSelectEntryAnimation,
  accountProfile,
  activeContactId,
  savedContacts,
  conversationPreviews,
  unreadCounts,
  roomInvites,
  outgoingInvites,
  onAcceptRoomInvite,
  onDismissRoomInvite,
  onDeleteContact,
  onLogoutAccount,
  onOpenChat,
  onSearchAccount,
  onSendRoomInvite,
  onUpdateAccountProfile,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("chat");
  const [recording, setRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [attachment, setAttachment] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);
  const [contactsPanelOpen, setContactsPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState(null);
  const [textSize, setTextSize] = useState(() => localStorage.getItem("talknesty-text-size") || "medium");
  const attachmentInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const recordingTimerRef = useRef(null);
  const shouldSendVoiceRef = useRef(false);
  const outgoingStatusRef = useRef(new Map());
  const feedbackTimerRef = useRef(null);
  const entryAnimation = getEntryAnimation(joinNotice?.animationId || entryAnimationId);
  const activeRoomInvite = roomInvites
    .filter((invite) => invite.status === "pending")
    .sort((a, b) => getInviteTime(b) - getInviteTime(a))[0];

  useEffect(() => {
    return () => stopRecording(false);
  }, []);

  useEffect(() => {
    const previous = outgoingStatusRef.current;
    outgoingInvites.forEach((invite) => {
      const oldStatus = previous.get(invite.id);
      if (oldStatus === "pending" && invite.status !== "pending") {
        window.clearTimeout(feedbackTimerRef.current);
        setInviteFeedback({
          id: invite.id,
          status: invite.status,
          name: invite.toName,
        });
        feedbackTimerRef.current = window.setTimeout(() => setInviteFeedback(null), 4200);
      }
      previous.set(invite.id, invite.status);
    });
    return () => window.clearTimeout(feedbackTimerRef.current);
  }, [outgoingInvites]);

  useEffect(() => {
    if (recordingSeconds < 30) return;
    stopRecording(true);
  }, [recordingSeconds]);

  useEffect(() => {
    if (!profilePreview) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setProfilePreview(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [profilePreview]);

  function openEntryAnimations() {
    setMobileMenuOpen(false);
    setProfileSidebarOpen(false);
    setActiveView("entry-animations");
  }

  function changeTextSize(size) {
    localStorage.setItem("talknesty-text-size", size);
    setTextSize(size);
  }

  async function startRecording() {
    if (!window.isSecureContext) {
      setRecordingError("Voice recording needs HTTPS or localhost. Open the app directly in Chrome.");
      return;
    }

    if (!window.MediaRecorder) {
      setRecordingError("Voice recording is not supported in this browser. Update Chrome and try again.");
      return;
    }

    try {
      const stream = await requestMicrophoneStream();
      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      voiceChunksRef.current = [];
      shouldSendVoiceRef.current = false;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size) voiceChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        window.clearInterval(recordingTimerRef.current);
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;

        if (shouldSendVoiceRef.current && voiceChunksRef.current.length) {
          const blob = new Blob(voiceChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          const durationMs = Math.min(
            30_000,
            Math.max(1, Date.now() - recordingStartedAtRef.current)
          );
          await onSendVoiceMessage(blob, durationMs);
        }

        voiceChunksRef.current = [];
        shouldSendVoiceRef.current = false;
      };

      recorder.start(250);
      setRecordingError("");
      setRecordingSeconds(0);
      setRecording(true);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - recordingStartedAtRef.current) / 1000));
      }, 250);
    } catch (error) {
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        setRecordingError("Allow microphone access from the Chrome address bar.");
      } else if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
        setRecordingError("No microphone was detected. Check your device microphone.");
      } else {
        setRecordingError("Microphone access is unavailable. Open the app directly in a Chrome tab.");
      }
    }
  }

  function stopRecording(shouldSend) {
    window.clearInterval(recordingTimerRef.current);
    shouldSendVoiceRef.current = shouldSend;
    setRecording(false);

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }

  function chooseAttachment(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setRecordingError("Select a photo or video.");
      return;
    }

    if (file.size > 20_000_000) {
      setRecordingError("Photos and videos must be smaller than 20 MB.");
      return;
    }

    clearAttachment();
    setAttachment({
      file,
      kind: isVideo ? "video" : "image",
      previewUrl: URL.createObjectURL(file),
    });
    setRecordingError("");
  }

  function clearAttachment() {
    setAttachment((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }

  async function sendAttachment() {
    if (!attachment) return;
    const sent = await onSendMediaMessage(attachment.file);
    if (sent !== false) clearAttachment();
  }

  return (
    <main className={`chat-layout text-size-${textSize}`}>
      <div className="mobile-safe-strip" aria-hidden="true" />

      <header className="mobile-topbar">
        <div className="mobile-brand">
          <span className="brand-mark mobile">
            <LogoIcon size={21} />
          </span>
          <span>talknesty</span>
        </div>

        <div className="mobile-topbar-actions">
          <button type="button" title="Contacts" onClick={() => setContactsPanelOpen(true)}><ContactRound size={20} /></button>
          <button type="button" title="App settings" onClick={() => setSettingsPanelOpen(true)}><Settings2 size={20} /></button>
          <button
            className="mobile-menu-button"
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-chat-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            title={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <>
        <button
          className={`mobile-menu-backdrop ${mobileMenuOpen ? "open" : ""}`}
          type="button"
          aria-label="Close menu"
          tabIndex={mobileMenuOpen ? 0 : -1}
          onClick={() => setMobileMenuOpen(false)}
        />
        <section
          className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}
          id="mobile-chat-menu"
          aria-hidden={!mobileMenuOpen}
        >
            <div className="mobile-menu-section">
              <h3>{connection === "online" ? <Wifi size={16} /> : <WifiOff size={16} />} Connection</h3>
              <p className={`mobile-connection ${connection}`}>
                <span />
                {connection === "online"
                  ? "You are online"
                  : connection === "connecting"
                  ? "Connecting"
                  : "You are offline"}
              </p>
            </div>

            <div className="mobile-menu-section">
              <h3><Users size={16} /> People</h3>
              <div className="mobile-people">
                {contacts.map((user) => (
                  <div className={`mobile-person ${user.status}`} key={user.id}>
                    <ProfileAvatar className="person-avatar" name={user.name} color={user.color} photoUrl={user.photoUrl} />
                    <div>
                      <p>{user.id === currentUserId ? "You" : user.name}</p>
                      <small>{user.status === "online" ? "Online" : "Offline"}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mobile-menu-actions">
              <button className="mobile-leave-button" type="button" onClick={onLeaveRoom}>
                <ArrowLeft size={17} />
                Back to chats
              </button>
            </div>

            <button className="mobile-entry-button" type="button" onClick={() => {
              setMobileMenuOpen(false);
              setProfileSidebarOpen(true);
            }}>
              <UserRound size={17} />
              Profile
            </button>

        </section>
      </>

      <aside className="sidebar">
        <div className="sidebar-topbar">
          <div className="sidebar-brand">
            <span className="brand-mark small">
              <LogoIcon size={24} />
            </span>
            <h1>talknesty</h1>
          </div>

          <button className="sidebar-settings-button" type="button" title="App settings" onClick={() => setSettingsPanelOpen(true)}>
            <Settings2 size={18} />
          </button>
        </div>

        <button className="sidebar-profile-card" type="button" onClick={() => setProfileSidebarOpen(true)}>
          <ProfileAvatar name={accountProfile?.name || "You"} photoUrl={accountProfile?.photoUrl} />
          <span><strong>{accountProfile?.name || "Your profile"}</strong><small>View and edit profile</small></span>
          <UserRound size={17} />
        </button>

        <div className={`status sidebar-connection ${connection}`}>
          {connection === "online" ? <Wifi size={15} /> : <WifiOff size={15} />}
          <span />
          {connection === "online"
            ? "Connected"
            : connection === "connecting"
              ? "Connecting"
              : "Offline"}
        </div>

        <section className="sidebar-friends sidebar-conversations">
          <button className="sidebar-friends-heading" type="button" onClick={() => setContactsPanelOpen(true)}>
            <span><MessageCircle size={16} /> Chats</span>
            <small><Plus size={14} /> Add contact</small>
          </button>
          <div className="sidebar-friends-list">
            {savedContacts.length ? savedContacts.map((contact) => {
              const preview = conversationPreviews[contact.id];
              const unread = unreadCounts[contact.id] || 0;
              return (
                <button
                  className={`sidebar-friend sidebar-chat-contact ${activeContactId === contact.id ? "active" : ""}`}
                  type="button"
                  key={contact.id}
                  onClick={() => onOpenChat(contact)}
                >
                  <ProfileAvatar name={contact.name} photoUrl={contact.photoUrl} />
                  <span>
                    <strong>{contact.name}</strong>
                    <small>{preview ? `${preview.mine ? "You: " : ""}${preview.text}` : "Start a conversation"}</small>
                  </span>
                  <em>
                    {preview?.createdAt ? formatSidebarTime(preview.createdAt) : ""}
                    {unread ? <b>{unread}</b> : null}
                  </em>
                </button>
              );
            }) : <p>No saved chats yet.</p>}
          </div>
        </section>

        <button className="sidebar-leave-button" type="button" onClick={onLeaveRoom}>
          <ArrowLeft size={18} />
          Back to chats
        </button>
      </aside>

      <section className={`chat-panel ${activeView === "entry-animations" ? "catalog-open" : ""}`}>
        {activeView === "entry-animations" ? (
          <EntryAnimationsPage
            selectedAnimationId={entryAnimationId}
            onBack={() => setActiveView("chat")}
            onSelectAnimation={(animationId) => {
              onSelectEntryAnimation(animationId);
              setActiveView("chat");
            }}
          />
        ) : (
          <>
        {activeRoomInvite ? (
          <RoomInviteBanner
            invite={activeRoomInvite}
            onAccept={onAcceptRoomInvite}
            onDismiss={onDismissRoomInvite}
          />
        ) : null}

        {inviteFeedback ? (
          <div className={`invite-feedback ${inviteFeedback.status}`} role="status">
            {inviteFeedback.status === "accepted"
              ? `${inviteFeedback.name} accepted your room request.`
              : `${inviteFeedback.name} did not accept your request. You can send it again.`}
          </div>
        ) : null}

               {joinNotice ? (
  <div
    className={`join-overlay entry-style-${entryAnimation.id} entry-media-${entryAnimation.type}`}
    key={joinNotice.id}
    style={{
      "--entry-gradient": entryAnimation.gradient,
      "--entry-glow": entryAnimation.glow,
    }}
  >
    <EntryMedia
      animation={entryAnimation}
      className="join-media-bg lottie"
    />

    <div className="join-animation">
      <div className="join-animation-content">
        {joinNotice.preview ? (
          <>
            ✨ <span>{joinNotice.isMe ? "Your" : `${joinNotice.name}'s`}</span> entry animation
          </>
        ) : joinNotice.isMe ? (
          <>
            🚀 <span>You</span> have entered the chat
          </>
        ) : (
          <>
            🎉 <span>{joinNotice.name}</span> joined the room
          </>
        )}
      </div>
    </div>
  </div>
) : null} 
        <header className="chat-header">
          <div className="chat-title">
            <button className="chat-back-button" type="button" title="Back to chats" onClick={onLeaveRoom}>
              <ArrowLeft size={20} />
            </button>
            {primaryContact?.photoUrl ? (
              <button
                className="chat-profile-button"
                type="button"
                title={`View ${primaryContact.name} profile picture`}
                onClick={() => setProfilePreview(primaryContact)}
              >
                <ProfileAvatar className="chat-mark" name={primaryContact.name} color={primaryContact.color} photoUrl={primaryContact.photoUrl} />
              </button>
            ) : primaryContact ? (
              <ProfileAvatar className="chat-mark" name={primaryContact.name} color={primaryContact.color} />
            ) : (
              <span className="chat-mark">
                <Sparkles size={20} />
              </span>
            )}

            <div>
              <h2>{primaryContact?.name || "New chat"}</h2>
              <p className={`chat-presence ${primaryContact?.status || (onlineCount ? "online" : "offline")}`}>
                <span />
                {primaryContact
                  ? primaryContact.status === "online" ? "Online" : "Offline"
                  : onlineCount ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <div className="delivered">
            <CheckCheck size={18} />
            {connection === "online" ? "Live sync" : "Offline"}
          </div>

          {contacts.length > 2 ? (
            <div className="mobile-live-people" aria-label="Room participants">
              {contacts.map((user) =>
                user.photoUrl ? (
                  <button
                    className={`mobile-live-person ${user.status}`}
                    type="button"
                    title={`${user.name} is ${user.status}`}
                    key={user.id}
                    onClick={() => setProfilePreview(user)}
                  >
                    <ProfileAvatar name={user.name} color={user.color} photoUrl={user.photoUrl} />
                  </button>
                ) : (
                  <span className={`mobile-live-person ${user.status}`} title={`${user.name} is ${user.status}`} key={user.id}>
                    <ProfileAvatar name={user.name} color={user.color} />
                  </span>
                )
              )}
            </div>
          ) : null}
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
                  <ProfileAvatar
                    className="avatar"
                    name={message.sender.name}
                    color={message.sender.color}
                    photoUrl={message.sender.photoUrl}
                  />
                ) : null}

                <div className="bubble">
                  {!message.system ? (
                    <div className="message-meta">
                      <strong>{mine ? "You" : message.sender.name}</strong>
                      <span>{timeLabel(message.createdAt)}</span>
                    </div>
                  ) : null}

                  {message.type === "voice" ? (
                    <VoiceMessagePlayer audioUrl={message.audioUrl} durationMs={message.durationMs} />
                  ) : message.type === "media" ? (
                    <div className={`media-message ${message.mediaKind}`}>
                      {message.mediaKind === "video" ? (
                        <video controls playsInline preload="metadata" src={message.mediaUrl} />
                      ) : (
                        <img src={message.mediaUrl} alt={message.fileName || "Shared photo"} />
                      )}
                      <small>Temporary media</small>
                    </div>
                  ) : (
                    <p>{message.text}</p>
                  )}
                </div>
              </article>
            );
          })}

        
  

          {typingText ? <p className="typing">{typingText}</p> : null}
        </div>

        {attachment ? (
          <div className="attachment-draft">
            <div className="attachment-draft-preview">
              {attachment.kind === "video" ? (
                <video muted playsInline src={attachment.previewUrl} />
              ) : (
                <img src={attachment.previewUrl} alt="" />
              )}
            </div>
            <div className="attachment-draft-details">
              <strong>{attachment.file.name}</strong>
              <small>Temporary {attachment.kind}</small>
            </div>
            <button type="button" title="Remove attachment" onClick={clearAttachment}>
              <X size={18} />
            </button>
            <button className="attachment-send-button" type="button" title="Send attachment" onClick={sendAttachment}>
              <Send size={18} />
            </button>
          </div>
        ) : null}

        <form className={`composer ${recording ? "recording" : ""}`} onSubmit={onSendMessage}>
          {recording ? (
            <>
              <div className="voice-recorder-status">
                <span className="recording-dot" />
                <strong>{formatVoiceDuration(recordingSeconds * 1000)}</strong>
                <small>Recording voice message</small>
              </div>

              <button className="voice-cancel-button" type="button" title="Cancel recording" onClick={() => stopRecording(false)}>
                <Trash2 size={19} />
              </button>

              <button className="send-button" type="button" title="Send voice message" onClick={() => stopRecording(true)}>
                <Send size={20} />
              </button>
            </>
          ) : (
            <>
              <input
                ref={attachmentInputRef}
                className="attachment-input"
                type="file"
                accept="image/*,video/*"
                onChange={chooseAttachment}
              />
              <button className="composer-icon-button" type="button" title="Attach photo or video" onClick={() => attachmentInputRef.current?.click()}>
                <Paperclip size={20} />
              </button>

              <div className="composer-input-shell">
                <input
                  ref={inputRef}
                  value={draft}
                  placeholder="Type a message..."
                  maxLength={1200}
                  onChange={(event) => onDraftChange(event.target.value)}
                  onFocus={() => {
                    setTimeout(() => {
                      inputRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 300);
                  }}
                />
                <button className="composer-mic-button" type="button" title="Record voice message" onClick={startRecording}>
                  <Mic size={19} />
                </button>
              </div>

              <button className="send-button" type="submit" title="Send message" disabled={!draft.trim()}>
                <Send size={20} />
              </button>
            </>
          )}
        </form>
        {recordingError ? <p className="recording-error">{recordingError}</p> : null}

        {profilePreview ? (
          <div className="profile-preview-backdrop" role="presentation" onClick={() => setProfilePreview(null)}>
            <section
              className="profile-preview-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${profilePreview.name} profile picture`}
              onClick={(event) => event.stopPropagation()}
            >
              <button className="profile-preview-close" type="button" title="Close profile picture" onClick={() => setProfilePreview(null)}>
                <X size={20} />
              </button>
              <img src={profilePreview.photoUrl} alt={`${profilePreview.name} profile`} />
              <div>
                <h3>{profilePreview.name}</h3>
                <p className={profilePreview.status === "online" ? "online" : "offline"}>
                  {profilePreview.status === "online" ? "Online" : "Offline"}
                </p>
              </div>
            </section>
          </div>
        ) : null}

        <ProfileSidebar
          open={profileSidebarOpen}
          profile={accountProfile}
          onClose={() => setProfileSidebarOpen(false)}
          onLogout={onLogoutAccount}
          onOpenEntryAnimations={openEntryAnimations}
          onSave={onUpdateAccountProfile}
        />

        <ContactsPanel
          open={contactsPanelOpen}
          contacts={savedContacts}
          onClose={() => setContactsPanelOpen(false)}
          onDeleteContact={onDeleteContact}
          onOpenChat={onOpenChat}
          onSearchAccount={onSearchAccount}
        />

        <AppSettingsPanel
          open={settingsPanelOpen}
          theme={theme}
          textSize={textSize}
          onClose={() => setSettingsPanelOpen(false)}
          onTextSizeChange={changeTextSize}
          onToggleTheme={onToggleTheme}
        />
          </>
        )}
      </section>
    </main>
  );
}

function getSupportedAudioMimeType() {
  return [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ].find((type) => MediaRecorder.isTypeSupported(type));
}

function requestMicrophoneStream() {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }

  const legacyGetUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

  if (!legacyGetUserMedia) {
    return Promise.reject(new DOMException("Microphone API unavailable", "NotSupportedError"));
  }

  return new Promise((resolve, reject) => {
    legacyGetUserMedia.call(navigator, { audio: true }, resolve, reject);
  });
}

function formatVoiceDuration(durationMs = 0) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatSidebarTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInviteTime(invite) {
  return invite.createdAt?.toMillis?.() || 0;
}
