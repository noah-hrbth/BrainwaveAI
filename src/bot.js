require("dotenv").config();
const { Client } = require("discord.js");
const client = new Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (msg) => {
  console.log('Message received: ' + msg.author.username + ': ' + msg.content);
});

client.login(process.env.BOT_TOKEN);
