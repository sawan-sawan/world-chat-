import React from "react";

export default function ProfileAvatar({
  name = "Guest",
  color = "#2563eb",
  photoUrl = "",
  className = "",
}) {
  return (
    <span
      className={`profile-avatar ${className}`.trim()}
      style={{ background: color }}
      aria-label={`${name} profile picture`}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
