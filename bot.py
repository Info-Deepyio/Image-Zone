from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackContext
from diffusers import DiffusionPipeline
import torch
import os

# Load the FLUX.1-dev model with authentication
AUTH_TOKEN = "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"  # Replace with your Hugging Face token

model = DiffusionPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-dev", 
    use_auth_token=AUTH_TOKEN, 
    torch_dtype=torch.float16
).to("cuda")

async def generate(update: Update, context: CallbackContext):
    if not context.args:
        await update.message.reply_text("Usage: /gen <prompt>")
        return
    
    prompt = " ".join(context.args)
    await update.message.reply_text(f"Generating image for: {prompt}...")

    try:
        image = model(prompt).images[0]
        image_path = "output.png"
        image.save(image_path)

        await update.message.reply_photo(photo=open(image_path, "rb"))
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")

def main():
    TOKEN = "7451898047:AAEo0edInxLogsU9rl6h0W0PjSQ1mg0omls"  # Replace with your Telegram bot token
    app = Application.builder().token(TOKEN).build()

    app.add_handler(CommandHandler("gen", generate))

    print("Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
