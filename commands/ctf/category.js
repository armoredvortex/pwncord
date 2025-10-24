const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
	EmbedBuilder,
	MessageFlagsBitField,
} = require('discord.js');
const { ctfAdmin } = require('../../config.json');
const ctfSchema = require('../../models/ctf.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('category')
		.setDescription('Manage categories inside a CTF')
		.addSubcommand(sub =>
			sub
				.setName('add')
				.setDescription('Add a category to a CTF')
				.addStringOption(opt =>
					opt
						.setName('ctf')
						.setDescription('Select the CTF to add a category to')
						.setAutocomplete(true)
						.setRequired(true)
				)
				.addStringOption(opt =>
					opt
						.setName('name')
						.setDescription('Name of the category (e.g. Web, Crypto)')
						.setRequired(true)
				)
		)
		.addSubcommand(sub =>
			sub
				.setName('delete')
				.setDescription('Delete a category from a CTF')
				.addStringOption(opt =>
					opt
						.setName('ctf')
						.setDescription('Select the CTF to delete a category from')
						.setAutocomplete(true)
						.setRequired(true)
				)
				.addStringOption(opt =>
					opt
						.setName('name')
						.setDescription('Name of the category to delete')
						.setRequired(true)
				)
		),

	async execute(interaction) {
		// Permission check
		if (!interaction.member.roles.cache.has(ctfAdmin)) {
			return interaction.reply({
				content: '🚫 You are not authorized to use this command!',
				flags: MessageFlagsBitField.Flags.Ephemeral,
			});
		}

		const sub = interaction.options.getSubcommand();
		const ctfName = interaction.options.getString('ctf');
		const categoryName = interaction.options.getString('name');

		await interaction.deferReply({ ephemeral: true });

		try {
			const ctf = await ctfSchema.findOne({ name: ctfName });
			if (!ctf) {
				return interaction.editReply(`❌ Could not find CTF **${ctfName}**.`);
			}

			const guild = interaction.guild;
			const parentCategory = guild.channels.cache.get(ctf.guildCategoryId);
			if (!parentCategory) {
				return interaction.editReply('⚠️ The parent guild category for this CTF no longer exists!');
			}

			// Add Category
			if (sub === 'add') {
				// Prevent duplicates
				if (ctf.categories.includes(categoryName)) {
					return interaction.editReply(`⚠️ Category **${categoryName}** already exists in this CTF!`);
				}

				const newChannel = await guild.channels.create({
					name: categoryName.toLowerCase(),
					type: ChannelType.GuildText,
					parent: parentCategory.id,
					reason: `Added category ${categoryName} to CTF ${ctf.name}`,
				});

				ctf.categories.push(categoryName);
				await ctf.save();

				const embed = new EmbedBuilder()
					.setTitle('📁 Category Added')
					.setColor(0x00ff99)
					.setDescription(
						`Added **${categoryName}** to **${ctf.name}**.\n` +
						`🗂️ Channel: ${newChannel}`
					)
					.setFooter({ text: 'CTF Manager Bot' });

				return interaction.editReply({ embeds: [embed] });
			}

			// Delete Category
			else if (sub === 'delete') {
				if (!ctf.categories.includes(categoryName)) {
					return interaction.editReply(`⚠️ Category **${categoryName}** not found in this CTF.`);
				}

				// Find and delete corresponding channel
				const existingChannel = guild.channels.cache.find(
					c => c.parentId === parentCategory.id && c.name.toLowerCase() === categoryName.toLowerCase()
				);
				if (existingChannel) await existingChannel.delete(`Deleted category ${categoryName} from ${ctf.name}`);

				ctf.categories = ctf.categories.filter(c => c !== categoryName);
				await ctf.save();

				const embed = new EmbedBuilder()
					.setTitle('🗑️ Category Deleted')
					.setColor(0xff5555)
					.setDescription(`Deleted **${categoryName}** from **${ctf.name}**.`)
					.setFooter({ text: 'CTF Manager Bot' });

				return interaction.editReply({ embeds: [embed] });
			}
		} catch (err) {
			console.error(err);
			return interaction.editReply('❌ Something went wrong while managing categories.');
		}
	},

	// 🔮 Autocomplete handler
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		try {
			const ctfs = await ctfSchema.find();
			const filtered = ctfs.filter(c =>
				c.name.toLowerCase().includes(focusedValue.toLowerCase())
			);

			await interaction.respond(
				filtered.slice(0, 25).map(c => ({
					name: `${c.name} — ${c._id.toString().slice(-5)}`, // small suffix for uniqueness
					value: c.name,
				}))
			);
		} catch (err) {
			console.error('Autocomplete error:', err);
		}
	},
};
