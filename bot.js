import { HfInference } from "@huggingface/inference";
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";

// API Keys (Same as original script)
const TELEGRAM_BOT_TOKEN = "7451898047:AAEo0edInxLogsU9rl6h0W0PjSQ1mg0omls";
const HUGGING_FACE_API_KEY = "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";

// Restrict bot to a specific Telegram group (Replace with your group's ID)
const ALLOWED_GROUP_ID = -1234567890; // Example: -1001122334455 for supergroups

// Initialize Hugging Face Inference Client
const hf = new HfInference(HUGGING_FACE_API_KEY);

// Initialize Telegram Bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Flag to prevent simultaneous image generation
let isGenerating = false;

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
    const prompt = match[1];

    // Check if the command is used in the allowed group
    if (chatId !== ALLOWED_GROUP_ID) {
        return;
    }

    // Prevent multiple requests at the same time
    if (isGenerating) {
        bot.sendMessage(chatId, "Please wait, an image is already being generated.");
        return;
    }

    isGenerating = true; // Lock generation process

    try {
        await bot.sendMessage(chatId, `Generating image for: "${prompt}"...`);
        const imagePath = await generateImage(prompt);
        await bot.sendPhoto(chatId, imagePath);
    } catch (error) {
        await bot.sendMessage(chatId, "Failed to generate an image. Please try again later.");
    } finally {
        isGenerating = false; // Unlock after completion
    }
});

// Handle "/start" command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Allow "/start" only in the allowed group
    if (chatId !== ALLOWED_GROUP_ID) {
        return;
    }

    bot.sendMessage(chatId, "Welcome! Use /gen 'your prompt' to generate an image.");
});
