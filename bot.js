const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-jalaali'); // For Iranian calendar
const numeral = require('numeral'); // For number formatting

// Replace with your bot token and target chat ID
const token = '7770849244:AAHwUn9N11ZzgwVcSUugQD-2a-UjpVnMsGg';
const targetChatId = -1002286986056; // Target group chat ID
let isActive = false;
let ownerID = null; // To store the owner's user ID
let isActivatedOnce = false; // Flag to track if the bot has been activated once

// Initialize the bot
const bot = new TelegramBot(token, { polling: true });

// Function to convert numbers to Persian numerals
function toPersianNumerals(str) {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (match) => persianNumbers[parseInt(match)]);
}

// Function to get current Iranian date and time
function getIranianDateTime() {
  const now = moment().jDate();
  const jalaliDate = now.format('jYYYY/jMM/jDD');
  const time = now.format('HH:mm:ss');
  return `${toPersianNumerals(jalaliDate)} ساعت ${toPersianNumerals(time)}`;
}

// Welcome message with fixed bold formatting (MarkdownV2)
function generateWelcomeMessage(user) {
  const iranianDateTime = getIranianDateTime();
  const formattedMessage = `
🌟 *خوش آمدید، عزیز* ${user.first_name || 'دوست عزیز'}! 🌟

⏰ *زمان ورود شما:* ${iranianDateTime}

✨ ما خوشحالیم که شما به این گروه پیوستید\. امیدواریم زمان لذت\-بخشی در اینجا سپری کنید\!

💡 برای مشاهده هدف و معرفی گروه، دکمه » را کلیک کنید\.
  `;
  return formattedMessage;
}

// Group purpose message with fixed bold formatting (MarkdownV2)
function generatePurposeMessage() {
  const formattedMessage = `
🎮 *هدف و معرفی گروه:*

🌟 این گروه فضایی است برای **چت کردن با دوستان و مردمی که از بازی ماینکرفت خوششان می\-آید**\. 

🎉 اینجا جایی است که می\-توانید تجربیات خود را به اشتراک بگذارید، نظرات خود را ابراز کنید و با افرادی که علاقه\-مند به ماینکرفت هستند، تعامل داشته باشید\.

💡 برای بازگشت به پیام خوش آمدگویی، دکمه « را کلیک کنید\.
  `;
  return formattedMessage;
}

// Inline keyboard buttons
function createKeyboard(page) {
  if (page === 'welcome') {
    return {
      reply_markup: JSON.stringify({
        inline_keyboard: [[{ text: '»', callback_data: 'purpose' }]],
      }),
    };
  } else if (page === 'purpose') {
    return {
      reply_markup: JSON.stringify({
        inline_keyboard: [[{ text: '«', callback_data: 'welcome' }]],
      }),
    };
  }
}

// Handler for new chat members
bot.on('message', async (msg) => {
  try {
    // Ensure the bot only operates in the specified chat
    if (!isActive || msg.chat.id !== targetChatId) return;

    // Detect new chat members
    if (msg.new_chat_members) {
      msg.new_chat_members.forEach((user) => {
        const welcomeMessage = generateWelcomeMessage(user);
        bot.sendMessage(
          msg.chat.id,
          welcomeMessage,
          { parse_mode: 'MarkdownV2', ...createKeyboard('welcome') }
        );
      });
    }

    // Detect and set the owner/admins when the bot starts
    if (!ownerID && msg.chat.id === targetChatId) {
      const admins = await bot.getChatAdministrators(targetChatId);
      const creator = admins.find((admin) => admin.status === 'creator');
      if (creator) {
        ownerID = creator.user.id;
        console.log(`Owner detected: ${ownerID}`);
      }
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Handler for callback queries
bot.on('callback_query', async (query) => {
  try {
    if (!isActive || query.message.chat.id !== targetChatId) return;

    const data = query.data;
    let messageText, keyboard;

    if (data === 'purpose') {
      messageText = generatePurposeMessage();
      keyboard = createKeyboard('purpose');
    } else if (data === 'welcome') {
      const user = query.message.reply_to_message.from;
      messageText = generateWelcomeMessage(user);
      keyboard = createKeyboard('welcome');
    }

    bot.editMessageText(messageText, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: 'MarkdownV2',
      ...keyboard,
    });
  } catch (error) {
    console.error('Error handling callback query:', error);
  }
});

// Activation command
bot.onText(/\/start|فعال/, async (msg) => {
  try {
    if (msg.chat.id !== targetChatId) return;

    // Ensure only the owner can activate the bot
    if (!ownerID) {
      const admins = await bot.getChatAdministrators(targetChatId);
      const creator = admins.find((admin) => admin.status === 'creator');
      if (creator) {
        ownerID = creator.user.id;
        console.log(`Owner detected: ${ownerID}`);
      }
    }

    if (msg.from.id === ownerID) {
      if (!isActivatedOnce) {
        isActive = true;
        isActivatedOnce = true;
        bot.sendMessage(msg.chat.id, '*🤖 ربات فعال شد\!* ✅', { parse_mode: 'MarkdownV2' });
      }
      // Do not respond if already activated
    } else {
      bot.sendMessage(msg.chat.id, '⚠️ فقط صاحب گروه می‌تواند ربات را فعال کند\.', { parse_mode: 'MarkdownV2' });
    }
  } catch (error) {
    console.error('Error handling activation:', error);
  }
});

// Midnight greeting
function sendMidnightGreeting() {
  try {
    if (!isActive) return;

    const currentTime = moment().tz('Asia/Tehran').format('HH:mm');
    if (currentTime === '00:00') {
      const midnightMessage = `
🌙 *شب بخیر\!* 🌙

💤 امیدواریم شبی آرام و خوشبخت برای شما در پی داشته باشد\. خواب خوب 💤
      `;
      bot.sendMessage(targetChatId, midnightMessage, { parse_mode: 'MarkdownV2' });
    }
  } catch (error) {
    console.error('Error sending midnight greeting:', error);
  }
}

// Schedule midnight greeting check every minute
setInterval(() => {
  sendMidnightGreeting();
}, 60000);

// Start the bot
console.log('Telegram bot is running...');
