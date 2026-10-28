 "use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, Music2, Pause, Play, Sparkles, Volume2, VolumeX, ArrowDown, Flower2 } from "lucide-react";
import { track } from "@/lib/analytics";

const memories = [
  { n: "01", title: "Woh pehli smile", note: "Jis din tumhari smile ne mera din bana diya.", img: "/pics/her-smile.jpg", alt: "Tumhari smile" },
  { n: "02", title: "Chhoti-chhoti baatein", note: "Tumse baat karna hamesha mere din ka favourite part raha.", img: "/pics/us-close.jpg", alt: "Hum dono, paas-paas" },
  { n: "03", title: "Hum, apni si duniya", note: "Perfect nahi, par mere liye bahut special.", img: "/pics/us-station.jpg", alt: "Station wali yaad" }
];

export default function Home() {
  const [musicOn, setMusicOn] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [forgiven, setForgiven] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const lovedOne = process.env.NEXT_PUBLIC_LOVED_ONE_NAME || "meri jaan";
  const yourName = process.env.NEXT_PUBLIC_YOUR_NAME || "tumhara pagal";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let cancelled = false;
    const start = async () => {
      try {
        audio.volume = volume;
        await audio.play();
        if (!cancelled) {
          setMusicOn(true);
          void track("event", "music_started");
        }
        return true;
      } catch {
        return false;
      }
    };
    const unlock = () => {
      cleanup();
      void start();
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    void (async () => {
      const ok = await start();
      if (!ok && !cancelled) {
        window.addEventListener("pointerdown", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
        window.addEventListener("touchstart", unlock, { once: true });
      }
    })();
    return () => { cancelled = true; cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void track("start", "page_open");
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") void track("heartbeat", "still_here");
    }, 15000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void track("event", "page_visible");
      else void track("event", "page_hidden");
    };
    const onPageHide = () => { void track("end", "page_exit"); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicOn) {
      audio.pause();
      setMusicOn(false);
      void track("event", "music_paused");
    } else {
      try {
        audio.volume = volume;
        await audio.play();
        setMusicOn(true);
        void track("event", "music_started");
      } catch {
        alert("Browser ne music block kar diya — page pe kahin bhi ek tap karo, song shuru ho jayega ❤️");
      }
    }
  }

  function forgiveClick() {
    setForgiven(true);
    void track("event", "forgive_button_clicked");
  }

  return (
    <main>
      <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} />
      <audio ref={audioRef} src="/song.mp3" loop preload="auto" onPlay={() => setMusicOn(true)} onPause={() => setMusicOn(false)} />
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="petal-field" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => <span key={i} style={{ "--i": i } as React.CSSProperties}>✿</span>)}
      </div>

      <header className="topbar">
        <a className="brand" href="#home"><Heart size={16} fill="currentColor" /> for {lovedOne}</a>
        <button className="music-button" onClick={toggleMusic} aria-label={musicOn ? "Pause music" : "Play music"}>
          {musicOn ? <Pause size={16} /> : <Play size={16} />} <Music2 size={16} /> {musicOn ? "Pause song" : "Play our song"}
        </button>
      </header>

      <section className="hero section" id="home">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="hero-inner">
          <span className="eyebrow"><Sparkles size={14} /> A little page, from my heart</span>
          <div className="hero-heart">
            <Image src="/pics/her-thinking.jpg" alt={lovedOne} fill sizes="92px" priority />
            <Heart className="hero-photo-badge" size={15} fill="currentColor" />
          </div>
          <h1>Maaf krde na,<br /><em>wapas aaja.</em></h1>
          <p className="hero-copy">Hey {lovedOne}, agar tum yahan tak aayi ho, toh bas kuch dil ki baatein kehni thi… bina kisi pressure ke. ❤️</p>
          <a className="primary-button" href="#letter" onClick={() => void track("event", "hero_read_more")}>Dil ki baat sunogi? <ArrowDown size={16} /></a>
          <div className="scroll-cue"><span /> scroll slowly</div>
        </motion.div>
        <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
      </section>

      <section className="section apology-section" id="letter">
        <motion.div className="section-heading" initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }}>
          <span className="eyebrow">01 — FROM THE HEART</span>
          <h2>Kaash main us pal ko<br /><em>thoda behtar bana pata.</em></h2>
          <p className="muted">Galti ko chhupana nahi, samajhna zaroori hai.</p>
        </motion.div>
        <motion.article className="letter-card" initial={{ opacity: 0, y: 30, rotate: -1 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.7 }}>
          <div className="letter-stamp"><Heart size={22} /></div>
          <p className="handwritten">Meri jaan,</p>
          <p>Mujhe sach mein sorry hai. Agar meri kisi baat ya harkat se tumhe dukh hua, toh main usse lightly nahi lena chahta. Main apni galti ko samajhna chahta hoon aur sirf words se nahi, apne actions se bhi better karna chahta hoon.</p>
          <p>Tum mere liye important ho. Main tumhari feelings sunne ke liye ready hoon — jab tum ready ho. Tumhe abhi jawab dene ya mujhe maaf karne ki koi majboori nahi hai.</p>
          <p className="handwritten signoff">Dil se sorry. ❤️</p>
          <span className="letter-footer">with love, {yourName}</span>
        </motion.article>
      </section>

      <section className="section memories-section" id="memories">
        <motion.div className="section-heading" initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="eyebrow">02 — LITTLE MOMENTS</span>
          <h2>Kuch yaadein jo<br /><em>mere paas rehti hain.</em></h2>
          <p className="muted">Kuch pal, kuch yaadein — sab dil ke paas rehti hain.</p>
        </motion.div>
        <div className="memory-grid">
          {memories.map((m, i) => <motion.article key={m.n} className={`memory-card memory-${i + 1}`} initial={{ opacity: 0, y: 35, rotate: i % 2 ? 2 : -2 }} whileInView={{ opacity: 1, y: 0, rotate: i % 2 ? 1 : -1 }} whileHover={{ y: -8, rotate: 0, scale: 1.02 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: i * 0.12 }}>
            <div className="memory-art"><Image src={m.img} alt={m.alt} fill sizes="(max-width:700px) 92vw, 320px" /><Heart className="memory-badge" size={18} fill="currentColor" /><span>{m.n}</span></div>
            <div className="memory-copy"><span className="eyebrow">A MEMORY</span><h3>{m.title}</h3><p>{m.note}</p></div>
          </motion.article>)}
        </div>
      </section>

      <section className="section promise-section">
        <motion.div className="promise-orb" animate={{ scale: [1, 1.06, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 8 }}>
          <Heart size={48} strokeWidth={1} />
        </motion.div>
        <span className="eyebrow">03 — NO BIG PROMISES, JUST HONESTY</span>
        <h2>Main perfect nahi hoon,<br /><em>par seekhna chahta hoon.</em></h2>
        <p className="promise-copy">Agar tum baat karna chaho, main sununga. Agar tumhe time chahiye, main uski respect karunga. Tumhari khushi aur sukoon bhi utne hi important hain.</p>
      </section>

      <section className="section final-section">
        <Flower2 className="final-flower" size={28} />
        <span className="eyebrow">ONE LAST THING</span>
        <h2>Maaf kar paogi<br /><em>kabhi, shayad?</em></h2>
        <p className="muted">Koi pressure nahi. Bas dil se pooch raha hoon.</p>
        <button className="primary-button big" onClick={forgiveClick}><Heart size={17} /> {forgiven ? "Thank you for reading ❤️" : "Ek hug bhej do? 🤍"}</button>
        {forgiven && <motion.div className="response-note" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><span>♡</span><p>Thank you, {lovedOne}. Jab bhi tum ready ho, main yahin hoon.</p><span>♡</span></motion.div>}
        <button className="text-button" onClick={() => { setShowLetter(!showLetter); void track("event", "small_note_toggled"); }}>{showLetter ? "Close my little note ↑" : "P.S. ek chhoti si baat…"}</button>
        {showLetter && <motion.p className="ps-note" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>Tumhari feelings matter karti hain. Agar maine kuch galat kiya hai, main sunne aur samajhne ke liye ready hoon. — {yourName}</motion.p>}
      </section>

      <footer className="footer"><Heart size={13} fill="currentColor" /> made with honesty, not pressure <span>·</span> for {lovedOne}</footer>
    </main>
  );
}
