export function GameBanners() {
  const banners = [
    {
      url: "https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/e4b48e98-a9c5-4733-96e0-53d787d8799a.png",
      alt: "Aviator Game",
    },
    {
      url: "https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/9a5be2c0-9141-41fc-802e-5d2168b81384.png",
      alt: "Sports Book",
    },
    {
      url: "https://ellprnxjjzatijdxcogk.supabase.co/storage/v1/object/public/files/chat-generated-images/project-yoxpep94xbqrro14o1zzv/83785ec4-5139-4164-b21c-8104b736972e.png",
      alt: "AviatorX",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", width: "100%", gap: 0 }}>
      {banners.map((banner, idx) => (
        <div
          key={idx}
          style={{ position: "relative", cursor: "pointer", overflow: "hidden", aspectRatio: "4/3" }}
        >
          <img
            src={banner.url}
            alt={banner.alt}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ))}
    </div>
  );
}
