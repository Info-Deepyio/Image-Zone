import { HfInference } from "@huggingface/inference";
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import { Translate } from "@google-cloud/translate";

// API Keys
const TELEGRAM_BOT_TOKEN = "7451898047:AAEo0edInxLogsU9rl6h0W0PjSQ1mg0omls";
const HUGGING_FACE_API_KEY = "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";

// Initialize Clients
const hf = new HfInference(HUGGING_FACE_API_KEY);
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const translate = new Translate();

// Flag to track if the bot is busy generating an image
let isGenerating = false;

// Function to detect language and translate if necessary
async function translateIfPersian(text) {
    try {
        const [detections] = await translate.detect(text);
        const detectedLang = detections.language;

        if (detectedLang === "fa") {
            const [translations] = await translate.translate(text, "en");
            return translations;
        }

        return text; // Return original if not Persian
    } catch (error) {
        console.error("Translation error:", error);
        return text; // Fallback to original text
    }
}

// Function to generate an image
async function generateImage(prompt) {
    try {
        console.log(`Generating image for: "${prompt}"`);
        
        const imageBlob = await hf.textToImage({
            model: "black-forest-labs/FLUX.1-dev",
            inputs: prompt,
            parameters: { num_inference_steps: 5 },
            provider: "together",
        });

        // Save the image locally
        const imagePath = path.join(process.cwd(), "output.png");
        const buffer = Buffer.from(await imageBlob.arrayBuffer());
        fs.writeFileSync(imagePath, buffer);

        return imagePath;
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Image generation failed.");
    }
}

// Handle "/gen" command
bot.onText(/\/gen (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userInput = match[1];

    if (isGenerating) {
        bot.sendMessage(chatId, "⚠️ Please wait, an image is already being generated!");
        return;
    }

    try {
        // Mark as generating
        isGenerating = true;

        // Translate if Persian
        const translatedPrompt = await translateIfPersian(userInput);
        await bot.sendMessage(chatId, `🎨 Generating image for: "${translatedPrompt}"...`);

        // Generate the image
        const imagePath = await generateImage(translatedPrompt);

        // Send the image
        await bot.sendPhoto(chatId, imagePath);
    } catch (error) {
        await bot.sendMessage(chatId, "❌ Failed to generate an image. Please try again later.");
    } finally {
        // Mark as not generating
        isGenerating = false;
    }
});

// Handle "/start" command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🤖 Welcome! Use /gen 'your prompt' to generate an image.");
});
