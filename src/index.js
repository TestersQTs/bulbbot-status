const BulbBotClient = require("./structures/BulbBotClient");
const { config } = require("dotenv");
const cron = require("node-cron");
const axios = require("axios");
const fs = require("fs");
const Discord = require("discord.js");
const moment = require("moment");

config({
	path: `./src/.env`,
});

const constant = {
	token: process.env.TOKEN,
	prefix: process.env.PREFIX,
	defaultPerms: ["SEND_MESSAGES", "VIEW_CHANNEL"],
	clearance: "0",
};

const client = new BulbBotClient(constant);

client.login().catch(err => console.log("Client connection error: ", err));

// Run this every 30 seconds
cron.schedule("*/30 * * * * *", async () => {
	await axios.get(process.env.API_INCIDENTS).then(resp => {
		fs.writeFileSync("src/incidentsNEW.json", JSON.stringify(resp.data, null, 2));
	});

	const rawdataNEW = fs.readFileSync("src/incidentsNEW.json");
	const dataNEW = JSON.parse(rawdataNEW);

	const rawdataOLD = fs.readFileSync("src/incidentsOLD.json");
	const dataOLD = JSON.parse(rawdataOLD);

	if (dataNEW.incidents[0] === undefined) return;

	if (dataNEW.incidents[0].incident_updates[0].id !== dataOLD.incidents[0].incident_updates[0].id) {
		console.log("[!] NEW INCIDENT");

		// SEND EMBED
		const inci = dataNEW.incidents[0];
		let msg = `**Impact:** ${inci.impact}\n`;
		msg += `\n**Latest incident update**\n`;

		inci.incident_updates.forEach(inc => {
			let status = inc.status;
			switch (status) {
				case "investigating":
					status = ":detective:";
					break;
				case "identified":
					status = ":bulb:";
					break;
				case "monitoring":
					status = ":bar_chart:";
					break;
				case "resolved":
					status = ":tada:";
					break;

				default:
					break;
			}

			msg += `\`\`[${moment(inc.updated_at).format("MMMM Do YYYY, h:mm:ss a")}]\`\`\n${status} ${inc.body}\n\n`;
		});

		let eColor = process.env.EMBED_COLOR;
		switch (inci.impact) {
			case "none":
				eColor = "#2DCCFF";
				break;
			case "minor":
				eColor = "#FCE83A";
				break;
			case "major":
				eColor = "#FFB302";
				break;
			case "critical":
				eColor = "#FF3838";
				break;

			default:
				break;
		}

		const embed = new Discord.MessageEmbed()
			.setColor(eColor)
			.setTitle(`${inci.name} - ${inci.status}`)
			.setAuthor(`Last updated ${moment(inci.updated_at).format("MMMM Do YYYY, h:mm:ss a")}`)
			.setURL(inci.shortlink)
			.setDescription(msg)
			.setTimestamp();

		client.channels.cache
			.get(process.env.POSTING_CHANNEL)
			.send(embed)
			.then(msg => msg.crosspost());

		// UPDATE FILES
		fs.unlinkSync("src/incidentsOLD.json");
		fs.renameSync("src/incidentsNEW.json", "src/incidentsOLD.json");
	}
});
