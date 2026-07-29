
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';

// Load environment variables natively
process.loadEnvFile('.env.local');

const CONFIG_PATH = './config.json';
const SIGNALS_PATH = './02_Signals/raw_signals.json';
const NET_COST_PER_SIGNAL = 0.0015;

// --- 1. DATA-INGESTION ---

async function fetchGitHubTrendingSignals() {
    try {
        // GitHub Trending is not available via a direct API.
        // As a stable alternative, we'll query the GitHub API for recently updated, popular repositories in key areas.
        const response = await fetch('https://api.github.com/search/repositories?q=ai+OR+robotics+OR+automation&sort=updated&order=desc&per_page=15');
        const data = await response.json();
        return data.items.map(repo => ({
            headline: `GitHub Trending: ${repo.full_name} - ${repo.description}`,
            source_url: repo.html_url,
            source: 'GitHub'
        }));
    } catch (error) {
        console.error('Error fetching GitHub signals:', error);
        return [];
    }
}

async function fetchArXivSignals() {
    try {
        const response = await fetch('http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.RO&sortBy=submittedDate&sortOrder=descending&max_results=15');
        const xmlData = await response.text();
        const signals = [];
        const entries = xmlData.split('</entry>');
        for (const entry of entries) {
            if (!entry.includes('<entry>')) continue;
            const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
            const urlMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
            if (titleMatch && urlMatch) {
                signals.push({
                    headline: titleMatch[1].replace(/\s+/g, ' ').trim(),
                    source_url: urlMatch[1].trim(),
                    source: 'arXiv'
                });
            }
        }
        return signals;
    } catch (error) {
        console.error('Error fetching arXiv signals:', error);
        return [];
    }
}

