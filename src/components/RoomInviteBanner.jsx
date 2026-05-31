import React, { useEffect, useState } from "react";
import { Check, Clock3, X } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";

const INVITE_DURATION_MS = 5000;

export default function RoomInviteBanner({ invite, onAccept, onDismiss }) {
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(invite));

  useEffect(() => {
    setRemainingMs(getRemainingMs(invite));
    const timer = window.setInterval(() => {
      const nextRemaining = getRemainingMs(invite);
      setRemainingMs(nextRemaining);
      if (nextRemaining <= 0) {
        window.clearInterval(timer);
        onDismiss(invite, "expired");
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [invite.id]);

  const progress = Math.max(0, Math.min(100, (remainingMs / INVITE_DURATION_MS) * 100));

  return (
    <section className="room-invite-banner" aria-label="Room request">
      <ProfileAvatar name={invite.fromName} photoUrl={invite.fromPhotoUrl} />
      <div className="room-invite-copy">
        <span><Clock3 size={13} /> Room request</span>
        <strong>{invite.fromName} invited you</strong>
        <small>Join room {invite.roomId}?</small>
      </div>
      <button className="room-invite-accept" type="button" title="Accept room request" onClick={() => onAccept(invite)}>
        <Check size={19} />
      </button>
      <button className="room-invite-decline" type="button" title="Decline room request" onClick={() => onDismiss(invite, "declined")}>
        <X size={18} />
      </button>
      <span className="room-invite-timeline" style={{ "--invite-progress": `${progress}%` }} />
    </section>
  );
}

function getRemainingMs(invite) {
  const expiresAt = invite?.expiresAt?.toMillis?.()
    || ((invite?.createdAt?.toMillis?.() || 0) + INVITE_DURATION_MS);
  return Math.max(0, expiresAt - Date.now());
}
