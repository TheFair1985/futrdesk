import { AbsoluteFill, Audio, Video, staticFile, useCurrentFrame, useVideoConfig, Composition, spring, interpolate } from "remotion";
import React from "react";
import whisperData from "./whisper_output.json";

export const FutureDeskVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTime = frame / fps;

  const currentWordObj = whisperData.words.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  let scale = 1;
  if (currentWordObj) {
    const wordStartFrame = Math.round(currentWordObj.start * fps);
    const springValue = spring({
      fps,
      frame: frame - wordStartFrame,
      config: { damping: 12, mass: 0.5 },
    });
    scale = interpolate(springValue, [0, 1], [1.2, 1]);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Video 
        src={staticFile("b_roll_fixed.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.4
        }}
      />
      
      <Audio src={staticFile("test_speech.wav")} />

      {currentWordObj && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              fontFamily: "Inter, -apple-system, sans-serif",
              fontSize: 95,
              fontWeight: 900,
              color: "#FFFFFF",
              textTransform: "uppercase",
              textShadow: "0px 0px 30px rgba(0,0,0,1)",
              transform: `scale(${scale})`,
              textAlign: "center",
              width: "90%",
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
      height={1920}
    />
  );
};
