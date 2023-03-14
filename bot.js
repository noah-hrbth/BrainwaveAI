require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const { Client, MessageEmbed } = require("discord.js");
const { Routes } = require("discord-api-types/v9");
const { REST } = require("@discordjs/rest");
const fs = require("fs");

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

const BOTS_FILE = "./bots.json";
// safe all bot instances in a map
const bots = new Map();

class Brainwave {
	constructor(openai) {
		this.openai = openai;
		this.messages = [];
		// add botname to messages array so the bot knows its name
		this.messages.push({
			role: "assistant",
			content:
				"My name is Brainwave. I'm a bot that uses OpenAI's GPT-3 API to answer questions and generate code and images.",
		});
	}

	async createImage(prompt, size) {
		const completion = await this.openai.createImage({
			prompt: prompt,
			n: 1,
			size: size,
		});
		return completion;
	}

	async createChatCompletion(prompt, command) {
		this.messages.push({
			role: "user",
			content:
				command === "code"
					? `This is a coding related question! ${prompt}`
					: prompt,
		});

		// Send request with all messages (also prev) to OpenAI API
		const completion = await openai
			.createChatCompletion({
				model: "gpt-3.5-turbo",
				messages: [...this.messages],
			})
			.catch(async (error) => {
				console.error(error);
				await interaction.editReply(
					`> ${user} creates: **${prompt}**\n\nI'm sorry! There was an error or timeout while executing this command!`
				);
			});
		return completion;
	}
}

// read bots.json file
if (fs?.existsSync(BOTS_FILE)) {
	const file = fs.readFileSync(BOTS_FILE);
	const data = JSON.parse(file);
	// create bot instances for each user
	for (const [userId, messages] of Object.entries(data)) {
		const brainwave = new Brainwave(openai);
		brainwave.messages = messages;
		bots.set(userId, brainwave);
	}
}

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;
	const command = interaction.commandName;
	const user = interaction.user;
	const userId = interaction.user.id;
	// get bot instance for user
	let brainwave = bots.get(userId);
	// if no bot instance exists, create one
	if (!brainwave) {
		brainwave = new Brainwave(openai);
		bots.set(userId, brainwave);
	}

	if (command === "image") {
		try {
			const prompt = interaction.options.getString("prompt").trim();
			const size = interaction.options.getString("size") ?? "512x512";

			// defer reply to show loading state and to handle longer responses (avoid 3s timeout)
			await interaction.deferReply();

			// Send request to OpenAI API
			const completion = await brainwave.createImage(prompt, size);
			// Get bot response
			const response = completion.data.data[0].url;
			// create embeded image
			const embed = new MessageEmbed() // used embed to show image in full size and to late be able to add more images
				.setTitle("Show in full size")
				.setImage(response)
				.setURL(response);
			// Send bot response to Discord
			await interaction.editReply({
				content: `> ${user} creates: **${prompt}**`,
				embeds: [embed],
			});
		} catch (error) {
			console.error(error);
			await interaction.editReply(
				`> ${user} creates: **${prompt}**\n\nI'm sorry! There was an error or timeout while executing this command!`
			);
		}
	} else {
		try {
			// defer reply to show loading state and to handle longer responses (avoid 3s timeout)
			await interaction.deferReply();

			// Get user input
			const prompt = interaction.options.getString("prompt").trim();

			// Get bot response
			const completion = await brainwave.createChatCompletion(prompt, command);
			const response = completion.data.choices[0].message;
			// Add bot response to messages array
			brainwave.messages.push(response);
			saveBots();

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
		{
			name: "image",
			description:
				"Ask the bot to generate an image (at the moment, creating variations of images is not supported)",
			options: [
				optionsObject,
				{
					name: "size",
					description: "The size of the image",
					type: 3, // STRING
					choices: [
						{
							name: "large",
							value: "1024x1024",
						},
						{
							name: "medium (default)",
							value: "512x512",
						},
						{
							name: "small",
							value: "256x256",
						},
					],
					required: false,
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

function saveBots() {
	const botsData = {};
	bots.forEach((bot, key) => {
		botsData[key] = bot.messages;
	});
	fs.writeFileSync(BOTS_FILE, JSON.stringify(botsData, null, 2));
}

// function deleteBots() {
//   setInterval(() => {
//     console.log("Deleting bots...");
//   }, 1000);
// }

// start the bot
client.login(BOT_TOKEN).catch((error) => {
	console.error(error);
});
