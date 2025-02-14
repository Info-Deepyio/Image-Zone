const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-jalaali');

// Replace with your Telegram bot token
const token = '7112444058:AAEN7XLWZ1A-CqF0VVEX3iJrdjMZ2TaLhwc';
const bot = new TelegramBot(token, { polling: true });

// The allowed chat ID (replace with your desired chat ID)
const allowedChatId = 'YOUR_SPECIFIC_CHAT_ID';  // Example: '123456789'

// Define a variable to track whether the bot is enabled
let botEnabled = false;
let lastMessageId = null;

// Helper function to format Persian numerals
function toPersianNumerals(num) {
  return num.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

// Handle the "/فعال" command to enable the bot
bot.onText(/\/فعال/, (msg) => {
  const chatId = msg.chat.id;
  const isAdmin = msg.from.id === chatId;  // Assuming the owner/admin is the one sending this command

  // Only proceed if the message is from the allowed chat ID
  if (chatId !== allowedChatId) {
    return;
  }

  if (isAdmin && !botEnabled) {
    botEnabled = true;
    bot.sendMessage(chatId, '🔓 گروه فعال شد. حالا خوشحال میشیم که خوش بگذرونید! 😄');
  } else if (!isAdmin) {
    bot.sendMessage(chatId, '❌ شما مجاز به فعال کردن گروه نیستید.');
  } else {
    bot.sendMessage(chatId, '✅ گروه قبلاً فعال است.');
  }
});

// Welcome new users and show current time in Iranian calendar
bot.on('new_chat_members', (msg) => {
  const chatId = msg.chat.id;

  // Only proceed if the message is from the allowed chat ID
  if (chatId !== allowedChatId) {
    return;
  }

  const user = msg.new_chat_member;
  const userName = user.first_name;

  // Get the current time in Iranian year
  const iranianDate = moment().format('jYYYY/jMM/jDD HH:mm:ss');

  // Persian numeral version of the time
  const formattedTime = toPersianNumerals(iranianDate);

  const welcomeMessage = `
سلام ${userName} عزیز! 👋
خوش آمدید به گروه ما! 🥳
زمان فعلی در تقویم هجری شمسی: ${formattedTime} ⏰

برای ادامه، لطفاً دکمه زیر را فشار دهید.
`;

  // Send welcome message with inline keyboard
  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '»', callback_data: 'next_page' }
        ]
      ]
    }).then((sentMessage) => {
      // Save the message ID to edit it later
      lastMessageId = sentMessage.message_id;
    });
});

// Handle the "»" button to show group purpose
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  // Only proceed if the message is from the allowed chat ID
  if (chatId !== allowedChatId) {
    return;
  }

  if (data === 'next_page') {
    const purposeMessage = `
📌 <b>هدف این گروه:</b>
این گروه برای چت کردن با مردم و دوستانی است که از <b>ماینکرفت</b> خوششون میاد. 🎮

برای بازگشت، دکمه « را فشار دهید.
    `;

    // Edit the message with the group purpose
    bot.editMessageText(purposeMessage, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '«', callback_data: 'back_page' }
          ]
        ]
      }
    });
  }

  if (data === 'back_page') {
    const welcomeBackMessage = `
سلام دوباره! 👋
خوش آمدید به گروه! 😄

برای دیدن هدف گروه، لطفاً دکمه "»" را فشار دهید.
    `;

    // Edit the message back to the welcome message
    bot.editMessageText(welcomeBackMessage, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '»', callback_data: 'next_page' }
          ]
        ]
      }
    });
  }
});

// Nightly greeting at 12:00 AM Iran time
const sendGoodNight = () => {
  const now = moment().utcOffset(3.5);  // Iranian Time Zone (UTC+3:30)
  const hour = now.hour();
  
  if (hour === 0 && now.minute() === 0) {
    const goodNightMessage = `
🌙 شب بخیر عزیزان! 😴
امیدوارم روز خوبی داشته باشید و شب خوبی را سپری کنید. 💫
    `;

    // Send the "Good night" message to the group
    bot.sendMessage(allowedChatId, goodNightMessage, { parse_mode: 'HTML' });
  }
};

// Schedule the "Good night" message every day at midnight Iran time
setInterval(sendGoodNight, 60000);  // Check every minute if it's midnight

// Set up bot's onStart functionality
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Only proceed if the message is from the allowed chat ID
  if (chatId !== allowedChatId) {
    return;
  }

  const greetingMessage = `
سلام به گروه! 🙌
برای فعال کردن ربات، مدیر گروه باید دستور "/فعال" را وارد کند. ⚙️
    `;

  bot.sendMessage(chatId, greetingMessage);
});
