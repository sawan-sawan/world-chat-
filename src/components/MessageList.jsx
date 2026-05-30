export default function MessageList({
  contacts,
  currentUserId,
  listRef,
  messages,
  timeLabel,
  typingText,
}) {
  return (
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

      {contacts
        .filter((user) => user.status === "online" && user.id !== currentUserId)
        .slice(-1)
        .map((user) => (
          <div className="join-animation" key={`join-${user.id}`}>
            🎉 <span>{user.name}</span> joined the room
          </div>
        ))}

      {typingText ? <p className="typing">{typingText}</p> : null}
    </div>
  );
}
