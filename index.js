import { Client, GatewayIntentBits, EmbedBuilder, Partials, AttachmentBuilder, time, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes } from "discord.js";
import express from "express";
import fetch from 'node-fetch';
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { request } from "undici";

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
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once("ready", async () => {
	console.log("Ready!");

	let i = 0;

	client.user.setPresence({
		activities: [{
			name: "Just woke up"
		}],
		status: "online"
	})

	setInterval(() => {
		let stuff = "with your mom,with daddy,with code,with Twitter,with bed".split(",")

		client.user.setPresence({
			activities: [{ name: stuff[i % 5] }]
		});

		i++;
	}, 40000)

	const debugChannel = client.channels.cache.get("1013035884481892382");

	const startMsg = await debugChannel.send("Bot started on " + time(new Date(), "R"))



	startMsg.react("🎉")

	app.get("/a", async (req, res) => {
		debugChannel.send("opened /a");
	});
});

client.on("messageCreate", async (message) => {
	if (message.author.bot) return;
	if (message.content.startsWith("___dev")) {
		if (message.author.id !== "961161387101536296") return message.channel.send(message.author.toString() + " You have no perms to run this!!!");

		const id = (Math.random() + Date()).replace(/[^a-zA-z0-9]/, "");

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('primary')
					.setLabel('Click me!')
					.setStyle(ButtonStyle.Primary),
			);

		await message.reply({ content: 'I think you should,', components: [row] });

		return;
	}
	if (message.content.trim().toLowerCase() == "hi") {
		message.react("👋");
	}
	if (message.content.trim().toLowerCase() == "ok") {
		message.react("🆗");
	}
	if (message.content.startsWith("secretSay")) {
		const channel = message.channel.send(message.content.replace("secretSay", ""));
		message.delete();
	}
	//

	if (!message.content.startsWith("+")) return;
	const command = message.content.split(" ")[0].slice(1);
	const args = message.content.split(" ").slice(1) || "";

	let commands = {
		ping: async () => {
			const msg = await message.channel.send(`Pong! Latency is ${client.ws.ping}ms.`);
			let i = 0;
			message.react("🕺");
			const intrvl = setInterval(() => {
				msg.edit(`Pong! Latency is ${client.ws.ping}ms. [${++i}]`);
			}, 1000);
			setTimeout(() => { clearInterval(intrvl) }, 6000);
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
			message.channel.send({
				content: [...args].join(" ") || "no message :(",
				allowedMentions: { users: ['123456789012345678'], roles: ['102938475665748392'] },
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
				`Wait..`
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
				`I found your mum's address: \n${json.mail_box}\n${json.street_address}\n${json.city}\n${json.zip}\n`
			);
		},
		crypto: async () => {
			const msg = await message.channel.send("Loading...");

			const result = await fetch(
				`https://cryptingup.com/api/markets`
			);
			const json = await result.json();

			json.markets = [...new Map(json.markets.map(item =>
				[item["base_asset"], item])).values()];

			json.markets.length = 15;

			const embed = new EmbedBuilder()
				.setTitle('Crypto prices');


			json.markets.map((coin) => {
				embed.addFields([
					{ name: `**${coin.base_asset}**`, value: ` *${parseFloat(coin.price).toFixed(8)}*$ ${parseInt(coin.change_24h) < 0 ? "🔻" : "🟢"} ${parseFloat(coin.change_24h).toFixed(2)}`, inline: true }
				])
			})

			msg.edit({ embeds: [embed], content: "" })

		},
		makeup: async () => {
			const afgd = message.channel;

			const canvas = createCanvas(300, 320)
			const ctx = canvas.getContext('2d')

			ctx.lineWidth = 10
			ctx.strokeStyle = '#03a9f4'
			ctx.fillStyle = '#03a9f4'

			// Wall
			ctx.strokeRect(75, 140, 150, 110)

			// Door
			ctx.fillRect(130, 190, 40, 60)

			// Roof
			ctx.beginPath()
			ctx.moveTo(50, 140)
			ctx.lineTo(150, 60)
			ctx.lineTo(250, 140)
			ctx.closePath()
			ctx.stroke()

			const { body } = await request(message.author.displayAvatarURL({ extension: 'jpg' }));
			const avatar = await loadImage(await body.arrayBuffer());

			// If you don't care about the performance of HTTP requests, you can instead load the avatar using
			// const avatar = await Canvas.loadImage(interaction.user.displayAvatarURL({ extension: 'jpg' }));

			// Draw a shape onto the main canvas
			ctx.drawImage(avatar, 25, 0, 200, canvas.height);

			const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });

			afgd.send({ files: [attachment] });

		}
	};

	if (commands[command]) {
		commands[command]();
	}

	const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
	await rest.put(Routes.applicationCommands(client.user.id), {
		body: [
			{
				name: 'ping',
				description: 'yes'
			}
		]
	});
});

client.on('interactionCreate', interaction => {
	interaction.reply("Ok");
	if (!interaction.isButton()) return;
	interaction.message.delete()
});

client.login(process.env.TOKEN || "");
