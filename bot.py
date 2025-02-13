from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, CallbackContext
from diffusers import DiffusionPipeline
import torch
import os

# Load FLUX.1-dev model
model = DiffusionPipeline.from_pretrained("black-forest-labs/FLUX.1-dev", torch_dtype=torch.float16).to("cuda")

async def generate(update: Update, context: CallbackContext):
    if not context.args:
        await update.message.reply_text("Usage: /gen <prompt>")
        return

    prompt = " ".join(context.args)
    await update.message.reply_text(f"Generating image for: {prompt}...")

    # Generate image
    image = model(prompt).images[0]
    image_path = "output.png"
    image.save(image_path)

    # Send image
    await update.message.reply_photo(photo=open(image_path, "rb"))

def main():
    TOKEN = "7451898047:AAEo0edInxLogsU9rl6h0W0PjSQ1mg0omls"
    app = Application.builder().token(TOKEN).build()

    app.add_handler(CommandHandler("gen", generate))

    print("Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
