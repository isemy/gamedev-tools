export type WaveType = "square" | "sawtooth" | "sine" | "triangle" | "noise";

export interface SfxParams {
  waveType: WaveType;
  frequency: number;       // Hz
  frequencyEnd: number;    // Hz (sweep target)
  attack: number;          // seconds
  sustain: number;         // seconds
  decay: number;           // seconds
  volume: number;          // 0-1
  vibrato: number;         // Hz
  vibratoDepth: number;    // semitones
  distortion: number;      // 0-1
}

export const PRESETS: Record<string, SfxParams> = {
  jump: {
    waveType: "square", frequency: 200, frequencyEnd: 600,
    attack: 0.01, sustain: 0.05, decay: 0.15,
    volume: 0.6, vibrato: 0, vibratoDepth: 0, distortion: 0,
  },
  explosion: {
    waveType: "noise", frequency: 80, frequencyEnd: 40,
    attack: 0.01, sustain: 0.1, decay: 0.5,
    volume: 0.8, vibrato: 0, vibratoDepth: 0, distortion: 0.6,
  },
  pickup: {
    waveType: "sine", frequency: 600, frequencyEnd: 1200,
    attack: 0.01, sustain: 0.05, decay: 0.1,
    volume: 0.5, vibrato: 8, vibratoDepth: 0.5, distortion: 0,
  },
  hurt: {
    waveType: "sawtooth", frequency: 400, frequencyEnd: 100,
    attack: 0.01, sustain: 0.05, decay: 0.2,
    volume: 0.7, vibrato: 0, vibratoDepth: 0, distortion: 0.3,
  },
  levelup: {
    waveType: "sine", frequency: 400, frequencyEnd: 800,
    attack: 0.02, sustain: 0.15, decay: 0.3,
    volume: 0.6, vibrato: 6, vibratoDepth: 1, distortion: 0,
  },
  shoot: {
    waveType: "square", frequency: 800, frequencyEnd: 200,
    attack: 0.005, sustain: 0.02, decay: 0.1,
    volume: 0.5, vibrato: 0, vibratoDepth: 0, distortion: 0.1,
  },
  coin: {
    waveType: "sine", frequency: 988, frequencyEnd: 1319,
    attack: 0.005, sustain: 0.06, decay: 0.12,
    volume: 0.5, vibrato: 0, vibratoDepth: 0, distortion: 0,
  },
};

const SAMPLE_RATE = 44100;

function generateSamples(p: SfxParams): Float32Array<ArrayBuffer> {
  const totalTime = p.attack + p.sustain + p.decay;
  const numSamples = Math.floor(SAMPLE_RATE * totalTime);
  const samples = new Float32Array(new ArrayBuffer(numSamples * 4));

  let phase = 0;
  let vibratoPhase = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / totalTime;

    // envelope
    let env = 0;
    if (t < p.attack) {
      env = t / p.attack;
    } else if (t < p.attack + p.sustain) {
      env = 1;
    } else {
      env = 1 - (t - p.attack - p.sustain) / p.decay;
    }
    env = Math.max(0, env);

    // frequency sweep + vibrato
    const freqProgress = Math.min(progress * 1.5, 1);
    const baseFreq = p.frequency + (p.frequencyEnd - p.frequency) * freqProgress;
    const vibratoOffset = p.vibrato > 0
      ? Math.sin(vibratoPhase) * p.vibratoDepth * baseFreq * 0.05946
      : 0;
    const freq = baseFreq + vibratoOffset;

    vibratoPhase += (2 * Math.PI * p.vibrato) / SAMPLE_RATE;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    // waveform
    let sample = 0;
    if (p.waveType === "noise") {
      sample = Math.random() * 2 - 1;
    } else if (p.waveType === "sine") {
      sample = Math.sin(phase);
    } else if (p.waveType === "square") {
      sample = Math.sin(phase) >= 0 ? 1 : -1;
    } else if (p.waveType === "sawtooth") {
      sample = ((phase % (2 * Math.PI)) / Math.PI) - 1;
    } else if (p.waveType === "triangle") {
      const norm = (phase % (2 * Math.PI)) / (2 * Math.PI);
      sample = norm < 0.5 ? norm * 4 - 1 : 3 - norm * 4;
    }

    // distortion
    if (p.distortion > 0) {
      const drive = 1 + p.distortion * 20;
      sample = Math.tanh(sample * drive) / Math.tanh(drive);
    }

    samples[i] = sample * env * p.volume;
  }

  return samples;
}

export function playSfx(p: SfxParams): void {
  const ctx = new AudioContext();
  const samples = generateSamples(p);
  const buffer = ctx.createBuffer(1, samples.length, SAMPLE_RATE);
  buffer.copyToChannel(samples, 0);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
  source.onended = () => ctx.close();
}

export function exportWav(p: SfxParams): void {
  const samples = generateSamples(p);
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  const blob = new Blob([buffer], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sfx.wav";
  a.click();
  URL.revokeObjectURL(url);
}
