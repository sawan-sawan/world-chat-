import React, { useEffect, useRef, useState } from "react";
import { Camera, Check, LogOut, Save, Search, Send, X } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import "./ProfileSidebar.css";

export default function ProfileSidebar({
  open,
  profile,
  contacts,
  roomId,
  roomInvites,
  onAcceptRoomInvite,
  onClose,
  onDismissRoomInvite,
  onLogout,
  onSave,
  onSearchAccount,
  onSendRoomInvite,
}) {
  const [draft, setDraft] = useState(profile || {});
  const [accountSearch, setAccountSearch] = useState("");
  const [searchResult, setSearchResult] = useState(null);
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

  async function findContact(event) {
    event.preventDefault();
    try {
      const match = await onSearchAccount(accountSearch);
      setSearchResult(match);
      setMessage(match ? "" : "Is mobile number se koi Talknesty user nahi mila.");
    } catch {
      setMessage("Search complete nahi hui. Firestore rules check karein.");
    }
  }

  async function sendInvite() {
    if (!searchResult) return;
    try {
      await onSendRoomInvite(searchResult);
      setMessage(`${searchResult.name || searchResult.username} contact mein save ho gaya aur room ${roomId} ka invite send ho gaya.`);
    } catch {
      setMessage("Invite send nahi hua. Updated Firestore rules publish karein.");
    }
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
          <div>
            <p>Account</p>
            <h2>Your profile</h2>
          </div>
          <button type="button" title="Close profile" onClick={onClose}><X size={20} /></button>
        </header>

        <form className="profile-editor" onSubmit={saveProfile}>
          <div className="profile-editor-photo">
            <ProfileAvatar name={draft.name || "You"} photoUrl={draft.photoUrl} />
            <input ref={fileRef} type="file" accept="image/*" onChange={(event) => choosePhoto(event.target.files?.[0])} />
            <button type="button" title="Change profile picture" onClick={() => fileRef.current?.click()}><Camera size={17} /></button>
          </div>
          <label>Name<input value={draft.name || ""} placeholder="Your name" onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>Mobile number<input value={draft.phone || ""} inputMode="tel" placeholder="+91 mobile number" onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></label>
          <button className="profile-save-button" type="submit"><Save size={17} /> Save profile</button>
        </form>

        <section className="profile-contact-section">
          <h3>Find people</h3>
          <form onSubmit={findContact}>
            <input value={accountSearch} inputMode="tel" placeholder="+91 mobile number" onChange={(event) => setAccountSearch(event.target.value)} />
            <button type="submit" title="Search user"><Search size={17} /></button>
          </form>
          {searchResult ? (
            <div className="profile-search-result">
              <ProfileAvatar name={searchResult.name} photoUrl={searchResult.photoUrl} />
              <div><strong>{searchResult.name}</strong><small>{searchResult.phone}</small></div>
              <button type="button" title={`Save contact and invite to room ${roomId}`} onClick={sendInvite}><Send size={16} /></button>
            </div>
          ) : null}
        </section>

        <section className="profile-invite-list">
          <h3>Room requests</h3>
          {roomInvites.length ? roomInvites.map((invite) => (
            <div className="profile-invite" key={invite.id}>
              <ProfileAvatar name={invite.fromName} photoUrl={invite.fromPhotoUrl} />
              <span><strong>{invite.fromName}</strong><small>Room {invite.roomId}</small></span>
              <button type="button" title="Accept room request" onClick={() => onAcceptRoomInvite(invite)}><Check size={16} /></button>
              <button type="button" title="Dismiss room request" onClick={() => onDismissRoomInvite(invite)}><X size={16} /></button>
            </div>
          )) : <p>No pending room requests.</p>}
        </section>

        <section className="profile-contact-list">
          <h3>Saved contacts</h3>
          {contacts.length ? contacts.map((contact) => (
            <div key={contact.id}>
              <ProfileAvatar name={contact.name} photoUrl={contact.photoUrl} />
              <span><strong>{contact.name}</strong><small>{contact.phone}</small></span>
              <button type="button" title={`Invite ${contact.name} to room ${roomId}`} onClick={() => onSendRoomInvite(contact)}><Send size={16} /></button>
            </div>
          )) : <p>No saved contacts yet.</p>}
        </section>

        {message ? <p className="profile-drawer-message">{message}</p> : null}
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
