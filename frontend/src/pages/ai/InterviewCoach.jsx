import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { Bot, Mic, MicOff, Video, VideoOff, PhoneOff, User, MoreVertical, Volume2, Loader2, Sparkles, Send } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

const InterviewCoach = () => {
    // Setup State
    const [started, setStarted] = useState(false);
    const [config, setConfig] = useState({ role: '', difficulty: 'Junior' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Interview State
    const [messages, setMessages] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [feedback, setFeedback] = useState(null);
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(false);

    // Media State
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [micEnabled, setMicEnabled] = useState(false); // Default off until started
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    
    // Refs
    const videoRef = useRef(null);
    const recognitionRef = useRef(null);
    const streamRef = useRef(null);

    // ------------------------------------------------------------------
    // 1. WEBCAM HANDLING
    // ------------------------------------------------------------------
    useEffect(() => {
        if (started && cameraEnabled) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [started, cameraEnabled]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera Error:", err);
            // Don't block app, just show placeholder
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const toggleCamera = () => setCameraEnabled(!cameraEnabled);


    // ------------------------------------------------------------------
    // 2. SPEECH RECOGNITION (STT)
    // ------------------------------------------------------------------
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Keep listening
            recognitionRef.current.interimResults = true; // Show live typing
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    // Append to ongoing transcript
                    setTranscript(prev => prev + " " + finalTranscript);
                }
                
                // Show interim on screen (optional, currently using transcript state)
                // We combine them for display if needed
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech Error:", event.error);
                if (event.error === 'not-allowed') {
                    setMicEnabled(false);
                    setListening(false);
                }
            };
            
            recognitionRef.current.onend = () => {
                // If mic is supposed to be on, restart it (continuous mode fallback)
                if (listening) {
                    recognitionRef.current.start();
                }
            };
        }
    }, [listening]);

    const toggleMic = () => {
        if (listening) {
            setListening(false);
            recognitionRef.current?.stop();
            setMicEnabled(false);
        } else {
            setListening(true);
            setMicEnabled(true);
            recognitionRef.current?.start();
            setTranscript(""); // Clear for new answer
        }
    };


    // ------------------------------------------------------------------
    // 3. TEXT TO SPEECH (TTS)
    // ------------------------------------------------------------------
    const speak = (text) => {
        if (!voiceEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        
        setIsAISpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        
        // Priority: Indian Female -> Any Female -> Indian -> Default
        const preferredVoice = voices.find(v => 
            (v.name.includes("India") || v.lang === "en-IN") && 
            (v.name.includes("Female") || v.name.includes("Veena") || v.name.includes("Heera"))
        ) || voices.find(v => 
             v.name.includes("Google English India") // Often female by default on Chrome
        ) || voices.find(v => 
            v.name.includes("Female")
        ) || voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 0.9; // Natural conversational speed
        utterance.pitch = 1.05; // Slightly higher pitch for female voice
        
        utterance.onend = () => setIsAISpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    // ------------------------------------------------------------------
    // 4. API & GAME LOGIC
    // ------------------------------------------------------------------
    const handleStart = async () => {
        if (!config.role.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/ai/interview/start', config);
            const { message, question } = res.data.data;
            
            setCurrentQuestion(question);
            setMessages([{ type: 'ai', content: message + " " + question }]);
            setStarted(true);
            setMicEnabled(false); // User muted initially while AI speaks
            
            // AI Speaks
            speak(message + ". " + question);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to start interview.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendAnswer = async () => {
        if (!transcript.trim()) return;
        
        // Stop listening
        setListening(false);
        setMicEnabled(false);
        recognitionRef.current?.stop();

        setIsAIProcessing(true);
        
        try {
            const res = await api.post('/ai/interview/chat', {
                role: config.role,
                question: currentQuestion,
                answer: transcript
            });

            const { feedback, nextQuestion } = res.data.data;

            setFeedback(feedback); // Show feedback overlay
            setCurrentQuestion(nextQuestion);
            setTranscript(""); // Clear user buffer
            
            // Speak Feedback + Next Question
            speak(feedback + ". " + nextQuestion);

        } catch (err) {
            console.error(err);
            setError("Connection lost. Try again.");
        } finally {
            setIsAIProcessing(false);
        }
    };

    // State for Report
    const [report, setReport] = useState(null);

    const handleEndSession = async () => {
        // Stop Media
        stopCamera();
        window.speechSynthesis.cancel();
        recognitionRef.current?.stop();
        
        // Don't generate report if no interaction happened
        if (messages.length < 2) {
            setStarted(false);
            return;
        }

        setLoading(true);
        try {
            // Prepare history for AI
            // Check if messages is an array of objects
            const history = messages.map(m => ({
                role: m.type === 'user' ? 'candidate' : 'interviewer',
                text: m.content
            }));
            
            const res = await api.post('/ai/interview/end', {
                role: config.role,
                history: history
            });
            
            setReport(res.data.data);
        } catch (err) {
            console.error(err);
            // Fallback to home if report fails
            setStarted(false); 
        } finally {
            setLoading(false);
        }
    };

    const resetInterview = () => {
        setStarted(false);
        setReport(null);
        setMessages([]);
        setTranscript("");
    };

    // ------------------------------------------------------------------
    // RENDER: REPORT CARD
    // ------------------------------------------------------------------
    if (report) {
       const isSelected = report.status === 'Selected';
       return (
           <div className="min-h-screen bg-black flex items-center justify-center p-4">
               <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl overflow-hidden relative">
                   {/* Status Banner */}
                   <div className={`h-32 flex items-center justify-center ${isSelected ? 'bg-green-600' : 'bg-red-600'}`}>
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-white mb-2">{report.status.toUpperCase()}</h1>
                            <p className="text-white/80 font-medium">Score: {report.score}/10</p>
                        </div>
                   </div>
                   
                   <CardContent className="p-8 space-y-6">
                       <div className="space-y-2">
                           <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-800 pb-2">Feedback</h3>
                           <p className="text-slate-400 leading-relaxed">
                               {report.feedback}
                           </p>
                       </div>

                       <div className="space-y-3">
                           <h3 className="text-lg font-semibold text-indigo-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                               <Sparkles className="w-5 h-5" /> Area of Improvement
                           </h3>
                           <ul className="space-y-2">
                               {report.improvements?.map((item, idx) => (
                                   <li key={idx} className="flex items-start gap-2 text-slate-300">
                                       <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                       {item}
                                   </li>
                               ))}
                           </ul>
                       </div>
                   </CardContent>

                   <div className="p-6 bg-slate-950 flex justify-center border-t border-slate-800">
                       <Button 
                           onClick={resetInterview}
                           className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-xl text-lg w-full md:w-auto"
                       >
                           Back to Home
                       </Button>
                   </div>
               </Card>
           </div>
       );
    }

    // ------------------------------------------------------------------
    // RENDER: SETUP SCREEN
    // ------------------------------------------------------------------
    if (!started && !loading) {
        return (
            <div className="min-h-[85vh] flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-950">
                <Card className="w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-2xl">
                    <CardContent className="p-8 space-y-8">
                        {/* ... Existing Setup UI ... */}
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                <Sparkles className="w-10 h-10 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">AI Interview Room</h1>
                                <p className="text-slate-400 mt-2 text-lg">Master your tech interviews with real-time voice feedback.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Desired Role</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Senior React Developer"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                    value={config.role}
                                    onChange={e => setConfig({...config, role: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Difficulty</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Junior', 'Mid', 'Senior'].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setConfig({...config, difficulty: level})}
                                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                                config.difficulty === level 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]' 
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button 
                                onClick={handleStart} 
                                disabled={!config.role || loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 text-lg rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01]"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Setting up Room...
                                    </div>
                                ) : 'Join Interface'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // Loading State for Report Generation
    if (loading && started && !report) {
         return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Bot className="w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white">Generating Report Card...</h2>
                <p className="text-slate-400">Analyzing your answers and confidence...</p>
            </div>
        );
    }


    // ------------------------------------------------------------------
    // RENDER: VIDEO CALL UI
    // ------------------------------------------------------------------
    return (
        <div className="h-[calc(100vh-6rem)] bg-black flex flex-col overflow-hidden relative">
            
            {/* MAIN VIDEO AREA */}
            <div className="flex-1 flex flex-col md:flex-row p-4 gap-6 overflow-hidden max-w-7xl mx-auto w-full">
                
                {/* 1. AI VIEW (LEFT) */}
                <div className="flex-1 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900 rounded-[2rem] relative overflow-hidden ring-1 ring-white/10 flex flex-col items-center justify-center shadow-2xl">
                    
                    {/* AVATAR CONTAINER */}
                    <div className="relative z-10 scale-110">
                        {/* Outer Glow */}
                        <div className={`absolute inset-0 bg-indigo-500 blur-[60px] opacity-20 transition-all duration-300 ${isAISpeaking ? 'opacity-50 scale-125' : ''}`} />
                        
                        <div className={`w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-b from-indigo-500 to-indigo-700 flex items-center justify-center shadow-[0_0_60px_rgba(79,70,229,0.4)] ring-4 ring-indigo-400/20 transition-all duration-300 ${isAISpeaking ? 'scale-105 ring-indigo-400/50' : ''}`}>
                            <Bot className="w-20 h-20 md:w-28 md:h-28 text-white drop-shadow-lg" />
                        </div>
                        
                        {/* Audio Waves Animation */}
                        {isAISpeaking && (
                             <>
                                <div className="absolute inset-0 rounded-full border-[3px] border-indigo-400/40 animate-[ping_1.5s_ease-out_infinite]" />
                                <div className="absolute inset-0 rounded-full border-[3px] border-purple-400/30 animate-[ping_2s_ease-out_infinite] delay-150" />
                                <div className="absolute -inset-4 rounded-full border border-indigo-500/20 animate-pulse" />
                             </>
                        )}
                    </div>
                    
                    {/* AI NAME TAG */}
                    <div className="absolute top-6 left-6 flex items-center gap-3 bg-white/5 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 z-20 shadow-lg">
                        <span className="relative flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 ${isAISpeaking ? 'opacity-75' : 'opacity-0'}`}></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                        <span className="text-white font-semibold text-sm tracking-wide">AI Assistant</span>
                    </div>

                    {/* AI CAPTIONS (QUESTION) */}
                    <div className="absolute bottom-24 left-0 right-0 px-6 md:px-12 text-center z-20">
                         <div className="inline-block max-w-3xl mx-auto bg-black/60 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl transition-all duration-500 hover:bg-black/70">
                             <h3 className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 leading-relaxed drop-shadow-sm">
                                 "{currentQuestion}"
                             </h3>
                             {isAIProcessing && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-indigo-300 font-medium">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Generating response...</span>
                                </div>
                             )}
                         </div>
                    </div>
                </div>

                {/* 2. USER VIEW (RIGHT) */}
                <div className="flex-1 bg-slate-800 rounded-[2rem] relative overflow-hidden ring-1 ring-white/10 group shadow-2xl">
                    {cameraEnabled ? (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                            <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                <User className="w-16 h-16 text-slate-500" />
                            </div>
                            <p className="text-slate-500 font-medium">Camera is off</p>
                        </div>
                    )}

                    {/* USER NAME TAG */}
                    <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        {!micEnabled ? (
                             <MicOff className="w-4 h-4 text-red-400" />
                        ) : (
                             <div className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                        <span className="text-white font-medium text-sm">You</span>
                    </div>

                    {/* LIVE TRANSCRIPT OVERLAY */}
                    {transcript && (
                        <div className="absolute bottom-10 left-10 right-10">
                            <div className="inline-block bg-black/70 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10">
                                <p className="text-lg text-white/90 font-medium">
                                    <span className="text-slate-400 mr-2">You said:</span>
                                    {transcript}
                                    <span className="animate-pulse">|</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* FEEDBACK POPUP (Temporary Overlay) */}
                    {feedback && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-sm w-full p-6 animate-in fade-in zoom-in duration-300">
                            <div className="bg-emerald-950/90 backdrop-blur-xl border border-emerald-500/30 p-5 rounded-2xl shadow-2xl">
                                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold uppercase text-xs tracking-wider">
                                    <Sparkles className="w-4 h-4" /> Feedback
                                </div>
                                <p className="text-emerald-100 leading-relaxed text-sm">
                                    {feedback}
                                </p>
                                <button 
                                    onClick={() => setFeedback(null)} // Dismiss
                                    className="absolute top-2 right-2 p-1 text-emerald-400 hover:bg-emerald-500/20 rounded-full"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CONTROL BAR (BOTTOM) */}
            <div className="h-28 bg-slate-900/80 backdrop-blur-lg border-t border-white/5 flex items-center justify-center gap-8 px-4 z-50">
                
                <div className="flex items-center gap-6 bg-slate-800/50 p-3 rounded-full border border-white/5 shadow-xl">
                    {/* 1. MIC TOGGLE */}
                    <button 
                        onClick={toggleMic}
                        className={`p-5 rounded-full transition-all duration-300 transform hover:scale-105 ${
                            micEnabled 
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                        }`}
                        title="Toggle Microphone"
                    >
                        {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </button>

                    {/* 2. CAMERA TOGGLE */}
                    <button 
                        onClick={toggleCamera}
                        className={`p-5 rounded-full transition-all duration-300 transform hover:scale-105 ${
                            cameraEnabled 
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                        }`}
                        title="Toggle Camera"
                    >
                        {cameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>
                    
                     {/* 3. END CALL */}
                    <button 
                        onClick={handleEndSession}
                        className="p-5 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-105"
                        title="End Interview"
                    >
                        <PhoneOff className="w-6 h-6" />
                    </button>
                </div>

                {/* 4. SEND ANSWER (Separate "Submit" Action) */}
                <Button 
                    onClick={handleSendAnswer}
                    disabled={!transcript.trim() || isAIProcessing}
                    className={`h-16 px-10 rounded-full text-lg font-bold tracking-wide transition-all duration-300 ${
                         transcript.trim() 
                         ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-xl shadow-emerald-500/30 transform hover:-translate-y-1' 
                         : 'bg-slate-800 text-slate-500 border border-white/5'
                    }`}
                >
                    {isAIProcessing ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin mr-3" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Submit Answer <Send className="w-5 h-5 ml-3 opacity-90" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default InterviewCoach;
