/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Heart,
  Gift,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Play,
  Pause,
  Video,
  Maximize,
  Minimize,
} from "lucide-react";
import { birthdaySynth } from "./utils/audio";
import p1 from "./assets/images/p1.jpeg";
import p2 from "./assets/images/p2.jpeg";
import p3 from "./assets/images/p3.jpeg";
import p4 from "./assets/images/p4.jpeg";
import p5 from "./assets/images/p5.jpeg";
import vCard from "./assets/images/v.jpeg";
import veduVideo from "./assets/videos/vedu.mp4";

// Types
interface TapSparkle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  char: string;
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  gravity: number;
}

interface PhotoSlide {
  id: number;
  url: string;
  caption: string;
  quote: string;
}

// Beautiful memories with Vedangi
const MEMORY_PHOTOS: PhotoSlide[] = [
  {
    id: 1,
    url: p1,
    caption: "Our Sweet Moments",
    quote: "Every moment spent with you is a memory I'll cherish forever. 🌸",
  },
  {
    id: 2,
    url: p2,
    caption: "Laughs & Smiles",
    quote: "Through all the chaos, your smile is my favorite constant. ✨",
  },
  {
    id: 3,
    url: p3,
    caption: "Endless Fun",
    quote: "We've created a world of our own, filled with endless fun and crazy stories! 🤍",
  },
  {
    id: 4,
    url: p4,
    caption: "Partner in Crime",
    quote: "To the one who knows all my secrets and still chooses to stick around. 👯‍♀️",
  },
  {
    id: 5,
    url: p5,
    caption: "Happy 21st Birthday!",
    quote: "Here is to 21 spectacular years of you blooming and spreading magic in this world! 🎉🍼",
  },
];

