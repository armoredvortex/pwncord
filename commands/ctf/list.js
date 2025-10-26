const { SlashCommandBuilder, EmbedBuilder, MessageFlagsBitField } = require('discord.js');
const { ctfAdmin, fallbackImg } = require('../../config.json');
const ctfSchema = require('../../models/ctf.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Get list of all CTFs'),

	async execute(interaction) {
		if (!interaction.member.roles.cache.has(ctfAdmin)) {
			return interaction.reply({
				content: 'You are not authorized to use this command!',
				flags: MessageFlagsBitField.Flags.Ephemeral,
			});
		}

		await interaction.deferReply(); // only defer after auth check

		try {
			const activeCTFs = await ctfSchema.find({ active: true });
			const inactiveCTFs = await ctfSchema.find({ active: false });

			if (activeCTFs.length === 0 && inactiveCTFs.length === 0) {
				return interaction.editReply({
					content: 'ℹ️ No CTFs found in the database.',
				});
			}

			const activeList = activeCTFs.length
				? activeCTFs.map((ctf, i) => `**${i + 1}.** **${ctf.name}**\n> ID: \`${ctf._id}\``).join('\n')
				: '*None*';

			const inactiveList = inactiveCTFs.length
				? inactiveCTFs.map((ctf, i) => `**${i + 1}.** **${ctf.name}**\n> ID: \`${ctf._id}\``).join('\n')
				: '*None*';

			const embed = new EmbedBuilder()
				.setTitle('CTF List')
				.setDescription('A list of all active and inactive CTFs managed by the bot.')
				.setColor(0x00b0f4)
				.addFields(
					{ name: '🟢 Active CTFs', value: activeList, inline: false },
					{ name: '🔴 Inactive CTFs', value: inactiveList, inline: false },
				)
				.setFooter({ text: `CTF Manager • ${new Date().toLocaleDateString()}` })
				.setThumbnail(fallbackImg);

			await interaction.editReply({ embeds: [embed] });
		} catch (err) {
			console.error(err);
			await interaction.editReply({
				content: 'There was an error fetching CTF data.',
			});
		}
	},
};
