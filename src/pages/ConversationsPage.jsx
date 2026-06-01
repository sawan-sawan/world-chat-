import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  MessageCircle,
  Search,
  Settings2,
  Trash2,
  UserPlus,
} from "lucide-react";
import LogoIcon from "../components/LogoIcon";
import ProfileAvatar from "../components/ProfileAvatar";
import ProfileSidebar from "../components/ProfileSidebar";
import AppSettingsPanel from "../components/AppSettingsPanel";
import RoomInviteBanner from "../components/RoomInviteBanner";
import EntryAnimationsPage from "./EntryAnimationsPage";
import "./ConversationsPage.css";

export default function ConversationsPage({
  accountProfile,
  contacts,
  conversationPreviews,
  entryAnimationId,
  error,
  roomInvites,
  theme,
  onAcceptRoomInvite,
  onDeleteContact,
  onDismissRoomInvite,
  onLogoutAccount,
  onOpenChat,
  onSearchAccount,
  onSelectEntryAnimation,
  onToggleTheme,
  onUpdateAccountProfile,
}) {
  const [activeView, setActiveView] = useState("chats");
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [textSize, setTextSize] = useState(
    () => localStorage.getItem("talknesty-text-size") || "medium"
  );
  const searchRef = useRef(null);
  const cleanQuery = query.trim().toLowerCase();
  const isNameSearch = /[a-z]/i.test(cleanQuery);
  const filteredContacts = useMemo(() => {
    if (!isNameSearch) return contacts;
    return contacts.filter((contact) =>
      String(contact.name || contact.username || "")
        .toLowerCase()
        .includes(cleanQuery)
    );
  }, [cleanQuery, contacts, isNameSearch]);
  const visibleSearchMessage =
    searchMessage ||
    (isNameSearch && !filteredContacts.length
      ? "This contact is not in your saved chats."
      : "");
  const activeRoomInvite = roomInvites
    .filter((invite) => invite.status === "pending")
    .sort((first, second) => inviteTime(second) - inviteTime(first))[0];

  async function searchContact(event) {
    event.preventDefault();
    const submittedQuery = query.trim();

    if (!submittedQuery) {
      searchRef.current?.focus();
      setSearchMessage("Enter a contact name or mobile number.");
      setSearchResult(null);
      return;
    }

    if (/[a-z]/i.test(submittedQuery)) {
      setSearchResult(null);
      setSearchMessage(
        filteredContacts.length
          ? ""
          : "This contact is not in your saved chats."
      );
      return;
    }

    setSearching(true);
    setSearchMessage("");

    try {
      const result = await onSearchAccount(submittedQuery);
      if (!result) {
        setSearchResult(null);
        setSearchMessage("No Talknesty account was found for this number.");
      } else if (result.id === accountProfile?.id) {
        setSearchResult(null);
        setSearchMessage("This is your Talknesty account.");
      } else {
        setSearchResult(result);
      }
    } catch {
      setSearchResult(null);
      setSearchMessage("Contact search is unavailable right now. Try again.");
    } finally {
      setSearching(false);
    }
  }

  function changeTextSize(size) {
    localStorage.setItem("talknesty-text-size", size);
    setTextSize(size);
  }

  if (activeView === "entry-animations") {
    return (
      <main className="conversations-page">
        <header className="conversations-topbar">
          <div className="conversations-brand">
            <span><LogoIcon size={23} /></span>
            <h1>talknesty</h1>
          </div>
        </header>
        <section className="conversations-catalog">
          <EntryAnimationsPage
            selectedAnimationId={entryAnimationId}
            onBack={() => setActiveView("chats")}
            onSelectAnimation={(animationId) => {
              onSelectEntryAnimation(animationId);
              setActiveView("chats");
            }}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="conversations-page">
      <header className="conversations-topbar">
        <div className="conversations-brand">
          <span><LogoIcon size={23} /></span>
          <div>
            <h1>talknesty</h1>
            <p>Chats</p>
          </div>
        </div>

        <div className="conversations-actions">
          <button type="button" title="Focus contact search" onClick={() => searchRef.current?.focus()}>
            <Search size={19} />
          </button>
          <button type="button" title="App settings" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={19} />
          </button>
          <button className="conversations-profile-button" type="button" title="Your profile" onClick={() => setProfileOpen(true)}>
            <ProfileAvatar name={accountProfile?.name || "You"} photoUrl={accountProfile?.photoUrl} />
          </button>
        </div>
      </header>

      <section className="conversations-content">
        {activeRoomInvite ? (
          <RoomInviteBanner
            invite={activeRoomInvite}
            onAccept={onAcceptRoomInvite}
            onDismiss={onDismissRoomInvite}
          />
        ) : null}

        <div className="conversations-intro">
          <p>Your conversations</p>
          <h2>Start a chat</h2>
          <span>Search your saved chats by name, or find a new Talknesty user with their mobile number.</span>
        </div>

        <form className="contact-search-form" onSubmit={searchContact}>
          <div>
            <Search size={18} />
            <input
              ref={searchRef}
              value={query}
              placeholder="Search chats or mobile number"
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchResult(null);
                setSearchMessage("");
              }}
            />
          </div>
          <button type="submit" disabled={searching} title="Search contact">
            {searching ? "Searching" : <><UserPlus size={18} /> Find</>}
          </button>
        </form>

        {visibleSearchMessage ? <p className="contact-search-message">{visibleSearchMessage}</p> : null}

        {searchResult ? (
          <article className="search-result">
            <ProfileAvatar name={searchResult.name} photoUrl={searchResult.photoUrl} />
            <div>
              <strong>{searchResult.name}</strong>
              <small>{searchResult.phone || "Talknesty user"}</small>
            </div>
            <button type="button" title={`Message ${searchResult.name}`} onClick={() => onOpenChat(searchResult)}>
              <MessageCircle size={18} />
              Message
            </button>
          </article>
        ) : null}

        {error ? <p className="error conversations-error">{error}</p> : null}

        <section className="saved-conversations">
          <header>
            <div>
              <p>Saved contacts</p>
              <h2>Chats</h2>
            </div>
            <span>{filteredContacts.length}</span>
          </header>

          {filteredContacts.length ? (
            <div className="conversation-list">
              {filteredContacts.map((contact) => (
                <article className="conversation-row" key={contact.id}>
                  <button className="conversation-open" type="button" onClick={() => onOpenChat(contact)}>
                    <ProfileAvatar name={contact.name} photoUrl={contact.photoUrl} />
                    <span>
                      <strong>{contact.name || "Talknesty user"}</strong>
                      <small>{conversationPreviews[contact.id]?.text || contact.phone || "Tap to start chatting"}</small>
                    </span>
                    <MessageCircle size={18} />
                  </button>
                  <button className="conversation-delete" type="button" title={`Delete ${contact.name} contact`} onClick={() => onDeleteContact(contact)}>
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>
          ) : !isNameSearch ? (
            <div className="conversations-empty">
              <UserPlus size={24} />
              <h3>Add your first contact</h3>
              <p>Search by mobile number above. Your saved chats will appear here.</p>
              <button type="button" onClick={() => searchRef.current?.focus()}>
                <Search size={17} />
                Find a contact
              </button>
            </div>
          ) : null}
        </section>

        <p className="conversations-account-note"><Check size={14} /> Signed in as {accountProfile?.name || "Talknesty user"}</p>
      </section>

      <ProfileSidebar
        open={profileOpen}
        profile={accountProfile}
        onClose={() => setProfileOpen(false)}
        onLogout={onLogoutAccount}
        onOpenEntryAnimations={() => {
          setProfileOpen(false);
          setActiveView("entry-animations");
        }}
        onSave={onUpdateAccountProfile}
      />

      <AppSettingsPanel
        open={settingsOpen}
        theme={theme}
        textSize={textSize}
        onClose={() => setSettingsOpen(false)}
        onTextSizeChange={changeTextSize}
        onToggleTheme={onToggleTheme}
      />
    </main>
  );
}

function inviteTime(invite) {
  return invite.createdAt?.toMillis?.() || 0;
}
