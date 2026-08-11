import { structureInvoiceData } from '../utils/groq';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runSelfCheck() {
  const messyInput = "Reifenwechsel beim Sprinter für Bauer in Erding. 350 Euro netto. Bitte noch die 19 Prozent Steuer draufrechnen.";
  
  console.log("Starting Groq JSON Structuring Test...");
  console.log(`INPUT: "${messyInput}"`);
  
  try {
    const result = await structureInvoiceData(messyInput);
    console.log("\n✅ Resulting JSON:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

runSelfCheck();
