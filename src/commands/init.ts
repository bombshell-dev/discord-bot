import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { InteractionResponseType, InteractionType, ButtonStyle } from "discord-api-types/v10";
import type { Command } from "../types.ts";
import type { InteractionClient } from "../discordClient.ts";
import { getConfigDurableObject, isUserAdmin, getGuildId } from "../utils/configUtils.ts";
import { getDefaultEmbed } from "../utils/embeds.ts";

const InitCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("init")
    .setDescription("Set up the GitHub integration for this server"),

  async execute(client: InteractionClient<InteractionType.ApplicationCommand, any>): Promise<Response> {
    const interaction = client.interaction;
    const guildId = getGuildId(interaction);

    // Check if command is used in a guild
    if (!guildId) {
      return client.reply({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "⚠️ This command can only be used in a server, not in DMs.",
          flags: 64, // Ephemeral
        },
      });
    }

    // Check admin permissions
    if (!isUserAdmin(interaction)) {
      return client.reply({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "⚠️ You need Administrator or Manage Server permissions to initialize GitHub integration.",
          flags: 64,
        },
      });
    }

    const configDO = getConfigDurableObject(client.env);
    const guildConfig = await configDO.getGuildConfig(guildId);

    const embed = getDefaultEmbed()
      .setTitle("🚀 GitHub Integration Setup")
      .setDescription(
        "Welcome! To get the most out of this bot, you'll need to install the GitHub App.\n\n" +
        "**What you'll get:**\n" +
        "• Use `/ptal` to share pull request summaries\n" +
        "• Automatic PR status updates\n" +
        "• Rich PR embeds with review information\n\n" +
        "Click the button below to install the GitHub App for your organization or repositories."
      );

    if (guildConfig?.githubAppInstalled) {
      embed.addFields({
        name: "✅ Status",
        value: "GitHub App is already configured for this server!",
      });
    }

    if (guildConfig?.defaultRepository) {
      embed.addFields({
        name: "📦 Default Repository",
        value: `\`${guildConfig.defaultRepository}\`\n\nUse \`/config set-default-repo\` to change it.`,
      });
    } else {
      embed.addFields({
        name: "💡 Tip",
        value: "After installing the app, use `/config set-default-repo` to set a default repository for this server!",
      });
    }

    // Create action row with install button
    // Note: You'll need to replace this URL with your actual GitHub App installation URL
    const githubAppInstallUrl = `https://github.com/apps/YOUR_GITHUB_APP_NAME/installations/new`;

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Install GitHub App")
        .setStyle(ButtonStyle.Link)
        .setURL(githubAppInstallUrl)
        .setEmoji({ name: "📱" })
    );

    return client.reply({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [embed.toJSON()],
        components: [row.toJSON()],
      },
    });
  },

  async button(client: InteractionClient<InteractionType.MessageComponent, any>): Promise<Response> {
    const interaction = client.interaction;
    const customId = interaction.data.custom_id;

    if (customId === "mark-installed") {
      const guildId = getGuildId(interaction);

      if (!guildId) {
        return client.reply({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "⚠️ Could not determine server ID.",
            flags: 64,
          },
        });
      }

      const configDO = getConfigDurableObject(client.env);
      await configDO.markGitHubAppInstalled(guildId);

      return client.reply({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "✅ GitHub App marked as installed for this server!",
          flags: 64,
        },
      });
    }

    return client.reply({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "⚠️ Unknown button interaction.",
        flags: 64,
      },
    });
  },
};

export default InitCommand;
