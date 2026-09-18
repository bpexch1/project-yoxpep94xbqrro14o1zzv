
import { motion } from "framer-motion";
import aviatorXImg from "@/assets/images/banner_aviator_x_1789663874611.jpg";
import sportsBookImg from "@/assets/images/banner_sportsbook_1789663894265.jpg";
import aviatorClassicImg from "@/assets/images/banner_aviator_red_1789663919683.jpg";

interface GameBannersProps {
  onFilterChange?: (filter: string) => void;
}

export function GameBanners({ onFilterChange }: GameBannersProps) {
  const banners = [
    {
      id: "aviator-x",
      title: "AviatorX",
      image: aviatorXImg,
      filter: "Casino",
      alt: "AviatorX",
    },
    {
      id: "sports-book",
      title: "Sports Book",
      image: sportsBookImg,
      filter: "Inplay",
      alt: "Sports Book",
    },
    {
      id: "aviator-classic",
      title: "Aviator",
      image: aviatorClassicImg,
      filter: "Casino",
      alt: "Aviator",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        width: "100%",
        backgroundColor: "#000",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        gap: 1,
      }}
    >
      {banners.map((banner, idx) => (
        <motion.div
          key={banner.id || idx}
          whileTap={{ scale: 0.97 }}
          onClick={() => onFilterChange?.(banner.filter)}
          style={{
            position: "relative",
            aspectRatio: "1/1",
            cursor: "pointer",
            overflow: "hidden",
            backgroundColor: "#0d1117",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={banner.image}
            alt={banner.alt}
            referrerPolicy="no-referrer"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        </motion.div>
      ))}
    </div>
  );
}

