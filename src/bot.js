require("dotenv").config();
const { Client } = require("discord.js");
const client = new Client();

// Login to Discord
client.login(process.env.BOT_TOKEN);

// Import OpenAI API
const { Configuration, OpenAIApi } = require("openai");

// Create OpenAI API configuration
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});

// Create OpenAI API instance
const openai = new OpenAIApi(configuration);

client.on("message", async (msg) => {
	if (!msg.content || msg.author.bot) return;
	try {
		const prompt = msg.content;

		// Send request to OpenAI API
		const completion = await openai.createCompletion({
			model: "text-davinci-003",
			prompt: prompt,
			temperature: 0.2,
			max_tokens: 100,
		});

		// Send response to Discord
		const response = completion.data.choices[0].text;
		msg.reply(response);
	} catch (error) {
		// Consider implementing your own error handling logic here
		console.error(error);
	}
});
