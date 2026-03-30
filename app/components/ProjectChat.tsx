'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  _id: string;
  senderId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  text: string;
  createdAt: string;
}

interface ChatProps {
  projectId: string;
}

export function ProjectChat({ projectId }: ChatProps) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages and initialize WebSocket
  useEffect(() => {
    let socket: any = null;

    const fetchMessages = async () => {
      if (!token) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/messages/project/${projectId}?limit=50`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data.messages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const setupSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
        socket = io(SOCKET_URL, { transports: ['websocket'] });

        socket.on('connect', () => {
          socket?.emit('joinRoom', { roomId: `project_${projectId}` });
        });

        socket.on('receiveMessage', (message: any) => {
          if (message.projectId === projectId && message.chatType === 'project-group') {
            setMessages((prev) => [...prev, message]);
          }
        });
      } catch (err) {
        console.error('Socket connection failed', err);
      }
    };

    setupSocket();

    socket.on('receiveMessage', (message) => {
      if (message.projectId === projectId && message.chatType === 'project-group') {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      if (socket) {
        socket.emit('leaveRoom', { roomId: `project_${projectId}` });
        socket.disconnect();
      }
    };
  }, [projectId, token]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/messages/project/${projectId}/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: newMessage })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');

      // Refresh messages
      const listResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/messages/project/${projectId}?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (listResponse.ok) {
        const data = await listResponse.json();
        setMessages(data.messages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-6 bg-white h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Chat</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-gray-50 p-3 rounded-lg">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
        ) : (
          <>
            {messages.map(message => (
              <div
                key={message._id}
                className={`p-3 rounded-lg ${
                  message.senderId._id === user?.id
                    ? 'bg-blue-100 mr-8'
                    : 'bg-white border border-gray-200 ml-8'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-gray-900">
                    {message.senderId.firstName} {message.senderId.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{message.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <Button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </Card>
  );
}
