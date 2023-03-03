require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const { Client } = require("discord.js");
const { Routes } = require("discord-api-types/v9");
const { REST } = require("@discordjs/rest");

const { OPENAI_API_KEY, BOT_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

// Create OpenAI API configuration
const configuration = new Configuration({
	apiKey: OPENAI_API_KEY,
});
// Create OpenAI API instance
const openai = new OpenAIApi(configuration);

// create a new Discord client
const client = new Client({ intents: [] });
// Create a new REST instance
const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

const messages = [];
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;

  try {
    // Get user input
    const prompt = interaction.options.getString("prompt");
    // Add user input to messages array
		messages.push({
			role: "user",
			content: prompt,
		});
    // Send request with all messages (also prev) to OpenAI API
		const completion = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: [...messages],
    });
    // Get bot response
    const response = completion.data.choices[0].message;
    // Add bot response to messages array
    messages.push(response);
    // Send bot response to Discord
		interaction.reply(response.content);
	} catch (error) {
		console.error(error);
	}
});

async function registerCommands() {
	const commands = [
		{
			name: "ask",
			description: "Ask the bot a question",
			options: [
				{
					name: "prompt",
					description: "The prompt to send to the bot",
					type: 3, // STRING
					required: true,
				},
			],
		},
	];
	try {
		// Set the commands to be registered
		// TODO: replace with applicationCommands when development is complete
		await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
			body: commands,
		});
	} catch (error) {
		console.error(error);
	}
}

registerCommands();

// start the bot
client.login(BOT_TOKEN);
