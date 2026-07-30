# Future Desk OS - Visual & SFX Asset Library

Diese Bibliothek stellt das zentrale Repository für wiederverwendbare Bewegungsgrafiken (Framer Motion) und Sound-Effekte (SFX) dar, die im **Kallaway Video Protokoll** referenziert werden.

---

## 📁 Ordnerstruktur

```text
04_Visuals/library/
├── animations/         # Wiederverwendbare Framer-Motion Komponentenelemente (.jsx / .tsx)
│   ├── KineticTypography.jsx
│   ├── LowerThirdCallout.jsx
│   ├── BRollOverlayCard.jsx
│   └── SelectivePerceptionDiagram.jsx
└── sfx/                # Kategorisierte Open-Source Sound-Effekte (.wav / .mp3)
    ├── whoosh_heavy.wav
    ├── pop_digital.mp3
    ├── cash_register.wav
    └── riser_subtle.wav
```

---

## 🎨 Framer-Motion Bausteine (`/animations`)

Alle visuellen Animationen werden als atomare, konfigurierbare React-Komponenten mit **Framer Motion** gebaut. Sie dienen als wiederverwendbare Bausteine für die automatische Videogenerierung (z.B. via Remotion oder React-Canvas-Pipelines).

### Design-System Standards & Motion-Prinzipien
1. **Physics-based Spring Animations**: Verwende `type: "spring"` für natürliche, dynamische Übergänge anstelle von statischen Bezier-Kurven.
2. **Prop-Driven State Controls**: Jede Komponente akzeptiert `highlightWords`, `active`, `delay` und `duration`.
3. **Modularität**: Die Komponenten sind unabhängig und overlay-fähig aufgebaut.

### Beispiel-Komponente: `KineticTypography.jsx`

```jsx
import React from 'react';
import { motion } from 'framer-motion';

export const KineticTypography = ({ text, highlightWords = [], triggerKey }) => {
  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  };

  const wordVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 350, damping: 25 }
    }
  };

  return (
    <motion.div
      key={triggerKey}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="kinetic-text-container text-4xl font-extrabold tracking-tight text-white"
    >
      {words.map((word, index) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '');
        const isHighlighted = highlightWords.some(
          (hw) => hw.toLowerCase() === cleanWord.toLowerCase()
        );

        return (
          <motion.span
            key={index}
            variants={wordVariants}
            className={`inline-block mr-2 ${
              isHighlighted
                ? 'text-yellow-400 underline decoration-wavy underline-offset-4'
                : 'text-white'
            }`}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.div>
  );
};
```

---

## 🔊 SFX Audio Bibliothek (`/sfx`)

Die Sound-Effekte bilden die auditive Untermalung für visuelle Cuts, Text-Einblendungen und Stimmungswechsel im Kallaway Protokoll.

### Mappings & Trigger-Konventionen

Die im Regiebuch (`kallaway_protocol.mjs`) generierten `sound_trigger` Werte mappen direkt auf Dateinamen im Ordner `04_Visuals/library/sfx/`:

| `sound_trigger` (Groq Output) | Dateipfad | Beschreibung |
| :--- | :--- | :--- |
| `SFX_WHOOSH_HEAVY` | `sfx/whoosh_heavy.wav` | Schneller B-Roll Wechsel oder Szenentransition |
| `SFX_POP_DIGITAL` | `sfx/pop_digital.mp3` | Einblendung von Highlight-Words / Kinetic Text |
| `SFX_CASH_REGISTER` | `sfx/cash_register.wav` | B2B-Metriken, Umsatz-Signale, ROI-Hooks |
| `SFX_RISER_SUBTLE` | `sfx/riser_subtle.wav` | Spannungsaufbau vor Aufdeckung selektiver Wahrnehmung |

---

## 🎙️ Synthese & Open-Source Audio Integration

- **Voice Engine**: Das Voiceover wird mit **XTTSv2** lokal/open-source erzeugt.
- **Audio-Mixing**: Die synthetisierte XTTSv2 Voice-Spur wird zeitlich exakt mit den SFX-Triggern aus `/sfx` und den Framer-Motion Komponenten aus `/animations` kombiniert.
