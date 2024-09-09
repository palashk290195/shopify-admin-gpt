# shopify-admin-gpt
### README for Shopify App with OpenAI Integration

## Overview

This is a Shopify app that allows you to update product titles and generate SEO-based descriptions using natural language commands. The app integrates with OpenAI's GPT-3.5 model to interpret commands, suggest new product titles, and create optimized product descriptions.

## Features

- Update Shopify product titles using natural language commands.
- Automatically generate SEO-optimized descriptions based on the current product title and description.
- Simple UI using Shopify Polaris components for user interaction.
![image](https://github.com/user-attachments/assets/84910fad-fab7-44f1-af7d-9878661a7313)


## Prerequisites

- Node.js (>=14)
- Shopify Partner Account
- Ngrok (for local tunneling)
- OpenAI API Key

## Setup Instructions

### 1. Clone the Repository

First, clone the repository and navigate into the project directory.

```bash
git clone https://github.com/palashk290195/shopify-admin-gpt.git
cd shopify-admin-gpt
```

### 2. Install Dependencies

Install the necessary dependencies:
```bash
npm install
```

### 3. Add OpenAI API Key and Shopify Credentials

Create a `.env` file at the root of the project and add your OpenAI API Key and Shopify app credentials:

```
SHOPIFY_API_KEY=your-shopify-api-key
OPENAI_API_KEY=your-openai-api-key
```

### 4. Ngrok Setup

Since Shopify apps need to be publicly accessible for development, you’ll need to use Ngrok for tunneling.

1. Install ngrok (if not already installed):

2. Start ngrok at port 3000:

```bash
ngrok http 3000
```

3. Copy the `ngrok` tunnel URL from the output (e.g., `https://0ea8-49-207-244-45.ngrok-free.app`).

### 5. Deploy to Shopify

1. Run the following Shopify CLI command to connect the tunnel:

```bash
shopify app build
shopify app deploy
shopify app dev --tunnel-url https://0ea8-49-207-244-45.ngrok-free.app:3000
```

This will set up the tunnel between Shopify and your local app running on port `3000`.

Once the app is running and the tunnel is connected, you can install the app on a development store:

1. Visit your Shopify Partner dashboard.
2. Navigate to your app and click on "Test on Development Store".
3. Follow the prompts to install and test the app.

### 6. How to Use

1. Enter natural language commands in the provided text field (e.g., "Change the snowboard title to 'Extreme Winter Glider' and improve the SEO description").
2. The app will process the command and update the product title and SEO description accordingly.
