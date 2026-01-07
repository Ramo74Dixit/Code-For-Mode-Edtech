import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, MessageSquare, Video, Paperclip, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Use env variable or default to localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
const socket = io.connect(SOCKET_URL);

const BatchChat = ({ roomId, title }) => {
    const { user } = useAuth();
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [viewImage, setViewImage] = useState(null); // For Lightbox
    const [attachment, setAttachment] = useState(null); // { url, type, name }
    const [uploading, setUploading] = useState(false);
    const scrollRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        // Optimistic Preview can also be done here with URL.createObjectURL if needed
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Reusing the general upload endpoint
            // Assuming /api/upload returns { url: ... }
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const fileType = file.type.startsWith('image/') ? 'image' : 
                             file.type.startsWith('video/') ? 'video' : 'file';

            setAttachment({
                url: res.data.data, // Backend returns the URL in the 'data' field
                type: fileType,
                name: file.name
            });
        } catch (error) {
            console.error("File upload failed", error);
            alert("Failed to upload file");
        } finally {
            setUploading(false);
        }
    };
    
    // ... (rest of the file until rendering)


    // Fetch History
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/chat/${roomId}`);
                // Transform DB messages to match socket shape or vice versa
                // DB: { _id, sender: { name, ... }, content, createdAt }
                // Socket: We want to normalize.
                
                const formattedMessages = res.data.data.map(msg => ({
                    _id: msg._id,
                    room: msg.room,
                    author: msg.sender?.name || "Unknown",
                    message: msg.content,
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    senderId: msg.sender?._id,
                    attachment: msg.attachments?.[0] || null // Map DB array to single attachment
                }));
                setMessageList(formattedMessages);
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };

        if (roomId) fetchMessages();
    }, [roomId]);

    // Socket Connection
    useEffect(() => {
        if (roomId) {
            socket.emit("join_room", roomId);
        }

        const handleReceiveMessage = (data) => {
            const normalizedMsg = {
                room: data.room,
                author: data.sender?.name || "Guest",
                message: data.content,
                time: new Date(data.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                attachment: data.attachments?.[0] || null // Map Socket array to single attachment
            };
            
            setMessageList((list) => [...list, normalizedMsg]);
        };
        
        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [roomId]);

    // Auto-scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messageList]);

    const sendMessage = async () => {
        if (currentMessage !== "" || attachment) {
            const messageData = {
                room: roomId,
                senderId: user._id,
                author: user.name,
                message: currentMessage,
                attachment: attachment, // New field
                time: new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            await socket.emit("send_message", messageData);
            
            setMessageList((list) => [...list, messageData]);
            setCurrentMessage("");
            setAttachment(null);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-background border rounded-lg shadow-sm">
            {/* Header */}
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{title || "Community Chat"}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Live Discussion
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                    onClick={() => window.open(`https://meet.jit.si/codeformode_${roomId}`, '_blank')}
                >
                    <Video className="h-4 w-4" />
                    Join Video Room
                </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/10">
                {messageList.map((msg, index) => {
                    const isMe = msg.author === user?.name;
                    return (
                        <div 
                            key={index} 
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2`}
                        >
                            <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                                    isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                }`}>
                                    {msg.author[0]}
                                </div>
                                
                                <div className={`rounded-2xl px-4 py-2 shadow-sm ${
                                    isMe 
                                    ? "bg-primary text-primary-foreground rounded-br-none" 
                                    : "bg-white dark:bg-zinc-800 border rounded-bl-none"
                                }`}>
                                    {!isMe && <span className="text-xs font-bold opacity-70 block mb-1 text-primary">{msg.author}</span>}
                                    
                                    {/* Render Attachment */}
                                    {msg.attachment && (
                                        <div className="mb-2 mt-1">
                                            {msg.attachment.type === 'image' ? (
                                                <img 
                                                    src={msg.attachment.url} 
                                                    alt="attachment" 
                                                    className="rounded-lg max-h-60 w-full object-cover cursor-zoom-in hover:brightness-95 transition-all" 
                                                    onClick={() => setViewImage(msg.attachment.url)} 
                                                />
                                            ) : msg.attachment.type === 'video' ? (
                                                <video src={msg.attachment.url} controls className="rounded-lg max-h-48 w-full" />
                                            ) : (
                                                <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline opacity-90 hover:opacity-100 bg-black/10 p-2 rounded">
                                                    <Paperclip className="h-4 w-4" />
                                                    {msg.attachment.name || "Attached File"}
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 px-12">
                                {msg.time}
                            </span>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
                
                {messageList.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
                        <MessageSquare className="h-12 w-12" />
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
            </div>

            {/* Image Lightbox Modal */}
            {viewImage && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewImage(null)}>
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setViewImage(null)}>
                        <X className="h-8 w-8" />
                    </button>
                    <img 
                        src={viewImage} 
                        alt="Full view" 
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-md" 
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-background border-t space-y-3">
                {/* Preview Attachment */}
                {attachment && (
                    <div className="relative inline-block">
                        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border border-primary/20">
                            {attachment.type === 'image' ? (
                                <img src={attachment.url} alt="preview" className="h-16 w-16 object-cover rounded-md" />
                            ) : (
                                <div className="h-16 w-16 bg-primary/10 flex items-center justify-center rounded-md">
                                    <Paperclip className="h-6 w-6 text-primary" />
                                </div>
                            )}
                            <div className="flex flex-col max-w-[150px]">
                                <span className="text-xs font-medium truncate">{attachment.name}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{attachment.type}</span>
                            </div>
                            <button 
                                onClick={() => setAttachment(null)} 
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="flex gap-3">
                    <input
                        type="file"
                        id="chat-file-upload"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,video/*,application/pdf"
                    />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => document.getElementById('chat-file-upload').click()}
                        disabled={uploading}
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>

                    <Input
                        type="text"
                        value={currentMessage}
                        placeholder={uploading ? "Uploading..." : "Type a message..."}
                        onChange={(event) => setCurrentMessage(event.target.value)}
                        onKeyPress={(event) => {
                            event.key === "Enter" && !uploading && sendMessage();
                        }}
                        className="bg-muted/50 border-muted-foreground/20 focus-visible:ring-primary/20"
                        disabled={uploading}
                    />
                    <Button onClick={sendMessage} size="icon" className="bg-primary hover:bg-primary/90 transition-all" disabled={uploading}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BatchChat;
