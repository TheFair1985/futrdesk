# SOP 01: Sensor Engine

## Purpose
This document outlines the standard operating procedure for the `sensor_engine.mjs` script, which is the primary data ingestion mechanism for the Future Desk OS. Its purpose is to continuously scan the digital horizon for early indicators of change.

## Core Rule: Data Integrity and Causal Assignment
The Sensor Engine's most critical function is not just to collect data, but to provide immediate context. Therefore, the following rule is absolute:

**No signal may pass the `raw` status without a valid `causal_pillar` assignment.**

Data without a clear connection to one of the five causal pillars (`Intelligence`, `Capital`, `Infrastructure`, `Society`, `Decision_Systems`) is considered noise and must be discarded by the engine immediately. This ensures that all downstream processes operate on a foundation of clean, relevant, and pre-contextualized information.

## Adding New Data Sources
Adding a new data source to the Sensor Engine is a critical task that must be performed with precision. Follow these steps:

1.  **Identify the Endpoint:** Locate a stable, publicly accessible API or feed (JSON or XML) that provides high-quality data relevant to one of the five causal pillars.

2.  **Create a Fetcher Function:** In `sensor_engine.mjs`, create a new asynchronous function dedicated to this source (e.g., `fetchYourSourceSignals`). This function is responsible for:
    *   Calling the endpoint using the native `fetch` API.
    *   Handling the response (e.g., parsing JSON).
    *   Error handling (e.g., logging failed requests).

3.  **Normalize the Data:** Create a normalizer function (e.g., `normalizeYourSourceData`) that takes the raw data from the fetcher and transforms it into a structured object. This function must:
    *   Extract the `headline` and `source_url`.
    *   Clean the data by removing HTML tags, special characters, and unnecessary whitespace.
    *   Return a clean, intermediate object for each signal.

4.  **Integrate into the Main Function:** In the `main` function of the script:
    *   Call your new fetcher and normalizer.
    *   Ensure the normalized data is passed to the `classifyAndStructureSignal` function, which will handle the causal pillar assignment, UUID generation, and final structuring according to the `config.json` schema.

5.  **Update Keyword Engine (If Necessary):** If the new source provides signals for a niche area, review the keyword sets in the `assignCausalPillar` function and add new keywords to improve classification accuracy.

6.  **Test Rigorously:** Execute the script and verify that the new signals are being correctly fetched, normalized, classified, and saved to `raw_signals.json`. Check the console output for any errors.

By adhering to this process, we maintain the integrity and effectiveness of our Sensor Engine as the foundational layer of the Future Desk OS.
