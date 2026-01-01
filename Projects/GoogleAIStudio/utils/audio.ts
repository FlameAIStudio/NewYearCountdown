
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * 机械触感反馈声
 */
export function createProceduralClick(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.05;
  const frameCount = sampleRate * duration;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t / 0.01);
    data[i] = (Math.random() * 2 - 1) * envelope * 0.25;
  }
  return buffer;
}

/**
 * 物理建模：圣殿青铜大钟 (Cathedral Bronze Bell)
 * 采用双正弦干涉与频率依赖性衰减模型
 */
export function createProceduralBell(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 10.0; 
  const frameCount = sampleRate * duration;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);

  // 基频设定为 G2 (约 98Hz)，这个频率在普通扬声器上表现更清晰且不失厚重
  const f = 97.99; 
  
  // 钟声的标准谐波比例及其独立衰减特性
  // freq: 频率比例, amp: 初始振幅, decay: 衰减速度(数值越大衰减越慢), beat: 拍频差
  const partials = [
    { ratio: 0.5,   amp: 0.8,  decay: 8.0, beat: 0.15 }, // Hum Note (最深沉的长尾)
    { ratio: 1.0,   amp: 1.0,  decay: 5.0, beat: 0.3  }, // Prime (主音)
    { ratio: 1.189, amp: 0.7,  decay: 3.5, beat: 0.5  }, // Tierce (标志性小三度 - 庄严感来源)
    { ratio: 1.5,   amp: 0.5,  decay: 2.5, beat: 0.8  }, // Quint (纯五度)
    { ratio: 2.0,   amp: 0.9,  decay: 1.8, beat: 1.2  }, // Nominal (敲击瞬间的主听觉高度)
    { ratio: 3.0,   amp: 0.4,  decay: 1.0, beat: 1.8  }, // Superquint
    { ratio: 4.0,   amp: 0.3,  decay: 0.6, beat: 2.5  }  // Octave Nominal (瞬态金属感)
  ];

  for (let i = 0; i < frameCount; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    for (const p of partials) {
      const freq = f * p.ratio;
      const env = Math.exp(-t / p.decay);
      
      // 使用双振荡器产生真实的物理拍频干涉，而非调频失真
      const osc1 = Math.sin(2 * Math.PI * freq * t);
      const osc2 = Math.sin(2 * Math.PI * (freq + p.beat) * t);
      
      sample += ((osc1 + osc2) * 0.5) * p.amp * env;
    }
    
    // 初始敲击的“金属碰撞”瞬间 (Metallic Clang)
    // 使用更高频、极短促的非谐波群，模拟重锤接触感
    if (t < 0.1) {
      const strikeEnv = Math.exp(-t / 0.02);
      sample += (Math.sin(2 * Math.PI * f * 7.1 * t) + Math.sin(2 * Math.PI * f * 11.3 * t)) * 0.3 * strikeEnv;
    }

    // 最后的增益处理与软限制
    let val = sample * 0.35;
    
    // 软限制处理：防止溢出的同时增加声音的温暖感
    if (val > 0.4) val = 0.4 + Math.tanh(val - 0.4) * 0.1;
    if (val < -0.4) val = -0.4 + Math.tanh(val + 0.4) * 0.1;
    
    data[i] = val;
  }
  return buffer;
}
