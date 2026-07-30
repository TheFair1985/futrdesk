import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SponsorLayer } from './SponsorLayer.jsx';

export const KallawayShort = ({ scenes = [], accentColor = '#F5A623', title = 'Future Desk OS', sponsorName = 'PartnerStack' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Pattern interrupt every 90 frames (3 seconds at 30fps)
    const currentSceneIndex = Math.floor(frame / 90) % (scenes.length || 1);
    const scene = scenes[currentSceneIndex] || scenes[0] || {};

    // Framer-Motion / Spring scale animation for text popups
    const scale = spring({
        frame: frame % 90,
        fps,
        config: { damping: 12, stiffness: 200 }
    });

    // Pattern interrupt rotation every 3 seconds
    const rotation = interpolate(
        frame % 90,
        [0, 5, 85, 90],
        [-2, 0, 0, 2]
    );

    const highlightWords = (scene.highlight_words || []).map(w => w.toLowerCase());
    const words = (scene.text || '').split(' ');

    return (
        <div
            style={{
                flex: 1,
                backgroundColor: '#090D16',
                color: '#FFFFFF',
                fontFamily: "'Space Grotesk', sans-serif",
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '80px 60px',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Google Fonts Import */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;600;700&display=swap');
                
                .bebas-caption {
                    font-family: 'Bebas Neue', sans-serif;
                    letter-spacing: 2px;
                }
            `}</style>

            {/* Top Branding Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <span className="bebas-caption" style={{ fontSize: 36, color: accentColor }}>FUTURE DESK OS</span>
                <span style={{ fontSize: 24, opacity: 0.7, textTransform: 'uppercase' }}>{scene.speaker || 'Host'}</span>
            </div>

            {/* Center B-Roll / Action Overlay Box */}
            <div
                style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${accentColor}`,
                    borderRadius: '24px',
                    padding: '40px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: `0 20px 50px rgba(245, 166, 35, 0.15)`,
                    margin: '40px 0'
                }}
            >
                <div style={{ fontSize: 20, color: '#A0AEC0', marginBottom: 12, textTransform: 'uppercase' }}>
                    🎬 {scene.action || 'Direct Camera Action'}
                </div>
                <div style={{ fontSize: 24, color: accentColor, fontWeight: 600 }}>
                    🖼️ B-Roll: {scene.b_roll_topic || 'Corporate Visual Overlay'}
                </div>
            </div>

            {/* Kinetic Caption Popup Container */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h1
                    className="bebas-caption"
                    style={{
                        fontSize: 72,
                        lineHeight: 1.1,
                        textAlign: 'center',
                        margin: 0,
                        transform: `scale(${scale})`,
                        textShadow: '0 4px 20px rgba(0,0,0,0.8)'
                    }}
                >
                    {words.map((word, idx) => {
                        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        const isHighlighted = highlightWords.includes(cleanWord);

                        return (
                            <span
                                key={idx}
                                style={{
                                    color: isHighlighted ? accentColor : '#FFFFFF',
                                    display: 'inline-block',
                                    marginRight: '12px'
                                }}
                            >
                                {word}{' '}
                            </span>
                        );
                    })}
                </h1>
            </div>

            {/* Bottom SFX & Timing Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <span style={{ fontSize: 20, color: '#718096' }}>⚡ {scene.sound_trigger || 'SFX_WHOOSH'}</span>
                <span className="bebas-caption" style={{ fontSize: 28, color: accentColor }}>{scene.timing || '00:00'}</span>
            </div>

            {/* Dynamic Kinetic Sponsor Overlay Layer */}
            <SponsorLayer sponsorName={sponsorName} accentColor={accentColor} />
        </div>
    );
};
