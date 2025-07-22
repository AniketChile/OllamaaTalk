'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import ChatSidebar from '../../components/ChatSidebar'; // Adjust the path as needed

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [abortController, setAbortController] = useState(null);

  useEffect(() => {
    let intervalId;
  
    async function fetchMessages() {
      try {
        const res = await fetch(`http://localhost:3001/api/chat/${chatId}`);
        const data = await res.json();
  
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          console.error('Expected array, got:', data);
          setMessages([]);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setMessages([]);
      }
    }
  
    if (chatId) {
      fetchMessages(); // Initial load
      intervalId = setInterval(fetchMessages, 2000); // Poll every 2 sec
    }
  
    return () => clearInterval(intervalId); // Cleanup
  }, [chatId]);
  

  async function sendMessage() {
    const controller = new AbortController();
    setAbortController(controller);
  
    const userMessage = { role: 'user', content: input };
    const assistantMessage = { role: 'assistant', content: '' };
  
    const newMessages = [...messages, userMessage, assistantMessage];
    const assistantIndex = newMessages.length - 1;
  
    setMessages(newMessages);
    setInput('');
  
    try {
      const res = await fetch(`http://localhost:3001/api/chat/${chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
        signal: controller.signal,
      });
  
      if (!res.ok || !res.body) {
        const text = await res.text();
        console.error('Streaming failed:', text);
        setMessages(prev => {
          const updated = [...prev];
          updated[assistantIndex] = {
            role: 'system',
            content: `❌ Error: ${res.status} ${res.statusText}`,
          };
          return updated;
        });
        return;
      }
  
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        buffer += decoder.decode(value, { stream: true });
  
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // Keep the leftover
  
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
  
          const content = line.replace('data: ', '');
          if (content === '[DONE]') return;
  
          setMessages(prev => {
            const updated = [...prev];
            updated[assistantIndex] = {
              ...updated[assistantIndex],
              content: updated[assistantIndex].content + content,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('❌ Request error:', err.message);
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantIndex] = {
          role: 'system',
          content: `❌ Request failed: ${err.message}`,
        };
        return updated;
      });
    }
  }

  function handleStop() {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatSidebar currentChatId={chatId} />

      <div className="flex flex-col flex-1 p-6">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-xl px-4 py-3 rounded-lg shadow-sm ${
                msg.role === 'user'
                  ? 'ml-auto bg-blue-500 text-white'
                  : msg.role === 'assistant'
                  ? 'mr-auto bg-white text-gray-900 border'
                  : 'mr-auto bg-red-100 text-red-700 border border-red-300'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400 border border-black"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Send
          </button>
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}
