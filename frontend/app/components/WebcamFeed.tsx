"use client";

import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { motion } from "framer-motion";

interface WebcamFeedProps {
    onEmotionDetected?: (emotion: string, confidence: number) => void;
}

export default function WebcamFeed({ onEmotionDetected }: WebcamFeedProps) {
    const webcamRef = useRef<Webcam>(null);

    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        if (!isCameraReady) return;

        const captureInterval = setInterval(async () => {
            if (webcamRef.current) {
                const imageSrc = webcamRef.current.getScreenshot();
                if (imageSrc) {
                    try {
                        const res = await fetch(imageSrc);
                        const blob = await res.blob();
                        const formData = new FormData();
                        formData.append("file", blob, "webcam-frame.jpg");

                        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://healmind-backend.onrender.com";
                        const apiRes = await fetch(`${API_URL}/detect-emotion`, {
                            method: "POST",
                            body: formData,
                        });

                        if (apiRes.ok) {
                            const data = await apiRes.json();
                            if (onEmotionDetected) {
                                onEmotionDetected(data.emotion, data.confidence);
                            }
                        }
                    } catch (error) {
                        console.error("Error detecting emotion:", error);
                    }
                }
            }
        }, 3000);

        return () => clearInterval(captureInterval);
    }, [onEmotionDetected, isCameraReady]);

    return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-black/50 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            {!isCameraReady && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                    <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="mb-4 h-12 w-12 rounded-full border-t-2 border-r-2 border-cyan-400"
                    />
                    <p className="text-sm font-medium text-cyan-400 animate-pulse">Initializing Camera...</p>
                </div>
            )}
            
            <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl border border-white/5 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)]" />
            
            <Webcam
                ref={webcamRef}
                audio={false}
                mirrored
                screenshotFormat="image/jpeg"
                onUserMedia={() => setIsCameraReady(true)}
                className={`h-full w-full object-cover transition-opacity duration-1000 ${isCameraReady ? "opacity-100" : "opacity-0"}`}
            />
        </div>
    );
}