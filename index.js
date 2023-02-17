import {
	Client,
	GatewayIntentBits,
	EmbedBuilder,
	Partials,
	time,
} from "discord.js";
import express from "express";
import { chromium } from "playwright"; // Or 'chromium' or 'webkit'.
import { config } from "dotenv";

config();

const app = express();
const port = process.env.PORT || 80;

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
		afk: true,
		status: "idle",
	});

	const debugChannel = client.channels.cache.get("1013035884481892382");

	const startMsg = await debugChannel.send(
		"Bot started on " + time(new Date(), "R")
	);

	startMsg.react("🎉");
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
		powercut: async () => {
			const zone = args.join(" ").trim().toUpperCase();

			if (!zone) return await message.reply("Please provide a zone");

			const msg = await message.reply("Loading...");

			const result = await getPowerCut();

			const embed = new EmbedBuilder().setTitle("Power cut schedule");
			let resp = result.map((i) => ({
				zone: i.loadShedGroupId,
				start: new Date(i.startTime),
				end: new Date(i.endTime),
			}));

			resp = resp.filter((i) => i.zone.trim().toUpperCase() === zone);

			resp.map((i) => {
				embed.addFields([
					{
						name: `**${i.zone}**`,
						value: `Start: ${i.start.toLocaleString()} \nEnd: ${i.end.toLocaleString()}`,
						inline: true,
					},
				]);
			});

			if (resp.length === 0) {
				embed.setDescription("No power cuts for this zone today. Enjoy!");
			}

			msg.edit({ embeds: [embed], content: "" });
		},
	};

	if (commands[command]) {
		commands[command]();
	}
});

async function getPowerCut() {
	const today = new Date();
	const tomorrow = new Date(today);

	return new Promise(async (resolve, reject) => {
		let resp = [];

		const browser = await chromium.launch({});
		const page = await browser.newPage();
		await page.goto("https://cebcare.ceb.lk/Incognito/DemandMgmtSchedule");
		resp = await page.evaluate(`(async () => {
        let resp = await fetch("https://cebcare.ceb.lk/Incognito/GetLoadSheddingEvents", {
  "headers": {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "en-US,en;q=0.9,si;q=0.8",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "requestverificationtoken": document.querySelector(
        "input[name='__RequestVerificationToken']"
    ).value,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    "x-requested-with": "XMLHttpRequest"
  },
  "referrer": "https://cebcare.ceb.lk/Incognito/DemandMgmtSchedule",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": "StartTime=${today.getFullYear()}-${
			today.getMonth() + 1
		}-${today.getDate()}&EndTime=${tomorrow.getFullYear()}-${
			tomorrow.getMonth() + 1
		}-${tomorrow.getDate()}",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
        return await resp.json();
    })();
    `);
		await browser.close();
		resolve(resp);
	});
}
client.login(process.env.TOKEN || "");
