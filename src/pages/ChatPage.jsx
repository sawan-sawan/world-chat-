import React, { useState } from "react";
import {
  CheckCheck,
  Copy,
  Hash,
  LogOut,
  Menu,
  PartyPopper,
  Send,
  Sparkles,
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
  onToggleTheme,
  timeLabel,
  joinNotice,
  entryAnimationId,
  onSelectEntryAnimation,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("chat");
  const entryAnimation = getEntryAnimation(entryAnimationId);

  function openEntryAnimations() {
    setMobileMenuOpen(false);
    setActiveView("entry-animations");
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

                  <p>{message.text}</p>
                </div>
              </article>
            );
          })}

        
  

          {typingText ? <p className="typing">{typingText}</p> : null}
        </div>

        <form className="composer" onSubmit={onSendMessage}>
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

          <button className="send-button" type="submit" title="Send message">
            <Send size={20} />
          </button>
        </form>
          </>
        )}
      </section>
    </main>
  );
}
