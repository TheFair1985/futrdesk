/**
 * NOTION GATEWAY MODULE
 * Future Desk OS - Visual Approval Center Integration
 * Writes generated content packages (Editorial + Kallaway Video-Regiebuch)
 * to Notion database via Notion REST API.
 */

function createRichText(text = '') {
    const str = String(text);
    const chunks = [];
    for (let i = 0; i < str.length; i += 2000) {
        chunks.push({
            type: 'text',
            text: {
                content: str.substring(i, i + 2000)
            }
        });
    }
    return chunks.length > 0 ? chunks : [{ type: 'text', text: { content: '' } }];
}

/**
 * Sends content package to Notion API to create a new approval card page in the database.
 * @param {Object} contentPackage - Generated editorial and video blueprint content package
 * @returns {Promise<Object>} Notion API response object
 */
export async function createNotionApprovalCard(contentPackage) {
    const apiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!apiKey || !databaseId) {
        console.warn('⚠️ [Notion Gateway] NOTION_API_KEY or NOTION_DATABASE_ID missing. Skipping Notion approval card creation.');
        return { success: false, reason: 'Missing NOTION_API_KEY or NOTION_DATABASE_ID' };
    }

    const title = contentPackage.title ||
                  contentPackage.videoMetadata?.titles?.[0] ||
                  contentPackage.leadingQuestion ||
                  'Future Desk OS Content Package';

    const linkedInPostText = contentPackage.linkedInPost?.post || 
                            (typeof contentPackage.linkedInPost === 'string' ? contentPackage.linkedInPost : '');

    const xThreadArray = Array.isArray(contentPackage.xThread?.thread) 
        ? contentPackage.xThread.thread 
        : (Array.isArray(contentPackage.xThread) ? contentPackage.xThread : []);
    const xThreadText = xThreadArray.join('\n\n');

    const kallawayRegiebuch = contentPackage.kallawayRegiebuch || contentPackage.kallawayBlueprint || contentPackage.regiebuch || {};
    const kallawayJsonString = typeof kallawayRegiebuch === 'string' 
        ? kallawayRegiebuch 
        : JSON.stringify(kallawayRegiebuch, null, 2);

    const payload = {
        parent: {
            database_id: databaseId
        },
        properties: {
            "Title": {
                title: createRichText(title)
            },
            "Status": {
                status: {
                    name: contentPackage.status || "Draft"
                }
            },
            "LinkedIn Post": {
                rich_text: createRichText(linkedInPostText)
            },
            "X Thread": {
                rich_text: createRichText(xThreadText)
            },
            "Kallaway Regiebuch": {
                rich_text: createRichText(kallawayJsonString)
            }
        },
        children: [
            {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                    rich_text: createRichText('💼 LinkedIn Executive Briefing')
                }
            },
            {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: createRichText(linkedInPostText)
                }
            },
            {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                    rich_text: createRichText('🧵 X (Twitter) Thread')
                }
            },
            ...xThreadArray.map(tweet => ({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: createRichText(tweet)
                }
            })),
            {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                    rich_text: createRichText('🎬 Kallaway Video-Regiebuch (JSON Blueprint)')
                }
            },
            {
                object: 'block',
                type: 'code',
                code: {
                    rich_text: createRichText(kallawayJsonString),
                    language: 'json'
                }
            }
        ]
    };

    try {
        console.log('📌 [Notion Gateway] Sending request to Notion REST API...');
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`❌ [Notion Gateway] Failed to create Notion approval card [HTTP ${response.status}]: ${errorDetails}`);
            return { success: false, status: response.status, error: errorDetails };
        }

        const data = await response.json();
        console.log(`✅ [Notion Gateway] Approval card page successfully created in Notion! Page ID: ${data.id}`);
        return { success: true, pageId: data.id, url: data.url };
    } catch (err) {
        console.error(`❌ [Notion Gateway] Fetch Exception: ${err.message}`);
        return { success: false, error: err.message };
    }
}
