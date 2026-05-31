import React, { useEffect, useRef, useState } from "react";
import { AtSign, Camera, LogOut, Mail, PartyPopper, Phone, Save, ShieldCheck, Sparkles, X } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import "./ProfileSidebar.css";

export default function ProfileSidebar({
  open,
  profile,
  onClose,
  onLogout,
  onOpenEntryAnimations,
  onSave,
}) {
  const [draft, setDraft] = useState(profile || {});
  const [message, setMessage] = useState("");
  const fileRef = useRef(null);

  useEffect(() => setDraft(profile || {}), [profile]);

  if (!open) return null;

  async function saveProfile(event) {
    event.preventDefault();
    await onSave({
      name: String(draft.name || "").trim().slice(0, 28),
      username: String(draft.username || "").trim().slice(0, 24),
      phone: String(draft.phone || "").trim().slice(0, 18),
      photoUrl: draft.photoUrl || "",
    });
    setMessage("Profile updated.");
  }

  async function choosePhoto(file) {
    if (!file?.type.startsWith("image/")) return;
    const photoUrl = await resizePhoto(file);
    setDraft((current) => ({ ...current, photoUrl }));
  }

  return (
    <div className="profile-drawer-backdrop" onClick={onClose}>
      <aside className="profile-drawer" onClick={(event) => event.stopPropagation()}>
        <header>
          <div className="profile-heading">
            <span><ShieldCheck size={19} /></span>
            <div>
              <p>Account settings</p>
              <h2>Your profile</h2>
            </div>
          </div>
          <button type="button" title="Close profile" onClick={onClose}><X size={20} /></button>
        </header>

        <form className="profile-editor" onSubmit={saveProfile}>
          <div className="profile-editor-photo">
            <ProfileAvatar name={draft.name || "You"} photoUrl={draft.photoUrl} />
            <div>
              <strong>{draft.name || "Your name"}</strong>
              <small>Personalize your Talknesty account</small>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={(event) => choosePhoto(event.target.files?.[0])} />
            <button type="button" title="Change profile picture" onClick={() => fileRef.current?.click()}><Camera size={17} /></button>
          </div>
          <label><span><AtSign size={15} /> Display name</span><input value={draft.name || ""} placeholder="Your name" onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label><span><Phone size={15} /> Mobile number</span><input value={draft.phone || ""} inputMode="tel" placeholder="+91 mobile number" onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></label>
          <label><span><Mail size={15} /> Account email</span><input value={draft.email || ""} readOnly /></label>
          <button className="profile-save-button" type="submit"><Save size={17} /> Save profile</button>
        </form>

        {message ? <p className="profile-drawer-message">{message}</p> : null}
        <button className="profile-animation-button" type="button" onClick={onOpenEntryAnimations}>
          <span><PartyPopper size={19} /></span>
          <div><strong>Entry animations</strong><small>Choose how you enter a room</small></div>
          <Sparkles size={17} />
        </button>
        <p className="profile-security-note"><ShieldCheck size={16} /> Your profile stays linked to your login account.</p>
        <button className="profile-logout-button" type="button" onClick={onLogout}><LogOut size={17} /> Log out</button>
      </aside>
    </div>
  );
}

async function resizePhoto(file) {
  const source = await readFile(file);
  const image = await loadImage(source);
  const crop = Math.min(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 240;
  canvas.height = 240;
  context.drawImage(image, (image.naturalWidth - crop) / 2, (image.naturalHeight - crop) / 2, crop, crop, 0, 0, 240, 240);
  return canvas.toDataURL("image/jpeg", 0.78);
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}
