import {
  ArrowRight,
  LockKeyhole,
  MessageCircle,
  Signal,
  Smartphone,
  Users,
} from "lucide-react";
import "./LoginPage.css";

export default function LoginPage({
  name,
  roomInput,
  color,
  colors,
  error,
  onNameChange,
  onRoomChange,
  onColorChange,
  onGenerateRoom,
  onSubmit,
}) {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand">
          <span className="login-brand-mark"><MessageCircle size={26} /></span>
          <div>
            <h1>talknesty</h1>
            <p>Join a room and start chatting instantly with anyone, anywhere.</p>
          </div>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label>
            Your name
            <input
              autoFocus
              value={name}
              maxLength={28}
              placeholder="Sawan"
              onChange={(event) => onNameChange(event.target.value)}
            />
          </label>

          <label>
            Room code
            <div className="login-input-action">
              <input
                value={roomInput}
                maxLength={32}
                placeholder="FAMILY01"
                onChange={(event) => onRoomChange(event.target.value.toUpperCase())}
              />
              <button
                type="button"
                className="login-icon-button"
                title="New room code"
                onClick={onGenerateRoom}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </label>

          <div className="login-color-row" aria-label="Choose profile color">
            {colors.map((item) => (
              <button
                key={item}
                type="button"
                className={`login-swatch ${item === color ? "selected" : ""}`}
                style={{ background: item }}
                title={`Use ${item}`}
                onClick={() => onColorChange(item)}
              />
            ))}
          </div>

          {error ? <p className="page-error">{error}</p> : null}

          <button className="login-primary-button" type="submit">
            <Smartphone size={18} />
              Login
          </button>
        </form>

        <div className="login-feature-strip">
          <span><Signal size={16} /> Realtime</span>
          <span><LockKeyhole size={16} /> Room code</span>
          <span><Users size={16} /> Presence</span>
        </div>
      </section>
    </main>
  );
}
