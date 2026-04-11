import { motion } from "framer-motion";
import { superdevClient } from "@/lib/superdev/client";
import { Button } from "@/components/ui/button";
import { Shield, Zap, TrendingUp, Trophy } from "lucide-react";

export default function Landing() {
  const currentPath = encodeURIComponent(window.location.href);
  const loginUrl = (superdevClient.auth.client.options.loginUrl + "&from_url=" + currentPath).replace("/api", "");
  const signupUrl = loginUrl.replace("app-login", "app-signup");

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6 text-amber-400" />,
      title: "Best Odds",
      description: "Get the most competitive live odds in the market for all major sports events."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: "Fast Payouts",
      description: "Enjoy lightning-fast withdrawals and secure transaction processing 24/7."
    },
    {
      icon: <Shield className="w-6 h-6 text-amber-400" />,
      title: "Secure Platform",
      description: "State-of-the-art security protocols to keep your data and funds protected."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white selection:bg-amber-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-8 h-8 text-amber-500" />
          <div className="text-2xl font-black tracking-tighter">
            <span className="text-amber-500">BETPRO</span>
            <span className="text-white">EXCHANGE</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <a href={loginUrl} className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            ADMIN LOGIN
          </a>
          <Button asChild className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
            <a href={loginUrl}>LOG IN</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
              INDIA'S PREMIER <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                BETTING EXCHANGE
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              The ultimate destination for sports enthusiasts. Experience live betting, 
              superior odds, and a secure environment designed for champions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-10 text-lg bg-amber-500 hover:bg-amber-400 text-black font-black shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <a href={loginUrl}>START BETTING NOW</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-10 text-lg border-gray-700 text-white hover:bg-white/5">
                <a href={signupUrl}>CREATE ACCOUNT</a>
              </Button>
            </div>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 mt-32"
          >
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="p-8 rounded-2xl bg-[#111827] border border-[#1e2d47] text-left hover:border-amber-500/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 py-12">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2024 BetPro Exchange. Play responsibly. 18+ only.</p>
        </div>
      </footer>
    </div>
  );
}
