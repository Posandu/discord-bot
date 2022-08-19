import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import express from "express";
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 80;

app.get("/", (req, res) => {
	res.send("Hello World!");
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
	],
});

client.once("ready", () => {
	console.log("Ready!");

	client.user.setActivity("with the code");
});

client.on("messageCreate", async (message) => {
	if (message.author.bot) return;
	if (message.channel.type === "dm") return;
	if (message.content.trim().toLowerCase() == "hi") {
		message.react("👋");
	}
	if (!message.content.startsWith("+")) return;

	const command = message.content.split(" ")[0].slice(1);
	const args = message.content.split(" ").slice(1);

	let commands = {
		ping: () => {
			message.channel.send(`Pong! Latency is ${client.ws.ping}ms.`);
			message.react("🕺");
		},
		help: () => {
			const c = Object.keys(commands);

			const embed = new EmbedBuilder()
				.setTitle("Help")
				.setDescription("This is a list of commands")
				.addFields(
					c.map((command) => ({
						name: command,
						value: `\`+${command}\``,
					}))
				);

			message.channel.send({
				embeds: [embed],
			});
		},
		say: () => {
			const embed = new EmbedBuilder();

			embed
				.setTitle(message.author.username + " says:")
				.setDescription(args.join(" "));

			message.channel.send({
				embeds: [embed],
			});
		},
		match: async () => {
			const users = message.guild.members.cache.filter(
				(member) => !member.user.bot
			);
			const rand = users.random();

			const msg = await message.channel.send(
				`${message.author.username} + ${rand.user.username}`
			);
			msg.react("🙄");
		},
		math: () => {
			const isMath = args.join(" ").match(/[0-9]+[+-/*][0-9]+/);
			if (!isMath) return message.channel.send("Invalid math expression");

			try {
				const result = eval(args.join(" "));
				message.channel.send(`${args.join(" ")} = ${result}`);
			} catch (error) {
				message.channel.send(`Error: ${error}`);
			}
		},
		roll: () => {
			const roll = Math.floor(Math.random() * 6) + 1;
			message.channel.send(`You rolled a ${roll}`);
		},
		luckynumber: () => {
			let number = message.author.discriminator;
			number = Math.round(Math.random() * +number);

			message.channel.send(`Your lucky number is ${number}`);
		},
		play: async () => {
			const users = message.guild.members.cache.filter(
				(member) => member.user.bot === false && member.id !== message.author.id
			);
			const rand = () => users.random();

			const msg = await message.channel.send(
				`Starting play with ${rand().user.username}`
			);
			msg.react("\uD83D\uDE0A");
			msg.react("\uD83D\uDE21");
			msg.react("\uD83D\uDE2D");

			setTimeout(() => {
				msg.reactions.removeAll();

				setTimeout(() => {
					msg.edit(`${rand().user.username} won!`);
				}, 1000);
			}, 4000);
		},
		me: () => {
			const embed = new EmbedBuilder();

			embed.setTitle("About you").setDescription(`
                **Name:** ${message.author.username}
                **ID:** ${message.author.id}
                **Discriminator:** ${message.author.discriminator}
            `);

			message.channel.send({
				embeds: [embed],
			});
		},
		die: async () => {
			const msg = await message.reply(`Ok I will die in 5`);
			setTimeout(() => {
				msg.edit(`Ok I will die in 4`);
				setTimeout(() => {
					msg.edit(`Ok I will die in 3`);
					setTimeout(() => {
						msg.edit(`Ok I will die in 2`);
						setTimeout(() => {
							msg.edit(`Ok I will die in 1`);
							setTimeout(() => {
								msg.edit(`Ok I will die now`);

								message.react("😛");
								message.react("😂");

								msg.delete();

								message.channel.send(
									"Haha fooled you " + message.author.toString()
								);
							}, 1000);
						}, 1000);
					}, 1000);
				}, 1000);
			}, 1000);
		},
		findme: async () => {
			const msg = await message.reply(`Hmm, I'm looking for you`);

			const result = await fetch(
				`https://random-data-api.com/api/address/random_address`
			);
			const json = await result.json();

			msg.edit(
				"I found your mum's address: \n" +
				json.mail_box +
				"\n" +
				json.street_address +
				"\n" +
				json.city +
				"\n" +
				json.zip +
				"\n"
			);
		},
	};

	if (commands[command]) {
		commands[command]();
	}
});

client.login(process.env.TOKEN || "");
