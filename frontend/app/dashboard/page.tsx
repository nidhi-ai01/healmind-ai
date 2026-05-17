"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import WebcamFeed from "../components/WebcamFeed";

const emotionQuotes: Record<string, string[]> = {
    Happy: [
        "You look amazing when you smile. Keep shining.",
        "Your joy is contagious. Let it fill the room.",
        "A wonderful moment to pause and appreciate the good things.",
        "Keep that energy alive. You're doing incredible.",
        "Happiness looks beautiful on you. Embrace it.",
    ],
    Sad: [
        "Tough moments pass. Take a deep breath and be kind to yourself.",
        "It's okay to feel this way. Give yourself permission to rest.",
        "You are allowed to take up space, even when you're hurting.",
        "Be gentle with your mind today. Healing is not linear.",
        "This feeling is valid, but it doesn't define your entire story.",
    ],
    Angry: [
        "Pause for a moment. Calm minds make better decisions.",
        "Breathe in deeply. Let the tension slowly leave your shoulders.",
        "Your feelings are valid. Take a step back and protect your peace.",
        "Channel this energy into something that serves you well.",
        "Before you react, take three slow breaths. You are in control.",
    ],
    Neutral: [
        "A calm mind is a powerful mind.",
        "In this quiet moment, find your center and breathe.",
        "Stillness is a gift. Let your thoughts settle naturally.",
        "Balance and clarity begin with a steady heart.",
        "You are exactly where you need to be right now.",
    ],
    Fear: [
        "You are stronger than your fears. One step at a time.",
        "It's brave to acknowledge your fear. You are safe here.",
        "Breathe through the uncertainty. You have navigated tough times before.",
        "Fear is just a feeling, not a fact. You've got this.",
        "Ground yourself in the present moment. You are capable.",
    ],
    Surprise: [
        "Unexpected moments can become beautiful memories.",
        "Life is full of little surprises. Stay open to them.",
        "Breathe into the unknown. New experiences help us grow.",
        "A sudden shift in perspective can reveal new paths.",
        "Embrace the unexpected with a curious and open heart.",
    ],
};

const emotionData: Record<string, { color: string; emoji: string; glow: string }> = {
    Happy: { color: "text-yellow-400", emoji: "😊", glow: "shadow-[0_0_30px_rgba(250,204,21,0.3)]" },
    Sad: { color: "text-blue-400", emoji: "😢", glow: "shadow-[0_0_30px_rgba(96,165,250,0.3)]" },
    Angry: { color: "text-red-400", emoji: "😠", glow: "shadow-[0_0_30px_rgba(248,113,113,0.3)]" },
    Neutral: { color: "text-cyan-400", emoji: "😐", glow: "shadow-[0_0_30px_rgba(34,211,238,0.3)]" },
    Fear: { color: "text-purple-400", emoji: "😨", glow: "shadow-[0_0_30px_rgba(192,132,252,0.3)]" },
    Surprise: { color: "text-orange-400", emoji: "😲", glow: "shadow-[0_0_30px_rgba(251,146,60,0.3)]" },
    "No face detected": { color: "text-gray-400", emoji: "😶", glow: "shadow-[0_0_30px_rgba(156,163,175,0.2)]" },
};

const proactiveMessages: Record<string, string[]> = {
    Happy: [
        "love seeing that smile ✨",
        "ayyy good vibes today 😄",
        "you look happy!",
    ],
    Sad: [
        "rough day? 🫂",
        "you okay? 💙",
        "take it easy today 😔",
    ],
    Angry: [
        "take a breather 😅",
        "slow down for a sec 🫶",
        "breathe... you got this 💙",
    ],
    Fear: [
        "you're safe here 🫂",
        "take a slow breath 💙",
        "everything okay? 🛡️",
    ],
    Neutral: [
        "drink some water pls ✨",
        "just checking in 🫶",
        "how's your day going?",
    ],
    Surprise: [
        "whoa 😲",
        "that was unexpected 👀",
    ]
};

