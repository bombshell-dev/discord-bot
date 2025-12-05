import type { Command } from '../types.ts';
import { default as IssueCommand } from './issue.ts';
import { default as PTALCommand } from './ptal.ts';
import { default as ConfigCommand } from './config.ts';
import { default as InitCommand } from './init.ts';

export const commands: Record<string, Command> = {
	issue: IssueCommand,
	ptal: PTALCommand,
	config: ConfigCommand,
	init: InitCommand,
};
