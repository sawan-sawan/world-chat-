import { CheckCheck, Sparkles } from "lucide-react";

export default function ChatHeader({ primaryContact, roomId, roomStatus, connection }) {
  return (
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
  );
}
