module.exports = class BulbBotUtils {
	constructor(client) {
		this.client = client;
	}

	translate(string, key = {}) {
		let response;
		try {
			response = JSON.parse(JSON.stringify(lang))[string].toString();
		} catch (err) {
			throw new TranslatorException(`${string} is not a valid translatable string`);
		}
	}
};
