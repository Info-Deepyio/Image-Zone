import logging
import requests
import re
from telegram import Update
from telegram.ext import Updater, CommandHandler, CallbackContext

# DeepAI API Key (as provided)
DEEPAI_API_KEY = "9de8f0a3-278f-4046-99d4-588be131657e"
# Replace with your Telegram Bot Token
TELEGRAM_BOT_TOKEN = "7451898047:AAEo0edInxLogsU9rl6h0W0PjSQ1mg0omls"

# Enable logging
logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# Function to generate an image
def generate(update: Update, context: CallbackContext) -> None:
    message = update.message.text

    # Extract text inside quotes
    match = re.search(r'"(.*?)"', message)
    if not match:
        update.message.reply_text('Please use the correct format: /gen "your prompt here"')
        return

    prompt = match.group(1)
    update.message.reply_text(f"Generating an image for: {prompt}...")

    response = requests.post(
        "https://api.deepai.org/api/text2img",
        data={"text": prompt},
        headers={"api-key": DEEPAI_API_KEY},
    )

    if response.status_code == 200:
        image_url = response.json().get("output_url")
        update.message.reply_photo(image_url)
    else:
        update.message.reply_text("Failed to generate an image. Try again later.")

# Main function to start the bot
def main():
    updater = Updater(TELEGRAM_BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    dp.add_handler(CommandHandler("gen", generate))

    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()
