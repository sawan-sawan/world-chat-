export default function MessageList({
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

      {typingText ? <p className="typing">{typingText}</p> : null}
    </div>
  );
}
