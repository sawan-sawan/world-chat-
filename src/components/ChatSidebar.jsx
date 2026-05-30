import { Copy, LogOut, Wifi, WifiOff } from "lucide-react";
import LogoIcon from "./LogoIcon";

export default function ChatSidebar({
  roomId,
  onlineCount,
  connection,
  contacts,
  currentUserId,
  onCopyInvite,
  onLeaveRoom,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark small">
          <LogoIcon size={24} />
        </span>
        <h1>talknesty</h1>
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
              <p>{user.id === currentUserId ? "You" : user.name}</p>
              <small>{user.status === "online" ? "Online" : "Offline"}</small>
            </div>
          </div>
        ))}
      </section>

      <button className="secondary-button" type="button" onClick={onLeaveRoom}>
        <LogOut size={18} />
        Leave Room
      </button>
    </aside>
  );
}
