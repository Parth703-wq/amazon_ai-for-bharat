import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Mic, MicOff, Loader2, X, Volume2, VolumeX,
    ExternalLink, MessageCircle, FileText, Bot, CheckCircle,
    ChevronRight, Calendar, Building2, Users, IndianRupee
} from 'lucide-react';
import { schemesApi, type SchemeResponse } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

declare global {
    interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

// ── Language config ─────────────────────────────────────────────────────────
type LangCode = 'en' | 'hi' | 'gu' | 'bn' | 'ta' | 'te' | 'mr' | 'pa' | 'kn' | 'ml';

const LANG_OPTIONS: { code: LangCode; label: string; font: string; tts: string }[] = [
    { code: 'en', label: 'English', font: "'Noto Sans', sans-serif", tts: 'en-IN' },
    { code: 'hi', label: 'हिंदी', font: "'Noto Sans Devanagari', sans-serif", tts: 'hi-IN' },
    { code: 'gu', label: 'ગુજરાતી', font: "'Noto Sans Gujarati', sans-serif", tts: 'gu-IN' },
    { code: 'bn', label: 'বাংলা', font: "'Noto Sans Bengali', sans-serif", tts: 'bn-IN' },
    { code: 'ta', label: 'தமிழ்', font: "'Noto Sans Tamil', sans-serif", tts: 'ta-IN' },
    { code: 'te', label: 'తెలుగు', font: "'Noto Sans Telugu', sans-serif", tts: 'te-IN' },
    { code: 'mr', label: 'मराठी', font: "'Noto Sans Devanagari', sans-serif", tts: 'mr-IN' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ', font: "'Noto Sans', sans-serif", tts: 'pa-IN' },
    { code: 'kn', label: 'ಕನ್ನಡ', font: "'Noto Sans Kannada', sans-serif", tts: 'kn-IN' },
    { code: 'ml', label: 'മലയാളം', font: "'Noto Sans Malayalam', sans-serif", tts: 'ml-IN' },
];

// ── UI translations ──────────────────────────────────────────────────────────
const T: Record<LangCode, Record<string, string>> = {
    en: { title: 'Government Schemes', subtitle: 'Find welfare programs you are eligible for', search: 'Search schemes...', all: 'All', viewDetails: 'View Details', applyNow: 'Apply Now', whatsapp: 'Get Help on WhatsApp', readAloud: 'Read Aloud', stop: 'Stop', whatYouGet: 'What You Get', whoCanGet: 'Who Can Get This', docsNeeded: 'Documents Needed', howToApply: 'How to Apply', department: 'Department', deadline: 'Last Date', launchYear: 'Since', noSchemes: 'No schemes found', tryDiff: 'Try different keywords or clear filters', aiMatch: 'AI Match for Me', matching: 'Matching...', found: 'schemes found', farming: 'Farming', health: 'Health', housing: 'Housing', education: 'Education', money: 'Money', women: 'Women', skill: 'Skill', senior: 'Senior', sanitation: 'Sanitation', energy: 'Energy' },
    hi: { title: 'सरकारी योजनाएं', subtitle: 'अपने लिए उपयुक्त योजनाएं खोजें', search: 'योजना खोजें...', all: 'सभी', viewDetails: 'विवरण देखें', applyNow: 'अभी आवेदन करें', whatsapp: 'WhatsApp पर मदद', readAloud: 'सुनें', stop: 'रोकें', whatYouGet: 'क्या मिलेगा', whoCanGet: 'कौन पात्र है', docsNeeded: 'जरूरी दस्तावेज', howToApply: 'आवेदन कैसे करें', department: 'विभाग', deadline: 'अंतिम तिथि', launchYear: 'शुरुआत', noSchemes: 'कोई योजना नहीं मिली', tryDiff: 'अलग खोज करें', aiMatch: 'AI मेरे लिए खोजे', matching: 'खोज रहे हैं...', found: 'योजनाएं मिलीं', farming: 'कृषि', health: 'स्वास्थ्य', housing: 'आवास', education: 'शिक्षा', money: 'वित्त', women: 'महिला', skill: 'कौशल', senior: 'वरिष्ठ', sanitation: 'स्वच्छता', energy: 'ऊर्जा' },
    gu: { title: 'સરકારી યોજનાઓ', subtitle: 'તમારા માટે યોગ્ય યોજનાઓ શોધો', search: 'શોધો...', all: 'બધા', viewDetails: 'વિગતો જુઓ', applyNow: 'અરજી કરો', whatsapp: 'WhatsApp પર સહાય', readAloud: 'સાંભળો', stop: 'અટકો', whatYouGet: 'શું મળશે', whoCanGet: 'કોણ પાત્ર', docsNeeded: 'જરૂરી દસ્તાવેજ', howToApply: 'કેવી રીતે અરજી કરવી', department: 'વિભાગ', deadline: 'છેલ્લી તારીખ', launchYear: 'શરૂ', noSchemes: 'કોઈ યોજના મળી નહીં', tryDiff: 'અલગ શોધ કરો', aiMatch: 'AI મારા માટે', matching: 'શોધી રહ્યા...', found: 'યોજનાઓ', farming: 'ખેતી', health: 'આરોગ્ય', housing: 'આવાસ', education: 'શિક્ષણ', money: 'નાણાં', women: 'મહિલા', skill: 'કૌશલ', senior: 'વૃદ્ધ', sanitation: 'સ્વચ્છતા', energy: 'ઊર્જા' },
    bn: { title: 'সরকারি প্রকল্প', subtitle: 'আপনার জন্য প্রকল্প খুঁজুন', search: 'খুঁজুন...', all: 'সব', viewDetails: 'বিস্তারিত', applyNow: 'আবেদন করুন', whatsapp: 'WhatsApp-এ সাহায্য', readAloud: 'শুনুন', stop: 'থামুন', whatYouGet: 'কী পাবেন', whoCanGet: 'কে পাবেন', docsNeeded: 'প্রয়োজনীয় কাগজ', howToApply: 'কীভাবে আবেদন', department: 'বিভাগ', deadline: 'শেষ তারিখ', launchYear: 'শুরু', noSchemes: 'প্রকল্প পাওয়া যায়নি', tryDiff: 'অন্যভাবে খুঁজুন', aiMatch: 'AI আমার জন্য', matching: 'খুঁজছি...', found: 'প্রকল্প', farming: 'কৃষি', health: 'স্বাস্থ্য', housing: 'আবাসন', education: 'শিক্ষা', money: 'অর্থ', women: 'মহিলা', skill: 'দক্ষতা', senior: 'বয়স্ক', sanitation: 'স্বাস্থ্যবিধি', energy: 'শক্তি' },
    ta: { title: 'அரசு திட்டங்கள்', subtitle: 'உங்களுக்கான திட்டங்களை கண்டறியுங்கள்', search: 'தேடுங்கள்...', all: 'அனைத்தும்', viewDetails: 'விவரங்கள்', applyNow: 'விண்ணப்பிக்கவும்', whatsapp: 'WhatsApp உதவி', readAloud: 'கேளுங்கள்', stop: 'நிறுத்து', whatYouGet: 'என்ன கிடைக்கும்', whoCanGet: 'யார் தகுதி', docsNeeded: 'தேவையான ஆவணங்கள்', howToApply: 'எப்படி விண்ணப்பிக்க', department: 'துறை', deadline: 'கடைசி தேதி', launchYear: 'தொடக்கம்', noSchemes: 'திட்டம் இல்லை', tryDiff: 'வேறு தேடுங்கள்', aiMatch: 'AI என்னுடையது', matching: 'தேடுகிறது...', found: 'திட்டங்கள்', farming: 'விவசாயம்', health: 'சுகாதாரம்', housing: 'வீட்டுவசதி', education: 'கல்வி', money: 'நிதி', women: 'பெண்கள்', skill: 'திறன்', senior: 'முதியோர்', sanitation: 'சுகாதாரம்', energy: 'ஆற்றல்' },
    te: { title: 'ప్రభుత్వ పథకాలు', subtitle: 'మీకు అర్హమైన పథకాలు కనుగొనండి', search: 'వెతకండి...', all: 'అన్నీ', viewDetails: 'వివరాలు', applyNow: 'దరఖాస్తు చేయండి', whatsapp: 'WhatsApp సహాయం', readAloud: 'వినండి', stop: 'ఆపండి', whatYouGet: 'ఏమి లభిస్తుంది', whoCanGet: 'ఎవరికి అర్హత', docsNeeded: 'అవసరమైన పత్రాలు', howToApply: 'ఎలా దరఖాస్తు చేయాలి', department: 'శాఖ', deadline: 'చివరి తేదీ', launchYear: 'ప్రారంభం', noSchemes: 'పథకాలు దొరకలేదు', tryDiff: 'వేరే వెతకండి', aiMatch: 'AI నాకు', matching: 'వెతుకుతున్నది...', found: 'పథకాలు', farming: 'వ్యవసాయం', health: 'ఆరోగ్యం', housing: 'గృహం', education: 'విద్య', money: 'విత్తం', women: 'మహిళ', skill: 'నైపుణ్యం', senior: 'వృద్ధులు', sanitation: 'పారిశుద్ధ్యం', energy: 'శక్తి' },
    mr: { title: 'सरकारी योजना', subtitle: 'तुमच्यासाठी योजना शोधा', search: 'योजना शोधा...', all: 'सर्व', viewDetails: 'तपशील पाहा', applyNow: 'अर्ज करा', whatsapp: 'WhatsApp मदत', readAloud: 'ऐका', stop: 'थांबा', whatYouGet: 'काय मिळेल', whoCanGet: 'कोण पात्र', docsNeeded: 'आवश्यक कागदपत्रे', howToApply: 'अर्ज कसा करावा', department: 'विभाग', deadline: 'शेवटची तारीख', launchYear: 'सुरुवात', noSchemes: 'योजना सापडल्या नाहीत', tryDiff: 'वेगळे शोधा', aiMatch: 'AI माझ्यासाठी', matching: 'शोधत आहे...', found: 'योजना', farming: 'शेती', health: 'आरोग्य', housing: 'गृहनिर्माण', education: 'शिक्षण', money: 'वित्त', women: 'महिला', skill: 'कौशल्य', senior: 'ज्येष्ठ', sanitation: 'स्वच्छता', energy: 'ऊर्जा' },
    pa: { title: 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ', subtitle: 'ਆਪਣੇ ਲਈ ਯੋਜਨਾਵਾਂ ਲੱਭੋ', search: 'ਖੋਜੋ...', all: 'ਸਭ', viewDetails: 'ਵੇਰਵੇ', applyNow: 'ਅਰਜ਼ੀ ਕਰੋ', whatsapp: 'WhatsApp ਮਦਦ', readAloud: 'ਸੁਣੋ', stop: 'ਰੋਕੋ', whatYouGet: 'ਕੀ ਮਿਲੇਗਾ', whoCanGet: 'ਕੌਣ ਯੋਗ', docsNeeded: 'ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼', howToApply: 'ਕਿਵੇਂ ਅਰਜ਼ੀ ਕਰੀਏ', department: 'ਵਿਭਾਗ', deadline: 'ਆਖਰੀ ਤਾਰੀਖ਼', launchYear: 'ਸ਼ੁਰੂ', noSchemes: 'ਕੋਈ ਯੋਜਨਾ ਨਹੀਂ', tryDiff: 'ਵੱਖ ਖੋਜੋ', aiMatch: 'AI ਮੇਰੇ ਲਈ', matching: 'ਖੋਜ ਰਿਹਾ...', found: 'ਯੋਜਨਾਵਾਂ', farming: 'ਖੇਤੀ', health: 'ਸਿਹਤ', housing: 'ਘਰ', education: 'ਪੜ੍ਹਾਈ', money: 'ਵਿੱਤ', women: 'ਮਹਿਲਾ', skill: 'ਹੁਨਰ', senior: 'ਬਜ਼ੁਰਗ', sanitation: 'ਸਫ਼ਾਈ', energy: 'ਊਰਜਾ' },
    kn: { title: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು', subtitle: 'ನಿಮಗೆ ಅರ್ಹ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ', search: 'ಹುಡುಕಿ...', all: 'ಎಲ್ಲಾ', viewDetails: 'ವಿವರಗಳು', applyNow: 'ಅರ್ಜಿ ಹಾಕಿ', whatsapp: 'WhatsApp ಸಹಾಯ', readAloud: 'ಕೇಳಿ', stop: 'ನಿಲ್ಲಿಸಿ', whatYouGet: 'ಏನು ಸಿಗುತ್ತದೆ', whoCanGet: 'ಯಾರಿಗೆ ಅರ್ಹತೆ', docsNeeded: 'ಅಗತ್ಯ ದಾಖಲೆಗಳು', howToApply: 'ಹೇಗೆ ಅರ್ಜಿ ಹಾಕುವುದು', department: 'ಇಲಾಖೆ', deadline: 'ಕೊನೆಯ ದಿನಾಂಕ', launchYear: 'ಆರಂಭ', noSchemes: 'ಯೋಜನೆ ಸಿಗಲಿಲ್ಲ', tryDiff: 'ಬೇರೆ ಹುಡುಕಿ', aiMatch: 'AI ನನಗಾಗಿ', matching: 'ಹುಡುಕುತ್ತಿದೆ...', found: 'ಯೋಜನೆಗಳು', farming: 'ಕೃಷಿ', health: 'ಆರೋಗ್ಯ', housing: 'ವಸತಿ', education: 'ಶಿಕ್ಷಣ', money: 'ಹಣಕಾಸು', women: 'ಮಹಿಳೆ', skill: 'ಕೌಶಲ', senior: 'ಹಿರಿಯರು', sanitation: 'ನೈರ್ಮಲ್ಯ', energy: 'ಶಕ್ತಿ' },
    ml: { title: 'സർക്കാർ പദ്ധതികൾ', subtitle: 'നിങ്ങൾക്കുള്ള പദ്ധതികൾ കണ്ടെത്തൂ', search: 'തിരയൂ...', all: 'എല്ലാം', viewDetails: 'വിശദാംശങ്ങൾ', applyNow: 'അപേക്ഷിക്കൂ', whatsapp: 'WhatsApp സഹായം', readAloud: 'കേൾക്കൂ', stop: 'നിർത്തൂ', whatYouGet: 'എന്ത് ലഭിക്കും', whoCanGet: 'ആർക്ക് അർഹത', docsNeeded: 'ആവശ്യമായ രേഖകൾ', howToApply: 'എങ്ങനെ അപേക്ഷിക്കാം', department: 'വകുപ്പ്', deadline: 'അവസാന തീയതി', launchYear: 'ആരംഭം', noSchemes: 'പദ്ധതി കണ്ടെത്തിയില്ല', tryDiff: 'വ്യത്യസ്തമായി തിരയൂ', aiMatch: 'AI എനിക്കായി', matching: 'തിരയുന്നു...', found: 'പദ്ധതികൾ', farming: 'കൃഷി', health: 'ആരോഗ്യം', housing: 'ഭവനം', education: 'വിദ്യാഭ്യാസം', money: 'ധനം', women: 'വനിത', skill: 'നൈപുണ്യം', senior: 'മുതിർന്നവർ', sanitation: 'ശുചിത്വം', energy: 'ഊർജ്ജം' },
};

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORIES: { db: string; key: keyof typeof T['en'] }[] = [
    { db: 'agriculture', key: 'farming' },
    { db: 'health', key: 'health' },
    { db: 'housing', key: 'housing' },
    { db: 'education', key: 'education' },
    { db: 'finance', key: 'money' },
    { db: 'women', key: 'women' },
    { db: 'skill', key: 'skill' },
    { db: 'social_security', key: 'senior' },
    { db: 'sanitation', key: 'sanitation' },
    { db: 'energy', key: 'energy' },
];

const CATEGORY_COLORS: Record<string, string> = {
    agriculture: 'bg-green-100 text-green-800',
    health: 'bg-red-100 text-red-800',
    housing: 'bg-orange-100 text-orange-800',
    education: 'bg-blue-100 text-blue-800',
    finance: 'bg-purple-100 text-purple-800',
    women: 'bg-pink-100 text-pink-800',
    skill: 'bg-yellow-100 text-yellow-800',
    social_security: 'bg-gray-100 text-gray-800',
    sanitation: 'bg-teal-100 text-teal-800',
    energy: 'bg-amber-100 text-amber-800',
};

// ── Translation helper ────────────────────────────────────────────────────────
function getTranslated(scheme: SchemeResponse, field: 'description' | 'eligibility_criteria' | 'required_documents', lang: LangCode): string {
    if (lang === 'en') return (scheme[field] as string) || '';
    const key = `${field}_${lang}` as keyof SchemeResponse;
    const translated = scheme[key] as string | undefined;
    return translated || (scheme[field] as string) || '';
}

function formatDeadline(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function extractApplyUrl(authority?: string): string {
    if (!authority) return '';
    const match = authority.match(/https?:\/\/[^\s,)]+/);
    return match ? match[0] : '';
}

// ── Main Component ───────────────────────────────────────────────────────────
export const SchemeFinder = () => {
    const { user } = useAuthStore();
    const [lang, setLang] = useState<LangCode>('en');
    const t = T[lang];
    const langConf = LANG_OPTIONS.find(l => l.code === lang)!;

    const [schemes, setSchemes] = useState<SchemeResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiMsg, setAiMsg] = useState('');
    const [error, setError] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const [selectedScheme, setSelectedScheme] = useState<SchemeResponse | null>(null);
    const [speaking, setSpeaking] = useState(false);

    useEffect(() => {
        fetchSchemes();
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SR) {
            const r = new SR();
            r.continuous = false; r.interimResults = false; r.lang = langConf.tts;
            r.onresult = (e: any) => { setSearch(e.results[0][0].transcript); setIsListening(false); };
            r.onerror = () => setIsListening(false);
            r.onend = () => setIsListening(false);
            setRecognition(r);
        }
    }, []);

    const fetchSchemes = async (overrides?: { category?: string; search?: string }) => {
        setLoading(true); setError('');
        try {
            const p: Record<string, string> = {};
            const cat = overrides?.category ?? category;
            const q = overrides?.search ?? search;
            if (cat) p.category = cat;
            if (q) p.search = q;
            const data = await schemesApi.getSchemes(p);
            setSchemes(data.schemes); setTotal(data.total);
        } catch (e: unknown) {
            setError((e as Error).message || 'Could not load schemes');
        } finally { setLoading(false); }
    };

    const handleCategoryClick = (db: string) => {
        const newCat = category === db ? '' : db;
        setCategory(newCat);
        fetchSchemes({ category: newCat, search });
    };

    const handleAiMatch = async () => {
        setAiLoading(true); setAiMsg('');
        try {
            const res = await schemesApi.aiMatch();
            setSchemes(res.schemes);
            setAiMsg(`AI matched ${res.ai_matches?.length ?? 0} schemes based on your profile`);
        } catch { setError('Sign in first to get personalized AI matches.'); }
        finally { setAiLoading(false); }
    };

    const startVoice = () => {
        if (!recognition) return;
        recognition.lang = langConf.tts;
        recognition.start(); setIsListening(true);
    };

    // ── Read Aloud ──────────────────────────────────────────────────────────
    const speakScheme = (scheme: SchemeResponse) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const fullText = [
            scheme.name,
            getTranslated(scheme, 'description', lang),
            getTranslated(scheme, 'eligibility_criteria', lang),
            getTranslated(scheme, 'required_documents', lang),
        ].filter(Boolean).join('. ');
        const utt = new SpeechSynthesisUtterance(fullText);
        utt.lang = langConf.tts;
        utt.rate = 0.9;
        utt.onstart = () => setSpeaking(true);
        utt.onend = () => setSpeaking(false);
        utt.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utt);
    };

    const stopSpeaking = () => {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
    };

    return (
        <div
            className="min-h-screen pt-20 pb-16"
            style={{ background: '#FFFBF5', fontFamily: langConf.font }}
        >
            <div className="container mx-auto px-4 max-w-6xl">

                {/* ── Language Selector ── */}
                <div className="flex flex-wrap gap-1.5 justify-end mb-4">
                    {LANG_OPTIONS.map(l => (
                        <button
                            key={l.code}
                            onClick={() => setLang(l.code)}
                            style={{ fontFamily: l.font }}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${lang === l.code ? 'bg-primary text-white border-primary font-semibold' : 'border-gray-200 text-gray-600 bg-white hover:border-primary/50'}`}
                        >{l.label}</button>
                    ))}
                </div>

                {/* ── Header ── */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
                    <p className="text-gray-500">{t.subtitle}</p>
                </div>

                {/* ── Search Row ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
                    <div className="flex gap-3">
                        <button
                            onClick={startVoice}
                            className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                            disabled={!recognition}
                        >
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </button>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                className="w-full pl-10 pr-4 h-12 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                placeholder={isListening ? '...' : t.search}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchSchemes()}
                            />
                        </div>
                        <Button onClick={() => fetchSchemes()} className="h-12 px-6 shrink-0">
                            <Search className="h-4 w-4 mr-2" />{t.all === 'All' ? 'Search' : t.search}
                        </Button>
                        {(search || category) && (
                            <button
                                onClick={() => { setSearch(''); setCategory(''); fetchSchemes({ category: '', search: '' }); }}
                                className="h-12 w-12 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 shrink-0"
                            ><X className="h-4 w-4" /></button>
                        )}
                    </div>
                </div>

                {/* ── Category Filters ── */}
                <div className="flex flex-wrap gap-2 mb-5">
                    <button
                        onClick={() => { setCategory(''); fetchSchemes({ category: '', search }); }}
                        className={`text-sm px-4 py-2 rounded-full border transition-all font-medium ${!category ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 bg-white hover:border-primary/50'}`}
                    >{t.all}</button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.db}
                            onClick={() => handleCategoryClick(cat.db)}
                            className={`text-sm px-4 py-2 rounded-full border transition-all ${category === cat.db ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 bg-white hover:border-primary/50'}`}
                        >{t[cat.key]}</button>
                    ))}
                </div>

                {/* ── AI Match Banner ── */}
                {user && (
                    <div className="mb-5 bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Personalized AI matching</p>
                            <p className="text-xs text-gray-500 mt-0.5">Based on your income, state, and profile</p>
                        </div>
                        <Button size="sm" onClick={handleAiMatch} isLoading={aiLoading} variant="outline" className="shrink-0 text-xs">
                            {aiLoading ? t.matching : t.aiMatch}
                        </Button>
                    </div>
                )}

                {aiMsg && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" /> {aiMsg}
                    </div>
                )}
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
                )}

                {/* ── Count ── */}
                <p className="text-sm text-gray-500 font-medium mb-4">
                    {loading ? 'Searching...' : `${total} ${t.found}`}
                </p>

                {/* ── Cards Grid ── */}
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : schemes.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">{t.noSchemes}</p>
                        <p className="text-xs text-gray-400 mt-1">{t.tryDiff}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schemes.map((scheme, i) => {
                            const desc = getTranslated(scheme, 'description', lang);
                            const catColor = CATEGORY_COLORS[scheme.category] || 'bg-gray-100 text-gray-700';
                            return (
                                <motion.div key={scheme.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                                    <Card className="h-full hover:shadow-md transition-all hover:border-primary/30 bg-white border-gray-100">
                                        <CardContent className="p-5 flex flex-col h-full gap-3">
                                            {/* Category + State badge */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>
                                                    {t[CATEGORIES.find(c => c.db === scheme.category)?.key || 'all'] || scheme.category}
                                                </span>
                                                {scheme.state_specific && scheme.state_specific !== 'all' && (
                                                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{scheme.state_specific}</span>
                                                )}
                                                {scheme.match_percentage && (
                                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">{scheme.match_percentage}%</span>
                                                )}
                                            </div>

                                            {/* Name */}
                                            <h3 className="font-bold text-gray-900 text-sm leading-snug">{scheme.name}</h3>

                                            {/* Benefit — large bold */}
                                            {scheme.benefit_amount && (
                                                <div className="flex items-start gap-1.5">
                                                    <IndianRupee className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                                    <span className="text-base font-bold text-green-700 leading-tight">{scheme.benefit_amount}</span>
                                                </div>
                                            )}

                                            {/* Description preview */}
                                            <p className="text-xs text-gray-600 leading-relaxed flex-1 line-clamp-3">
                                                {desc.slice(0, 120)}{desc.length > 120 ? '...' : ''}
                                            </p>

                                            {/* Ministry */}
                                            {scheme.ministry && (
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />{scheme.ministry}
                                                </p>
                                            )}

                                            {/* Action */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full text-xs h-9 mt-auto hover:bg-primary hover:text-white group"
                                                onClick={() => setSelectedScheme(scheme)}
                                            >
                                                {t.viewDetails}
                                                <ChevronRight className="h-3.5 w-3.5 ml-auto group-hover:translate-x-0.5 transition-transform" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            <AnimatePresence>
                {selectedScheme && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setSelectedScheme(null); stopSpeaking(); }}
                    >
                        <motion.div
                            className="bg-white w-full md:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-3xl shadow-2xl"
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 80, opacity: 0 }}
                            style={{ fontFamily: langConf.font }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-3 z-10 rounded-t-3xl">
                                <div className="flex-1">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[selectedScheme.category] || 'bg-gray-100 text-gray-700'}`}>
                                        {t[CATEGORIES.find(c => c.db === selectedScheme.category)?.key || 'all'] || selectedScheme.category}
                                    </span>
                                    <h2 className="text-lg font-bold text-gray-900 mt-2 leading-tight">{selectedScheme.name}</h2>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Read Aloud button */}
                                    <button
                                        onClick={() => speaking ? stopSpeaking() : speakScheme(selectedScheme)}
                                        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${speaking ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
                                    >
                                        {speaking ? (
                                            <><span className="h-2 w-2 rounded-full bg-red-500 animate-pulse inline-block" /><VolumeX className="h-3.5 w-3.5" />{t.stop}</>
                                        ) : (
                                            <><Volume2 className="h-3.5 w-3.5" />{t.readAloud}</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { setSelectedScheme(null); stopSpeaking(); }}
                                        className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600"
                                    ><X className="h-4 w-4" /></button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-5 space-y-6">

                                {/* Section 1 — What You Get */}
                                <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">{t.whatYouGet}</p>
                                    <p className="text-2xl md:text-3xl font-bold text-green-800">{selectedScheme.benefit_amount}</p>
                                    {selectedScheme.benefit_type && (
                                        <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                                            {selectedScheme.benefit_type.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                </div>

                                {/* Section 2 — Eligibility */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5" />{t.whoCanGet}
                                    </p>
                                    <div className="space-y-2">
                                        {getTranslated(selectedScheme, 'eligibility_criteria', lang).split('.').filter(s => s.trim()).map((point, i) => (
                                            <div key={i} className="flex items-start gap-2.5">
                                                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">{i + 1}</span>
                                                <p className="text-sm text-gray-700 leading-relaxed">{point.trim()}.</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 3 — Documents */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5" />{t.docsNeeded}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {getTranslated(selectedScheme, 'required_documents', lang).split(',').filter(d => d.trim()).map((doc, i) => (
                                            <span key={i} className="text-xs bg-blue-50 border border-blue-100 text-blue-800 px-3 py-1.5 rounded-full font-medium">
                                                {doc.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 4 — How to Apply */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <ChevronRight className="h-3.5 w-3.5" />{t.howToApply}
                                    </p>
                                    <p className="text-sm text-gray-700 leading-relaxed">{selectedScheme.applying_authority}</p>
                                    {selectedScheme.deadline && (
                                        <div className="flex items-center gap-1.5 mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                            <Calendar className="h-4 w-4" />
                                            <span className="font-medium">{t.deadline}:</span> {formatDeadline(selectedScheme.deadline)}
                                        </div>
                                    )}
                                </div>

                                {/* Section 5 — Department */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.department}</p>
                                    <p className="text-sm font-medium text-gray-800">{selectedScheme.ministry}</p>
                                    {selectedScheme.launch_year && (
                                        <p className="text-xs text-gray-400 mt-1">{t.launchYear} {selectedScheme.launch_year}</p>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Bottom Bar */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-3xl">
                                {(() => {
                                    const url = extractApplyUrl(selectedScheme.applying_authority);
                                    return url ? (
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                            <Button className="w-full h-11 text-sm">
                                                <ExternalLink className="h-4 w-4 mr-2" />{t.applyNow}
                                            </Button>
                                        </a>
                                    ) : (
                                        <Button className="flex-1 h-11 text-sm" disabled>
                                            <ExternalLink className="h-4 w-4 mr-2" />{t.applyNow}
                                        </Button>
                                    );
                                })()}
                                <a
                                    href={`https://wa.me/911800115526?text=${encodeURIComponent(`Help me with: ${selectedScheme.name}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                >
                                    <Button variant="outline" className="w-full h-11 text-sm border-green-200 text-green-700 hover:bg-green-50">
                                        <MessageCircle className="h-4 w-4 mr-2" />{t.whatsapp}
                                    </Button>
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
