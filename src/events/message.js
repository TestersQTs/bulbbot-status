const Event = require("../structures/Event");

module.exports = class extends Event {
	constructor(...args) {
		super(...args);
	}

	async run(message) {
		this.client.prefix = process.env.PREFIX;

		const mentionRegex = RegExp(`^<@!?${this.client.user.id}>`);
		if (!message.guild || message.author.bot) return;
		if (message.content.match(mentionRegex)) message.channel.send(`My prefix for **${message.guild.name}** is \`\`${this.client.prefix}\`\``);
		if (!message.content.startsWith(this.client.prefix)) return;

		const [cmd, ...args] = message.content.slice(this.client.prefix.length).trim().split(/ +/g);

		const command = this.client.commands.get(cmd.toLowerCase()) || this.client.commands.get(this.client.aliases.get(cmd.toLowerCase()));
		if (command) {
			const developers = process.env.DEVELOPERS.split(",");
			if (command.devOnly) if (!developers.includes(message.author.id)) return;

			command.run(message, args);
		}
	}
};
