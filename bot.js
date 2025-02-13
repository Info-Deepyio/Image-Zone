const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { Readable } = require('stream');
const fs = require('fs');

// API Keys
const TELEGRAM_BOT_TOKEN = '7451898047:AAEo0edInxLogsU9rl6h0W0PjSQ1mg0omls';
const HUGGING_FACE_API_KEY = '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';

// Initialize Telegram Bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Inference API URL for FLUX.1-schnell
const API_URL = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';

// Function to generate an image using FLUX.1-schnell
async function generateImage(prompt) {
    try {
        const response = await axios.post(
            API_URL,
            { inputs: prompt },
            {
                headers: {
                    'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Check if the image URL exists in the response
        if (response.data && response.data[0] && response.data[0].url) {
            return response.data[0].url;
        } else {
            throw new Error('No image URL found in the response');
        }
    } catch (error) {
        console.error('Error generating image:', error.message);
        throw error;
    }
}

// Handle "/gen" command
bot.onText(/\/gen (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const prompt = match[1];

    try {
        // Notify user that the image is being generated
        await bot.sendMessage(chatId, `Generating image for: "${prompt}"...`);

        // Generate the image
        const imageUrl = await generateImage(prompt);

        // Send the image to Telegram
        await bot.sendPhoto(chatId, imageUrl);
    } catch (error) {
        await bot.sendMessage(chatId, 'Failed to generate an image. Please try again later.');
    }
});

// Handle "/start" command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome! Use /gen "your prompt" to generate an image.');
});
