import React, { useState } from "react";
import Lottie from "lottie-react";
import confettiAnimation from "../assets/confetti.json";
import {
  CheckCheck,
  Copy,
  Hash,
  LogOut,
  Menu,
  Send,
  Sparkles,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import LogoIcon from "../components/LogoIcon";
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
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="chat-layout">
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

      {mobileMenuOpen ? (
        <>
          <button
            className="mobile-menu-backdrop"
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <section className="mobile-menu" id="mobile-chat-menu">
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
          </section>
        </>
      ) : null}

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

        <button className="secondary-button" type="button" onClick={onLeaveRoom}>
          <LogOut size={18} />
          Leave Room
        </button>
      </aside>

      <section className="chat-panel">
               {joinNotice ? (
  <div className="join-overlay" key={joinNotice.id}>
    <Lottie
      animationData={confettiAnimation}
      loop={false}
      className="join-lottie-bg"
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
      </section>
    </main>
  );
}
