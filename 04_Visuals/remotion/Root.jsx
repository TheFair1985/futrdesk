import React from 'react';
import { Composition } from 'remotion';
import { KallawayShort } from './KallawayShort.jsx';

export const RemotionRoot = () => {
    return (
        <>
            <Composition
                id="KallawayShort"
                component={KallawayShort}
                durationInFrames={300}
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: "Future Desk OS Editorial",
                    accentColor: "#F5A623", // tuscan_sun
                    scenes: [
                        {
                            timing: "00:00 - 00:03",
                            speaker: "Host 1",
                            text: "When Amazon quietly winds down its proprietary flagship AI models...",
                            action: "Camera zooms in on Host 1",
                            b_roll_topic: "Data center server racks",
                            sound_trigger: "SFX_WHOOSH_HEAVY",
                            highlight_words: ["Amazon", "AI"]
                        },
                        {
                            timing: "00:03 - 00:07",
                            speaker: "Host 2",
                            text: "If Amazon is backing off, why are enterprise CEOs burning tens of millions?",
                            action: "Side angle perspective change",
                            b_roll_topic: "Executive boardroom glass wall",
                            sound_trigger: "SFX_RISER_SUBTLE",
                            highlight_words: ["CEOs", "millions"]
                        }
                    ]
                }}
            />
        </>
    );
};

export default RemotionRoot;
