'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const createNewChat = async () => {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Chat' }), // 🔥 Add title here
      });
      console.log("Created chat:", chat);
      const chat = await res.json();

      if (chat?.id) {
        router.push(`/chat/${chat.id}`); // Use UUID correctly
      } else {
        console.error('Failed to create chat:', chat);
      }
    };

    createNewChat();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-600 text-lg">Creating new chat...</p>
    </div>
  );
}
