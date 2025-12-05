import { DurableObject } from "cloudflare:workers";
import type { GuildConfig, ChannelConfig } from "./types.ts";

export class DiscordBotDurableObject extends DurableObject {
  /**
   * Get the configuration for a specific guild
   */
  async getGuildConfig(guildId: string): Promise<GuildConfig | null> {
    const config = await this.ctx.storage.get<GuildConfig>(`guild:${guildId}`);
    return config || null;
  }

  /**
   * Set the configuration for a specific guild
   */
  async setGuildConfig(guildId: string, config: Partial<GuildConfig>): Promise<GuildConfig> {
    const existingConfig = await this.getGuildConfig(guildId);
    const newConfig: GuildConfig = {
      ...existingConfig,
      ...config,
      guildId,
    };
    await this.ctx.storage.put(`guild:${guildId}`, newConfig);
    return newConfig;
  }

  /**
   * Get the configuration for a specific channel
   */
  async getChannelConfig(guildId: string, channelId: string): Promise<ChannelConfig | null> {
    const guildConfig = await this.getGuildConfig(guildId);
    if (!guildConfig || !guildConfig.channels) {
      return null;
    }
    return guildConfig.channels[channelId] || null;
  }

  /**
   * Set the configuration for a specific channel
   */
  async setChannelConfig(
    guildId: string,
    channelId: string,
    config: Partial<ChannelConfig>
  ): Promise<GuildConfig> {
    const guildConfig = await this.getGuildConfig(guildId);
    const existingChannelConfig = guildConfig?.channels?.[channelId] || {};

    const newChannelConfig: ChannelConfig = {
      ...existingChannelConfig,
      ...config,
    };

    const updatedGuildConfig: GuildConfig = {
      ...guildConfig,
      guildId,
      channels: {
        ...guildConfig?.channels,
        [channelId]: newChannelConfig,
      },
    };

    await this.ctx.storage.put(`guild:${guildId}`, updatedGuildConfig);
    return updatedGuildConfig;
  }

  /**
   * Get the default repository for a guild or channel
   * Channel-specific config takes precedence over guild-wide config
   */
  async getDefaultRepository(guildId: string, channelId?: string): Promise<string | null> {
    const guildConfig = await this.getGuildConfig(guildId);

    if (!guildConfig) {
      return null;
    }

    // Check channel-specific config first
    if (channelId && guildConfig.channels?.[channelId]?.defaultRepository) {
      return guildConfig.channels[channelId].defaultRepository!;
    }

    // Fall back to guild-wide config
    return guildConfig.defaultRepository || null;
  }

  /**
   * Set the default repository for a guild or channel
   */
  async setDefaultRepository(
    guildId: string,
    repository: string,
    channelId?: string
  ): Promise<GuildConfig> {
    if (channelId) {
      return this.setChannelConfig(guildId, channelId, { defaultRepository: repository });
    } else {
      return this.setGuildConfig(guildId, { defaultRepository: repository });
    }
  }

  /**
   * Mark GitHub app as installed for a guild
   */
  async markGitHubAppInstalled(guildId: string): Promise<GuildConfig> {
    return this.setGuildConfig(guildId, { githubAppInstalled: true });
  }

  /**
   * Delete all configuration for a guild
   */
  async deleteGuildConfig(guildId: string): Promise<void> {
    await this.ctx.storage.delete(`guild:${guildId}`);
  }
}
