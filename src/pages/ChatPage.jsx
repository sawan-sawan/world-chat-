import React, { useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  Copy,
  Hash,
  LogOut,
  Menu,
  Mic,
  PartyPopper,
  Send,
  Sparkles,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import LogoIcon from "../components/LogoIcon";
import EntryMedia from "../components/EntryMedia";
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
  roomStatus,
  theme,
  ThemeButton,
  typingText,
  onCopyInvite,
  onDraftChange,
  onLeaveRoom,
  onSendMessage,
  onSendVoiceMessage,
  onToggleTheme,
  timeLabel,
  joinNotice,
  entryAnimationId,
  onSelectEntryAnimation,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("chat");
  const [recording, setRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const recordingTimerRef = useRef(null);
  const shouldSendVoiceRef = useRef(false);
  const entryAnimation = getEntryAnimation(entryAnimationId);

  useEffect(() => {
    return () => stopRecording(false);
  }, []);

  useEffect(() => {
    if (recordingSeconds < 30) return;
    stopRecording(true);
  }, [recordingSeconds]);

  function openEntryAnimations() {
    setMobileMenuOpen(false);
    setActiveView("entry-animations");
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
        setRecordingError("Chrome address bar se microphone permission Allow karein.");
      } else if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
        setRecordingError("Microphone detect nahi hua. Device microphone check karein.");
      } else {
        setRecordingError("Microphone access unavailable hai. App ko direct Chrome tab mein open karein.");
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

  return (
    <main className="chat-layout">
      <div className="mobile-safe-strip" aria-hidden="true" />

      <header className="mobile-topbar">
        <div className="mobile-brand">
          <span className="brand-mark mobile">
            <LogoIcon size={21} />
          </span>
          <span>talknesty</span>
        </div>

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
              <h3><Hash size={16} /> Room details</h3>
              <div className="mobile-room-row">
                <div>
                  <strong>{roomId}</strong>
                  <span>{onlineCount} online now</span>
                </div>
                <button className="mobile-action-button" type="button" title="Copy invite" onClick={onCopyInvite}>
                  <Copy size={17} />
                  <span>Copy</span>
                </button>
              </div>
            </div>

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
                    <span className="person-avatar" style={{ background: user.color }}>
                      {user.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p>{user.id === currentUserId ? "You" : user.name}</p>
                      <small>{user.status === "online" ? "Online" : "Offline"}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mobile-menu-actions">
              {ThemeButton ? (
                <ThemeButton theme={theme} onToggleTheme={onToggleTheme} className="mobile-theme-btn" />
              ) : null}
              <button className="mobile-leave-button" type="button" onClick={onLeaveRoom}>
                <LogOut size={17} />
                Leave room
              </button>
            </div>

            <button className="mobile-entry-button" type="button" onClick={openEntryAnimations}>
              <PartyPopper size={17} />
              Entry Animate
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

          {ThemeButton ? (
            <ThemeButton theme={theme} onToggleTheme={onToggleTheme} className="chat-theme-btn" />
          ) : null}
        </div>

        <div className="room-card">
          <div>
            <p className="eyebrow">Room</p>
            <h2>{roomId}</h2>
            <p className="room-subtitle">{onlineCount} online now</p>
          </div>

          <button className="icon-button" type="button" title="Copy invite" onClick={onCopyInvite}>
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
                <p className="user-name">{user.id === currentUserId ? "You" : user.name}</p>
                <small className="user-status">{user.status === "online" ? "Online" : "Offline"}</small>
              </div>
            </div>
          ))}
        </section>

        <div className="sidebar-actions">
          <button className="sidebar-entry-button" type="button" onClick={openEntryAnimations}>
            <PartyPopper size={18} />
            Entry Animate
          </button>

          <button className="secondary-button" type="button" onClick={onLeaveRoom}>
            <LogOut size={18} />
            Leave Room
          </button>
        </div>
      </aside>

      <section className={`chat-panel ${activeView === "entry-animations" ? "catalog-open" : ""}`}>
        {activeView === "entry-animations" ? (
          <EntryAnimationsPage
            selectedAnimationId={entryAnimationId}
            onBack={() => setActiveView("chat")}
            onSelectAnimation={onSelectEntryAnimation}
          />
        ) : (
          <>
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
      className={`join-media-bg ${entryAnimation.type === "video" ? "video" : "lottie"}`}
    />

    <div className="join-animation">
      <div className="join-animation-content">
        {joinNotice.isMe ? (
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

                  {message.type === "voice" ? (
                    <div className="voice-message">
                      <Mic size={16} />
                      <audio controls preload="metadata" src={message.audioUrl} />
                      <span>{formatVoiceDuration(message.durationMs)}</span>
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
                ref={inputRef}
                value={draft}
                placeholder="Message likhein..."
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

              {draft.trim() ? (
                <button className="send-button" type="submit" title="Send message">
                  <Send size={20} />
                </button>
              ) : (
                <button className="send-button voice-start-button" type="button" title="Record voice message" onClick={startRecording}>
                  <Mic size={20} />
                </button>
              )}
            </>
          )}
        </form>
        {recordingError ? <p className="recording-error">{recordingError}</p> : null}
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
