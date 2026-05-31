import React from "react";
import { ArrowLeft, Check, PartyPopper } from "lucide-react";
import EntryMedia from "../components/EntryMedia";
import { ENTRY_ANIMATIONS } from "../data/entryAnimations";
import "./EntryAnimationsPage.css";

const CATALOG_SECTIONS = [
  {
    id: "free",
    name: "Free",
    description: "Ready-to-use entry animations for every account.",
  },
  {
    id: "premium",
    name: "Premium",
    description: "A richer collection for upgraded profiles.",
  },
  {
    id: "vip",
    name: "VIP",
    description: "Exclusive statement entrances for VIP profiles.",
  },
];

export default function EntryAnimationsPage({
  selectedAnimationId,
  onBack,
  onSelectAnimation,
}) {
  return (
    <section className="entry-catalog">
      <header className="entry-catalog-header">
        <button
          className="entry-back-button"
          type="button"
          title="Back to chat"
          aria-label="Back to chat"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <p className="eyebrow">Personalize your entrance</p>
          <h2>Entry animations</h2>
        </div>
      </header>

      <div className="entry-catalog-sections">
        {CATALOG_SECTIONS.map((section) => {
          const animations = ENTRY_ANIMATIONS.filter(
            (animation) => animation.tier === section.id
          );

          return (
            <section className={`entry-tier entry-tier-${section.id}`} key={section.id}>
              <header className="entry-tier-header">
                <div>
                  <p className="entry-tier-label">{section.name}</p>
                  <h3>{section.name} animations</h3>
                  <p>{section.description}</p>
                </div>
                <span>{animations.length} available</span>
              </header>

              {animations.length ? (
                <div className="entry-catalog-grid">
                  {animations.map((animation) => {
                    const selected = animation.id === selectedAnimationId;

                    return (
                      <article
                        className={`entry-product ${selected ? "selected" : ""}`}
                        key={animation.id}
                      >
                        <div className={`entry-preview entry-preview-${animation.id}`}>
                          <EntryMedia
                            animation={animation}
                            loop
                            className={`entry-preview-media ${animation.type === "video" ? "video" : "lottie"}`}
                          />

                          <div
                            className="entry-preview-pill"
                            style={{
                              "--entry-gradient": animation.gradient,
                              "--entry-glow": animation.glow,
                            }}
                          >
                            <PartyPopper size={15} />
                            You joined
                          </div>
                        </div>

                        <div className="entry-product-content">
                          <div>
                            <h3>{animation.name}</h3>
                            <p>{animation.description}</p>
                          </div>

                          <button
                            className={`entry-apply-button ${selected ? "selected" : ""}`}
                            type="button"
                            onClick={() => onSelectAnimation(animation.id)}
                          >
                            {selected ? <Check size={17} /> : <PartyPopper size={17} />}
                            {selected ? "Applied" : "Apply"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="entry-tier-empty">
                  <PartyPopper size={20} />
                  <p>New {section.name.toLowerCase()} animations will appear here.</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
