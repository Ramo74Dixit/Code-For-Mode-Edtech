import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const socket = io.connect("http://localhost:5001");

const LiveChat = ({ roomId, title }) => {
    const { user } = useAuth();
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);

    useEffect(() => {
        if (roomId) {
            socket.emit("join_room", roomId);
        }
    }, [roomId]);

    useEffect(() => {
        const handleReceiveMessage = (data) => {
            setMessageList((list) => [...list, data]);
        };
        
        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, []);

    const sendMessage = async () => {
        if (currentMessage !== "") {
            const messageData = {
                room: roomId,
                author: user?.name || "Guest",
                message: currentMessage,
                time: new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            await socket.emit("send_message", messageData);
            setMessageList((list) => [...list, messageData]);
            setCurrentMessage("");
        }
    };

    return (
        <div className="flex flex-col h-full bg-background border rounded-lg shadow-sm">
            {/* Header */}
            <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h3 className="font-semibold text-sm">Live Chat: {title}</h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messageList.map((msg, index) => {
                    const isMe = msg.author === user?.name;
                    return (
                        <div 
                            key={index} 
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                                isMe 
                                ? "bg-primary text-primary-foreground rounded-br-none" 
                                : "bg-muted rounded-bl-none"
                            }`}>
                                {!isMe && <span className="text-xs font-bold opacity-70 block mb-1">{msg.author}</span>}
                                <p>{msg.message}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                {msg.time}
                            </span>
                        </div>
                    );
                })}
                {messageList.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-10 opacity-50">
                        Welcome to live chat!
                        <br/>
                        Be nice and respectful.
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t bg-muted/30">
                <div className="flex gap-2">
                    <Input
                        type="text"
                        value={currentMessage}
                        placeholder="Type a message..."
                        onChange={(event) => setCurrentMessage(event.target.value)}
                        onKeyPress={(event) => {
                            event.key === "Enter" && sendMessage();
                        }}
                        className="bg-background"
                    />
                    <Button onClick={sendMessage} size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LiveChat;
