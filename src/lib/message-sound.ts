/** Soft chime for incoming chat messages (Web Audio, no asset file). */
export function playNewMessageSound() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    master.connect(ctx.destination);

    const tones = [880, 1174];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = i === 0 ? 1 : 0.55;
      osc.connect(gain);
      gain.connect(master);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.32);
    });

    window.setTimeout(() => {
      void ctx.close();
    }, 500);
  } catch {
    // autoplay / unsupported — ignore
  }
}
