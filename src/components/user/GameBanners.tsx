export function GameBanners() {
  const banners = [
    {
      url: "https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/6868a813-50ce-49e7-8efb-ea036e124f3f.png",
      alt: "Aviator game",
    },
    {
      url: "https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/637b4c3e-dc7b-4f3d-8c43-12d7cd0c3e0e.png",
      alt: "Sports Book",
    },
    {
      url: "https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/f2541386-7298-4690-8799-1e288f5de967.png",
      alt: "AviatorX game",
    },
  ];

  return (
    <div className="grid grid-cols-3 w-full overflow-hidden">
      {banners.map((banner, idx) => (
        <div 
          key={idx} 
          className="relative group cursor-pointer overflow-hidden aspect-[4/3]"
        >
          <img
            src={banner.url}
            alt={banner.alt}
            className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
}
