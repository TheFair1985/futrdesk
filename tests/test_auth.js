const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuth() {
  console.log("Starting Serverless Auth Test...");

  const testPhoneNumber = "4915112345678"; // Mock Number

  try {
    console.log(`Testing SELECT for phone number: ${testPhoneNumber}`);
    
    // We execute the exact query that the webhook route performs
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', testPhoneNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log("✅ Expected behavior: User not found (PGRST116). Die Datenbank antwortet korrekt auf unbekannte Nummern.");
      } else {
        console.error("❌ Unexpected database error:", error.message);
        process.exit(1);
      }
    } else if (user) {
      console.log("✅ User found. Authentication check works.");
    }

    console.log("✅ Test erfolgreich abgeschlossen. Supabase-Verbindung steht.");
  } catch (e) {
    console.error("❌ Test failed:", e.message);
    process.exit(1);
  }
}

testAuth();
