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
import crypto from "crypto";

config();

const app = express();
const port = process.env.PORT || 80;
const OWNER_ID = "961161387101536296";

app.get("/", (req, res) => {
	//hash the process.env
	const hash = crypto
		.createHash("sha256")
		.update(JSON.stringify(process.env) + "salt")
		.digest("hex");

	//send content type to javascript
	res.setHeader("Content-Type", "text/javascript");
	res.send(`___ = typeof ___ === "undefined" ? {} : ___; ___["${hash}"] = true;`);
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});

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

const addVistor = async (url) => {
	const statChannel = client.channels.cache.get("1106932219068567646");
	const msgId = "1106933269758480465";

	const msg = await statChannel.messages.fetch(msgId);

	//format:
	// `url`: `visitors`
	let content = msg.content.trim();

	try {
		content = JSON.parse(content);
	} catch (error) {
		content = {};
	}

	if (url) {
		if (!content[url]) content[url] = 0;
		content[url]++;
	}

	const embed = new EmbedBuilder()
		.setTitle("Stats")
		.setDescription(
			Object.keys(content)
				.map((x) => `\`${x}\`: \`${content[x]}\``)
				.join("\n") || "No visitors :("
		)

		.setColor(((Math.random() * 0xffffff) << 0).toString(16));

	//sort by most visitors
	content = Object.fromEntries(
		Object.entries(content).sort(([, a], [, b]) => b - a)
	);

	await msg.edit({
		content: JSON.stringify(content),
		embeds: [embed],
	});
}

app.post("/_/uwu", async (req, res) => {
	const url = req.query.url;

	if (!url) return res.status(400).send("No url provided");

	await addVistor(url);

	//disable cors
	res.setHeader("Access-Control-Allow-Origin", "*");
	
	res.status(400).jsonp("What was that supposed to mean?");
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

	await addVistor();
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
					`**Latency:** ${msg.createdTimestamp - message.createdTimestamp
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
				.setTitle(meme.title + " " + subreddit)
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
		}
	};

	async function execute() {
		await commands[command]();
	}

	if (commands[command]) {
		if (command === "devMode" && message.author.id == OWNER_ID) {
			await execute();
			return;
		}

		if (devMode) return;
		await execute();
	}
});

app.get("/servers", (req, res) => {
	res.send({
		servers: client.guilds.cache.map((guild) => ({
			name: guild.name,
			id: guild.id,
			members: guild.members.cache,
		})),
	});
})

app.get("/u:userId", async (req, res) => {
	const user = await client.users.fetch(req.params.userId);

	res.send({
		user
	});
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


app.get("/*", (req, res) => {
	res.send(`
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css">

		<br>

		<title>404</title>

		<div class="container">
			<div class="row">
				<div class="column column-50 column-offset-25">
					<h1>${"Oops,uh oh,oh no,:(,🥹,omg".split(",")[Math.floor(Math.random() * 6)]}</h1>
					<p>${"You've found a secret page!".split("").map(x => Math.random() > 0.5 ? x.toUpperCase() : x.toLowerCase()).join("")}</p>

					<pre>
						<code>Please wait a few seconds while we redirect you to a safe page...</code>
					</pre>
				</div>
			</div>

			<script>
				setTimeout(() => {
					window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
				}, 5000);
			</script>
		</div>

	`)
});
