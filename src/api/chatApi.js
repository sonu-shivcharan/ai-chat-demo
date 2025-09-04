import { systemInstruction } from "../instructions";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;


// ✅ Model config (easy to change later)
const CHAT_MODEL = "gemini-2.5-flash-preview-05-20";
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${apiKey}`;
export async function sendChatMessage(history, userPrompt) {
  const payload = {
    contents: [...history, { role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: {
      parts: [
        {
          text:systemInstruction,
        },
      ],
    },
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Chat API Error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text || null;
}