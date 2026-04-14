import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  GraduationCap, BookOpen, Mic, MicOff, Volume2, VolumeX,
  ChevronRight, RotateCcw, Loader2, CheckCircle2, XCircle,
  Send, Sparkles, ArrowRight, Trophy, ClipboardCheck
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// DIAGRAM COMPONENTS
// ─────────────────────────────────────────────────────────────

const TreeNode = ({ node, depth = 0 }) => (
  <div className="flex flex-col items-center">
    <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold border shadow-md whitespace-nowrap ${
      depth === 0
        ? 'bg-violet-600/80 border-violet-400/60 text-white'
        : depth === 1
        ? 'bg-violet-800/60 border-violet-600/50 text-violet-100'
        : 'bg-slate-700/60 border-slate-600/50 text-slate-200'
    }`}>
      {node.label}
    </div>
    {node.children && node.children.length > 0 && (
      <>
        <div className="w-px h-5 bg-violet-400/50" />
        <div className="relative flex items-start gap-6">
          {node.children.length > 1 && (
            <div
              className="absolute top-0 h-px bg-violet-400/40"
              style={{ left: '50%', right: '50%', width: `calc(100% - 3rem)`, transform: 'translateX(-50%)' }}
            />
          )}
          {node.children.map((child, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-px h-5 bg-violet-400/50" />
              <TreeNode node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

const FlowchartDiagram = ({ data }) => (
  <div className="flex flex-col items-center gap-0 py-2">
    {data.steps.map((step, i) => (
      <React.Fragment key={i}>
        <div className="bg-violet-900/50 border border-violet-500/40 rounded-2xl px-5 py-3 text-center max-w-xs w-full shadow-lg">
          <div className="text-violet-200 font-bold text-sm tracking-wide">{step.label}</div>
          {step.desc && <div className="text-slate-400 text-xs mt-1 leading-relaxed">{step.desc}</div>}
        </div>
        {i < data.steps.length - 1 && (
          <div className="flex flex-col items-center my-1">
            <div className="w-px h-3 bg-violet-400/60" />
            <ChevronRight className="w-5 h-5 text-violet-400 rotate-90" />
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
);

const TableDiagram = ({ data }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-700/50 shadow-lg">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-violet-900/40">
          {data.headers.map((h, i) => (
            <th key={i} className="border-b border-r border-violet-700/40 px-4 py-3 text-left text-violet-300 text-sm font-bold last:border-r-0">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, i) => (
          <tr key={i} className={`${i % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/10'} hover:bg-violet-900/10 transition-colors`}>
            {row.map((cell, j) => (
              <td key={j} className="border-b border-r border-slate-700/30 px-4 py-3 text-slate-300 text-sm last:border-r-0">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CodeDiagram = ({ data }) => (
  <div className="bg-slate-950 rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
    <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/60 border-b border-slate-700/60">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      <span className="text-slate-400 text-xs font-mono ml-2">{data.language || 'code'}</span>
    </div>
    <pre className="p-5 text-emerald-400 text-sm font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
      <code>{data.code}</code>
    </pre>
  </div>
);

const ListDiagram = ({ data }) => (
  <div className="space-y-2.5">
    {data.title && (
      <h4 className="text-violet-300 font-bold text-sm tracking-wide uppercase mb-4">{data.title}</h4>
    )}
    {data.items.map((item, i) => (
      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-violet-900/20 border border-violet-700/20">
        <span className="w-7 h-7 rounded-xl bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
          {i + 1}
        </span>
        <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
      </div>
    ))}
  </div>
);

const DiagramCard = ({ type, title, data }) => {
  if (!data) return null;
  return (
    <div className="mt-4 bg-slate-800/40 rounded-2xl border border-violet-700/20 overflow-hidden shadow-xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-700/20 bg-violet-900/20">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <span className="text-violet-300 text-sm font-semibold">{title || 'Visual Aid'}</span>
      </div>
      <div className="p-5 flex justify-center">
        {type === 'tree'      && <TreeNode node={data} />}
        {type === 'flowchart' && <FlowchartDiagram data={data} />}
        {type === 'table'     && <TableDiagram data={data} />}
        {type === 'code'      && <CodeDiagram data={data} />}
        {type === 'list'      && <ListDiagram data={data} />}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN AI TUTOR COMPONENT
// ─────────────────────────────────────────────────────────────

const AiTutor = () => {
  const [phase, setPhase] = useState('setup');
  const [topic, setTopic] = useState('');
  const [lessonPlan, setLessonPlan] = useState(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(null);
  const [studentInput, setStudentInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [typedContent, setTypedContent] = useState({});
  const [currentTypingId, setCurrentTypingId] = useState(null);
  const [sectionDone, setSectionDone] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef    = useRef(null);
  const recognitionRef    = useRef(null);
  const typingIntervalRef = useRef(null);
  const messageIdCounter  = useRef(0);

  // ── Auto scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typedContent]);

  // ── Speech Recognition Setup ──
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setStudentInput(text);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend   = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setStudentInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // ── Load & score available voices ──
  const scoreVoice = (v) => {
    let score = 0;
    const n = v.name;
    // Microsoft Neural Online voices are the best quality available
    if (n.includes('Online') || n.includes('Natural')) score += 60;
    if (n.includes('Microsoft'))                       score += 30;
    if (n.includes('Google') && v.lang.startsWith('en')) score += 20;
    // Prefer female-sounding voices for a teacher feel
    if (['Aria','Zira','Hazel','Karen','Moira','Tessa','Susan','Heera','Veena','Samantha']
        .some(fn => n.includes(fn)))                   score += 15;
    // English preferred; en-IN gets bonus for Indian feel
    if (v.lang === 'en-IN')  score += 12;
    if (v.lang === 'en-GB')  score += 8;
    if (v.lang === 'en-US')  score += 6;
    if (!v.lang.startsWith('en')) score -= 20;
    // Penalise raw local system voices (usually robotic)
    if (v.localService && !n.includes('Microsoft') && !n.includes('Google')) score -= 12;
    return score;
  };

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      const englishVoices = voices
        .filter(v => v.lang.startsWith('en'))
        .sort((a, b) => scoreVoice(b) - scoreVoice(a));
      setAvailableVoices(englishVoices);
      // Auto-select the best voice if none chosen yet
      if (!selectedVoiceURI && englishVoices.length > 0) {
        setSelectedVoiceURI(englishVoices[0].voiceURI);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // ── TTS ──
  const speak = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.voiceURI === selectedVoiceURI)
      || voices.filter(v => v.lang.startsWith('en')).sort((a,b) => scoreVoice(b)-scoreVoice(a))[0]
      || voices[0];

    if (voice) utterance.voice = voice;
    utterance.rate  = 0.9;   // slightly slower = feels like a real teacher
    utterance.pitch = 1.05;
    utterance.onend   = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled, selectedVoiceURI]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  // ── Typewriter effect (3 chars/tick @ 10ms) ──
  const startTyping = useCallback((msgId, fullText, onComplete) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setCurrentTypingId(msgId);
    setTypedContent(prev => ({ ...prev, [msgId]: '' }));
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      i += 3;
      setTypedContent(prev => ({ ...prev, [msgId]: fullText.slice(0, i) }));
      if (i >= fullText.length) {
        setTypedContent(prev => ({ ...prev, [msgId]: fullText }));
        clearInterval(typingIntervalRef.current);
        setCurrentTypingId(null);
        if (onComplete) onComplete();
      }
    }, 10);
  }, []);

  const addMessage = useCallback((type, content, extras = {}) => {
    const id = ++messageIdCounter.current;
    setMessages(prev => [...prev, { id, type, content, ...extras }]);
    return id;
  }, []);

  // ── CLEANUP on unmount ──
  useEffect(() => {
    return () => {
      clearInterval(typingIntervalRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ─────────────────────────────────────────────
  // LESSON LOGIC
  // ─────────────────────────────────────────────

  const handleStart = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/ai/tutor/lesson-plan', { topic: topic.trim() });
      const plan = res.data.data;
      setLessonPlan(plan);
      setCurrentSectionIdx(0);
      setMessages([]);
      setTypedContent({});
      setPhase('teaching');

      const welcomeId = addMessage('system', plan.intro);
      speak(plan.intro);
      startTyping(welcomeId, plan.intro, () => {
        setTimeout(() => doTeachSection(plan, 0), 600);
      });
    } catch (err) {
      console.error(err);
      setError('Kuch gadbad ho gayi. Please dobara try karo.');
    } finally {
      setIsLoading(false);
    }
  };

  const doTeachSection = async (plan, idx) => {
    const section = plan.sections[idx];
    setSectionDone(false);
    setIsLoading(true);
    try {
      const res = await api.post('/ai/tutor/teach', {
        topic,
        sectionTitle:   section.title,
        sectionIndex:   idx,
        totalSections:  plan.sections.length,
      });
      const data = res.data.data;

      addMessage('section-header', section.title);
      const msgId = addMessage('ai', data.content, {
        diagram: data.hasDiagram
          ? { type: data.diagramType, title: data.diagramTitle, data: data.diagramData }
          : null,
        checkQuestion: data.checkQuestion,
      });

      setIsLoading(false);
      speak(data.content + '. ' + (data.checkQuestion || ''));
      startTyping(msgId, data.content, () => setSectionDone(true));
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setError('Section load nahi ho saka. Dobara try karo.');
    }
  };

  const handleNextSection = () => {
    const next = currentSectionIdx + 1;
    if (next < lessonPlan.sections.length) {
      setCurrentSectionIdx(next);
      doTeachSection(lessonPlan, next);
    } else {
      handleLoadQuiz();
    }
  };

  // ── Student Follow-up ──
  const handleStudentQuestion = async () => {
    if (!studentInput.trim() || isLoading) return;
    const q = studentInput.trim();
    setStudentInput('');
    addMessage('student', q);
    setSectionDone(false);
    setIsLoading(true);
    try {
      const res = await api.post('/ai/tutor/followup', { topic, question: q });
      const data = res.data.data;
      const msgId = addMessage('ai', data.content, {
        diagram: data.hasDiagram
          ? { type: data.diagramType, title: data.diagramTitle, data: data.diagramData }
          : null,
      });
      setIsLoading(false);
      speak(data.content);
      startTyping(msgId, data.content, () => setSectionDone(true));
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  // ── Load Quiz ──
  const handleLoadQuiz = async () => {
    setIsLoading(true);
    addMessage('system', 'Shabaaash! Aapne saare sections padh liye. Ab ek chhoti si quiz — sirf 3 sawaal! 🎯');
    try {
      const sectionTitles = lessonPlan.sections.map(s => s.title);
      const res = await api.post('/ai/tutor/quiz', { topic, sections: sectionTitles });
      setQuizData(res.data.data);
      setPhase('quiz');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Quiz Logic ──
  const handleQuizAnswer = (qId, optionIndex) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const handleQuizSubmit = () => {
    let score = 0;
    quizData.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correct) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    const total = quizData.questions.length;
    const msg =
      score === total
        ? 'Wah wah! Perfect score! Aap is topic ke master hain! 🏆'
        : score >= Math.ceil(total / 2)
        ? `Bahut badhiya! ${score} out of ${total} — Keep it up! 👏`
        : `${score} out of ${total}. Koi baat nahi, dobara padhne se sab clear ho jaayega! 💪`;
    speak(msg);
  };

  const handleReset = () => {
    stopSpeaking();
    clearInterval(typingIntervalRef.current);
    setPhase('setup');
    setTopic('');
    setLessonPlan(null);
    setMessages([]);
    setQuizData(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setTypedContent({});
    setCurrentSectionIdx(0);
    setSectionDone(false);
    setError(null);
  };

  // ─────────────────────────────────────────────
  // RENDER: SETUP
  // ─────────────────────────────────────────────
  if (phase === 'setup') {
    const suggestions = [
      { emoji: '🌳', label: 'Binary Search Trees' },
      { emoji: '⚡', label: 'React Hooks' },
      { emoji: '🔐', label: 'HTTP vs HTTPS' },
      { emoji: '🧮', label: 'Big O Notation' },
      { emoji: '🐍', label: 'Python Decorators' },
      { emoji: '🗄️', label: 'SQL Joins' },
      { emoji: '🌐', label: 'DNS Resolution' },
      { emoji: '🔄', label: 'Async Await in JS' },
    ];
    return (
      <div className="min-h-[90vh] flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
        <div className="w-full max-w-2xl space-y-6">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-[0_0_60px_rgba(139,92,246,0.4)] ring-1 ring-violet-400/20">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-3 rounded-3xl border border-violet-500/20 animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">AI Tutor</h1>
              <p className="text-violet-300/80 mt-2 text-lg">Aapka apna personal classroom teacher — voice, text aur diagrams ke saath! 🎓</p>
            </div>
          </div>

          {/* Input Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-violet-800/30 rounded-3xl p-8 shadow-2xl space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-sm">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Kaunsa topic seekhna hai?</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400 pointer-events-none" />
                <input
                  id="ai-tutor-topic-input"
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isLoading && handleStart()}
                  placeholder="e.g. Binary Search Trees, React Hooks, HTTP..."
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-2xl px-5 py-4 pl-12 text-white placeholder:text-slate-600 outline-none transition-all text-base"
                />
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">Ya in topics mein se chuno:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setTopic(s.label)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs hover:border-violet-500/50 hover:text-violet-300 hover:bg-violet-900/20 transition-all"
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="ai-tutor-start-btn"
              onClick={handleStart}
              disabled={!topic.trim() || isLoading}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg shadow-xl shadow-violet-600/30 transition-all hover:scale-[1.01] hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Lesson plan ban raha hai...</>
              ) : (
                <><GraduationCap className="w-5 h-5" /> Class Shuru Karo!</>
              )}
            </button>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🗣️', label: 'Indian Voice', desc: 'AI bolke padhata hai' },
              { icon: '📊', label: 'Live Diagrams', desc: 'Visual examples' },
              { icon: '✅', label: 'Mini Quiz', desc: 'Knowledge check' },
            ].map((f, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-slate-900/30 border border-slate-800/50">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-white text-xs font-bold">{f.label}</div>
                <div className="text-slate-500 text-xs mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: QUIZ
  // ─────────────────────────────────────────────
  if (phase === 'quiz') {
    const allAnswered = quizData && Object.keys(quizAnswers).length >= quizData.questions.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2 pt-4">
            <div className="flex items-center justify-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-violet-400" />
              <h2 className="text-3xl font-extrabold text-white">Mini Quiz</h2>
            </div>
            <p className="text-slate-400">
              Topic: <span className="text-violet-400 font-semibold">{topic}</span>
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
              <p className="text-slate-400">Quiz ban raha hai...</p>
            </div>
          ) : quizData ? (
            <div className="space-y-6">
              {quizData.questions.map((q, qIdx) => {
                const selected   = quizAnswers[q.id];
                const isCorrect  = selected === q.correct;

                return (
                  <div
                    key={q.id}
                    className={`bg-slate-900/60 border rounded-3xl p-6 space-y-4 transition-all ${
                      quizSubmitted
                        ? isCorrect
                          ? 'border-emerald-500/40 bg-emerald-950/10'
                          : 'border-red-500/30 bg-red-950/10'
                        : 'border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-violet-900/60 border border-violet-700/40 text-violet-300 text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {qIdx + 1}
                      </span>
                      <p className="text-white font-semibold text-base leading-relaxed">{q.question}</p>
                    </div>

                    <div className="grid gap-2.5 ml-11">
                      {q.options.map((opt, optIdx) => {
                        const isSelected      = selected === optIdx;
                        const isCorrectOption = optIdx === q.correct;

                        let cls = 'px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all ';
                        if (!quizSubmitted) {
                          cls += isSelected
                            ? 'border-violet-500 bg-violet-900/40 text-violet-200 cursor-pointer'
                            : 'border-slate-700/50 bg-slate-800/30 text-slate-300 hover:border-violet-600/50 hover:bg-violet-900/20 cursor-pointer';
                        } else {
                          if (isCorrectOption)
                            cls += 'border-emerald-500/60 bg-emerald-900/30 text-emerald-200 cursor-default';
                          else if (isSelected)
                            cls += 'border-red-500/50 bg-red-900/20 text-red-300 cursor-default';
                          else
                            cls += 'border-slate-700/30 bg-slate-800/20 text-slate-500 cursor-default';
                        }

                        return (
                          <button key={optIdx} className={cls} onClick={() => handleQuizAnswer(q.id, optIdx)}>
                            <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className={`ml-11 flex items-start gap-2 p-3 rounded-xl border text-sm ${
                        isCorrect
                          ? 'bg-emerald-900/20 border-emerald-700/30 text-emerald-300'
                          : 'bg-amber-900/20 border-amber-700/30 text-amber-300'
                      }`}>
                        {isCorrect
                          ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                        <span>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Submit / Score card */}
              {!quizSubmitted ? (
                <button
                  id="ai-tutor-quiz-submit"
                  onClick={handleQuizSubmit}
                  disabled={!allAnswered}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5" /> Submit Quiz
                </button>
              ) : (
                <div className="bg-slate-900/60 border border-violet-700/40 rounded-3xl p-8 text-center space-y-5">
                  <Trophy className="w-16 h-16 text-amber-400 mx-auto drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]" />
                  <h3 className="text-3xl font-extrabold text-white">
                    {quizScore}/{quizData.questions.length} Sahi! 🎉
                  </h3>
                  <p className="text-slate-400">
                    {quizScore === quizData.questions.length
                      ? 'Perfect! Aap is topic ke master ban gaye! 🏆'
                      : quizScore > 0
                      ? 'Bahut badhiya! Thodi aur practice karo! 💪'
                      : 'Koi baat nahi — practice karte raho! 🌟'}
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Naya Topic
                    </button>
                    <button
                      onClick={() => setPhase('complete')}
                      className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Trophy className="w-4 h-4" /> Finish!
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: COMPLETE
  // ─────────────────────────────────────────────
  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="relative flex justify-center">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_70px_rgba(251,191,36,0.35)]">
              <Trophy className="w-14 h-14 text-white" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-white">Lesson Complete! 🎉</h1>
            <p className="text-slate-400 text-lg mt-2">
              Aapne <span className="text-violet-400 font-bold">"{topic}"</span> successfully seekh liya!
            </p>
          </div>
          <div className="bg-slate-900/60 border border-violet-700/20 rounded-3xl p-6 space-y-3 text-left">
            <h3 className="text-violet-300 font-bold mb-4">Aaj ke sections:</h3>
            {lessonPlan?.sections.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {s.title}
              </div>
            ))}
            <div className="flex items-center gap-3 text-sm text-slate-300 mt-2 pt-2 border-t border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
              Mini Quiz — Score: {quizScore}/{quizData?.questions?.length || 3}
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg shadow-xl hover:opacity-90 transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
          >
            <GraduationCap className="w-5 h-5" /> Kuch Aur Seekhein!
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: TEACHING
  // ─────────────────────────────────────────────
  const allSectionsDone = lessonPlan && currentSectionIdx >= lessonPlan.sections.length - 1;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gradient-to-br from-slate-950 via-violet-950/10 to-slate-950 overflow-hidden">

      {/* ── LEFT SIDEBAR: Lesson Outline ── */}
      <div className="w-60 flex-shrink-0 border-r border-violet-900/30 bg-slate-950/90 flex flex-col hidden md:flex">
        <div className="p-5 border-b border-violet-900/30">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-5 h-5 text-violet-400" />
            <span className="text-white font-bold text-sm">AI Tutor</span>
          </div>
          <p className="text-violet-400 text-xs font-medium truncate">{topic}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-3">Lesson Plan</p>
          {lessonPlan?.sections.map((s, i) => {
            const isDone    = i < currentSectionIdx;
            const isCurrent = i === currentSectionIdx;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-violet-900/30 border border-violet-700/40'
                    : isDone
                    ? 'opacity-60'
                    : 'opacity-35'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                  isDone    ? 'bg-emerald-500 text-white'
                  : isCurrent ? 'bg-violet-600 text-white'
                  : 'bg-slate-700 text-slate-400'
                }`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isCurrent ? 'text-violet-200' : 'text-slate-400'}`}>{s.title}</p>
                  <p className="text-slate-600 text-xs mt-0.5 line-clamp-2">{s.summary}</p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-3 p-3 rounded-xl mt-2 opacity-35">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-3 h-3 text-slate-400" />
            </div>
            <p className="text-slate-400 text-xs font-semibold">Mini Quiz</p>
          </div>
        </div>

        {/* Voice + Reset controls */}
        <div className="p-4 border-t border-violet-900/30 space-y-2">
          {/* Voice on/off toggle with waveform */}
          <button
            onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) stopSpeaking(); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border ${
              voiceEnabled
                ? 'bg-violet-900/30 border-violet-700/40 text-violet-300'
                : 'bg-slate-800/30 border-slate-700/40 text-slate-500'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Voice {voiceEnabled ? 'On' : 'Off'}</span>
            {isSpeaking && voiceEnabled && (
              <span className="ml-auto flex gap-0.5 items-end h-4">
                {[0, 1, 2, 1, 0].map((h, j) => (
                  <span
                    key={j}
                    className="w-0.5 bg-violet-400 rounded-full animate-bounce"
                    style={{ height: `${6 + h * 4}px`, animationDelay: `${j * 0.1}s` }}
                  />
                ))}
              </span>
            )}
          </button>

          {/* Voice picker dropdown */}
          {voiceEnabled && availableVoices.length > 0 && (
            <div className="space-y-1">
              <label className="text-slate-500 text-xs px-1">Voice:</label>
              <select
                id="ai-tutor-voice-picker"
                value={selectedVoiceURI || ''}
                onChange={e => setSelectedVoiceURI(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-violet-500/60 cursor-pointer"
              >
                {availableVoices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name.replace('Microsoft ', '').replace(' Online (Natural)', ' ✨').replace('Google ', 'G ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Naya Topic
          </button>
        </div>
      </div>

      {/* ── MAIN: Teaching Chat Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((msg) => {
            const displayText    = typedContent[msg.id] !== undefined ? typedContent[msg.id] : msg.content;
            const isTypingThis   = currentTypingId === msg.id;

            if (msg.type === 'section-header') {
              return (
                <div key={msg.id} className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-violet-800/30" />
                  <span className="text-violet-400 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-violet-900/20 border border-violet-800/30">
                    {msg.content}
                  </span>
                  <div className="flex-1 h-px bg-violet-800/30" />
                </div>
              );
            }

            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="max-w-lg bg-violet-950/60 border border-violet-800/30 rounded-2xl px-5 py-4 text-center">
                    <p className="text-violet-300 text-sm font-medium leading-relaxed">
                      {displayText}
                      {isTypingThis && <span className="animate-pulse text-violet-400">▌</span>}
                    </p>
                  </div>
                </div>
              );
            }

            if (msg.type === 'ai') {
              return (
                <div key={msg.id} className="flex gap-4 max-w-3xl">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg mt-1 transition-all ${
                    isSpeaking && !isTypingThis ? 'scale-110 shadow-violet-400/50' : ''
                  }`}>
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Text bubble */}
                    <div className="bg-slate-800/60 border border-slate-700/40 rounded-3xl rounded-tl-sm px-5 py-4 shadow-lg">
                      <p className="text-slate-200 text-sm leading-7 whitespace-pre-wrap">
                        {displayText}
                        {isTypingThis && <span className="text-violet-400 animate-pulse">▌</span>}
                      </p>
                    </div>

                    {/* Diagram — show after typing done */}
                    {msg.diagram && !isTypingThis && (
                      <DiagramCard
                        type={msg.diagram.type}
                        title={msg.diagram.title}
                        data={msg.diagram.data}
                      />
                    )}

                    {/* Check question — show after typing + section done */}
                    {msg.checkQuestion && !isTypingThis && sectionDone && (
                      <div className="bg-violet-950/40 border border-violet-700/30 rounded-2xl px-4 py-3">
                        <p className="text-violet-300 text-sm font-medium leading-relaxed">
                          💬 {msg.checkQuestion}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (msg.type === 'student') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-violet-700/30 border border-violet-600/30 rounded-3xl rounded-tr-sm px-5 py-3 max-w-md shadow-lg">
                    <p className="text-violet-100 text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            }
            return null;
          })}

          {/* AI thinking indicator */}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0 mt-1">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="bg-slate-800/60 border border-slate-700/40 rounded-3xl rounded-tl-sm px-5 py-4">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── BOTTOM: Input + Nav Bar ── */}
        <div className="border-t border-violet-900/30 bg-slate-950/90 p-4 space-y-3">
          {/* Q&A input row */}
          <div className="flex gap-2.5 items-center">
            <button
              id="ai-tutor-mic-btn"
              onClick={toggleMic}
              disabled={isLoading}
              className={`p-3 rounded-2xl flex-shrink-0 transition-all border ${
                isListening
                  ? 'bg-red-500/20 border-red-500/40 text-red-400 scale-105 shadow-lg'
                  : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-violet-300 hover:border-violet-600/40'
              }`}
              title={isListening ? 'Stop' : 'Voice sawaal'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              id="ai-tutor-question-input"
              type="text"
              value={studentInput}
              onChange={e => setStudentInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleStudentQuestion()}
              placeholder={isListening ? '🎤 Sun raha hoon...' : 'Koi sawaal puchho ya type karo...'}
              disabled={isLoading}
              className="flex-1 bg-slate-800/60 border border-slate-700/40 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 text-sm outline-none transition-all disabled:opacity-50"
            />

            <button
              id="ai-tutor-send-btn"
              onClick={handleStudentQuestion}
              disabled={!studentInput.trim() || isLoading}
              className="p-3 rounded-2xl bg-violet-700/40 hover:bg-violet-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-violet-300 border border-violet-600/30 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation row */}
          <div className="flex justify-between items-center">
            <p className="text-slate-500 text-xs">
              Section {currentSectionIdx + 1}/{lessonPlan?.sections?.length} &bull; {topic}
            </p>

            {sectionDone && !isLoading && (
              <button
                id="ai-tutor-next-btn"
                onClick={handleNextSection}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-violet-600/25 transition-all hover:-translate-y-0.5"
              >
                {allSectionsDone ? (
                  <><ClipboardCheck className="w-4 h-4" /> Quiz Shuru Karo</>
                ) : (
                  <>Agla Section <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
