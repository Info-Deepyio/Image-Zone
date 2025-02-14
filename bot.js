const TelegramBot = require('node-telegram-bot-api');
const ytdl = require('ytdl-core');
const fs = require('fs');

// Your Telegram bot token
const token = '7451898047:AAEo0edInxLogsU9rl6h0W0PjSQ1mg0omls';
const bot = new TelegramBot(token, { polling: true });

// Handle incoming messages
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Send me a YouTube link and I will download the video for you!');
});

// Handle incoming YouTube video links
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Check if the message contains a YouTube link
  if (ytdl.validateURL(text)) {
    bot.sendMessage(chatId, 'Downloading the video... Please wait.');

    // Download the YouTube video
    const video = ytdl(text, { filter: 'audioandvideo' });

    // Define a temporary file to store the video
    const fileName = `video-${Date.now()}.mp4`;

    video.pipe(fs.createWriteStream(fileName));

    // Once the download is complete, send the video to the user
    video.on('end', () => {
      bot.sendMessage(chatId, 'Video downloaded! Sending now...');
      bot.sendVideo(chatId, fileName)
        .then(() => {
          // Delete the file after sending it
          fs.unlinkSync(fileName);
        })
        .catch((error) => {
          console.error(error);
          bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again.');
        });
    });
  } else {
    bot.sendMessage(chatId, 'Please send a valid YouTube URL.');
  }
});
