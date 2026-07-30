import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const SponsorLayer = ({ sponsorName = '', accentColor = '#F5A623' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (!sponsorName) return null;

    // Show sponsor lower-third overlay starting around frame 450 (second 15 of 30fps video)
    const sponsorStartFrame = 450;
    
    if (frame < sponsorStartFrame) return null;

    const relativeFrame = frame - sponsorStartFrame;

    // Spring animation for smooth popup
    const scale = spring({
        frame: relativeFrame,
        fps,
        config: { damping: 14, stiffness: 180 }
    });

    // Fade in / out opacity over 90 frames duration
    const opacity = interpolate(
        relativeFrame,
        [0, 15, 75, 90],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 160,
                left: '50%',
                transform: `translateX(-50%) scale(${scale})`,
                opacity,
                backgroundColor: 'rgba(9, 13, 22, 0.92)',
                border: `2px solid ${accentColor}`,
                borderRadius: 40,
                padding: '16px 40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: `0 10px 30px rgba(245, 166, 35, 0.25)`,
                zIndex: 100,
                backdropFilter: 'blur(12px)'
            }}
        >
            <span style={{ fontSize: 24, color: '#A0AEC0', textTransform: 'uppercase' }}>⚡ SPONSOR</span>
            <span
                className="bebas-caption"
                style={{
                    fontSize: 32,
                    color: '#FFFFFF',
                    letterSpacing: 1.5
                }}
            >
                BROUGHT TO YOU BY <span style={{ color: accentColor }}>{sponsorName.toUpperCase()}</span>
            </span>
        </div>
    );
};
