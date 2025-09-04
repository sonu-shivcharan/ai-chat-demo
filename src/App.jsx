import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "./api/chatApi";
import { playAudioFromText } from "./api/ttsApi";

const App = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const sendMessage = async () => {
    if (isSending || !userInput.trim()) return;
    const prompt = userInput.trim();

    setUserInput("");
    setIsSending(true);

    setChatHistory((prev) => [
      ...prev,
      { role: "user", parts: [{ text: prompt }] },
    ]);
    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        parts: [{ text: "typing..." }],
        isLoading: true,
      },
    ]);

    try {
      const assistantText = await sendChatMessage(chatHistory, prompt);

      setChatHistory((prev) => prev.filter((msg) => !msg.isLoading));
      if (assistantText) {
        setChatHistory((prev) => [
          ...prev,
          { role: "model", parts: [{ text: assistantText }] },
        ]);
        playAudioFromText(assistantText);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "model", parts: [{ text: "Sorry, no response." }] },
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => prev.filter((msg) => !msg.isLoading));
      setChatHistory((prev) => [
        ...prev,
        { role: "model", parts: [{ text: "Error occurred. Try again." }] },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-gray-100 flex flex-col h-screen">
      {/* Header */}
   

      {/* Chat Container */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div
          ref={chatMessagesRef}
          className="max-w-xl mx-auto flex flex-col gap-4"
        >
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-2xl max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-800"
                } ${msg.isLoading ? "animate-pulse" : ""}`}
              >
                {msg.parts?.[0]?.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white flex gap-2">
        <input
          type="text"
          className="flex-grow rounded-full border-2 border-gray-300 px-4 py-2 focus:outline-none"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={isSending}
        />
        <button
          className="bg-indigo-600 text-white rounded-full p-3 disabled:bg-indigo-400"
          onClick={sendMessage}
          disabled={isSending}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default App;
