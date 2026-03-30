'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Message {
  _id: string;
  senderId: { _id: string; firstName: string; lastName: string; };
  recipientId: string;
  text: string;
  createdAt: string;
}

interface DirectChatProps {
  otherUserId: string;
}

export function DirectChat({ otherUserId }: DirectChatProps) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const roomId = `direct_${user?.id}_${otherUserId}`;

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let socket: any = null;

    const fetchMessages = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/messages/direct/${otherUserId}?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch direct messages');
        const data = await res.json();
        setMessages(data.messages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
        socket = io(SOCKET_URL, { transports: ['websocket'] });

        socket.on('connect', () => {
          socket?.emit('joinRoom', { roomId });
          socket?.emit('joinRoom', { roomId: `direct_${otherUserId}_${user?.id}` });
        });

        socket.on('receiveMessage', (message: Message) => {
          if (message.chatType === 'direct' && (message.senderId._id === otherUserId || message.recipientId === otherUserId)) {
            setMessages(prev => [...prev, message]);
          }
        });
      } catch (err) {
        console.error('Socket.io init failed', err);
      }
    };

    initSocket();

    return () => {
      if (socket) {
        socket.emit('leaveRoom', { roomId });
        socket.emit('leaveRoom', { roomId: `direct_${otherUserId}_${user?.id}` });
        socket.disconnect();
      }
    };
  }, [otherUserId, token, roomId, user?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/messages/direct/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: otherUserId, text: newMessage })
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const payload = await res.json();
      setMessages(prev => [...prev, payload]);
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-6 bg-white h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Direct Chat</h3>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-gray-50 p-3 rounded-lg">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading chat...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No direct messages yet.</div>
        ) : (
          messages.map(message => (
            <div key={message._id} className={`p-3 rounded-lg ${message.senderId._id === user?.id ? 'bg-blue-100 ml-auto' : 'bg-white border border-gray-200 mr-auto'}`}>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-sm">{message.senderId.firstName} {message.senderId.lastName}</span>
                <span className="text-xs text-gray-500">{new Date(message.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700">{message.text}</p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type message..." disabled={sending} />
        <Button type="submit" disabled={sending || !newMessage.trim()}>{sending ? 'Sending...' : 'Send'}</Button>
      </form>
    </Card>
  );
}
