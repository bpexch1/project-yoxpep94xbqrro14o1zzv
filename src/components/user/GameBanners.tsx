import React from "react";
import { motion } from "framer-motion";

interface GameBannersProps {
  onFilterChange?: (filter: string) => void;
}

export function GameBanners({ onFilterChange }: GameBannersProps) {
  const banners = [
    {
      id: "world-roulette",
      title: "WORLD CASINO ROULETTE",
      image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80",
      filter: "Casino",
      tag: "LIVE",
    },
    {
      id: "american-roullet",
      title: "AMERICAN ROULLET",
      image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=600&q=80",
      filter: "Casino",
      tag: "HOT",
    },
    {
      id: "star-up-down",
      title: "STAR CASINO UP DOWN",
      image: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=600&q=80",
      filter: "Casino",
      tag: "NEW",
    },
    {
      id: "world-virtual",
      title: "WORLD CASINO VIRTUAL GAMES",
      image: "https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=600&q=80",
      filter: "Casino",
      tag: "LIVE",
    },
    {
      id: "star-teenpatti",
      title: "STAR CASINO TEENPATTI",
      image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=600&q=80",
      filter: "Casino",
      tag: "LIVE",
    },
    {
      id: "world-teenpatti",
      title: "WORLD CASINO TEENPATTI",
      image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=600&q=80",
      filter: "Casino",
      tag: "LIVE",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#0d1b2a",
        padding: "6px 4px 6px 4px",
        overflowX: "auto",
        display: "flex",
        gap: 6,
        scrollbarWidth: "none",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
      className="no-scrollbar"
    >
      {banners.map((banner) => (
        <motion.div
          key={banner.id}
          whileTap={{ scale: 0.96 }}
          onClick={() => onFilterChange?.(banner.filter)}
          style={{
            flex: "0 0 calc(33.333% - 4px)",
            minWidth: 105,
            aspectRatio: "1/1.05",
            position: "relative",
            borderRadius: 4,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            backgroundColor: "#000",
          }}
        >
          <img
            src={banner.image}
            alt={banner.title}
            referrerPolicy="no-referrer"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />

          {/* Dark gradient overlay for text legibility */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "4px 4px 6px 4px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: 9.5,
                fontWeight: 900,
                lineHeight: 1.15,
                textTransform: "uppercase",
                letterSpacing: "0.2px",
                textShadow: "0 1px 3px rgba(0,0,0,0.9)",
              }}
            >
              {banner.title}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
