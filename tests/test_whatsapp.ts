import { downloadWhatsAppImage } from '../utils/whatsapp';

async function runSelfCheck() {
  console.log("Starting WhatsApp Image Retrieval Mock Test...");

  // Setup Mock Env Token
  process.env.WHATSAPP_TOKEN = "mock_token_123";

  // Mock global.fetch for the test
  const originalFetch = global.fetch;
  global.fetch = async (url: string | Request | URL, options?: RequestInit): Promise<Response> => {
    const urlStr = url.toString();
    
    // Mock for Step 1: Metadata Request
    if (urlStr.includes("graph.facebook.com/v19.0/")) {
      console.log(`[Mock Fetch] Intercepted Graph API Call: ${urlStr}`);
      return new Response(JSON.stringify({
        url: "https://fake-meta-url.com/image.jpg",
        mime_type: "image/jpeg"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Mock for Step 2: Binary Download Request
    if (urlStr === "https://fake-meta-url.com/image.jpg") {
      console.log(`[Mock Fetch] Intercepted Binary Download: ${urlStr}`);
      
      // Create a dummy 4-byte array buffer (PNG magic number logic for recognizable base64 'iVBORw')
      const dummyBuffer = new Uint8Array([137, 80, 78, 71]).buffer;
      return new Response(dummyBuffer, {
        status: 200,
        headers: { "Content-Type": "image/jpeg" }
      });
    }
    
    throw new Error(`Unhandled fetch mock for URL: ${urlStr}`);
  };

  try {
    const base64DataUri = await downloadWhatsAppImage("fake_media_id_42");
    console.log("\n✅ Successfully generated Base64 String:");
    console.log(base64DataUri);

    if (base64DataUri.startsWith("data:image/jpeg;base64,iVBORw")) {
      console.log("✅ Validation passed. Mock binary was correctly fetched and converted.");
    } else {
      console.warn("⚠️ Validation failed: Output doesn't match expected binary pattern.");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Restore original fetch
    global.fetch = originalFetch;
  }
}

runSelfCheck();
