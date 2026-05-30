import {
  CheckCheck,
  Copy,
  LogOut,
  Send,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import "./ChatPage.css";

export default function ChatPage({
  roomId,
  onlineCount,
  contacts,
  currentUserId,
  primaryContact,
  roomStatus,
  connection,
  error,
  messages,
  typingText,
  draft,
  listRef,
  onCopyInvite,
  onLeaveRoom,
  onDraftChange,
  onSendMessage,
  timeLabel,
}) {
  return (
    <main className="chat-layout">
      <aside className="chat-sidebar">
        <div className="chat-room-card">
          <div>
            <p className="chat-eyebrow">Room</p>
            <h2>{roomId}</h2>
            <p className="chat-room-subtitle">{onlineCount} online now</p>
          </div>
          <button className="chat-icon-button" type="button" title="Copy invite" onClick={onCopyInvite}>
            <Copy size={18} />
          </button>
        </div>

        <div className={`chat-status ${connection}`}>
          {connection === "online" ? <Wifi size={17} /> : <WifiOff size={17} />}
          <span />
          {connection === "online" ? "You are online" : connection === "connecting" ? "Connecting" : "You are offline"}
        </div>

        <section className="chat-people">
          <h3>People</h3>
          {contacts.map((user) => (
            <div className={`chat-person ${user.status}`} key={user.id}>
              <span className="chat-person-avatar" style={{ background: user.color }}>
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p>{user.id === currentUserId ? "You" : user.name}</p>
                <small>{user.status === "online" ? "Online" : "Offline"}</small>
              </div>
            </div>
          ))}
        </section>

        <button className="chat-leave-button" type="button" onClick={onLeaveRoom}>
          <LogOut size={18} />
          Leave
        </button>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div className="chat-title">
            <span className="chat-mark"><Sparkles size={18} /></span>
            <div>
              <p className="chat-eyebrow">Realtime chat</p>
              <h2>{primaryContact?.name || roomId}</h2>
              <p className="chat-subtitle">{roomStatus}</p>
            </div>
          </div>
          <div className="chat-delivered">
            <CheckCheck size={18} />
            {connection === "online" ? "Live sync" : "Offline"}
          </div>
        </header>

        {error ? <p className="page-error chat-inline-error">{error}</p> : null}

        <div className="chat-messages" ref={listRef}>
          {messages.map((message) => {
            const mine = message.sender.id === currentUserId;
            return (
              <article
                className={`chat-message ${mine ? "mine" : ""} ${message.system ? "system" : ""}`}
                key={message.id}
              >
                {!message.system ? (
                  <div className="chat-avatar" style={{ background: message.sender.color }}>
                    {message.sender.name.slice(0, 1).toUpperCase()}
                  </div>
                ) : null}
                <div className="chat-bubble">
                  {!message.system ? (
                    <div className="chat-message-meta">
                      <strong>{mine ? "You" : message.sender.name}</strong>
                      <span>{timeLabel(message.createdAt)}</span>
                    </div>
                  ) : null}
                  <p>{message.text}</p>
                </div>
              </article>
            );
          })}
          {typingText ? <p className="chat-typing">{typingText}</p> : null}
        </div>

        <form className="chat-composer" onSubmit={onSendMessage}>
          <input
            value={draft}
            placeholder="Message likhein..."
            maxLength={1200}
            onChange={(event) => onDraftChange(event.target.value)}
          />
          <button className="chat-send-button" type="submit" title="Send message">
            <Send size={20} />
          </button>
        </form>
      </section>
    </main>
  );
}
