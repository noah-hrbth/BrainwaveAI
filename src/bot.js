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
// add botname to messages array so the bot knows its name
messages.push({
	role: "assistant",
	content:
		"My name is Brainwave. I'm a bot that uses OpenAI's GPT-3 API to answer questions and generate code and images.",
});
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;

	try {
		const command = interaction.commandName;
		const user = interaction.user;
		// defer reply to show loading state and to handle longer responses (avoid 3s timeout)
		await interaction.deferReply();

		// Get user input
		const prompt = interaction.options.getString("prompt").trim();
		// Add user input to messages array
		messages.push({
			role: "user",
			content:
				command === "code"
					? `This is a coding related question! ${prompt}`
					: prompt,
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
		await interaction.editReply(
			`> ${user} asked: **${prompt}**\n\n${response.content.trim()}`
		);
	} catch (error) {
		console.error(error);
		await interaction.editReply(
			`> ${user} asked: **${prompt}**\n\nI'm sorry! There was an error or timeout while executing this command!`
		);
	}
});

async function registerCommands() {
	const optionsObject = {
		name: "prompt",
		description: "The prompt to send to the bot",
		type: 3, // STRING
		required: true,
	};
	const commands = [
		{
			name: "ask",
			description: "Ask the bot a question",
			options: [optionsObject],
		},
		{
			name: "code",
			description: "Ask the bot to generate code",
			options: [optionsObject],
		},
		// {
		// 	name: "image",
		// 	description: "Ask the bot to generate an image",
		// 	options: [optionsObject],
		// },
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
