import type { Command } from '../types.ts';
import { default as IssueCommand } from './issue.js';
import { default as PTALCommand } from './ptal.js';
import { default as TweetCommand } from './tweet.js';

export const commands: Record<string, Command> = {
	issue: IssueCommand,
	ptal: PTALCommand,
	tweet: TweetCommand,
};
