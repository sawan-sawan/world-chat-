import React from "react";
import { ArrowRight, User, Users } from "lucide-react";
import LogoIcon from "../components/LogoIcon";
import "./LoginPage.css";

export default function LoginPage({
  error,
  name,
  roomInput,
  theme,
  ThemeButton,
  onToggleTheme,
  onGenerateRoom,
  onNameChange,
  onRoomChange,
  onSubmit,
}) {
  return (
    <main className="shell">
      <section className="auth-panel">
        <div className="brand-row hero-brand">
          <span className="brand-mark">
            <LogoIcon size={30} />
          </span>

          <div>
            <h1>talknesty</h1>
            <p>Join a room and start chatting instantly with anyone, anywhere.</p>
          </div>

          {ThemeButton ? (
            <ThemeButton theme={theme} onToggleTheme={onToggleTheme} className="auth-theme-btn" />
          ) : null}
        </div>

        <form className="join-form" onSubmit={onSubmit}>
          <label>
            Name
            <div className="input-icon">
              <User size={20} />
              <input
                autoFocus
                value={name}
                maxLength={28}
                placeholder="Name"
                onChange={(event) => onNameChange(event.target.value)}
              />
            </div>
          </label>

          <label>
            Room ID
            <div className="input-action">
              <div className="input-icon">
                <Users size={20} />
                <input
                  value={roomInput}
                  maxLength={32}
                  placeholder="Room ID"
                  onChange={(event) => onRoomChange(event.target.value.toUpperCase())}
                />
              </div>

              <button
                type="button"
                className="icon-button"
                title="New room code"
                onClick={onGenerateRoom}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button className="primary-button" type="submit">
            Login
          </button>
        </form>
      </section>
    </main>
  );
}
