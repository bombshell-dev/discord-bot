import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { InteractionResponseType, InteractionType } from "discord-api-types/v10";
import type { Command, Env } from "../types.ts";
import type { InteractionClient } from "../discordClient.ts";
import { getStringOption, getBooleanOption } from "../utils/discordUtils.ts";
import { getConfigDurableObject, isUserAdmin, getGuildId, getChannelId } from "../utils/configUtils.ts";

const ConfigCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure bot settings for this server")
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
      subcommand
        .setName("view")
        .setDescription("View current configuration for this server or channel")
        .addBooleanOption((option) =>
          option
            .setName("channel")
            .setDescription("Show channel-specific configuration")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
      subcommand
        .setName("set-default-repo")
        .setDescription("Set the default repository for /ptal commands")
        .addStringOption((option) =>
          option
            .setName("repository")
            .setDescription('Repository in "owner/repo" format (e.g., "bombshell-dev/discord-bot")')
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("channel")
            .setDescription("Set for this channel only (otherwise applies to entire server)")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
      subcommand
        .setName("clear-default-repo")
        .setDescription("Clear the default repository setting")
        .addBooleanOption((option) =>
          option
            .setName("channel")
            .setDescription("Clear for this channel only")
            .setRequired(false)
        )
    ),

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

    // Get subcommand
    const subcommand = interaction.data.options?.[0];
    if (!subcommand || subcommand.type !== 1) {
      return client.reply({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "⚠️ Invalid subcommand.",
          flags: 64,
        },
      });
    }

    const subcommandName = subcommand.name;

    // For config changes, check admin permissions
    if (subcommandName !== "view") {
      if (!isUserAdmin(interaction)) {
        return client.reply({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "⚠️ You need Administrator or Manage Server permissions to change bot configuration.",
            flags: 64,
          },
        });
      }
    }

    const configDO = getConfigDurableObject(client.env);

    // Handle subcommands
    switch (subcommandName) {
      case "view": {
        const showChannel = getBooleanOption(interaction.data, "channel") || false;
        const channelId = getChannelId(interaction);

        if (showChannel && channelId) {
          const channelConfig = await configDO.getChannelConfig(guildId, channelId);
          const defaultRepo = await configDO.getDefaultRepository(guildId, channelId);

          return client.reply({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `**Channel Configuration** (<#${channelId}>)\n\n` +
                `**Default Repository:** ${defaultRepo || "Not set (using server default)"}\n` +
                (channelConfig?.features ? `**Features:** ${JSON.stringify(channelConfig.features, null, 2)}` : ""),
              flags: 64,
            },
          });
        } else {
          const guildConfig = await configDO.getGuildConfig(guildId);

          if (!guildConfig) {
            return client.reply({
              type: InteractionResponseType.ChannelMessageWithSource,
              data: {
                content: "**Server Configuration**\n\nNo configuration set for this server yet. Use `/config set-default-repo` to get started!",
                flags: 64,
              },
            });
          }

          const channelCount = Object.keys(guildConfig.channels || {}).length;

          return client.reply({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `**Server Configuration**\n\n` +
                `**Default Repository:** ${guildConfig.defaultRepository || "Not set"}\n` +
                `**GitHub App Installed:** ${guildConfig.githubAppInstalled ? "Yes" : "No"}\n` +
                `**Configured Channels:** ${channelCount}\n\n` +
                (channelCount > 0 ? `Use \`/config view channel:true\` to see channel-specific settings.` : ""),
              flags: 64,
            },
          });
        }
      }

      case "set-default-repo": {
        const repository = getStringOption(interaction.data, "repository");
        const isChannelSpecific = getBooleanOption(interaction.data, "channel") || false;
        const channelId = getChannelId(interaction);

        if (!repository) {
          return client.reply({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: "⚠️ Please provide a repository in the format `owner/repo`.",
              flags: 64,
            },
          });
        }

        // Validate repository format
        if (!repository.match(/^[\w\-\.]+\/[\w\-\.]+$/)) {
          return client.reply({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `⚠️ Invalid repository format. Please use \`owner/repo\` format (e.g., \`bombshell-dev/discord-bot\`).\n\nYou provided: \`${repository}\``,
              flags: 64,
            },
          });
        }

        if (isChannelSpecific && channelId) {
          await configDO.setDefaultRepository(guildId, repository, channelId);
          return client.reply({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `✅ Default repository for <#${channelId}> set to \`${repository}\``,
            },
          });
        } else {
          await configDO.setDefaultRepository(guildId, repository);
          return client.reply({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `✅ Default repository for this server set to \`${repository}\``,
            },
          });
        }
      }

      case "clear-default-repo": {
        const isChannelSpecific = getBooleanOption(interaction.data, "channel") || false;
        const channelId = getChannelId(interaction);

        if (isChannelSpecific && channelId) {
          await configDO.setChannelConfig(guildId, channelId, { defaultRepository: undefined });
          return client.reply({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `✅ Default repository cleared for <#${channelId}>`,
            },
          });
        } else {
          await configDO.setGuildConfig(guildId, { defaultRepository: undefined });
          return client.reply({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `✅ Default repository cleared for this server`,
            },
          });
        }
      }

      default:
        return client.reply({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "⚠️ Unknown subcommand.",
            flags: 64,
          },
        });
    }
  },
};

export default ConfigCommand;
