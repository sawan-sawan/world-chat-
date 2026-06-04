import React, { useEffect, useState } from "react";

export default function ProfileAvatar({
  name = "Guest",
  color = "#2563eb",
  photoUrl = "",
  className = "",
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  const showPhoto = photoUrl && !imageFailed;

  return (
    <span
      className={`profile-avatar ${className}`.trim()}
      style={{ background: color }}
      aria-label={`${name} profile picture`}
    >
      {showPhoto ? (
        <img src={photoUrl} alt="" onError={() => setImageFailed(true)} />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
