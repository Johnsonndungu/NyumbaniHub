import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, MoreVertical, Phone, Video, Loader2, MessageSquare } from 'lucide-react';
import { api } from '@/src/services/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: any;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    photoURL?: string;
  };
  lastMessage: string;
  lastMessageAt: any;
}

export function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUser = api.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        const msgs = await api.getMessages(currentUser.id);
        const safeMsgs = Array.isArray(msgs) ? msgs : [];
        
        // Group by conversation
        const convMap = new Map<string, Conversation>();
        
        // Fetch user details for each unique otherId
        const otherIds = Array.from(new Set(safeMsgs.map((m: any) => m.senderId === currentUser.id ? m.receiverId : m.senderId)));
        
        const userDetailsMap = new Map<string, { name: string; photoURL?: string }>();
        
        for (const id of otherIds) {
          try {
            const userData = await api.getUser(id as string);
            userDetailsMap.set(id as string, {
              name: userData.displayName || 'Anonymous User',
              photoURL: userData.photoURL
            });
          } catch (err) {
            console.error('Error fetching user details:', err);
            userDetailsMap.set(id as string, { name: 'User ' + (id as string).slice(0, 4) });
          }
        }

        safeMsgs.forEach((m: any) => {
          const otherId = m.senderId === currentUser.uid ? m.receiverId : m.senderId;
          if (!convMap.has(otherId)) {
            const details = userDetailsMap.get(otherId);
            convMap.set(otherId, {
              id: otherId,
              otherUser: {
                id: otherId,
                name: details?.name || 'User ' + otherId.slice(0, 4),
                photoURL: details?.photoURL
              },
              lastMessage: m.content,
              lastMessageAt: m.createdAt
            });
          }
        });

        setConversations(Array.from(convMap.values()));
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!activeConv || !currentUser) return;

    const fetchMessages = async () => {
      try {
        const msgs = await api.getMessages(currentUser.id);
        const safeMsgs = Array.isArray(msgs) ? msgs : [];
        const filtered = safeMsgs.filter((m: any) => (m.senderId === activeConv.id || m.receiverId === activeConv.id));
        setMessages(filtered);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeConv, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || !currentUser) return;

    setSending(true);
    try {
      await api.sendMessage({
        senderId: currentUser.id,
        receiverId: activeConv.id,
        content: newMessage
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[700px] bg-white rounded-2xl border overflow-hidden shadow-sm">
      {/* Conversations List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search messages..." className="pl-9 bg-slate-50 border-none" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-b last:border-0 ${activeConv?.id === conv.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
              >
                <Avatar>
                  <AvatarImage src={conv.otherUser.photoURL} />
                  <AvatarFallback>{conv.otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 truncate">{conv.otherUser.name}</span>
                    <span className="text-[10px] text-slate-400">{new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={activeConv.otherUser.photoURL} />
                  <AvatarFallback>{activeConv.otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-slate-900">{activeConv.otherUser.name}</div>
                  <div className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-500"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-slate-500"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-slate-500"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
              {messages.map((msg) => {
                const isMe = msg.senderId === (currentUser?.id || 'agent1');
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none border shadow-sm'}`}>
                      {msg.text}
                      <div className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-slate-50 border-none"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="h-16 w-16 mb-4 opacity-10" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
