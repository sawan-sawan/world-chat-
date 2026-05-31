import React from "react";
import { Moon, Settings2, Sun, Type, X } from "lucide-react";
import "./AppSettingsPanel.css";

export default function AppSettingsPanel({
  open,
  theme,
  textSize,
  onClose,
  onTextSizeChange,
  onToggleTheme,
}) {
  if (!open) return null;

  return (
    <div className="settings-panel-backdrop" onClick={onClose}>
      <aside className="settings-panel" onClick={(event) => event.stopPropagation()}>
        <header>
          <div className="settings-heading">
            <span><Settings2 size={19} /></span>
            <div>
              <p>App preferences</p>
              <h2>Settings</h2>
            </div>
          </div>
          <button type="button" title="Close settings" onClick={onClose}><X size={20} /></button>
        </header>

        <section className="settings-group">
          <div>
            {theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
            <span><strong>Appearance</strong><small>Switch the chat color theme.</small></span>
          </div>
          <button className={`settings-switch ${theme === "dark" ? "on" : ""}`} type="button" aria-label="Toggle dark theme" onClick={onToggleTheme}><span /></button>
        </section>

        <section className="settings-group text-size-setting">
          <div>
            <Type size={17} />
            <span><strong>Chat text size</strong><small>Choose a comfortable message size.</small></span>
          </div>
          <div className="text-size-options">
            {["small", "medium", "large"].map((size) => (
              <button className={textSize === size ? "active" : ""} type="button" key={size} onClick={() => onTextSizeChange(size)}>
                {size}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-preview">
          <p>Preview</p>
          <div className="settings-preview-bubble">Your chat will look like this.</div>
        </section>
      </aside>
    </div>
  );
}
