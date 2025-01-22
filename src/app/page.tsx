"use client";

import { useEffect, useState, useRef } from "react";

export default function RealTimeMicrophoneComponent() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const intervalRef = useRef(null);

  const WHISPER_API_KEY = "API_KEY";

  const transcribeChunk = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, `chunk${Date.now()}.wav`);
    formData.append("model", "whisper-1");

    try {
      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHISPER_API_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      setTranscript((prev) => [...prev, data.text]);
    } catch (error) {
      console.error("Error during transcription:", error);
    }
  };

  const startRecording = () => {
    setTranscript([]);
    setIsRecording(true);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            transcribeChunk(event.data);
          }
        };

        mediaRecorderRef.current.start();

        intervalRef.current = setInterval(() => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
          ) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.start(); // Начинаем новый 5-секундный чанк
          }
        }, 3000);
      })
      .catch((error) => {
        console.error("Microphone access error:", error);
        setIsRecording(false);
      });
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  return (
    <div className="flex items-center justify-center h-screen w-full bg-gray-900">
      <div className="w-full">
        <div className="w-3/4 m-auto bg-white rounded-md border p-4 mt-4">
          {transcript.map((chunk, idx) => (
            <span className="text-gray-600" key={idx}>
              {" " + chunk}
            </span>
          ))}
        </div>

        <button
          onClick={handleToggleRecording}
          className={`mt-10 m-auto flex items-center justify-center ${
            isRecording ? "bg-red-400" : "bg-blue-400"
          } hover:bg-opacity-80 rounded-full w-20 h-20 focus:outline-none`}
        >
          {isRecording ? (
            <svg
              className="h-12 w-12"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="white" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 256 256"
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12 text-white"
            >
              <path
                fill="currentColor"
                d="M128 176a48.05 48.05 0 0 0 48-48V64a48 48 0 0 0-96 0v64a48.05 48.05 0 0 0 48 48ZM96 64a32 32 0 0 1 64 0v64a32 32 0 0 1-64 0Zm40 143.6V232a8 8 0 0 1-16 0v-24.4A80.11 80.11 0 0 1 48 128a8 8 0 0 1 16 0a64 64 0 0 0 128 0a8 8 0 0 1 16 0a80.11 80.11 0 0 1-72 79.6Z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
