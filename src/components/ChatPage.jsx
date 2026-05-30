import ChatHeader from "./ChatHeader";
import ChatSidebar from "./ChatSidebar";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";

export default function ChatPage({
  contacts,
  connection,
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
  timeLabel,
  typingText,
  onCopyInvite,
  onDraftChange,
  onLeaveRoom,
  onSendMessage,
}) {
  return (
    <main className="chat-layout">
      <ChatSidebar
        roomId={roomId}
        onlineCount={onlineCount}
        connection={connection}
        contacts={contacts}
        currentUserId={currentUserId}
        onCopyInvite={onCopyInvite}
        onLeaveRoom={onLeaveRoom}
      />

      <section className="chat-panel">
        <ChatHeader
          primaryContact={primaryContact}
          roomId={roomId}
          roomStatus={roomStatus}
          connection={connection}
        />

        {error ? <p className="error inline">{error}</p> : null}

        <MessageList
          contacts={contacts}
          currentUserId={currentUserId}
          listRef={listRef}
          messages={messages}
          timeLabel={timeLabel}
          typingText={typingText}
        />

        <MessageComposer
          draft={draft}
          inputRef={inputRef}
          onDraftChange={onDraftChange}
          onSubmit={onSendMessage}
        />
      </section>
    </main>
  );
}
