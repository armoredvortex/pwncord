const {
	SlashCommandBuilder,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	MessageFlagsBitField,
} = require('discord.js');
const { ctfAdmin } = require('../../config.json');
const ctfSchema = require('../../models/ctf.js');
const challSchema = require('../../models/challenge.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('challenge')
		.setDescription('Manage challenges inside a CTF')
		.addSubcommand(sub =>
			sub
				.setName('add')
				.setDescription('Add a challenge to a CTF (opens modal)')
				.addStringOption(opt =>
					opt
						.setName('ctf')
						.setDescription('Select the CTF to add a challenge to')
						.setAutocomplete(true)
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt
						.setName('category')
						.setDescription('Name of the category (e.g. web, crypto) — channel where the challenge will be posted')
						.setRequired(true),
				)
				.addIntegerOption(opt =>
					opt
						.setName('points')
						.setDescription('Points for challenge')
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub
				.setName('delete')
				.setDescription('Delete a challenge from a CTF')
				.addStringOption(opt =>
					opt
						.setName('ctf')
						.setDescription('Select the CTF to delete a challenge from')
						.setAutocomplete(true)
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt
						.setName('name')
						.setDescription('Name of the challenge to delete')
						.setRequired(true),
				),
		),

	async execute(interaction) {
		// permission
		if (!interaction.member.roles.cache.has(ctfAdmin)) {
			return interaction.reply({
				content: '🚫 You are not authorized to use this command!',
				flags: MessageFlagsBitField.Flags.Ephemeral,
			});
		}

		const sub = interaction.options.getSubcommand();
		const ctfName = interaction.options.getString('ctf');
		const categoryName = interaction.options.getString(sub === 'add' ? 'category' : 'name');
		// const points = interaction.options.getString(sub === 'add')

		// we will show modal for add, so don't defer (modal is the first response)
		// only defer for delete
		if (sub === 'delete') await interaction.deferReply();

		try {
			const ctf = await ctfSchema.findOne({ name: ctfName });
			if (!ctf) {
				return interaction.editReply(`❌ Could not find CTF **${ctfName}**.`);
			}

			// Try to get stored guildCategory id in a few common forms:
			let parentCategoryId = null;
			const gid = ctf.guildCategoryId;
			if (!gid) parentCategoryId = null;

			if (gid.startsWith('<#') && gid.endsWith('>')) parentCategoryId = gid.slice(2, -1);
			else parentCategoryId = gid;


			if (!parentCategoryId) {
				return interaction.editReply('⚠️ The parent guild category for this CTF is not set or invalid.');
			}

			const guild = interaction.guild;
			const parentCategory = guild.channels.cache.get(parentCategoryId);
			if (!parentCategory) {
				return interaction.editReply('⚠️ The parent guild category for this CTF no longer exists!');
			}

			// --- OPEN MODAL FOR ADD ---
			if (sub === 'add') {

				const points = interaction.options.getInteger('points');

				// Build modal
				const modal = new ModalBuilder()
					.setCustomId(`addChallenge|${ctf._id.toString()}|${encodeURIComponent(categoryName)}|${points}`)
					.setTitle(`Add Challenge — ${categoryName}`);

				const nameInput = new TextInputBuilder()
					.setCustomId('challengeName')
					.setLabel('Challenge Name (short)')
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMaxLength(100);

				const descInput = new TextInputBuilder()
					.setCustomId('challengeDescription')
					.setLabel('Description')
					.setStyle(TextInputStyle.Paragraph)
					.setRequired(true)
					.setMaxLength(2000);

				const authorInput = new TextInputBuilder()
					.setCustomId('challengeAuthor')
					.setLabel('Author')
					.setStyle(TextInputStyle.Short)
					.setRequired(true);

				const flagInput = new TextInputBuilder()
					.setCustomId('challengeFlag')
					.setLabel('Flag')
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMaxLength(100);

				const urlInput = new TextInputBuilder()
					.setCustomId('challengeURL')
					.setLabel('URL (optional)')
					.setStyle(TextInputStyle.Short)
					.setRequired(false);

				// Discord modals are limited for 5 fields only :(

				// const attachmentUrlInput = new TextInputBuilder()
				// 	.setCustomId('challengeAttachment')
				// 	.setLabel('Attachment URL (optional)')
				// 	.setStyle(TextInputStyle.Short)
				// 	.setRequired(false);

				modal.addComponents(
					new ActionRowBuilder().addComponents(nameInput),
					new ActionRowBuilder().addComponents(descInput),
					new ActionRowBuilder().addComponents(authorInput),
					new ActionRowBuilder().addComponents(flagInput),
					new ActionRowBuilder().addComponents(urlInput),
				);

				// Show modal as the first response (don't editReply before showModal)
				return interaction.showModal(modal);
			}

			// --- DELETE CHALLENGE ---
			else if (sub === 'delete') {
				const existingChannel = guild.channels.cache.find(
					c => c.parentId === parentCategory.id && c.name.toLowerCase() === categoryName.toLowerCase(),
				);
				if (existingChannel) await existingChannel.delete(`Deleted category ${categoryName} from ${ctf.name}`);

				// delete from DB by name + ctf
				await challSchema.deleteOne({ name: categoryName, ctfID: ctf._id });

				const embed = new EmbedBuilder()
					.setTitle('🗑️ Challenge Deleted')
					.setColor(0xff5555)
					.setDescription(`Deleted **${categoryName}** from **${ctf.name}**.`)
					.setFooter({ text: 'pwncord' });

				return interaction.editReply({ embeds: [embed] });
			}
		}
		catch (err) {
			console.error(err);
			return interaction.editReply('❌ Something went wrong while managing challenges.');
		}
	},

	// Autocomplete unchanged, but cleaned
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		try {
			const ctfs = await ctfSchema.find();
			const filtered = ctfs.filter(c =>
				c.name.toLowerCase().includes(String(focusedValue).toLowerCase()),
			);

			await interaction.respond(
				filtered.slice(0, 25).map(c => ({
					name: `${c.name} — ${c._id.toString()}`,
					value: c.name,
				})),
			);
		}
		catch (err) {
			console.error('Autocomplete error:', err);
		}
	},
};
