import { useState } from "react";

// import { generateContent } from "./gemini/textGenerationModel";
import ReactMarkdown from "react-markdown";
import {sendMessageToBot } from "../gemini/chatModel";

function ChatBot() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    // Add user message
    const userMsg = { sender: "user", text: prompt };
    setMessages((prev) => [...prev, userMsg]);

    setPrompt("");
    setLoading(true);

    try {
      // Call AI
      const resp = await sendMessageToBot(prompt)
      console.log('resp', resp);
      const aiMsg = { sender: "ai", text: resp || "No response" };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Something went wrong." },
      ]);
      console.log('err', err)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble ${msg.sender === "user" ? "user" : "ai"}`}
          >
            {msg.sender === "ai" ? (
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            ) : (
              msg.text
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble ai">
            <em>AI is typing...</em>
          </div>
        )}
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type your message..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatBot;
