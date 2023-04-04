import {
	Client,
	GatewayIntentBits,
	EmbedBuilder,
	Partials,
	time,
} from "discord.js";
import express from "express";
import { config } from "dotenv";
import fs from "fs";
import fetch from "node-fetch";

config();

const app = express();
const port = process.env.PORT || 80;
const OWNER_ID = "961161387101536296";

app.get("/", (req, res) => {
	res.send("Hello World!");
});

app.listen(port, () => {});

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.GuildMessageReactions,
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once("ready", async () => {
	console.log("Ready!");

	client.user.setPresence({
		status: "online",
	});

	const debugChannel = client.channels.cache.get("1078716206703448176");

	const startMsg = await debugChannel.send(
		"Bot started on " + time(new Date(), "R")
	);

	startMsg.react("🎉");
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isButton()) {
		if (interaction.customId === "create__channel") {
			const thread = await interaction.guild.channels.cache
				.get("1079023549798432909")
				.threads.create({
					name: "test",
					autoArchiveDuration: 60,
					reason: "test",
				});

			interaction.reply({
				content: `Created thread!`,
				ephemeral: true,
			});

			if (thread.joinable) {
				thread.join();

				thread.send({
					content: `${interaction.user} joined the thread!`,
				});
			}
		}
	}
});

client.on("messageCreate", async (message) => {
	if (message.author.bot) return;
	if (!message.content.startsWith("+")) return;

	const command = message.content.split(" ")[0].slice(1);
	const args = message.content.split(" ").slice(1) || "";

	let commands = {
		ping: async () => {
			const msg = await message.reply("Pinging...");

			const embed = new EmbedBuilder()
				.setTitle("Pong!")
				.setDescription(
					`**Latency:** ${
						msg.createdTimestamp - message.createdTimestamp
					}ms\n**API Latency:** ${Math.round(client.ws.ping)}ms`
				)
				.setColor(((Math.random() * 0xffffff) << 0).toString(16));

			msg.edit({
				content: null,
				embeds: [embed],
			});
		},
		help: () => {
			const c = Object.keys(commands);

			message.reply(`**Commands:**\n${c.map((x) => `\`+${x}\``).join(", ")}`);
		},
		say: () => {
			message.channel.send({
				content: [...args].join(" ") || "no message :(",
				allowedMentions: {
					users: [message.author.id],
					roles: [],
				},
			});
		},
		math: () => {
			const isMath = args.join(" ").match(/[0-9]+[+-/*][0-9]+/);
			if (!isMath) return message.reply("Invalid math expression");

			try {
				const result = eval(args.join(" "));
				message.reply(`${args.join(" ")} = ${result}`);
			} catch (error) {
				message.reply(`Error: ${error}`);
			}
		},
		roll: () => {
			const roll = Math.floor(Math.random() * 6) + 1;
			message.reply(`You rolled a ${roll}`);
		},
		rand: () => {
			let number = message.author.discriminator;
			number = Math.round(Math.random() * +number);

			message.reply(`Your random number is ${number}`);
		},
		save: async () => {
			const data = args.join(" ");

			// If no data is provided, return
			if (!data) return message.reply("No data provided");

			// If the data is too long, return
			if (data.length > 69)
				return message.reply("Data must be less than 69 characters");

			// Save data
			await saveData({
				userData: {
					...((await getData()).userData || {}),
					[message.author.id]: data,
				},
			});

			message.reply("Data saved!");
		},
		get: async () => {
			const data = (await getData()).userData;

			// If no data is found for the user, return
			if (!data[message.author.id])
				return message.reply("No data found for you");

			message.reply({
				content: ``,
				embeds: [
					new EmbedBuilder()
						.setTitle("Your data")
						.setDescription(data[message.author.id])
						.setColor(((Math.random() * 0xffffff) << 0).toString(16)),
				],
			});
		},
		save: async () => {
			const text = args.join(" ");
			const user = message.mentions.users.first();
			const amount =
				parseInt(
					text?.match(/[0-9]+/) ? text?.match(/[0-9]+/)[0] : "100" || "100"
				) || 100;

			const messages = await message.channel.fetch({
				limit: amount,
			});

			const data = await messages.awaitMessages({
				filter: (m) => m.author.id === user.id,
				time: 1000 * 60 * 5,
			});

			console.log(data);
		},
		meme: async () => {
			const subreddits = ["dankmemes", "memes", "meirl", "me_irl", "funny"];
			const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];

			const data = await fetch(
				`https://api.reddit.com/r/${subreddit}/random`
			).then((res) => res.json());

			const meme = data[0].data.children[0].data;

			const embed = new EmbedBuilder()
				.setTitle(meme.title+" "+subreddit)
				.setURL(`https://reddit.com${meme.permalink}`)
				.setImage(meme.url);

			message.reply({ 
				embeds: [embed],
			});
		},
		devMode: async () => {
			if (!process.env.PROD) return;

			if (message.author.id !== OWNER_ID) return;

			globalThis.devMode = !globalThis.devMode;

			await saveData({
				...((await getData()) || {}),
				devMode: globalThis.devMode,
			});

			message.reply(`Dev mode is now ${devMode ? "on" : "off"}`);

			if (devMode) {
				// Set client status to dev mode
				client.user.setPresence({
					afk: true,
					status: "idle",
				});
			} else {
				// Set client status to normal
				client.user.setPresence({
					afk: false,
					status: "online",
				});
			}
		},
	};

	if (commands[command]) {
		if (command === "devMode" && message.author.id == OWNER_ID) {
			commands[command]();
			return;
		}

		if (devMode) return;

		commands[command]();
	}
});

const DEFAULT_DATA = {
	devMode: false,
	userData: {},
};

const DATA_PATH = "./data.json";

async function fileExists() {
	// Check if file exists
	const file = await fs.promises
		.access(DATA_PATH)
		.then(() => true)
		.catch(() => false);

	return file;
}

async function createFile() {
	// Create file
	await fs.promises.writeFile(DATA_PATH, JSON.stringify(DEFAULT_DATA));

	return true;
}

async function saveData(data) {
	if (!data) return false;

	// Check if file exists
	const file = await fileExists();

	// If file doesn't exist, create it
	if (!file) await createFile();

	// Write data to file
	await fs.promises.writeFile(DATA_PATH, JSON.stringify(data));
}

async function getData() {
	// Check if file exists
	const file = await fileExists();

	// If file doesn't exist, create it
	if (!file) await createFile();

	// Read data from file
	const data = await fs.promises.readFile(DATA_PATH, "utf8");

	return JSON.parse(data) || DEFAULT_DATA;
}

(async () => {
	globalThis.devMode = (await getData()).devMode;
	console.log("DEV MODE: " + devMode);
})();

client.login(process.env.TOKEN);
