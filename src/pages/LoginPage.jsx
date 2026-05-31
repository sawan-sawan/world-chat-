import React, { useRef } from "react";
import { ArrowRight, Camera, Trash2, User, Users } from "lucide-react";
import LogoIcon from "../components/LogoIcon";
import ProfileAvatar from "../components/ProfileAvatar";
import "./LoginPage.css";

export default function LoginPage({
  error,
  name,
  profilePhoto,
  roomInput,
  onGenerateRoom,
  onNameChange,
  onProfilePhotoChange,
  onRoomChange,
  onSubmit,
}) {
  const photoInputRef = useRef(null);

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

        </div>

        <form className="join-form" onSubmit={onSubmit}>
          <div className="profile-photo-field">
            <ProfileAvatar
              className="login-profile-avatar"
              name={name || "You"}
              photoUrl={profilePhoto}
            />

            <div>
              <strong>Profile picture</strong>
              <p>Choose a photo from your device</p>
            </div>

            <input
              ref={photoInputRef}
              className="profile-photo-input"
              type="file"
              accept="image/*"
              onChange={(event) => {
                onProfilePhotoChange(event.target.files?.[0]);
                event.target.value = "";
              }}
            />

            <button
              className="profile-photo-action"
              type="button"
              title={profilePhoto ? "Change profile picture" : "Add profile picture"}
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={18} />
            </button>

            {profilePhoto ? (
              <button
                className="profile-photo-action remove"
                type="button"
                title="Remove profile picture"
                onClick={() => onProfilePhotoChange(null)}
              >
                <Trash2 size={17} />
              </button>
            ) : null}
          </div>

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
