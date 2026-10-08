import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
const banners = [
  { title: "SPORTS BOOK", image: "/reference/casino/sportsbook.png", filter: "Inplay" },
  { title: "AVIATOR X", image: "/reference/casino/AviatorNew.png", filter: "Casino" },
  { title: "EUROPEAN ROULETTE", image: "/reference/casino/casino1.jpeg", filter: "Casino" },
  { title: "CASINO TEENPATTI", image: "/reference/casino/casino2.jpeg", filter: "Casino" },
  { title: "STAR CASINO TEENPATTI", image: "/reference/casino/casino3.jpeg", filter: "Casino" },
  { title: "WORLD CASINO TEENPATTI", image: "/reference/casino/casino4.jpeg", filter: "Casino" },
  { title: "AVIATOR", image: "/reference/casino/Aviator.png", filter: "Casino" },
];

export function GameBanners({ onFilterChange }: { onFilterChange?: (filter: string) => void }) {
  const [visibleCount, setVisibleCount] = useState(() => window.innerWidth >= 768 ? 4 : 3);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const resize = () => setVisibleCount(query.matches ? 4 : 3);
    query.addEventListener("change", resize);
    return () => query.removeEventListener("change", resize);
  }, []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setIndex(value => value + 1), 3500);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);
  const loopingBanners = [...banners, ...banners.slice(0, 4)];
  return (
    <section className="reference-game-banners" aria-label="Games"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <div className="reference-game-banner-track"
        style={{ transform: `translateX(calc(${-index * 100 / visibleCount}% - ${index * 12 / visibleCount}px))`, transition: index === 0 || reducedMotion ? "none" : "transform 500ms ease" }}
        onTransitionEnd={() => { if (index >= banners.length) setIndex(0); }}>
        {loopingBanners.map((banner, itemIndex) => (
          <button type="button" key={`${banner.title}-${itemIndex}`}
            tabIndex={itemIndex >= index && itemIndex < index + visibleCount ? 0 : -1}
            aria-hidden={itemIndex < index || itemIndex >= index + visibleCount}
            onClick={() => onFilterChange?.(banner.filter)}>
            <img src={banner.image} alt={banner.title} draggable={false} />
          </button>
        ))}
      </div>
    </section>
  );
}
