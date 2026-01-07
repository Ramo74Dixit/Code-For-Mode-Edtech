import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, MessageSquare, Video, Paperclip, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Use env variable or default to localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5002";
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
                
                const data = res.data?.data || [];
                const formattedMessages = Array.isArray(data) ? data.map(msg => ({
                    _id: msg._id,
                    room: msg.room,
                    author: msg.sender?.name || "Unknown",
                    message: msg.content,
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    senderId: msg.sender?._id,
                    attachment: msg.attachments?.[0] || null // Map DB array to single attachment
                })) : [];
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
        <div className="flex flex-col h-[600px] bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-white">{title || "Community Chat"}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            Live Discussion
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 hover:text-white transition-all rounded-full"
                    onClick={() => window.open(`https://meet.jit.si/codeformode_${roomId}`, '_blank')}
                >
                    <Video className="h-4 w-4" />
                    <span className="hidden sm:inline">Video Room</span>
                </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent custom-scrollbar">
                {messageList.map((msg, index) => {
                    const isMe = msg.author === user?.name;
                    return (
                        <div 
                            key={index} 
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-lg ${
                                    isMe ? "bg-indigo-600 text-white shadow-indigo-500/20" : "bg-slate-700 text-slate-300 border border-slate-600"
                                }`}>
                                    {msg.author[0]}
                                </div>
                                
                                <div className={`px-4 py-3 shadow-md backdrop-blur-sm ${
                                    isMe 
                                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-none border border-white/10" 
                                    : "bg-slate-800/80 text-slate-200 rounded-2xl rounded-tl-none border border-slate-700/50"
                                }`}>
                                    {!isMe && <span className="text-xs font-bold opacity-60 block mb-1 text-indigo-300">{msg.author}</span>}
                                    
                                    {/* Render Attachment */}
                                    {msg.attachment && (
                                        <div className="mb-2 mt-1">
                                            {msg.attachment.type === 'image' ? (
                                                <img 
                                                    src={msg.attachment.url} 
                                                    alt="attachment" 
                                                    className="rounded-lg max-h-60 w-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity border border-white/10" 
                                                    onClick={() => setViewImage(msg.attachment.url)} 
                                                />
                                            ) : msg.attachment.type === 'video' ? (
                                                <video src={msg.attachment.url} controls className="rounded-lg max-h-48 w-full border border-white/10" />
                                            ) : (
                                                <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline opacity-90 hover:opacity-100 bg-black/20 p-2 rounded border border-white/10">
                                                    <Paperclip className="h-4 w-4" />
                                                    {msg.attachment.name || "Attached File"}
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 px-12 font-mono opacity-70">
                                {msg.time}
                            </span>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
                
                {messageList.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                        <div className="bg-slate-800/50 p-6 rounded-full border border-slate-700/50">
                             <MessageSquare className="h-10 w-10 opacity-50" />
                        </div>
                        <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                    </div>
                )}
            </div>

            {/* Image Lightbox Modal */}
            {viewImage && (
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewImage(null)}>
                    <button className="absolute top-4 right-4 text-white hover:text-rose-400 transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/10" onClick={() => setViewImage(null)}>
                        <X className="h-6 w-6" />
                    </button>
                    <img 
                        src={viewImage} 
                        alt="Full view" 
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl ring-1 ring-white/10" 
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 space-y-3 backdrop-blur-xl">
                {/* Preview Attachment */}
                {attachment && (
                    <div className="relative inline-block animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-indigo-500/30 ring-1 ring-indigo-500/20">
                            {attachment.type === 'image' ? (
                                <img src={attachment.url} alt="preview" className="h-16 w-16 object-cover rounded-md" />
                            ) : (
                                <div className="h-16 w-16 bg-indigo-500/10 flex items-center justify-center rounded-md">
                                    <Paperclip className="h-6 w-6 text-indigo-400" />
                                </div>
                            )}
                            <div className="flex flex-col max-w-[150px]">
                                <span className="text-xs font-medium text-white truncate">{attachment.name}</span>
                                <span className="text-[10px] text-indigo-300 uppercase font-mono">{attachment.type}</span>
                            </div>
                            <button 
                                onClick={() => setAttachment(null)} 
                                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:bg-rose-600 transition-colors ring-2 ring-slate-900"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="flex gap-3 items-end">
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
                        className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full h-10 w-10"
                        onClick={() => document.getElementById('chat-file-upload').click()}
                        disabled={uploading}
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>

                    <Input
                        type="text"
                        value={currentMessage}
                        placeholder={uploading ? "Uploading..." : "Type a message..."}
                        onChange={(event) => setCurrentMessage(event.target.value)}
                        onKeyPress={(event) => {
                            event.key === "Enter" && !uploading && sendMessage();
                        }}
                        className="bg-slate-800/50 border-slate-700 text-white focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 placeholder:text-slate-500 min-h-[44px]"
                        disabled={uploading}
                    />
                    <Button onClick={sendMessage} size="icon" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 rounded-full h-10 w-10 transition-all" disabled={uploading}>
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BatchChat;
