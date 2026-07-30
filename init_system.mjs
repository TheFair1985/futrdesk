import { mkdirSync, existsSync } from 'fs';

const REQUIRED_DIRECTORIES = [
    "01_Research",
    "02_Signals",
    "03_Scripts",
    "04_Voice",
    "04_Visuals/remotion",
    "04_Visuals/prompts",
    "05_Database",
    "06_Graphics",
    "07_Published/distributors",
    "07_Published/remotion_assets"
];

/**
 * Boot-sequence file system initialization protocol.
 * Ensures all required pipeline directories exist before any engine executes.
 */
export async function ensureFileSystem() {
    for (const dir of REQUIRED_DIRECTORIES) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }
}
