import type { DiscordBotDurableObject } from "../durableObject.ts";
import type { Env } from "../types.ts";
import type { APIInteraction } from "discord-api-types/v10";
import { PermissionFlagsBits } from "discord-api-types/v10";

/**
 * Get a Durable Object instance for configuration storage
 * Uses a single global instance for all configuration
 */
export function getConfigDurableObject(env: Env): DurableObjectStub<DiscordBotDurableObject> {
  const namespace = env.DISCORD_BOT_DURABLE_OBJECT;
  // Use a fixed ID for the global configuration object
  const id = namespace.idFromName("global-config");
  return namespace.get(id);
}

/**
 * Check if a user has administrator permissions in the guild
 */
export function isUserAdmin(interaction: APIInteraction): boolean {
  // Check if interaction is in a guild
  if (!interaction.guild_id || !interaction.member) {
    return false;
  }

  const member = interaction.member;

  // Check if member has permissions field
  if (!member.permissions) {
    return false;
  }

  const permissions = BigInt(member.permissions);

  // Check for ADMINISTRATOR or MANAGE_GUILD permissions
  return (
    (permissions & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator ||
    (permissions & PermissionFlagsBits.ManageGuild) === PermissionFlagsBits.ManageGuild
  );
}

/**
 * Get the guild ID from an interaction
 */
export function getGuildId(interaction: APIInteraction): string | null {
  return interaction.guild_id || null;
}

/**
 * Get the channel ID from an interaction
 */
export function getChannelId(interaction: APIInteraction): string | null {
  return interaction.channel?.id || interaction.channel_id || null;
}
