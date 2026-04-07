const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
}
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function translateImage(base64Image, prompt) {
    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'votre_cle_api_gemini') {
            throw new Error("Clé API Gemini manquante. Veuillez configurer le fichier .env");
        }

        // We use gemini-2.5-flash as the latest fast model supporting vision
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const imageParts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            }
        ];

        const finalPrompt = prompt || "Traduit ce texte et donne sa décomposition/explication.";

        // Call the model with text prompt and image
        const result = await model.generateContent([finalPrompt, ...imageParts]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Erreur Gemini:", error);
        throw error;
    }
}

module.exports = { translateImage };
