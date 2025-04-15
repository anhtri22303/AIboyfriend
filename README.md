# Virtual Boyfriend AI Chat App

## Description

A web application that allows you to create and chat with a customizable virtual boyfriend powered by Google's Gemini AI.

## Features

- Customize virtual boyfriend's name, personality, and interests
- Real-time AI-powered chat
- Responsive and modern UI

## Prerequisites

- Node.js (v14 or higher)
- npm
- Gemini API Key from Google AI Studio

### Obtaining a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated API key
4. Replace `your_gemini_api_key_here` in the `.env` file with your actual key

**Important Security Note:**

- Never commit your actual API key to version control
- Add `.env` to your `.gitignore` file
- Treat your API key like a password

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

## Running the Application

- Development mode: `npm run dev`
- Production mode: `npm start`

## Technologies Used

- Node.js
- Express.js
- EJS Templating
- Google Gemini AI
- Vanilla JavaScript

## Customization

You can customize the virtual boyfriend's characteristics through the web interface, including:

- Name
- Personality description
- Interests
- Age

## License

ISC License