export default function App() {
  // Navigation & Game State
  const [scene, setScene] = useState<
    "landing" | "permission" | "portal" | "hub" | "letter" | "gallery" | "video" | "cake" | "final"
  >("landing");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAmbientStarted, setIsAmbientStarted] = useState(false);

  // Video Surprise Chapter State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fullScreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Set your birthday video URL here! (Supports local imported file or web URL)
  const videoUrl = veduVideo;

  // Sparkles and Particle elements
  const [tapSparkles, setTapSparkles] = useState<TapSparkle[]>([]);
  const sparkIdCounter = useRef(0);

  // Shy "No" button dodging state
  const [noBtnOffset, setNoBtnOffset] = useState({ x: 0, y: 0 });
  const [noCount, setNoCount] = useState(0);

  // Memory Slideshow control
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(true);

  // Birthday wish candle state
  const [blowProgress, setBlowProgress] = useState(0); // 0 to 100 on holding click
  const [isCandleBlown, setIsCandleBlown] = useState(false);
  const [isHoldingBlow, setIsHoldingBlow] = useState(false);

  // Hidden secret message popover
  const [showSecretMessage, setShowSecretMessage] = useState(false);

  // Canvas ref for fireworks particles in landing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fireworkParticles = useRef<FireworkParticle[]>([]);

  // Sound triggering on all clicks
  const handleGlobalClick = (e: React.MouseEvent) => {
    // Spawn gorgeous visual click sparkles
    const colors = ["#ffb6d5", "#cdb4f5", "#f6dca0", "#e3d4fb", "#ff8fb3"];
    const chars = ["✨", "💖", "🌸", "⭐", "🎀", "🎈"];
    const newSparkles: TapSparkle[] = Array.from({ length: 6 }).map((_, i) => {
      return {
        id: sparkIdCounter.current++,
        x: e.clientX,
        y: e.clientY,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 14 + Math.random() * 12,
        char: chars[Math.floor(Math.random() * chars.length)],
      };
    });

    setTapSparkles((prev) => [...prev, ...newSparkles]);
    birthdaySynth.playClickChime();

    // Lazy initialize/resume audio context
    if (!isAmbientStarted && !isAudioMuted) {
      birthdaySynth.init();
      birthdaySynth.startBackgroundAmbient();
      setIsAmbientStarted(true);
    }
  };

  // Clean trailing sparkles after 1 second
  useEffect(() => {
    if (tapSparkles.length > 0) {
      const timer = setTimeout(() => {
        setTapSparkles((prev) => prev.slice(5));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tapSparkles]);

  // Audio mute toggle
  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering global chime on toggle
    const muted = birthdaySynth.toggleMute();
    setIsAudioMuted(muted);
    if (!muted) {
      setIsAmbientStarted(true);
    }
  };

  // Interactive firecrackers loop on canvas
  useEffect(() => {
    if (!canvasRef.current || scene !== "landing") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const colors = ["#ffb6d5", "#cdb4f5", "#f6dca0", "#ffe7b3", "#ff8fb3"];

    const burst = (x: number, y: number) => {
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4.5;
        fireworkParticles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 3,
          gravity: 0.03 + Math.random() * 0.04,
        });
      }
    };

    // Auto fireworks popping randomly
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        const rx = canvas.width * (0.2 + Math.random() * 0.6);
        const ry = canvas.height * (0.2 + Math.random() * 0.4);
        burst(rx, ry);
      }
    }, 900);

    const updatePhysics = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      fireworkParticles.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= 0.015;

        if (p.alpha <= 0) {
          fireworkParticles.current.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(updatePhysics);
    };

    updatePhysics();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearInterval(interval);
      cancelAnimationFrame(animId);
    };
  }, [scene]);

  // Shy No Button Dodge Logic
  const handleNoButtonDodge = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    birthdaySynth.playDodgeSound();

    // Get random coordinates within healthy bounds (-180px to +180px)
    const randomX = (Math.random() - 0.5) * 360;
    const randomY = (Math.random() - 0.5) * 220;

    setNoBtnOffset({ x: randomX, y: randomY });
    setNoCount((c) => c + 1);
  };

  // Automated slider logic for photogallery
  useEffect(() => {
    if (scene !== "gallery" || !isSlideshowPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % MEMORY_PHOTOS.length);
    }, 5500); // long duration for relaxing pan zoom
    return () => clearInterval(interval);
  }, [scene, isSlideshowPlaying]);

  // Holding "Blow out" candle timer logic
  useEffect(() => {
    if (!isHoldingBlow || isCandleBlown) return;

    const interval = setInterval(() => {
      setBlowProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleCandleBlown();
          return 100;
        }
        return prev + 6; // quick 1.2 second hold
      });
    }, 60);

    return () => clearInterval(interval);
  }, [isHoldingBlow, isCandleBlown]);

  const handleCandleBlown = () => {
    setIsCandleBlown(true);
    setIsHoldingBlow(false);
    birthdaySynth.playHappyBirthdaySong();

    // Automatically transition to final page after a glorious sensory pause
    setTimeout(() => {
      setScene("final");
    }, 4500);
  };

  const cancelCandleBlow = () => {
    setIsHoldingBlow(false);
    setBlowProgress(0);
  };

  return (
    <div
      onClick={handleGlobalClick}
      className="min-h-screen relative w-full overflow-hidden font-sans font-medium text-white select-none bg-[#0f0c29] text-center flex flex-col items-center justify-between"
    >
      {/* IMMERSIVE LAYERED BACKGROUND (FROSTED GLASS THEME) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-pink-500/20 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[65%] h-[65%] rounded-full bg-gradient-to-tr from-purple-600/22 to-transparent blur-[120px]" />
        <div className="absolute top-[25%] right-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-l from-orange-400/15 to-transparent blur-[100px]" />
      </div>

      {/* REACTIVE TAP SPARKLING EFFECTS */}
      <AnimatePresence>
        {tapSparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{ opacity: 1, scale: 0.5, x: sparkle.x, y: sparkle.y }}
            animate={{
              opacity: 0,
              scale: 1.5,
              x: sparkle.x + (Math.random() - 0.5) * 120,
              y: sparkle.y - 150 - Math.random() * 80,
              rotate: Math.random() * 360,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              position: "fixed",
              pointerEvents: "none",
              zIndex: 9999,
              color: sparkle.color,
              fontSize: sparkle.size,
            }}
          >
            {sparkle.char}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* FLOAT MUSIC PLAYER */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        {isAmbientStarted && (
          <span className="text-xs bg-white/10 backdrop-blur-md border border-white/20 text-white/80 px-3 py-1 rounded-full font-semibold">
            {isAudioMuted ? "Sound muted" : "Playing Synthesized Magic 🎶"}
          </span>
        )}
        <button
          onClick={toggleAudio}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/20 hover:bg-white/15 backdrop-blur-md shadow-lg shadow-black/30 hover:scale-110 active:scale-95 transition-all text-white"
          id="music-toggle"
        >
          {isAudioMuted ? <VolumeX className="w-5 h-5 text-pink-300" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* PERSISTENT MEMORY HELPER BANNER */}
      <div className="pt-6 z-20">
        <span className="font-cursive text-3xl font-normal text-pink-200/90 drop-shadow-[0_2px_8px_rgba(255,182,213,0.3)]">
          Happiee Birthdayy Vedu ♥
        </span>
      </div>

      {/* MAIN SWITCHABLE CONTAINER SCENES */}
      <div className="flex-1 w-full flex items-center justify-center p-4 md:p-8 z-30 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {/* ============ SCENE 0 : LANDING ============ */}
          {scene === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex flex-col items-center gap-8 relative w-full h-full"
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none w-full h-full z-0"
              />

              <div className="glass-panel-heavy p-10 md:p-14 rounded-3xl max-w-xl text-center flex flex-col items-center gap-6 z-10 shadow-2xl">
                <span className="text-xs tracking-[0.2em] text-pink-200 font-bold uppercase">
                  ✨ Welcome, Vedu ✨
                </span>
                <h1 className="font-serif font-extrabold text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-pink-200 drop-shadow-lg leading-tight">
                  Twenty-one looks so beautiful on you.
                </h1>
                <p className="text-white/70 text-base leading-relaxed max-w-md font-light">
                  I created a tiny, magical interactive world filled with sweet memories, hidden chapters, and birthday candle wishes made just for you.
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setScene("permission")}
                  className="mt-4 px-10 py-4 rounded-full font-bold text-lg text-indigo-950 bg-white shadow-[0_10px_40px_rgba(255,182,213,0.35)] transition-all hover:bg-pink-100"
                >
                  ✨ Open my surprise →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ============ SCENE 1 : PERMISSION (PLAYFUL DODGING) ============ */}
          {scene === "permission" && (
            <motion.div
              key="permission"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel-heavy p-10 md:p-14 rounded-3xl max-w-lg w-full text-center flex flex-col items-center gap-8 shadow-2xl"
            >
              <div className="text-6xl animate-bounce">🎁</div>
              <h2 className="font-serif font-extrabold text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-pink-200 leading-snug drop-shadow-md">
                Are you ready to see your gift, Vedu?
              </h2>

              <p className="text-sm text-white/60 italic font-light">
                {noCount >= 6
                  ? "Okay, you've tried to say No enough times! Give in to the magic! 💖"
                  : "(the 'No' button is extremely shy and playful, be careful 👀)"}
              </p>

              <div className="relative w-full flex justify-center items-center gap-6 h-28">
                {/* YES BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Start portal scene
                    setScene("portal");
                    birthdaySynth.playClickChime();
                  }}
                  className="px-8 py-4 rounded-full font-bold text-lg text-indigo-950 bg-white shadow-[0_10px_30px_rgba(255,255,255,0.25)] transition-all"
                >
                  Yes!! 💖
                </motion.button>

                {/* PLAYFUL SHY DODGING NO BUTTON */}
                <motion.button
                  animate={{ x: noBtnOffset.x, y: noBtnOffset.y }}
                  transition={{ type: "spring", stiffness: 150, damping: 15 }}
                  onMouseEnter={handleNoButtonDodge}
                  onTouchStart={handleNoButtonDodge}
                  onClick={handleNoButtonDodge}
                  className="px-6 py-3 rounded-full font-bold text-base text-white/90 bg-white/5 border border-white/20 backdrop-blur-md shadow-xs cursor-none"
                >
                  {noCount === 0 && "No 🥺"}
                  {noCount === 1 && "Wait, what? 😮"}
                  {noCount === 2 && "Catch me! 🏃‍♀️"}
                  {noCount === 3 && "Ah, close! 💨"}
                  {noCount === 4 && "Try harder! 😜"}
                  {noCount === 5 && "Still saying no?! 🤨"}
                  {noCount >= 6 && "No way! 💖"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ============ SCENE 2 : PORTAL / MAGIC DOOR ============ */}
          {scene === "portal" && (
            <motion.div
              key="portal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8 text-center"
              onAnimationComplete={() => {
                // Auto transition doors swinging open
                setTimeout(() => {
                  const dl = document.getElementById("door-left-panel");
                  const dr = document.getElementById("door-right-panel");
                  const dg = document.getElementById("door-radial-glow");
                  if (dl && dr && dg) {
                    dl.style.transform = "rotateY(-115deg)";
                    dr.style.transform = "rotateY(115deg)";
                    dg.style.opacity = "1";
                  }
                }, 800);

                setTimeout(() => {
                  setScene("hub");
                }, 3800);
              }}
            >
              {/* FAIRY ANIMATION */}
              <motion.div
                animate={{
                  x: [0, 80, -80, 0],
                  y: [0, -30, -50, 0],
                  scale: [1, 1.15, 0.95, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl drop-shadow-xl z-20"
              >
                🧚‍♀️
              </motion.div>

              <div
                className="relative w-[340px] h-[460px] md:w-[400px] md:h-[520px] rounded-t-full border-[10px] border-white/20 bg-linear-to-b from-indigo-950/70 to-indigo-900 overflow-hidden shadow-2xl backdrop-blur-lg"
                style={{ perspective: "1200px" }}
              >
                {/* DOOR LEFT */}
                <div
                  id="door-left-panel"
                  className="absolute top-0 bottom-0 left-0 w-1/2 bg-linear-to-br from-white/10 to-white/5 backdrop-blur-md border-r border-white/20 origin-left transition-transform duration-[1800ms] ease-in-out"
                />

                {/* DOOR RIGHT */}
                <div
                  id="door-right-panel"
                  className="absolute top-0 bottom-0 right-0 w-1/2 bg-linear-to-br from-white/10 to-white/5 backdrop-blur-md border-l border-white/20 origin-right transition-transform duration-[1800ms] ease-in-out"
                />

                {/* GOLDEN GLOW INSIDE */}
                <div
                  id="door-radial-glow"
                  className="absolute inset-0 bg-radial from-pink-500/30 via-purple-600/20 to-transparent opacity-0 transition-opacity duration-[1000ms] pointer-events-none flex flex-col items-center justify-center p-6 text-center"
                >
                  <Sparkles className="w-12 h-12 text-pink-200 animate-spin mb-4" />
                  <p className="font-cursive text-4xl text-white font-bold">
                    Entering your world...
                  </p>
                </div>
              </div>

              <p className="text-white/60 font-serif italic text-base mt-2 font-light">
                opening a little gateway made just for you, Vedangi...
              </p>
            </motion.div>
          )}

          {/* ============ SCENE 3 : CHAPTERS HUB ============ */}
          {scene === "hub" && (
            <motion.div
              key="hub"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-10 w-full"
            >
              <div className="text-center">
                <span className="text-xs uppercase tracking-widest text-white/40 font-bold px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                  Step into the chapters
                </span>
                <h2 className="font-cursive text-5xl md:text-6xl text-white mt-4 font-bold drop-shadow-md">
                  Choose your journey, Vedu
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-5xl">
                {/* LETTER CHAPTER */}
                <motion.button
                  whileHover={{ y: -8 }}
                  onClick={() => setScene("letter")}
                  className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-between gap-4 group cursor-pointer hover:bg-white/15 hover:border-white/30 transition-all shadow-xl"
                >
                  <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-white/15 flex items-center justify-center text-3xl group-hover:scale-110 transition-all border border-white/10">
                    💌
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">
                      The Letter
                    </h3>
                    <p className="text-xs text-white/60 mt-2 font-light leading-relaxed">
                      A heartfelt handwritten token commemorating our story.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-pink-200 mt-2 flex items-center gap-1 group-hover:underline">
                    Read letter <ArrowRight className="w-3 h-3" />
                  </span>
                </motion.button>

                {/* MEMORIES SLIDESHOW CHAPTER */}
                <motion.button
                  whileHover={{ y: -8 }}
                  onClick={() => setScene("gallery")}
                  className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-between gap-4 group cursor-pointer hover:bg-white/15 hover:border-white/30 transition-all shadow-xl"
                >
                  <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-white/15 flex items-center justify-center text-3xl group-hover:scale-110 transition-all border border-white/10">
                    🎬
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">
                      The Slideshow
                    </h3>
                    <p className="text-xs text-white/60 mt-2 font-light leading-relaxed">
                      Smooth cinematic memory slideshow with pan & zoom effects.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-pink-200 mt-2 flex items-center gap-1 group-hover:underline">
                    Watch memories <ArrowRight className="w-3 h-3" />
                  </span>
                </motion.button>

                {/* VIDEO SURPRISE CHAPTER */}
                <motion.button
                  whileHover={{ y: -8 }}
                  onClick={() => setScene("video")}
                  className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-between gap-4 group cursor-pointer hover:bg-white/15 hover:border-white/30 transition-all shadow-xl relative overflow-hidden"
                >
                  <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-white/15 flex items-center justify-center text-3xl group-hover:scale-110 transition-all border border-white/10">
                    🎥
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">
                      Video Surprise
                    </h3>
                    <p className="text-xs text-white/60 mt-2 font-light leading-relaxed">
                      Watch special birthday video message in full screen mode!
                    </p>
                  </div>
                  <span className="text-xs font-bold text-pink-200 mt-2 flex items-center gap-1 group-hover:underline">
                    Play video <ArrowRight className="w-3 h-3" />
                  </span>
                </motion.button>

                {/* CAKE WISH CHAPTER */}
                <motion.button
                  whileHover={{ y: -8 }}
                  onClick={() => setScene("cake")}
                  className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-between gap-4 group cursor-pointer hover:bg-white/15 hover:border-white/30 transition-all shadow-xl"
                >
                  <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-white/15 flex items-center justify-center text-3xl group-hover:scale-110 transition-all border border-white/10">
                    🌟
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">
                      Wishing Star
                    </h3>
                    <p className="text-xs text-white/60 mt-2 font-light leading-relaxed">
                      Interactive 3D-layered cake. Press & hold to blow the candle!
                    </p>
                  </div>
                  <span className="text-xs font-bold text-pink-200 mt-2 flex items-center gap-1 group-hover:underline">
                    Make a wish <ArrowRight className="w-3 h-3" />
                  </span>
                </motion.button>
              </div>

              {/* LETTER CALLOUT */}
              <button
                onClick={() => setScene("letter")}
                className="font-serif italic text-white/60 hover:text-white transition-colors text-sm hover:underline"
              >
                Let me start with the letter... 🤍
              </button>
            </motion.div>
          )}

          {/* ============ SCENE 4 : THE LETTER ============ */}
          {scene === "letter" && (
            <motion.div
              key="letter"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex flex-col items-center gap-6 max-w-2xl w-full"
            >
              {/* VINTAGE STATIONERY RE-ENVISIONED FOR FROSTED THEME */}
              <div
                className="glass-panel-heavy p-8 md:p-12 rounded-3xl shadow-xl relative w-full text-left overflow-hidden border border-white/20"
                style={{
                  backgroundImage: "repeating-linear-gradient(rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 37px, rgba(255,182,213,0.15) 37px, rgba(255,182,213,0.15) 38px)",
                  lineHeight: "38px",
                }}
              >
                {/* STAMP EMBELLISHMENT */}
                <div className="absolute top-6 right-6 w-14 h-16 border-2 border-dashed border-white/30 rounded-sm flex flex-col items-center justify-center bg-white/5 rotate-6 text-xl p-1 pointer-events-none">
                  🎀
                </div>

                <h2 className="font-cursive text-4xl text-pink-200 md:text-5xl font-bold mb-6">
                  Dearest Vedangi,
                </h2>

                <div className="text-white/80 text-base font-serif space-y-4 leading-[38px] pt-4 font-light">
                  <p>
                    Happiee Birthdayy to my bestest friend forever ♾️...i love you sooo much vedu 💗 this day is yours celebrate every moment as you deserve to be celebrated ❣️ you are the sweetest and most beautiful person not just by face but by heart ❤️🧿... May God bless you and i wish you get everything you want in your life ✨🎀🌻💗 just be the cutest person as you are 🎀 lysm😘🫂.
                  </p>
                  <p>
                    From the very first day we became friends, you've filled my entire heart with beautiful laughter💗, endless comfort, and cinematic color. Twenty-one years of you existing in this sweet world is something worth celebrating with absolutely everything I've got ! 🫂.
                  </p>
                  <p>
                    Thank you for every thing you had done for me, for every stupid inside joke, and every single time you showed up without me even needing to ask 🎀. This tiny digital world is just a little token of how much you genuinely mean to me.
                  </p>
                  <p>
                    Here's to the gorgeous version of you that's blooming right now, and to many, many more birthdays holding hands. I love you, always and forever 😘🫂.
                  </p>
                  <p className="text-right font-cursive text-3.5xl font-bold text-pink-200 leading-none mt-8">
                    — your best friend, forever 🤍
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setScene("hub")}
                  className="px-6 py-3 rounded-full hover:bg-white/10 text-white font-semibold transition-all glass-button"
                >
                  ← Back to Chapters
                </button>
                <button
                  onClick={() => setScene("gallery")}
                  className="px-6 py-3 rounded-full bg-white text-indigo-950 font-bold hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  Watch Memory Slideshow →
                </button>
              </div>
            </motion.div>
          )}

          {/* ============ SCENE 5 : PHOTO GALLERY SLIDESHOW (CREATIVE ZOOM & CROSS-FADES) ============ */}
          {scene === "gallery" && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8 w-full max-w-3xl"
            >
              <div className="text-center">
                <h2 className="font-serif font-extrabold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-pink-200">
                  Our Magical Memories 📸
                </h2>
                <p className="text-xs text-white/60 mt-2 font-light">
                  Enjoy the smooth cinematic cross-fades and nostalgic Ken Burns zoom effects
                </p>
              </div>

              {/* MAIN SLIDESHOW CANVAS PORT */}
              <div className="relative w-full h-[400px] md:h-[480px] bg-white/5 p-4 rounded-3xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-lg">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 w-full h-full overflow-hidden"
                  >
                    {/* PHOTO LAYER WITH KEN BURNS STYLING */}
                    <div className="w-full h-full relative overflow-hidden">
                      <img
                        src={MEMORY_PHOTOS[activeSlide].url}
                        alt={MEMORY_PHOTOS[activeSlide].caption}
                        className="w-full h-full object-cover select-none ken-burns"
                      />
                      {/* FILTER OVERLAY */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>

                    {/* CAPTION TEXT OVERLAY */}
                    <div className="absolute bottom-6 inset-x-6 text-white text-left z-30 drop-shadow-md">
                      <span className="text-xs uppercase tracking-wider font-bold text-pink-200 mb-2 block">
                        {MEMORY_PHOTOS[activeSlide].caption}
                      </span>
                      <p className="font-serif italic text-base md:text-lg leading-relaxed text-white/95 font-light">
                        {MEMORY_PHOTOS[activeSlide].quote}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* BOTTOM DOT INDICATORS & IN-IMAGE NAVIGATION */}
                <div className="absolute top-4 right-4 z-40 bg-black/40 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-full text-xs font-bold border border-white/15">
                  {activeSlide + 1} / {MEMORY_PHOTOS.length}
                </div>

                {/* LEFT NAV REEL */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide(
                      (prev) => (prev - 1 + MEMORY_PHOTOS.length) % MEMORY_PHOTOS.length
                    );
                    birthdaySynth.playClickChime();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 shadow-md flex items-center justify-center text-white z-40 hover:scale-110 active:scale-90 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* RIGHT NAV REEL */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide((prev) => (prev + 1) % MEMORY_PHOTOS.length);
                    birthdaySynth.playClickChime();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 shadow-md flex items-center justify-center text-white z-40 hover:scale-110 active:scale-95 transition-transform"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* SLIDESHOW STATUS SLIDER BUTTONS */}
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
                  className="px-5 py-2 text-xs font-bold border border-white/20 rounded-full bg-white/5 hover:bg-white/15 transition-all text-white/90 flex items-center gap-1.5"
                >
                  {isSlideshowPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pause autoplay
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Resume autoplay
                    </>
                  )}
                </button>
              </div>

              {/* FLOATING CAPTIONS BOX */}
              <div className="flex gap-3 flex-wrap justify-center w-full max-w-xl">
                {MEMORY_PHOTOS.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => {
                      setActiveSlide(idx);
                      birthdaySynth.playClickChime();
                    }}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      activeSlide === idx ? "bg-pink-300 scale-125" : "bg-white/20 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setScene("hub")}
                  className="px-6 py-3 rounded-full hover:bg-white/10 text-white font-semibold transition-all glass-button"
                >
                  ← Back to Chapters
                </button>
                <button
                  onClick={() => setScene("video")}
                  className="px-6 py-3 rounded-full bg-white text-indigo-950 font-bold hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  Watch Video Surprise →
                </button>
              </div>
            </motion.div>
          )}

          {/* ============ SCENE 5.5 : VIDEO SURPRISE ============ */}
          {scene === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-6 w-full max-w-3xl text-center"
            >
              <div>
                <span className="text-xs uppercase tracking-widest text-pink-200 font-bold px-4 py-1.5 bg-white/10 border border-white/20 rounded-full">
                  Special Chapter
                </span>
                <h2 className="font-serif font-extrabold text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-pink-200 mt-3">
                  Video Surprise 🎥
                </h2>
                <p className="text-xs md:text-sm text-white/70 mt-2 font-light max-w-lg mx-auto">
                  Watch this special birthday video created just for Vedangi!
                </p>
              </div>

              {/* VIDEO CONTAINER */}
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden glass-panel-heavy p-2 md:p-3 border border-white/25 shadow-2xl flex flex-col items-center justify-center bg-black/40 group">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain rounded-2xl bg-black"
                  playsInline
                />

                {/* OVERLAY ACTION BAR */}
                <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (document.fullscreenElement) {
                          document.exitFullscreen?.().catch(() => {});
                        } else if (videoRef.current.requestFullscreen) {
                          videoRef.current.requestFullscreen().catch(() => {
                            setIsVideoModalOpen(true);
                          });
                        } else {
                          setIsVideoModalOpen(true);
                        }
                      } else {
                        setIsVideoModalOpen(true);
                      }
                      birthdaySynth.playClickChime();
                    }}
                    className="px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Maximize className="w-4 h-4 text-pink-300" /> Full Screen
                  </button>
                </div>
              </div>

              {/* NAVIGATION BUTTONS */}
              <div className="flex gap-4">
                <button
                  onClick={() => setScene("hub")}
                  className="px-6 py-3 rounded-full hover:bg-white/10 text-white font-semibold transition-all glass-button"
                >
                  ← Back to Chapters
                </button>
                <button
                  onClick={() => setScene("cake")}
                  className="px-6 py-3 rounded-full bg-white text-indigo-950 font-bold hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  Make a Wish & Blow Cake →
                </button>
              </div>

              {/* FULL SCREEN THEATER OVERLAY MODAL */}
              <AnimatePresence>
                {isVideoModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-2 md:p-6"
                  >
                    <button
                      onClick={() => {
                        setIsVideoModalOpen(false);
                        birthdaySynth.playClickChime();
                      }}
                      className="absolute top-6 right-6 z-50 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Minimize className="w-4 h-4 text-pink-300" /> Exit Full Screen
                    </button>

                    <div className="w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center relative">
                      <video
                        ref={fullScreenVideoRef}
                        src={videoUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-contain rounded-2xl shadow-2xl bg-black"
                        playsInline
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ============ SCENE 6 : STAR OF THE SHOW - THE CAKE & BLOW CEREMONY ============ */}
          {scene === "cake" && (
            <motion.div
              key="cake"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6 max-w-lg w-full text-center animate-pulse-slow"
            >
              <div>
                <h2 className="font-cursive text-5xl md:text-6xl text-white font-bold drop-shadow-md">
                  Make a wish, Vedangi 🌟
                </h2>
                <p className="text-sm text-white/60 mt-2 font-light">
                  Press and hold the magical blowing button over the candle to blow it out!
                </p>
              </div>

              {/* CAKE VISUAL COMPONENT */}
              <div className="relative w-72 h-80 flex flex-col justify-end items-center my-6">
                {/* CANDLE FLAME */}
                {!isCandleBlown && (
                  <motion.div
                    animate={{
                      scale: isHoldingBlow ? [0.8, 0.4, 0.9] : [1, 1.15, 0.95, 1],
                      y: isHoldingBlow ? -2 : [0, -3, 0],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                    onClick={birthdaySynth.playClickChime}
                    className="absolute bottom-[235px] w-5 h-8 rounded-t-full bg-gradient-to-t from-orange-600 via-yellow-400 to-white transition-all duration-300"
                    style={{
                      zIndex: 40,
                      boxShadow: "0 0 20px #e8b84b, 0 0 40px #ffb6d5, 0 0 60px rgba(255,255,255,0.8)",
                    }}
                  />
                )}

                {/* THE WAND CANDLE */}
                <div
                  className="w-3.5 h-20 rounded-t-lg bg-gradient-to-b from-purple-400 via-pink-400 to-indigo-400 relative"
                  style={{ zIndex: 30 }}
                >
                  <div className="absolute top-1/4 inset-x-0 h-2 bg-white/40" />
                  <div className="absolute top-2/4 inset-x-0 h-2 bg-white/40" />
                  <div className="absolute top-3/4 inset-x-0 h-2 bg-white/40" />
                </div>

                {/* CAKE TOP CREAM */}
                <div className="w-[180px] h-[34px] rounded-full bg-white shadow-inner relative -mt-3" style={{ zIndex: 20 }}>
                  {/* SPRINKLES */}
                  <div className="absolute top-2 left-6 w-1.5 h-1.5 rounded-full bg-pink-400" />
                  <div className="absolute top-4 left-16 w-2 h-1 bg-purple-400" />
                  <div className="absolute top-1 right-12 w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <div className="absolute top-3 right-6 w-2 h-1 bg-pink-400 rotate-12" />
                </div>

                {/* LAYER 1 : PINK ROSEWATER VELVET */}
                <div className="w-[220px] h-14 bg-gradient-to-b from-pink-300 to-pink-500 rounded-t-xl -mt-4 border-t border-white/20" style={{ zIndex: 15 }} />

                {/* LAYER 2 : SWEET LAVENDER */}
                <div className="w-[235px] h-14 bg-gradient-to-b from-purple-400 to-indigo-500 rounded-t-xl -mt-3 border-t border-white/20" style={{ zIndex: 10 }} />

                {/* PLATE COMPONENT */}
                <div className="w-[260px] h-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full shadow-lg -mt-5 flex items-center justify-center" style={{ zIndex: 5 }}>
                  <span className="text-[10px] font-bold text-pink-200 tracking-widest uppercase">
                    EST. 21 YEARS OF MAGIC
                  </span>
                </div>
              </div>

              {/* INTERACTIVE BLOW HOLD BUTTON CONTAINER (FROSTED GLASS) */}
              <div className="w-full glass-panel p-6 rounded-2xl max-w-sm">
                <p className="text-xs text-white/70 mb-3 font-semibold uppercase tracking-wider">
                  💨 Wishing breath meter:
                </p>

                {/* PROGRESS METER */}
                <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/15 mb-5 relative">
                  <div
                    className="h-full bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-300 transition-all duration-75"
                    style={{ width: `${blowProgress}%` }}
                  />
                  <span className="absolute inset-x-0 top-0.5 text-[9px] font-bold text-white tracking-wider drop-shadow-sm">
                    {blowProgress > 0 ? `Blowing... ${blowProgress}%` : "READY"}
                  </span>
                </div>

                {/* ACTIVE TRIGGER TRIGGER BUTTON */}
                {!isCandleBlown ? (
                  <button
                    onMouseDown={() => setIsHoldingBlow(true)}
                    onMouseUp={cancelCandleBlow}
                    onMouseLeave={cancelCandleBlow}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      setIsHoldingBlow(true);
                    }}
                    onTouchEnd={cancelCandleBlow}
                    className="w-full py-4 bg-white text-indigo-950 font-bold rounded-lg text-sm shadow-[0_4px_30px_rgba(255,255,255,0.2)] hover:bg-pink-100 transition-all cursor-pointer select-none border border-white/40 uppercase tracking-widest"
                  >
                    ✦ PRESS AND HOLD TO BLOW OUT! 💨
                  </button>
                ) : (
                  <div className="w-full py-4 bg-white/10 border border-pink-400/30 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-pink-300 animate-bounce" />
                    WISH SENT TO THE STARS! ✨
                  </div>
                )}
              </div>

              <button
                onClick={() => setScene("hub")}
                className="px-6 py-2.5 rounded-full hover:bg-white/10 text-white font-semibold text-sm shadow-xs mt-2 glass-button"
              >
                ← Back to chapters
              </button>
            </motion.div>
          )}

          {/* ============ SCENE 7 : FINAL CELEBRATION KEEPSAKE & POLAROID CARD ============ */}
          {scene === "final" && (
            <motion.div
              key="final"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-8 w-full max-w-xl text-center relative"
              onAnimationComplete={() => {
                birthdaySynth.init();
              }}
            >
              {/* HEARTS & STARS SHOWER EFFECTS */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {Array.from({ length: 21 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      opacity: 1,
                      y: 350,
                      x: (i * 28) % 360,
                      scale: 0.6 + Math.random() * 0.8,
                    }}
                    animate={{
                      y: -100 - Math.random() * 200,
                      x: ((i * 28) % 360) + (Math.random() - 0.5) * 100,
                      rotate: 360,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                    className="absolute text-pink-300 font-sans"
                  >
                    🎉
                  </motion.div>
                ))}
              </div>

              {/* THE MAGNIFICENT POLAROID FRAME CARD WITH FROSTED GRAPHICS */}
              <div className="glass-panel-heavy p-6 pb-12 rounded-lg shadow-2xl transform rotate-3 hover:rotate-1 hover:scale-103 transition-all duration-500 max-w-[360px] md:max-w-[400px] w-full mx-auto relative z-20">
                {/* POLAROID PHOTO CAPTION */}
                <div className="w-full aspect-4/5 rounded-xs overflow-hidden relative border border-white/20 shadow-inner">
                  <img
                    src={vCard}
                    alt="Happy Birthday Vedangi"
                    className="w-full h-full object-cover select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/40 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="pt-6 pb-2 text-center">
                  <h3 className="font-cursive text-3.5xl font-bold text-white drop-shadow-xs leading-none">
                    Vedangi ✨
                  </h3>
                  <p className="text-pink-200/80 font-serif italic text-xs tracking-widest mt-2 uppercase font-light">
                    Est. 21 Years of Magic & Joy
                  </p>
                </div>

                {/* MINI DECORATIVE BOW */}
                <div className="absolute top-3 left-3 text-xl bg-white/10 border border-white/20 px-2 py-0.5 rounded-full text-pink-200">
                  💖
                </div>
              </div>

              {/* HAPPY BIRTHDAY TO YOU MESSAGE BLOCK */}
              <div className="glass-panel p-8 rounded-3xl shadow-xl max-w-lg w-full flex flex-col gap-4 text-center z-20 mt-4">
                <h1 className="font-cursive text-5xl text-white font-bold drop-shadow-md leading-normal">
                  Happiest Birthday Vedangi!
                </h1>
                <p className="font-serif italic text-base leading-relaxed text-white/80 font-light">
                  "I hope this little magical world brings even half of the smiles, light, and warmth that you generously spread to everyone around you every single day."
                </p>

                {/* SECRET NOTE ACTIVATION LINK */}
                <button
                  onClick={() => {
                    setShowSecretMessage(!showSecretMessage);
                    birthdaySynth.playClickChime();
                  }}
                  className="mx-auto mt-2 px-4 py-2 border border-white/20 rounded-full bg-white/5 hover:bg-white/15 text-xs font-bold text-pink-200 flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Heart className="w-3.5 h-3.5 text-pink-300 fill-pink-300 animate-ping" />
                  Take a look at your secret note!
                </button>
              </div>

              {/* SECRET POPUP CARD */}
              <AnimatePresence>
                {showSecretMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
                  >
                    <div className="glass-panel-heavy p-8 rounded-3xl shadow-2xl text-center max-w-sm flex flex-col items-center gap-4">
                      <Heart className="w-12 h-12 text-pink-300 animate-pulse" />
                      <h4 className="font-cursive text-3.5xl font-bold text-white">
                        For Your Eyes Only 💌
                      </h4>
                      <p className="text-sm font-serif italic leading-relaxed text-white/80 font-light">
                        "If you ever find yourself doubting your light, remember that you are the anchor, the safe house, and the cosmic spark in so many lives—especially mine. Happy 21st birthday; the Universe is so incredibly glad you were born."
                      </p>
                      <button
                        onClick={() => {
                          setShowSecretMessage(false);
                          birthdaySynth.playClickChime();
                        }}
                        className="px-6 py-2.5 bg-white text-indigo-950 font-bold rounded-full text-xs shadow-md transition-all hover:scale-105"
                      >
                        Keep in my heart 🤍
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* NAVIGATION REPLAY LINKS */}
              <div className="flex gap-4 z-20">
                <button
                  onClick={() => {
                    setScene("landing");
                    setIsAmbientStarted(false);
                    setIsCandleBlown(false);
                    setBlowProgress(0);
                    setNoCount(0);
                    setNoBtnOffset({ x: 0, y: 0 });
                    birthdaySynth.stopBackgroundAmbient();
                    birthdaySynth.playClickChime();
                  }}
                  className="px-5 py-2 text-xs font-bold border border-white/20 rounded-full bg-white/5 hover:bg-white/10 transition-all text-white"
                >
                  🔁 Restart Surprise
                </button>
                <button
                  onClick={() => setScene("hub")}
                  className="px-5 py-2 text-xs font-bold border border-white/20 rounded-full bg-white/5 hover:bg-white/10 transition-all text-white"
                >
                  🔖 Explore Chapters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER BLOCK WITH DESIGN STATEMENT */}
      <div className="pb-6 pt-4 text-white/40 hover:text-white/60 select-none text-[10px] tracking-widest font-sans uppercase z-20 transition-colors">
        Crafted with love for Vedu ♥
      </div>
    </div>
  );
}