async function fetchNewsAPISignals() {
    if (!process.env.NEWS_API_KEY || process.env.NEWS_API_KEY === "YOUR_NEWS_API_KEY_HERE") {
        console.warn("NewsAPI key not found or not set. Skipping NewsAPI.");
        return [];
    }
    try {
        const url = `https://newsapi.org/v2/top-headlines?country=us&category=business&pageSize=15&apiKey=${process.env.NEWS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'ok') {
            return data.articles.map(article => ({
                headline: article.title,
                source_url: article.url,
                source: 'NewsAPI'
            }));
        } else {
            console.error('Error from NewsAPI:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching NewsAPI signals:', error);
        return [];
    }
}

async function fetchCNBCSignals() {
    try {
        const response = await fetch('https://www.cnbc.com/id/10000664/device/rss/rss.html');
        const xmlData = await response.text();
        const signals = [];
        const items = xmlData.split('</item>');
        for (const item of items) {
            if (!item.includes('<item>')) continue;
            const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
            const urlMatch = item.match(/<link>([\s\S]*?)<\/link>/);
            if (titleMatch && urlMatch) {
                signals.push({
                    headline: titleMatch[1].replace(/\s+/g, ' ').trim(),
                    source_url: urlMatch[1].trim(),
                    source: 'CNBC'
                });
            }
        }
        return signals;
    } catch (error) {
        console.error('Error fetching CNBC signals:', error);
        return [];
    }
}

async function fetchYahooFinanceSignals() {
    try {
        const response = await fetch('https://finance.yahoo.com/news/rss');
        const xmlData = await response.text();
        const signals = [];
        const items = xmlData.split('</item>');
        for (const item of items) {
            if (!item.includes('<item>')) continue;
            const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
            const urlMatch = item.match(/<link>([\s\S]*?)<\/link>/);
            if (titleMatch && urlMatch) {
                signals.push({
                    headline: titleMatch[1].replace(/\s+/g, ' ').trim(),
                    source_url: urlMatch[1].trim(),
                    source: 'Yahoo Finance'
                });
            }
        }
        return signals;
    } catch (error) {
        console.error('Error fetching Yahoo Finance signals:', error);
        return [];
    }
}

async function fetchMITTechReviewSignals() {
    try {
        const response = await fetch('https://news.mit.edu/rss/topic/technology');
        const xmlData = await response.text();
        const signals = [];
        const items = xmlData.split('</item>');
        for (const item of items) {
            if (!item.includes('<item>')) continue;
            const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
            const urlMatch = item.match(/<link>([\s\S]*?)<\/link>/);
            if (titleMatch && urlMatch) {
                signals.push({
                    headline: titleMatch[1].replace(/\s+/g, ' ').trim(),
                    source_url: urlMatch[1].trim(),
                    source: 'MIT Technology Review'
                });
            }
        }
        return signals;
    } catch (error) {
        console.error('Error fetching MIT Technology Review signals:', error);
        return [];
    }
}


// --- 2. NORMALISIERUNG & 3. KLASSIFIKATION ---

function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/[^\w\s\.\,\:\-\–\(\)]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function assignCausalPillar(headline) {
    const lowerHeadline = headline.toLowerCase();

    // Define keywords for each pillar. More specific/impactful keywords first.
    const pillarKeywords = {
        Decision_Systems: ['frameworks', 'game theory', 'mental models', 'risk', 'leadership', 'strategy', 'first principles', 'governance', 'turnaround', 'decision making', 'policy'],
        Infrastructure: ['energy', 'power grid', 'semiconductors', 'supply chain', 'logistics', 'manufacturing', 'hardware', 'cloud', 'data center', 'automation', 'robotics', 'capex'],
        Capital: ['vc', 'funding', 'startup', 'm&a', 'ipo', 'valuation', 'markets', 'investment', 'acquisition', 'business', 'economics', 'financial'],
        Society: ['education', 'demographics', 'workforce', 'psychology', 'consumer behavior', 'social', 'health', 'culture', 'employment'],
        Intelligence: ['ai', 'llm', 'software', 'computer vision', 'algorithm', 'neural network', 'github', 'machine learning', 'deep learning', 'generative ai']
    };

    // Iterate through pillars in order of precedence
    const orderedPillars = ['Decision_Systems', 'Infrastructure', 'Capital', 'Society', 'Intelligence'];

    for (const pillar of orderedPillars) {
        for (const keyword of pillarKeywords[pillar]) {
            // Use word boundaries to avoid partial matches (e.g., 'ai' matching 'trailer')
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(lowerHeadline)) {
                return pillar;
            }
        }
    }
    return null; // Discard if no pillar is found
}

function structureSignal(rawSignal, config) {
    const causal_pillar = assignCausalPillar(rawSignal.headline);
    if (!causal_pillar) {
        return null;
    }

    return {
        id: randomUUID(),
        timestamp_ingested: new Date().toISOString(),
        source_url: rawSignal.source_url,
        headline: cleanText(rawSignal.headline),
        causal_pillar,
        surprise_score: 0,
        scale_score: 0,
        timeliness_score: 0,
        longevity_score: 0,
        actionability_score: 0,
        total_editorial_score: 0,
        status: "raw",
        net_processing_cost_eur: NET_COST_PER_SIGNAL
    };
}

// --- 5. SPEICHERUNG & REPORTING ---

async function saveSignals(signals) {
    // Overwrite the file with new international data
    await fs.writeFile(SIGNALS_PATH, JSON.stringify(signals, null, 2));
    return { newSignalsCount: signals.length, totalSignalsCount: signals.length };
}

// --- MAIN EXECUTION ---

async function main() {
    console.log('Starting International Sensor Engine...');
    
    const configData = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configData);

    const sources = [
        fetchGitHubTrendingSignals(),
        fetchArXivSignals(),
        fetchNewsAPISignals(),
        fetchCNBCSignals(),
        fetchYahooFinanceSignals(),
        fetchMITTechReviewSignals()
    ];

    const allRawSignals = (await Promise.all(sources)).flat();
    
    const structuredSignals = allRawSignals
        .map(signal => structureSignal(signal, config))
        .filter(Boolean); // Filter out discarded signals

    // Enforce hard limit for pillar distribution (max 40% per pillar)
    const MAX_PILLAR_PERCENTAGE = 0.4;
    const MIN_TOTAL_SIGNALS = 30;
    let finalSignals = [...structuredSignals];

    let attempts = 0;
    const MAX_ATTEMPTS = 5; // Prevent infinite loops

    while (attempts < MAX_ATTEMPTS) {
        const currentPillarCounts = finalSignals.reduce((acc, signal) => {
            acc[signal.causal_pillar] = (acc[signal.causal_pillar] || 0) + 1;
            return acc;
        }, {});

        const totalCurrentSignals = finalSignals.length;
        let needsAdjustment = false;

        for (const pillar in currentPillarCounts) {
            if (currentPillarCounts[pillar] / totalCurrentSignals > MAX_PILLAR_PERCENTAGE) {
                needsAdjustment = true;
                const signalsToRemove = currentPillarCounts[pillar] - Math.floor(totalCurrentSignals * MAX_PILLAR_PERCENTAGE);
                
                // Randomly remove signals from this pillar
                const pillarSignals = finalSignals.filter(s => s.causal_pillar === pillar);
                const otherSignals = finalSignals.filter(s => s.causal_pillar !== pillar);
                
                // Shuffle and take the required number
                const shuffledPillarSignals = pillarSignals.sort(() => 0.5 - Math.random());
                finalSignals = [...otherSignals, ...shuffledPillarSignals.slice(signalsToRemove)];
                break; // Re-evaluate distribution after one adjustment
            }
        }

        if (!needsAdjustment && finalSignals.length >= MIN_TOTAL_SIGNALS) {
            break; // Distribution is good and enough signals
        } else if (!needsAdjustment && finalSignals.length < MIN_TOTAL_SIGNALS) {
            // If distribution is good but not enough signals, try to fetch more (not implemented in this iteration)
            // For now, we accept fewer signals if distribution is balanced.
            break;
        }
        attempts++;
    }

    if (finalSignals.length > 0) {
        const { totalSignalsCount } = await saveSignals(finalSignals);
        console.log(`Successfully ingested and saved ${totalSignalsCount} international signals with balanced pillar distribution.`);
    } else {
        console.log('No signals to save after balancing.');
    }
}

main().catch(error => {
    console.error('An unexpected error occurred in the Sensor Engine:', error);
});
