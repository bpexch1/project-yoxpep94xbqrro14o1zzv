import React from "react";
import { motion } from "framer-motion";
import sportsBookBanner from "@/assets/images/banner_sportsbook_1789663894265.jpg";
import aviatorXBanner from "@/assets/images/banner_aviator_x_1789663874611.jpg";

interface GameBannersProps {
  onFilterChange?: (filter: string) => void;
}

export function GameBanners({ onFilterChange }: GameBannersProps) {
  const banners = [
    {
      id: "sports-book",
      title: "SPORTS BOOK",
      image: sportsBookBanner,
      filter: "Inplay",
    },
    {
      id: "aviator-x",
      title: "AVIATOR X",
      image: aviatorXBanner,
      filter: "Casino",
    },
    {
      id: "european-roulette",
      title: "EUROPEAN ROULETTE",
      image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=600&q=80",
      filter: "Casino",
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
