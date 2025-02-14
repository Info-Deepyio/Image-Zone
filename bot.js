const { HfInference } = require('@huggingface/inference');
const TelegramBot = require('node-telegram-bot-api');

// Your Telegram Bot Token
const TELEGRAM_BOT_TOKEN = "7451898047:AAEo0edInxLogsU9rl6h0W0PjSQ1mg0omls";
// Your Hugging Face API Key
const HUGGING_FACE_API_KEY = "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";

// Initialize Hugging Face Inference Client
const hf = new HfInference(HUGGING_FACE_API_KEY);

// Initialize Telegram Bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Function to handle user messages and interact with Hugging Face API
async function handleUserMessage(chatId, message) {
    try {
        // Use the chat model to process the user's message
        const chatCompletion = await hf.chatCompletion({
            model: "gpt-3.5-turbo", // Using a widely available model as fallback
            messages: [
                {
                    role: "user",
                    content: message
                }
            ],
            provider: "openai", // If using OpenAI model
            max_tokens: 500,
        });

        // Send the response back to the Telegram chat
        const botResponse = chatCompletion.choices[0].message.content;
        bot.sendMessage(chatId, botResponse);
    } catch (error) {
        console.error("Error handling user message:", error);
        // Log the detailed error to help identify the issue
        bot.sendMessage(chatId, `Sorry, something went wrong. Error: ${error.message}`);
    }
}

// Listen for text messages
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    // Send typing indicator to let the user know the bot is processing their request
    bot.sendChatAction(chatId, "typing");

    // Handle the user message and get a response from the model
    handleUserMessage(chatId, userMessage);
});

// Handle "/start" command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Hello! I'm your assistant bot. You can ask me questions.");
});
