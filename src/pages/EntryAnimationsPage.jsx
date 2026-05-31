import React from "react";
import { ArrowLeft, Check, PartyPopper } from "lucide-react";
import EntryLottie from "../components/EntryLottie";
import { ENTRY_ANIMATIONS } from "../data/entryAnimations";
import "./EntryAnimationsPage.css";

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

      <div className="entry-catalog-grid">
        {ENTRY_ANIMATIONS.map((animation) => {
          const selected = animation.id === selectedAnimationId;

          return (
            <article
              className={`entry-product ${selected ? "selected" : ""}`}
              key={animation.id}
            >
              <div className={`entry-preview entry-preview-${animation.id}`}>
                <EntryLottie
                  animationData={animation.animationData}
                  loop
                  autoplay
                  speed={animation.speed}
                  className="entry-preview-lottie"
                />

                <div className="entry-preview-pill">
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
    </section>
  );
}
