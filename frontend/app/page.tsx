"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function HomePage() {

  return (

    <main className="relative min-h-screen overflow-hidden bg-black text-white">

      {/* Content */}

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative w-72 h-48 overflow-hidden flex justify-center items-start -mb-4"
        >
          <Image
            src="/logo.png"
            alt="HealMind AI Logo"
            width={288}
            height={288}
            className="absolute top-0 z-10 drop-shadow-[0_0_25px_rgba(34,211,238,0.6)] mix-blend-screen"
            priority
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-6xl font-extrabold text-transparent md:text-7xl mb-4"
        >
          HealMind AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300 md:text-xl"
        >
          Your emotionally intelligent AI companion that understands
          facial expressions, voice interaction, and mental wellness
          in real time.
        </motion.p>

        {/* Features */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >

          {[
            "Real-Time Emotion Detection",
            "Voice AI Interaction",
            "AI Wellness Insights",
            "Emotion Timeline",
            "Proactive Emotional Support"
          ].map((feature) => (

            <div
              key={feature}
              className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-300 backdrop-blur-md"
            >
              {feature}
            </div>

          ))}

        </motion.div>

        {/* CTA */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-14"
        >

          <Link href="/dashboard">

            <button className="group relative overflow-hidden rounded-2xl bg-cyan-500 px-10 py-5 text-lg font-semibold text-black transition-all duration-300 hover:scale-105 hover:bg-cyan-400">

              <span className="relative z-10">
                Start Your Wellness Journey ✨
              </span>

              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            </button>

          </Link>

        </motion.div>

      </div>

    </main>
  );
}