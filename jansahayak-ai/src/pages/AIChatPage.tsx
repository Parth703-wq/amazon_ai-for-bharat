import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Bot, User, Loader2, Volume2, RefreshCw } from 'lucide-react';
import { chatApi, type ChatMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { v4 as uuidv4 } from 'uuid';

// Web Speech API types
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const LANGUAGES = [
    { code: 'en', label: 'English', speechCode: 'en-IN' },
    { code: 'hi', label: 'हिंदी', speechCode: 'hi-IN' },
    { code: 'bn', label: 'বাংলা', speechCode: 'bn-IN' },
    { code: 'ta', label: 'தமிழ்', speechCode: 'ta-IN' },
    { code: 'te', label: 'తెలుగు', speechCode: 'te-IN' },
    { code: 'mr', label: 'मराठी', speechCode: 'mr-IN' },
];

const QUICK_QUESTIONS = [
    'Which schemes am I eligible for?',
    'How to apply for PM Kisan?',
    'What documents do I need for PM Awas?',
    'मुझे कौन सी योजना मिलती है?',
];

export const AIChatPage = () => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(() => uuidv4());
    const [lang, setLang] = useState('en');
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const bottomRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Welcome message
        setMessages([{
            id: 0,
            role: 'assistant',
            content: user
                ? `Namaste ${user.full_name}! I am JanSahayak AI. Ask me about any government scheme, eligibility, or how to apply. I can help in Hindi, English, and 20+ Indian languages.`
                : `Namaste! I am JanSahayak AI. Ask me about any government scheme or welfare program. Please sign in for personalized recommendations.`
        }]);

        // Init Web Speech API
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SR) {
            const r = new SR();
            r.continuous = false;
            r.interimResults = false;
            r.onresult = (e: any) => {
                const transcript = e.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };
            r.onerror = () => setIsListening(false);
            r.onend = () => setIsListening(false);
            setRecognition(r);
        }
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startListening = () => {
        if (!recognition) return;
        const selectedLang = LANGUAGES.find(l => l.code === lang);
        recognition.lang = selectedLang?.speechCode || 'hi-IN';
        recognition.start();
        setIsListening(true);
    };

    const sendMessage = async (text?: string) => {
        const msg = text || input.trim();
        if (!msg || loading) return;
        setInput('');

        const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: msg };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const res = await chatApi.sendMessage(msg, sessionId, lang);
            const aiMsg: ChatMessage = { id: Date.now() + 1, role: 'assistant', content: res.response };
            setMessages(prev => [...prev, aiMsg]);
        } catch {
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: 'Sorry, I could not connect. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const speak = (text: string) => {
        const u = new SpeechSynthesisUtterance(text);
        const selectedLang = LANGUAGES.find(l => l.code === lang);
        u.lang = selectedLang?.speechCode || 'hi-IN';
        window.speechSynthesis.speak(u);
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-6">
            <div className="container mx-auto px-4 max-w-4xl h-[calc(100vh-120px)] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
                        <p className="text-sm text-gray-500">Powered by Gemini AI · Amazon Bedrock ready</p>
                    </div>
                    <select
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium bg-white"
                        value={lang}
                        onChange={e => setLang(e.target.value)}
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                </div>

                {/* Chat Window */}
                <Card className="flex-1 overflow-hidden flex flex-col shadow-xl">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                            <Bot className="h-5 w-5" />
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'bg-primary text-white rounded-tr-sm'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        {msg.role === 'assistant' && (
                                            <button onClick={() => speak(msg.content)} className="mt-2 text-xs text-gray-400 hover:text-primary flex items-center gap-1">
                                                <Volume2 className="h-3 w-3" /> Listen
                                            </button>
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                            <User className="h-5 w-5 text-gray-600" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {loading && (
                            <div className="flex gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                    <div className="flex gap-1 items-center h-5">
                                        <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick Questions */}
                    <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                        {QUICK_QUESTIONS.map(q => (
                            <button
                                key={q}
                                onClick={() => sendMessage(q)}
                                className="shrink-0 text-xs bg-primary/5 text-primary border border-primary/20 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input Bar */}
                    <div className="border-t border-gray-100 p-4">
                        <div className="flex gap-3 items-end">
                            <button
                                onClick={startListening}
                                disabled={!recognition}
                                className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${isListening
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                                    } disabled:opacity-40`}
                                title={recognition ? 'Click to speak' : 'Voice not supported in this browser'}
                            >
                                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </button>
                            <textarea
                                rows={1}
                                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                                placeholder={isListening ? 'Listening...' : 'Ask about any government scheme...'}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            />
                            <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="h-12 px-5 rounded-xl shrink-0">
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
