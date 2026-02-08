const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

async function run() {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const models = await client.models.list();
  console.log(models);
}

run();