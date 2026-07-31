/**
 * NOTION UPDATER MODULE
 * Updates Notion database page status once a signal is published.
 */

// Safely load environment variables
try {
    process.loadEnvFile('.env.local');
} catch (e) {
    // Continue in production
}

/**
 * Sends a PATCH request to the Notion API to update the page Status to "Published".
 * @param {string} pageId - Notion page ID (UUID format or hyphenless)
 * @returns {Promise<Object>} Notion API response
 */
export async function markSignalAsPublished(pageId) {
    if (!pageId) {
        console.warn('⚠️ [Notion Updater Warning] Missing pageId parameter. Skipping Notion status update.');
        return { success: false, reason: 'Missing pageId' };
    }

    const apiKey = process.env.NOTION_API_KEY?.trim();
    if (!apiKey) {
        console.warn('⚠️ [Notion Updater Warning] NOTION_API_KEY environment variable is missing.');
        return { success: false, reason: 'Missing NOTION_API_KEY' };
    }

    // Format pageId to standard UUID path string for endpoint URL
    const cleanPageId = pageId.replace(/-/g, '');
    const url = `https://api.notion.com/v1/pages/${cleanPageId}`;

    const payload = {
        properties: {
            "Status": {
                status: {
                    name: "Published"
                }
            }
        }
    };

    try {
        console.log(`📌 [Notion Updater] Sending PATCH request to update Notion page ${cleanPageId} status to Published...`);

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`❌ [Notion Updater Error] Notion API HTTP ${response.status}: ${errorDetails}`);
            return { success: false, status: response.status, error: errorDetails };
        }

        const resData = await response.json();
        console.log(`✅ [Notion Updater Success] Notion page ${resData.id || cleanPageId} status updated to 'Published'!`);
        return { success: true, pageId: resData.id || cleanPageId, data: resData };

    } catch (err) {
        console.error(`❌ [Notion Updater Exception] Failed to update Notion page: ${err.message}`);
        return { success: false, error: err.message };
    }
}
