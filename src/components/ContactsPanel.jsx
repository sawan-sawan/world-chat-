import React, { useState } from "react";
import { MessageCircle, Search, Trash2, UserPlus, UsersRound, X } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import "./ContactsPanel.css";

export default function ContactsPanel({
  open,
  contacts,
  onClose,
  onDeleteContact,
  onOpenChat,
  onSearchAccount,
}) {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [message, setMessage] = useState("");

  if (!open) return null;

  async function findContact(event) {
    event.preventDefault();
    try {
      const match = await onSearchAccount(search);
      setSearchResult(match);
      setMessage(match ? "" : "No Talknesty user was found with this mobile number.");
    } catch {
      setMessage("Search could not be completed. Check your Firestore rules.");
    }
  }

  async function openChat(profile) {
    if (!profile) return;
    await onOpenChat(profile);
    onClose();
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
              onOpen={() => openChat(searchResult)}
            />
          ) : null}
        </section>

        <section className="saved-contact-list">
          <div className="contacts-section-title">
            <UsersRound size={17} />
            <div>
              <h3>Saved contacts</h3>
              <p>Choose a contact to start chatting.</p>
            </div>
          </div>
          {contacts.length ? contacts.map((contact) => (
            <ContactRow
              contact={contact}
              key={contact.id}
              onDelete={() => onDeleteContact(contact)}
              onOpen={() => openChat(contact)}
            />
          )) : <p className="contacts-empty">Your saved contacts will appear here.</p>}
        </section>

        {message ? <p className="contacts-panel-message">{message}</p> : null}
      </aside>
    </div>
  );
}

function ContactRow({ contact, onDelete, onOpen }) {
  return (
    <div className="contact-row">
      <ProfileAvatar name={contact.name} photoUrl={contact.photoUrl} />
      <div>
        <strong>{contact.name || contact.username}</strong>
        <small>{contact.phone || "Talknesty contact"}</small>
      </div>
      <button type="button" title={`Message ${contact.name}`} onClick={onOpen}>
        <MessageCircle size={17} />
      </button>
      {onDelete ? (
        <button className="delete" type="button" title={`Delete ${contact.name} contact`} onClick={onDelete}>
          <Trash2 size={15} />
        </button>
      ) : null}
    </div>
  );
}
