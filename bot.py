import logging
import time
from io import BytesIO
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from huggingface_hub import InferenceClient
from PIL import Image

# API keys
HUGGING_FACE_API_KEY = "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"
TELEGRAM_BOT_TOKEN = "7451898047:AAEo0edInxLogsU9rl6h0W0PjSQ1mg0omls"

# Enable logging
logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Hugging Face Inference Client
client = InferenceClient(
    provider="hf-inference",
    api_key=HUGGING_FACE_API_KEY
)

# Function to generate an image using XLabs-AI/flux-RealismLora
async def generate(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if len(context.args) == 0:
        await update.message.reply_text('Please use the correct format: /gen "your prompt here"')
        return

    prompt = " ".join(context.args)
    await update.message.reply_text(f"Generating an image for: {prompt}...")

    retries = 5  # Retry limit if model is still loading
    for attempt in range(retries):
        try:
            # Generate image using the Hugging Face client
            image = client.text_to_image(prompt, model="XLabs-AI/flux-RealismLora")

            # Convert PIL image to byte stream
            image_bytes = BytesIO()
            image.save(image_bytes, format="PNG")
            image_bytes.seek(0)

            # Send image to Telegram
            await update.message.reply_photo(photo=image_bytes)
            return

        except Exception as e:
            error_msg = str(e).lower()
            if "loading" in error_msg or "too many requests" in error_msg:
                wait_time = 10
                logger.warning(f"Model might be loading, retrying in {wait_time} seconds...")
                await update.message.reply_text(f"Model is still loading or busy. Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                logger.error(f"Error generating image: {e}")
                await update.message.reply_text(f"Failed to generate an image. Error: {str(e)}")
                return

    await update.message.reply_text("Failed to generate an image after multiple attempts.")

# Main function to start the bot
def main():
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    application.add_handler(CommandHandler("gen", generate))
    application.run_polling()

if __name__ == "__main__":
    main()
