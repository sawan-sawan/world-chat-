import React, { useState } from "react";
import { Check, Plus, Search, UserPlus, UsersRound, X } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import "./ContactsPanel.css";

export default function ContactsPanel({
  open,
  contacts,
  roomId,
  outgoingInvites,
  onClose,
  onSearchAccount,
  onSendRoomInvite,
}) {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [message, setMessage] = useState("");
  const [sentContactId, setSentContactId] = useState("");

  if (!open) return null;

  async function findContact(event) {
    event.preventDefault();
    try {
      const match = await onSearchAccount(search);
      setSearchResult(match);
      setMessage(match ? "" : "Is mobile number se koi Talknesty user nahi mila.");
    } catch {
      setMessage("Search complete nahi hui. Firestore rules check karein.");
    }
  }

  async function sendInvite(profile) {
    if (!profile) return;
    try {
      await onSendRoomInvite(profile);
      setMessage(`${profile.name || profile.username} ko room request send ho gayi.`);
      setSentContactId(profile.id);
      window.setTimeout(() => setSentContactId(""), 1800);
    } catch (error) {
      setMessage(error?.message || "Request send nahi hui. Updated Firestore rules publish karein.");
    }
  }

  function hasPendingInvite(contactId) {
    return outgoingInvites.some((invite) => invite.toUid === contactId && invite.status === "pending");
  }

  return (
    <div className="contacts-panel-backdrop" onClick={onClose}>
      <aside className="contacts-panel" onClick={(event) => event.stopPropagation()}>
        <header className="contacts-panel-header">
          <div className="contacts-panel-heading">
            <span><UsersRound size={19} /></span>
            <div>
              <p>Talknesty network</p>
              <h2>Contacts</h2>
            </div>
          </div>
          <button type="button" title="Close contacts" onClick={onClose}><X size={20} /></button>
        </header>

        <section className="contact-discovery">
          <div className="contacts-section-title">
            <UserPlus size={17} />
            <div>
              <h3>Add a contact</h3>
              <p>Search with a saved mobile number.</p>
            </div>
          </div>
          <form onSubmit={findContact}>
            <input
              value={search}
              inputMode="tel"
              placeholder="+91 mobile number"
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" title="Search contact"><Search size={18} /></button>
          </form>

          {searchResult ? (
            <ContactRow
              contact={searchResult}
              disabled={hasPendingInvite(searchResult.id)}
              sent={sentContactId === searchResult.id}
              onInvite={() => sendInvite(searchResult)}
            />
          ) : null}
        </section>

        <section className="saved-contact-list">
          <div className="contacts-section-title">
            <UsersRound size={17} />
            <div>
              <h3>Saved contacts</h3>
              <p>Invite someone to room {roomId}.</p>
            </div>
          </div>
          {contacts.length ? contacts.map((contact) => (
            <ContactRow
              contact={contact}
              disabled={hasPendingInvite(contact.id)}
              sent={sentContactId === contact.id}
              key={contact.id}
              onInvite={() => sendInvite(contact)}
            />
          )) : <p className="contacts-empty">Your saved contacts will appear here.</p>}
        </section>

        {message ? <p className="contacts-panel-message">{message}</p> : null}
      </aside>
    </div>
  );
}

function ContactRow({ contact, disabled, sent, onInvite }) {
  return (
    <div className="contact-row">
      <ProfileAvatar name={contact.name} photoUrl={contact.photoUrl} />
      <div>
        <strong>{contact.name || contact.username}</strong>
        <small>{contact.phone || "Talknesty contact"}</small>
      </div>
      <button className={disabled ? "pending" : ""} type="button" title={disabled ? "Request waiting for response" : "Send room request"} disabled={disabled} onClick={onInvite}>
        {sent ? <Check size={16} /> : <Plus size={17} />}
      </button>
    </div>
  );
}
