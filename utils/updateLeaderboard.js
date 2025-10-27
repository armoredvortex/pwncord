const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ctfSchema = require('../models/ctf.js');

module.exports = async function updateLeaderboard(client, ctfId) {
	const ctf = await ctfSchema.findById(ctfId);
	if (!ctf) throw new Error('CTF not found');
	if (!ctf.scoreboardId || !ctf.scoreboardMessageId) return;

	// --- Prepare leaderboard data ---
	const leaderboard = Object.entries(Object.fromEntries(ctf.leaderboard || new Map()))
		.sort(([, a], [, b]) => b - a);

	// Split leaderboard into pages of 10 players
	const PAGE_SIZE = 10;
	const totalPages = Math.ceil(leaderboard.length / PAGE_SIZE) || 1;

	// Helper: Build embed for a specific page
	const buildEmbed = (page = 0) => {
		const start = page * PAGE_SIZE;
		const pageEntries = leaderboard.slice(start, start + PAGE_SIZE);
		const embed = new EmbedBuilder()
			.setTitle(`${ctf.name} — Scoreboard`)
			.setDescription(ctf.description || '')
			.setThumbnail(ctf.imageURL || null)
			.setColor(0x00b0f4)
			.setTimestamp();

		if (pageEntries.length === 0) {
			embed.addFields({ name: 'Top Players', value: '*No solves yet*' });
		}
		else {
			const formatted = pageEntries
				.map(([id, score], i) => {
					const rank = start + i + 1;
					return `**#${rank}** <@${id}> — ${score} pts`;
				})
				.join('\n');
			embed.addFields({ name: `Top Players (Page ${page + 1}/${totalPages})`, value: formatted });
		}

		return embed;
	};

	// Pagination buttons
	const getButtons = (page) => {
		return new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('first')
				.setEmoji('⏮️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(page === 0),
			new ButtonBuilder()
				.setCustomId('prev')
				.setEmoji('⬅️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(page === 0),
			new ButtonBuilder()
				.setCustomId('next')
				.setEmoji('➡️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(page === totalPages - 1),
			new ButtonBuilder()
				.setCustomId('last')
				.setEmoji('⏭️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(page === totalPages - 1),
		);
	};

	try {
		const channel = await client.channels.fetch(ctf.scoreboardId.replace(/[<#>]/g, ''));
		const message = await channel.messages.fetch(ctf.scoreboardMessageId);

		let currentPage = 0;
		const embed = buildEmbed(currentPage);
		const buttons = getButtons(currentPage);

		// Edit existing scoreboard message
		await message.edit({ embeds: [embed], components: [buttons] });

		// --- Pagination interaction collector ---
		const collector = message.createMessageComponentCollector({
			time: 5 * 60 * 1000,
		});

		collector.on('collect', async (i) => {
			// Ignore other users (optional)
			if (i.user.id !== i.client.user.id) await i.deferUpdate();

			if (i.customId === 'first') currentPage = 0;
			if (i.customId === 'prev' && currentPage > 0) currentPage--;
			if (i.customId === 'next' && currentPage < totalPages - 1) currentPage++;
			if (i.customId === 'last') currentPage = totalPages - 1;

			const updatedEmbed = buildEmbed(currentPage);
			const updatedButtons = getButtons(currentPage);
			await i.message.edit({ embeds: [updatedEmbed], components: [updatedButtons] });
		});

		collector.on('end', async () => {
			// Disable all buttons after timeout
			const disabledRow = getButtons(currentPage);
			disabledRow.components.forEach((btn) => btn.setDisabled(true));
			await message.edit({ components: [disabledRow] });
		});
	}
	catch (err) {
		console.error('Leaderboard update failed:', err);
	}
};
