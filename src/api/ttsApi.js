const apiKey = import.meta.env.VITE_GEMINI_API_KEY;


// ✅ Model config for TTS
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const ttsApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`;
const voiceName="Orus" // e.g. Kore, Leda, Zephyr, etc
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function pcmToWav(pcmData, sampleRate) {
  const wavData = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(wavData);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcmData.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcmData.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcmData.length; i++, offset += 2) {
    view.setInt16(offset, pcmData[i], true);
  }

  return new Blob([view], { type: "audio/wav" });
}

export async function playAudioFromText(text) {
  const payload = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } } 
      }
    },
    model: "gemini-2.5-flash-preview-tts"
  };

  const response = await fetch(ttsApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`TTS API Error: ${response.statusText}`);
  }

  const result = await response.json();
  const part = result?.candidates?.[0]?.content?.parts?.[0];
  const audioData = part?.inlineData?.data;
  const mimeType = part?.inlineData?.mimeType;

  if (audioData && mimeType?.startsWith("audio/")) {
    const sampleRateMatch = mimeType.match(/rate=(\d+)/);
    const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 16000;

    const pcmData = base64ToArrayBuffer(audioData);
    const pcm16 = new Int16Array(pcmData);
    const wavBlob = pcmToWav(pcm16, sampleRate);
    const audioUrl = URL.createObjectURL(wavBlob);

    const audio = new Audio(audioUrl);
    await audio.play();
  } else {
    console.error("No audio returned from TTS API.");
  }
}