const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-jalaali'); // For Iranian calendar
const numeral = require('numeral'); // For number formatting

// Replace with your bot token and target chat ID
const token = '7770849244:AAHwUn9N11ZzgwVcSUugQD-2a-UjpVnMsGg';
const targetChatId =-1002286986056; // Example: -1001234567890
let isActive = false;

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

// Welcome message
function generateWelcomeMessage(user) {
  const iranianDateTime = getIranianDateTime();
  const formattedMessage = `
🌟 **خوش آمدید، عزیز** ${user.first_name}! 🌟

⏰ **زمان ورود شما:** ${iranianDateTime}

✨ ما خوشحالیم که شما به این گروه پیوستید. امیدواریم زمان لذت‌بخشی در اینجا سپری کنید!

💡 برای مشاهده هدف و معرفی گروه، دکمه » را کلیک کنید.
  `;
  return formattedMessage;
}

// Group purpose message
function generatePurposeMessage() {
  const formattedMessage = `
🎮 **هدف و معرفی گروه:**

🌟 این گروه فضایی است برای **چت کردن با دوستان و مردمی که از بازی ماینکرفت خوششان می‌آید**. 

🎉 اینجا جایی است که می‌توانید تجربیات خود را به اشتراک بگذارید، نظرات خود را ابراز کنید و با افرادی که علاقه‌مند به ماینکرفت هستند، تعامل داشته باشید.

💡 برای بازگشت به پیام خوش آمدگویی، دکمه « را کلیک کنید.
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
bot.on('message', (msg) => {
  if (!isActive || msg.chat.id !== targetChatId) return;

  if (msg.new_chat_members) {
    msg.new_chat_members.forEach((user) => {
      const welcomeMessage = generateWelcomeMessage(user);
      bot.sendMessage(
        msg.chat.id,
        welcomeMessage,
        createKeyboard('welcome')
      );
    });
  }
});

// Handler for callback queries
bot.on('callback_query', (query) => {
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
    ...keyboard,
  });
});

// Activation command
bot.onText(/\/start|فعال/, (msg) => {
  if (msg.chat.id !== targetChatId) return;

  if (msg.from.id === OWNER_ID) { // Replace OWNER_ID with the actual owner's ID
    if (!isActive) {
      isActive = true;
      bot.sendMessage(msg.chat.id, '🤖 **ربات فعال شد!** ✅');
    }
  }
});

// Midnight greeting
function sendMidnightGreeting() {
  if (!isActive) return;

  const currentTime = moment().tz('Asia/Tehran').format('HH:mm');
  if (currentTime === '00:00') {
    const midnightMessage = `
🌙 ** شب بخیر! ** 🌙

💤 امیدواریم شبی آرام و خوشبخت برای شما در پی داشته باشد. خواب خوب 💤
    `;
    bot.sendMessage(targetChatId, midnightMessage);
  }
}

// Schedule midnight greeting check every minute
setInterval(() => {
  sendMidnightGreeting();
}, 60000);

// Start the bot
console.log('Telegram bot is running...');