export default function Dashboard() {

    const [currentEmotion, setCurrentEmotion] = useState("Neutral");
    const [confidence, setConfidence] = useState(78);
    const [currentQuote, setCurrentQuote] = useState(emotionQuotes["Neutral"][0]);

    const [emotionHistory, setEmotionHistory] = useState<
        { emotion: string; confidence: number; time: string }[]
    >([]);

    const emotionStats = emotionHistory.reduce(
        (acc: Record<string, number>, item) => {
            acc[item.emotion] = (acc[item.emotion] || 0) + 1;
            return acc;
        },
        {}
    );

    const dominantEmotion =
        Object.keys(emotionStats).length > 0
            ? Object.keys(emotionStats).reduce((a, b) =>
                  emotionStats[a] > emotionStats[b] ? a : b
              ).toLowerCase()
            : "neutral";

    const positiveEmotions = ["happy", "neutral", "surprise"];
    const negativeEmotions = ["sad", "angry", "fear"];

    let wellnessScore = 75;
    if (positiveEmotions.includes(dominantEmotion)) {
        wellnessScore = 90;
    }
    if (negativeEmotions.includes(dominantEmotion)) {
        wellnessScore = 45;
    }

    const generateInsight = () => {
        switch (dominantEmotion) {
            case "happy":
                return "You’ve been emotionally positive today 🌸";
            case "sad":
                return "You may need rest and emotional support 💙";
            case "angry":
                return "Your stress levels seem elevated today ⚠️";
            case "fear":
                return "You seem anxious. Take things slowly 🌿";
            case "neutral":
                return "Your emotional state looks balanced ✨";
            default:
                return "Your emotional patterns are stable 🌱";
        }
    };

    const [messages, setMessages] = useState<
        { role: "user" | "ai"; content: string }[]
    >([]);

    const [inputText, setInputText] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);

    const [hasDetectedFace, setHasDetectedFace] = useState(false);
    const [lastProactiveTime, setLastProactiveTime] = useState(0);
    const [lastProactiveEmotion, setLastProactiveEmotion] = useState("");

    const [isListening, setIsListening] = useState(false);
    const [voiceType, setVoiceType] = useState<"female" | "male">("female");

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, isChatLoading]);

    useEffect(() => {
        const quotes = emotionQuotes[currentEmotion] || emotionQuotes["Neutral"];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setCurrentQuote(randomQuote);
    }, [currentEmotion]);

    useEffect(() => {

        if (
            !hasDetectedFace ||
            currentEmotion === "No face detected" ||
            isChatLoading
        ) return;

        const now = Date.now();
        const timeSinceLastMsg = now - lastProactiveTime;

        if (timeSinceLastMsg < 25000) return;

        const isEmotionChange =
            currentEmotion !== lastProactiveEmotion;
            
        const isSustainedStress = 
            ["Sad", "Angry", "Fear"].includes(currentEmotion) && confidence > 80 && timeSinceLastMsg >= 35000;

        const isTimeUp = timeSinceLastMsg >= 45000; // Increased to avoid spam

        if (isEmotionChange || isSustainedStress || isTimeUp) {

            setLastProactiveEmotion(currentEmotion);
            setLastProactiveTime(now);

            const msgs = proactiveMessages[currentEmotion];

            if (msgs && msgs.length > 0) {

                const randomMsg =
                    msgs[Math.floor(Math.random() * msgs.length)];

                setIsChatLoading(true);

                setTimeout(() => {

                    setIsChatLoading(false);

                    setMessages((prev) => [
                        ...prev,
                        {
                            role: "ai",
                            content: randomMsg
                        }
                    ]);

                    const cleanedMsg =
                        randomMsg.replace(
                            /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
                            ""
                        );

                    speakText(cleanedMsg);

                }, 800);
            }
        }

    }, [
        currentEmotion,
        lastProactiveTime,
        lastProactiveEmotion,
        isChatLoading,
        hasDetectedFace
    ]);

    const speakText = (text: string) => {

        if (!window.speechSynthesis) return;

        const cleanedText = text.replace(
            /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
            ""
        );

        window.speechSynthesis.cancel();

        const utterance =
            new SpeechSynthesisUtterance(cleanedText);
            
        const isEmotional = currentEmotion === "Sad" || currentEmotion === "Fear";

        utterance.rate = isEmotional ? 0.85 : 0.9;
        utterance.pitch =
            voiceType === "female" ? 1.2 : 0.85;

        utterance.volume = 1;

        const voices =
            window.speechSynthesis.getVoices();

        let preferredVoice;

        if (voiceType === "female") {

            preferredVoice =
                voices.find((voice) =>
                    voice.name.toLowerCase().includes("zira")
                ) ||
                voices.find((voice) =>
                    voice.name.toLowerCase().includes("female")
                ) ||
                voices.find((voice) =>
                    voice.name.toLowerCase().includes("samantha")
                );

        } else {

            preferredVoice =
                voices.find((voice) =>
                    voice.name.toLowerCase().includes("david")
                ) ||
                voices.find((voice) =>
                    voice.name.toLowerCase().includes("male")
                );
        }

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    };

    const startListening = () => {

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech Recognition not supported");
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);

        recognition.start();

        recognition.onresult = (event: any) => {
            const transcript =
                event.results[0][0].transcript;

            setInputText("");

            window.speechSynthesis.cancel();

            handleSendMessageFromVoice(transcript);

            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
    };

    const handleSendMessageFromVoice = async (voiceText: string) => {

        if (!voiceText.trim() || isChatLoading) return;

        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: voiceText
            }
        ]);

        setIsChatLoading(true);

        try {

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://healmind-backend.onrender.com";
            const response = await fetch(
                `${API_URL}/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: voiceText,
                        emotion: currentEmotion,
                    }),
                }
            );

            if (!response.ok)
                throw new Error("Chat request failed");

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content: data.response
                }
            ]);

            const cleanedResponse =
                data.response.replace(
                    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
                    ""
                );

            speakText(cleanedResponse);

        } catch (error) {

            console.error("Voice Chat Error:", error);

            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content:
                        "I'm having trouble connecting 😅",
                }
            ]);

        } finally {

            setIsChatLoading(false);
        }
    };

    const handleSendMessage = async () => {

        if (!inputText.trim() || isChatLoading) return;

        const userMessage = inputText.trim();

        setInputText("");

        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: userMessage
            }
        ]);

        setIsChatLoading(true);

        try {

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://healmind-backend.onrender.com";
            const response = await fetch(
                `${API_URL}/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: userMessage,
                        emotion: currentEmotion,
                    }),
                }
            );

            if (!response.ok)
                throw new Error("Chat request failed");

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content: data.response
                }
            ]);

            const cleanedResponse =
                data.response.replace(
                    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
                    ""
                );

            speakText(cleanedResponse);

        } catch (error) {

            console.error("Chat Error:", error);

            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content:
                        "I'm having trouble connecting right now 😅",
                }
            ]);

        } finally {

            setIsChatLoading(false);
        }
    };

    const handleEmotionDetected = (
        emotion: string,
        conf: number
    ) => {

        let formattedEmotion = emotion;

        if (emotion !== "No face detected") {

            formattedEmotion =
                emotion.charAt(0).toUpperCase() +
                emotion.slice(1);

            if (!hasDetectedFace) {
                setHasDetectedFace(true);
            }
        }

        setCurrentEmotion(formattedEmotion);
        setConfidence(conf);

        const currentTime =
            new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });

        setEmotionHistory((prev) => {

            const latest = prev[0];

            if (
                latest &&
                latest.emotion === formattedEmotion &&
                Math.abs(latest.confidence - conf) < 5
            ) {
                return prev;
            }

            return [
                {
                    emotion: formattedEmotion,
                    confidence: conf,
                    time: currentTime,
                },
                ...prev.slice(0, 9),
            ];
        });
    };

    return (
        <main className="min-h-screen bg-black text-white">

            <nav className="flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md px-8 py-5 sticky top-0 z-50">

                <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0 w-14 h-10 overflow-hidden flex justify-center items-start">
                        <Image
                            src="/logo.png"
                            alt="HealMind AI Logo"
                            width={56}
                            height={56}
                            className="absolute top-0 z-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] mix-blend-screen"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent leading-none mb-1">
                            HealMind AI
                        </h1>
                        <p className="text-xs text-gray-400">
                            AI-powered emotional wellness companion
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>

                    <span className="text-sm text-green-400">
                        System Active
                    </span>
                </div>

            </nav>

            <section className="grid gap-6 p-8 md:grid-cols-3">

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:col-span-2">

                    <h2 className="text-2xl font-semibold">
                        Live Emotion Analysis
                    </h2>

                    <div className="mt-6 h-[400px] overflow-hidden rounded-2xl border border-white/10">
                        <WebcamFeed
                            onEmotionDetected={handleEmotionDetected}
                        />
                    </div>

                </div>

                <div className="flex flex-col gap-6">

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

                        <h2 className="text-2xl font-bold text-white">
                            Current Emotion
                        </h2>
                        <div
                            className={`mt-8 rounded-2xl bg-black/40 p-6 text-center ${
                                emotionData[currentEmotion]?.color || "border-white/10"
                            }`}
                        >
                            <div className="text-5xl">
                                {emotionData[currentEmotion]?.emoji}
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="text-sm text-gray-400">
                                Confidence
                            </p>

                            <div className="mt-3 h-3 w-full rounded-full bg-white/10">

                                <motion.div
                                    className="h-3 rounded-full bg-cyan-400"
                                    animate={{
                                        width: `${confidence}%`
                                    }}
                                />

                            </div>

                            <p className="mt-2 text-right text-sm text-gray-400">
                                {confidence}%
                            </p>
                        </div>

                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

                        <h2 className="text-xl font-semibold mb-4">
                            Wellness Insight
                        </h2>

                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentQuote}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-gray-300 italic"
                            >
                                "{currentQuote}"
                            </motion.p>
                        </AnimatePresence>

                    </div>

                </div>

            </section>

            <section className="px-8 pb-12">

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

                    <h2 className="text-2xl font-semibold mb-6">
                        Wellness Assistant
                    </h2>

                    <div className="mb-4 flex gap-3">

                        <button
                            onClick={() => setVoiceType("female")}
                            className={`px-4 py-2 rounded-xl border transition ${
                                voiceType === "female"
                                    ? "bg-pink-500/20 border-pink-500/50"
                                    : "bg-white/5 border-white/10"
                            }`}
                        >
                            Female 👩
                        </button>

                        <button
                            onClick={() => setVoiceType("male")}
                            className={`px-4 py-2 rounded-xl border transition ${
                                voiceType === "male"
                                    ? "bg-blue-500/20 border-blue-500/50"
                                    : "bg-white/5 border-white/10"
                            }`}
                        >
                            Male 👨
                        </button>

                    </div>

                    <div
                        ref={chatContainerRef}
                        className="mb-6 flex h-[400px] flex-col gap-5 overflow-y-auto rounded-2xl border border-white/5 bg-black/40 p-5"
                    >

                        {messages.length === 0 ? (

                            <div className="flex h-full items-center justify-center text-gray-500">
                                Start chatting ✨
                            </div>

                        ) : (

                            messages.map((msg, index) => (

                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${
    msg.role === "user"
        ? "justify-end"
        : "justify-start"
} `}
                                >

                                    <div
                                        className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                                            msg.role === "user"
                                                ? "bg-cyan-500/20"
                                                : "bg-white/10"
                                        }`}
                                    >
                                        {msg.content}
                                    </div>

                                </motion.div>
                            ))
                        )}

                        {isChatLoading && (

                            <div className="flex justify-start">

                                <div className="flex gap-2 rounded-2xl bg-white/10 px-5 py-4">

                                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"></span>
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.2s]"></span>
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.4s]"></span>

                                </div>

                            </div>
                        )}

                    </div>

                    <div className="flex gap-4">

                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) =>
                                setInputText(e.target.value)
                            }
                            onKeyDown={(e) =>
                                e.key === "Enter" &&
                                handleSendMessage()
                            }
                            placeholder="How are you feeling today?"
                            className="flex-1 rounded-xl border border-white/10 bg-black/50 px-5 py-4 text-white placeholder-gray-500 focus:outline-none"
                        />

                        <button
                            onClick={handleSendMessage}
                            disabled={isChatLoading}
                            className="rounded-xl bg-cyan-500/20 px-6 py-4"
                        >
                            Send
                        </button>

                        <button
                            onClick={startListening}
                            className={`${
                                isListening
                                    ? "bg-red-500/30 border-red-500/50"
                                    : "bg-cyan-500/10 border-cyan-500/30"
                            } rounded-xl border px-4 py-4`}
                        >
                            🎤
                        </button>

                    </div>

                </div>

            </section>

            <section className="px-8 pb-12">
                <div className="mx-auto rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">

                    <h2 className="mb-6 text-3xl font-bold text-white">
                        AI Wellness Insights
                    </h2>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                            <p className="text-sm text-gray-400">
                                Dominant Emotion
                            </p>

                            <h3 className="mt-2 text-2xl font-bold capitalize text-white">
                                {dominantEmotion}
                            </h3>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                            <p className="text-sm text-gray-400">
                                Wellness Score
                            </p>

                            <h3 className="mt-2 text-2xl font-bold text-cyan-400">
                                {wellnessScore}%
                            </h3>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                            <p className="text-sm text-gray-400">
                                Emotional State
                            </p>

                            <h3 className="mt-2 text-2xl font-bold text-green-400">
                                Stable
                            </h3>
                        </div>

                    </div>

                    <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6">

                        <p className="mb-3 text-sm text-gray-400">
                            AI Insight
                        </p>

                        <p className="text-lg leading-relaxed text-white">
                            {generateInsight()}
                        </p>

                    </div>

                </div>
            </section>

        </main>
    );
}
