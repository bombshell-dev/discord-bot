import { DurableObject } from "cloudflare:workers";

export interface PTALMessageMapping {
  channelId: string;
  messageId: string;
  webhookToken: string;
  githubUrl: string;
  deploymentUrl?: string;
  otherUrls?: string;
  emoji?: string;
}

export class DiscordBotDurableObject extends DurableObject {
  /**
   * Store a PR-to-Discord-message mapping
   * @param owner GitHub repository owner
   * @param repo GitHub repository name
   * @param prNumber Pull request number
   * @param mapping Discord message details
   */
  async storePTAL(owner: string, repo: string, prNumber: number, mapping: PTALMessageMapping): Promise<void> {
    const key = `pr:${owner}/${repo}/${prNumber}`;
    await this.ctx.storage.put(key, mapping);
  }

  /**
   * Retrieve all Discord messages associated with a PR
   * @param owner GitHub repository owner
   * @param repo GitHub repository name
   * @param prNumber Pull request number
   * @returns Array of Discord message mappings
   */
  async getPTALs(owner: string, repo: string, prNumber: number): Promise<PTALMessageMapping[]> {
    const key = `pr:${owner}/${repo}/${prNumber}`;
    const mapping = await this.ctx.storage.get<PTALMessageMapping>(key);
    return mapping ? [mapping] : [];
  }

  /**
   * Remove a PR-to-Discord-message mapping
   * @param owner GitHub repository owner
   * @param repo GitHub repository name
   * @param prNumber Pull request number
   */
  async deletePTAL(owner: string, repo: string, prNumber: number): Promise<void> {
    const key = `pr:${owner}/${repo}/${prNumber}`;
    await this.ctx.storage.delete(key);
  }

  /**
   * List all stored PTAL mappings (for debugging)
   */
  async listAllPTALs(): Promise<Map<string, PTALMessageMapping>> {
    return await this.ctx.storage.list<PTALMessageMapping>();
  }
}
