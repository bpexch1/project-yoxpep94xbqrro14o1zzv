import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
const banners = [
  { title: "SPORTS BOOK", image: "https://bpexch.org/img/casino/sportsbook.png", filter: "Inplay" },
  { title: "AVIATOR X", image: "https://bpexch.org/img/casino/AviatorNew.png", filter: "Casino" },
  { title: "EUROPEAN ROULETTE", image: "https://bpexch.org/img/casino/casino1.jpeg", filter: "Casino" },
  { title: "CASINO TEENPATTI", image: "https://bpexch.org/img/casino/casino2.jpeg", filter: "Casino" },
  { title: "STAR CASINO TEENPATTI", image: "https://bpexch.org/img/casino/casino3.jpeg", filter: "Casino" },
  { title: "WORLD CASINO TEENPATTI", image: "https://bpexch.org/img/casino/casino4.jpeg", filter: "Casino" },
  { title: "AVIATOR", image: "https://bpexch.org/img/casino/Aviator.png", filter: "Casino" },
];

export function GameBanners({ onFilterChange }: { onFilterChange?: (filter: string) => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setIndex(value => value + 1), 3500);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);
  const loopingBanners = [...banners, ...banners.slice(0, 3)];
  return (
    <section className="reference-game-banners" aria-label="Games"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <div className="reference-game-banner-track"
        style={{ transform: `translateX(calc(${-index * 100 / 3}% - ${index * 4}px))`, transition: index === 0 || reducedMotion ? "none" : "transform 500ms ease" }}
        onTransitionEnd={() => { if (index >= banners.length) setIndex(0); }}>
        {loopingBanners.map((banner, itemIndex) => (
          <button type="button" key={`${banner.title}-${itemIndex}`}
            tabIndex={itemIndex >= index && itemIndex < index + 3 ? 0 : -1}
            aria-hidden={itemIndex < index || itemIndex >= index + 3}
            onClick={() => onFilterChange?.(banner.filter)}>
            <img src={banner.image} alt={banner.title} draggable={false} />
          </button>
        ))}
      </div>
    </section>
  );
}
