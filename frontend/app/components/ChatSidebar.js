'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatSidebar({ currentChatId }) {
  const [chats, setChats] = useState([]);
  const router = useRouter();

  const createNewChat = async () => {
    const res = await fetch('http://localhost:3001/api/chat', { method: 'POST' });
    const chat = await res.json();
    router.push(`/chat/${chat.id}`);
  };

  useEffect(() => {
    fetch('http://localhost:3001/api/chats')
      .then(res => res.json())
      .then(setChats);
  }, []);

  return (
    <div className="w-64 bg-white p-4 border-r overflow-y-auto text-black">
      <button
        onClick={createNewChat}
        className="w-full bg-blue-600 text-white py-2 rounded mb-4"
      >
        + New Chat
      </button>
      <div className="space-y-2">
        {chats.map(chat => (
          <button
            key={chat.id}
            onClick={() => router.push(`/chat/${chat.id}`)}
            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
              currentChatId == chat.id ? 'bg-gray-200' : ''
            }`}
          >
            Chat {chat.id}
          </button>
        ))}
      </div>
    </div>
  );
}
