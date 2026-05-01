import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function GameBanners() {
  const navigate = useNavigate();
  
  const banners = [
    {
      url: "https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/7127ebd7-c31a-4215-ac7a-1f4d91158474.png",
      alt: "Live Casino",
    },
    {
      url: "https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/86f70bd0-9f62-4e3f-b586-d29ef7fad6f6.png",
      alt: "Slots & Games",
    },
    {
      url: "https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/f9b27073-87e8-4854-9203-d0432cec440c.png",
      alt: "Sports Book",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", width: "100%", gap: 0 }}>
      {banners.map((banner, idx) => (
        <motion.div
          key={idx}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/casino')}
          style={{ 
            position: "relative", 
            cursor: "pointer", 
            overflow: "hidden", 
            aspectRatio: "4/3",
            transition: "transform 0.15s ease-out"
          }}
        >
          <img
            src={banner.url}
            alt={banner.alt}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </motion.div>
      ))}
    </div>
  );
}
