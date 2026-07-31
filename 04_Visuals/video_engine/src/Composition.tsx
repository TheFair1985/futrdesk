import { AbsoluteFill, Audio, Video, staticFile, useCurrentFrame, useVideoConfig, Composition } from "remotion";
import React from "react";
import whisperData from "./whisper_output.json";

export const FutureDeskVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Convert current frame to seconds
  const currentTime = frame / fps;

  // Find the word that should be displayed right now
  const currentWordObj = whisperData.words.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* 1. B-Roll Video */}
      <Video 
        src={staticFile("b_roll.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.6 // Darkened for B2B executive feel
        }}
      />
      
      {/* 2. Audio Track (Voiceover) */}
      <Audio src={staticFile("test_speech.mp3")} />

      {/* 3. Dynamic Captions (Future Desk Brand Style) */}
      {currentWordObj && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "Inter, -apple-system, sans-serif",
              fontSize: 140,
              fontWeight: 900,
              color: "#FFFFFF",
              textTransform: "uppercase",
              textShadow: "0px 0px 20px rgba(0,0,0,0.8)",
              // Minimal pop animation based on word start time
              transform: `scale(${1 + Math.max(0, 1 - (currentTime - currentWordObj.start) * 5) * 0.1})`,
            }}
          >
            {currentWordObj.word.replace(/['":,.]/g, '')}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="FutureDeskEngine"
      component={FutureDeskVideo}
      durationInFrames={Math.ceil(whisperData.duration * 30)}
      fps={30}
      width={1080}
      height={1920} // 9:16 Vertical aspect ratio for Shorts/Reels/TikTok
    />
  );
};
