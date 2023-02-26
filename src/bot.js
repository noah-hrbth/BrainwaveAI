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
client.on("message", async (msg) => {
	if (!msg.content || msg.author.bot || !msg.content.startsWith(PREFIX)) return;

	try {
		const prompt = msg.content.replace(PREFIX, "");

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

// Login to Discord
client.login(process.env.BOT_TOKEN);
