import { Send } from "lucide-react";

export default function MessageComposer({ draft, inputRef, onDraftChange, onSubmit }) {
  return (
    <form className="composer" onSubmit={onSubmit}>
      <input
        ref={inputRef}
        value={draft}
        placeholder="Message likhein..."
        maxLength={1200}
        onChange={(event) => onDraftChange(event.target.value)}
        onFocus={() => {
          setTimeout(() => {
            inputRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 300);
        }}
      />

      <button className="send-button" type="submit" title="Send message">
        <Send size={20} />
      </button>
    </form>
  );
}
