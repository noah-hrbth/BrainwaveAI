require("dotenv").config();

// Import OpenAI API
const { Configuration, OpenAIApi } = require("openai");
// Create OpenAI API configuration
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
// Create OpenAI API instance
const openai = new OpenAIApi(configuration);

// Import Discord API
const { Client, Discord } = require("discord.js");
const client = new Client();

const PREFIX = "/";
const messages = [];
client.on("message", async (msg) => {
	if (!msg.content || msg.author.bot || !msg.content.startsWith(PREFIX)) return;

	try {
		// Get user input
		const prompt = msg.content.replace(PREFIX, "");
		// Add user input to messages array
		messages.push({
			role: "user",
			content: prompt,
		});

		// Send request to OpenAI API
		// new model: gpt-3.5-turbo
		const completion = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: [...messages],
		});

		// old model: text-davinci-003
		// const completion = await openai.createCompletion({
		// 	model: "text-davinci-003",
		// 	prompt: prompt,
		// 	temperature: 0.2,
		// 	max_tokens: 100,
		// });

		const response = completion.data.choices[0].message;

		// Add bot response to messages array
		messages.push(response);

		// Send bot response to Discord
		msg.reply(response.content);
	} catch (error) {
		// Consider implementing your own error handling logic here
		console.error(error);
	}
});

// Login to Discord
client.login(process.env.BOT_TOKEN);
