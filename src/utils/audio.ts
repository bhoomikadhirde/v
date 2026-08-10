/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer for ambient music, sound effects, and Happy Birthday theme
class BirthdaySynth {
  private ctx: AudioContext | null = null;
  private ambientInterval: number | null = null;
  private isMuted: boolean = false;
  private isBackgroundPlaying: boolean = false;
  private currentNotesPlaying: { osc: OscillatorNode; gain: GainNode }[] = [];

  // Initialize audio context on user gesture
  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  // Play a soft, gorgeous wand-sparkle chime (pitch cascades upward quickly)
  public playClickChime() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.4);
    });
  }

  // Play a funny pitch-sliding sound when the button dodges/hovers
  public playDodgeSound() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now); // start low
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25); // slide high

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Continuous gentle ambient music track: plays relaxing, warm synth chords
  // Loops a simple chord progression: Cmaj7 -> Am7 -> Fmaj7 -> G7
  public startBackgroundAmbient() {
    this.init();
    if (!this.ctx || this.isBackgroundPlaying) return;
    this.isBackgroundPlaying = true;

    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
      [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
      [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [196.00, 246.94, 293.66, 349.23], // G7 (G3, B3, D4, F4)
    ];

    let chordIdx = 0;

    const playNextChord = () => {
      if (!this.ctx || this.isMuted || !this.isBackgroundPlaying) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIdx];

      // Arpeggiate the letters of the chord with beautiful, soft FM-like or warm organ synth pads
      currentChord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator(); // sub octave bass
        const gain = this.ctx.createGain();

        // Soft triangular/sine waves
        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        // Sub bass for the first note
        if (idx === 0) {
          subOsc.type = "sine";
          subOsc.frequency.setValueAtTime(freq / 2, now);
          const subGain = this.ctx.createGain();
          subGain.gain.setValueAtTime(0, now);
          subGain.gain.linearRampToValueAtTime(0.04, now + 0.8);
          subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);
          subOsc.connect(subGain);
          subGain.connect(this.ctx.destination);
          subOsc.start(now);
          subOsc.stop(now + 4.0);
          this.currentNotesPlaying.push({ osc: subOsc, gain: subGain });
        }

        // Slow attack, long slow release of chord elements
        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.15 + 1.2); // soft attack
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 4.2); // long tail release

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 4.5);

        this.currentNotesPlaying.push({ osc, gain });
      });

      chordIdx = (chordIdx + 1) % chords.length;
    };

    // Trigger first chord immediately
    playNextChord();

    // Loop chord progression every 5 seconds
    this.ambientInterval = window.setInterval(playNextChord, 5000);
  }

  // Stop background ambient loop
  public stopBackgroundAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    this.isBackgroundPlaying = false;
    this.currentNotesPlaying.forEach((item) => {
      try {
        item.osc.stop();
      } catch (e) {}
    });
    this.currentNotesPlaying = [];
  }

  // Toggle mute state
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBackgroundAmbient();
    } else {
      this.startBackgroundAmbient();
    }
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  // Play "Happy Birthday to you" song with custom retro chime melody
  public playHappyBirthdaySong() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    // First stop background ambient to prevent overlapping
    this.stopBackgroundAmbient();

    const now = this.ctx.currentTime;

    // Sequence of notes of Happy Birthday in C major:
    // [Frequency, Duration (beats), delay relative to start on beats]
    // Tempo: 120 bpm, so 1 beat = 0.5s
    const beatDur = 0.45; 
    const melody = [
      { f: 392.00, d: 0.75, t: 0 },    // G4
      { f: 392.00, d: 0.25, t: 0.75 }, // G4
      { f: 440.00, d: 1.0, t: 1.0 },   // A4
      { f: 392.00, d: 1.0, t: 2.0 },   // G4
      { f: 523.25, d: 1.0, t: 3.0 },   // C5
      { f: 493.88, d: 2.0, t: 4.0 },   // B4

      { f: 392.00, d: 0.75, t: 6.0 },   // G4
      { f: 392.00, d: 0.25, t: 6.75 },  // G4
      { f: 440.00, d: 1.0, t: 7.0 },    // A4
      { f: 392.00, d: 1.0, t: 8.0 },    // G4
      { f: 587.33, d: 1.0, t: 9.0 },    // D5
      { f: 523.25, d: 2.0, t: 10.0 },   // C5

      { f: 392.00, d: 0.75, t: 12.0 },  // G4
      { f: 392.00, d: 0.25, t: 12.75 }, // G4
      { f: 783.99, d: 1.0, t: 13.0 },   // G5
      { f: 659.25, d: 1.0, t: 14.0 },   // E5
      { f: 523.25, d: 1.0, t: 15.0 },   // C5
      { f: 493.88, d: 1.0, t: 16.0 },   // B4
      { f: 440.00, d: 1.5, t: 17.0 },   // A4

      { f: 698.46, d: 0.75, t: 18.5 },  // F5
      { f: 698.46, d: 0.25, t: 19.25 }, // F5
      { f: 659.25, d: 1.0, t: 19.5 },   // E5
      { f: 523.25, d: 1.0, t: 20.5 },   // C5
      { f: 587.33, d: 1.0, t: 21.5 },   // D5
      { f: 523.25, d: 2.5, t: 22.5 },   // C5
    ];

    // Simple accompanying bass chords to enrich it!
    const bass = [
      { f: 130.81, t: 0 },    // C3 (root)
      { f: 146.83, t: 4.0 },  // G3 or G2
      { f: 146.83, t: 6.0 },  // G3
      { f: 130.81, t: 10.0 }, // C3
      { f: 130.81, t: 12.0 }, // C3
      { f: 174.61, t: 17.0 }, // F3
      { f: 130.81, t: 19.5 }, // C3
      { f: 146.83, t: 21.5 }, // G3
      { f: 261.63, t: 22.5 }, // C4
    ];

    // Schedule melody chimes (combining Triangle for depth + Sine for sweetness)
    melody.forEach((note) => {
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      const startSec = now + note.t * beatDur;
      const durSec = note.d * beatDur;

      // Triangle gives a lovely sweet woody music-box vibe
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(note.f, startSec);

      // Soft sine adds warmth
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(note.f * 2, startSec); // harmonic sparkle octave

      gainNode.gain.setValueAtTime(0, startSec);
      gainNode.gain.linearRampToValueAtTime(0.08, startSec + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startSec + durSec - 0.05);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start(startSec);
      osc1.stop(startSec + durSec);
      osc2.start(startSec);
      osc2.stop(startSec + durSec);
    });

    // Schedule accompanying soft bass line
    bass.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      const startSec = now + note.t * beatDur;
      const durSec = 1.8;

      osc.type = "sine";
      osc.frequency.setValueAtTime(note.f, startSec);

      gainNode.gain.setValueAtTime(0, startSec);
      gainNode.gain.linearRampToValueAtTime(0.05, startSec + 0.2); // slow attack
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startSec + durSec - 0.1);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(startSec);
      osc.stop(startSec + durSec);
    });
  }
}

export const birthdaySynth = new BirthdaySynth();
