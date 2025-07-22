"use client";
import { useEffect, useRef, useState } from "react";
import "./globals.css";

export default function ChatWindow({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (!chatId) return;

    fetch(`http://localhost:3001/api/chat/${chatId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          console.error("Expected array of messages, got:", data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch messages:", err);
      });
  }, [chatId]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const assistantMessage = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setTyping(true);
    setStreaming(true);

    try {
      const res = await fetch(
        `http://localhost:3001/api/chat/${chatId}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: input }),
        }
      );

      const reader = ollamaRes.body.getReader();
      const decoder = new TextDecoder();
      let partial = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });

        let lines = partial.split("\n");
        partial = lines.pop(); // keep incomplete line for next loop

        for (let line of lines) {
          line = line.trim();
          if (!line) continue;

          try {
            const json = JSON.parse(line);
            if (json.response) {
              const token = json.response;
              assistantMessage += token;
              res.write(`data: ${token}\n\n`);
              res.flush?.(); // flush right after write
            }
          } catch (e) {
            console.warn("Skipped malformed line:", line);
          }
        }
      }

      setTyping(false);
      setStreaming(false);
    } catch (err) {
      console.error("Error while streaming:", err);
      setTyping(false);
      setStreaming(false);
    }
  };

  const stopStream = () => {
    fetch(`http://localhost:3001/api/chat/${chatId}/stop`, { method: "POST" });
    setStreaming(false);
    setTyping(false);
  };

  return (
    <div className="flex flex-col flex-1 p-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded ${
              msg.role === "user" ? "bg-white" : "bg-gray-200"
            }`}
          >
            <span className="font-semibold capitalize">{msg.role}:</span>{" "}
            {msg.content}
          </div>
        ))}
        {typing && <div className="italic text-gray-500">Typing...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <textarea
          rows={2}
          className="flex-1 p-2 border rounded resize-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          disabled={streaming}
          className="bg-green-600 text-black px-4 py-2 rounded"
        >
          Send
        </button>
        {streaming && (
          <button
            onClick={stopStream}
            className="bg-red-600 text-black px-4 py-2 rounded"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
