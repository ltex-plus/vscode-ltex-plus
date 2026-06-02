/* Copyright (C) 2019-2025
 * Julian Valentin, Daniel Spitzer, LTeX+ Development Community
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Code from "vscode";
import * as CodeLanguageClient from "vscode-languageclient/node";

import BugReporter from "./BugReporter";
import CommandHandler from "./CommandHandler";
import DependencyManager from "./DependencyManager";
import ExternalFileManager from "./ExternalFileManager";
import { I18n, i18n } from "./I18n";
import Logger from "./Logger";
import type LoggingOutputChannel from "./LoggingOutputChannel";
import StatusBarItemManager from "./StatusBarItemManager";
import StatusPrinter from "./StatusPrinter";
import WorkspaceConfigurationRequestHandler from "./WorkspaceConfigurationRequestHandler";

export class Api {
	public languageClient: CodeLanguageClient.LanguageClient | null = null;
	public clientOutputChannel: LoggingOutputChannel | null = null;
	public serverOutputChannel: LoggingOutputChannel | null = null;
	// Name and version reported by ltex-ls-plus through the LSP `initialize`
	// response (`serverInfo`), available since ltex-ls-plus#177. The version
	// string is SemVer 2.0.0 compliant (e.g. "18.7.0-alpha.93+2026-05-20.g...").
	// `null` when connected to an older server that does not report it.
	// Intended for version-gating client features in the future.
	public ltexLsServerName: string | null = null;
	public ltexLsServerVersion: string | null = null;
}

let dependencyManager: DependencyManager | null = null;
let api: Api | null = null;
let extensionContext: Code.ExtensionContext | null = null;
let externalFileManager: ExternalFileManager | null = null;
let statusPrinter: StatusPrinter | null = null;
let commandHandler: CommandHandler | null = null;
let statusBarItemManager: StatusBarItemManager | null = null;

async function languageClientIsReady(
	languageClient: CodeLanguageClient.LanguageClient,
	externalFileManager: ExternalFileManager,
	statusBarItemManager: StatusBarItemManager,
): Promise<void> {
	statusBarItemManager.setStatusToReady();
	languageClient.onNotification(
		"$/progress",
		statusBarItemManager.handleProgressNotification.bind(statusBarItemManager),
	);

	const workspaceConfigurationRequestHandler: WorkspaceConfigurationRequestHandler =
		new WorkspaceConfigurationRequestHandler(externalFileManager);
	languageClient.onRequest(
		"ltex/workspaceSpecificConfiguration",
		workspaceConfigurationRequestHandler.handle.bind(
			workspaceConfigurationRequestHandler,
		),
	);
}

function recordServerInfo(
	languageClient: CodeLanguageClient.LanguageClient,
	api: Api,
): void {
	// `initializeResult` is populated once `start()` has resolved.
	const serverInfo: { name: string; version?: string } | undefined =
		languageClient.initializeResult?.serverInfo;

	if (serverInfo == null) {
		api.ltexLsServerName = null;
		api.ltexLsServerVersion = null;
		return;
	}

	api.ltexLsServerName = serverInfo.name;
	api.ltexLsServerVersion = serverInfo.version ?? null;
	Logger.log(
		i18n(
			"ltexLsReportedServerInfo",
			serverInfo.name,
			serverInfo.version ?? "unknown",
		),
	);
}

export async function startLanguageClient(): Promise<void> {
	let serverOptions: CodeLanguageClient.ServerOptions | null = null;

	if (
		extensionContext == null ||
		statusPrinter == null ||
		externalFileManager == null ||
		statusPrinter == null ||
		commandHandler == null ||
		api == null
	) {
		Logger.error(i18n("couldNotStartLanguageClient"));
		return Promise.resolve();
	}

	if (api.languageClient != null) {
		Logger.log(i18n("ltexLsWasAlreadyStarted"));
		return Promise.resolve();
	}

	if (extensionContext.extensionMode === Code.ExtensionMode.Development) {
		serverOptions = DependencyManager.getDebugServerOptions();
	}

	if (serverOptions == null) {
		if (dependencyManager == null) {
			Logger.error("DependencyManager not initialized!");
			return Promise.resolve();
		}

		const success: boolean = await dependencyManager.install();
		if (success !== true) return Promise.resolve();
		serverOptions = await dependencyManager.getLtexLsExecutable();
	}

	statusBarItemManager = new StatusBarItemManager(extensionContext);

	const workspaceConfig: Code.WorkspaceConfiguration =
		Code.workspace.getConfiguration("ltex");
	const enabled: any = workspaceConfig.get("enabled");
	let enabledCodeLanguageIds: string[];

	if (enabled === true || enabled === false) {
		enabledCodeLanguageIds = enabled
			? CommandHandler.getDefaultCodeLanguageIds()
			: [];
	} else {
		enabledCodeLanguageIds = enabled;
	}

	const documentSelector: CodeLanguageClient.DocumentFilter[] = [];

	for (const codeLanguageId of enabledCodeLanguageIds) {
		documentSelector.push({ scheme: "file", language: codeLanguageId });
		documentSelector.push({ scheme: "untitled", language: codeLanguageId });
		documentSelector.push({
			scheme: "vscode-notebook-cell",
			language: codeLanguageId,
		});
	}

	const clientOptions: CodeLanguageClient.LanguageClientOptions = {
		documentSelector: documentSelector,
		synchronize: {
			configurationSection: "ltex",
		},
		initializationOptions: {
			customCapabilities: {
				workspaceSpecificConfiguration: true,
			},
		},
		revealOutputChannelOn: CodeLanguageClient.RevealOutputChannelOn.Never,
		traceOutputChannel: Logger.clientOutputChannel,
		outputChannel: Logger.serverOutputChannel,
	};

	const languageClient: CodeLanguageClient.LanguageClient =
		new CodeLanguageClient.LanguageClient(
			"ltex",
			i18n("ltexLanguageServer"),
			serverOptions,
			clientOptions,
		);

	if ("command" in serverOptions) {
		Logger.log(i18n("startingLtexLs"));
		Logger.logExecutable(serverOptions);
		Logger.log("");
	}

	languageClient.info(i18n("startingLtexLs"));
	await languageClient
		.start()
		.then(
			languageClientIsReady.bind(
				null,
				languageClient,
				externalFileManager,
				statusBarItemManager,
			),
		);
	statusPrinter.languageClient = languageClient;
	extensionContext.subscriptions.push(languageClient);
	commandHandler.languageClient = languageClient;
	commandHandler.statusBarItemManager = statusBarItemManager;
	api.languageClient = languageClient;

	recordServerInfo(languageClient, api);

	return Promise.resolve();
}

export async function activate(context: Code.ExtensionContext): Promise<Api> {
	Logger.createOutputChannels(context);
	I18n.initialize(context);

	api = new Api();
	api.clientOutputChannel = Logger.clientOutputChannel;
	api.serverOutputChannel = Logger.serverOutputChannel;

	dependencyManager = new DependencyManager(context);
	extensionContext = context;

	externalFileManager = new ExternalFileManager(context);
	statusPrinter = new StatusPrinter(
		context,
		dependencyManager,
		externalFileManager,
	);
	const bugReporter: BugReporter = new BugReporter(
		context,
		dependencyManager,
		statusPrinter,
	);

	commandHandler = new CommandHandler(
		context,
		externalFileManager,
		statusPrinter,
		bugReporter,
	);

	if (isLtexenabledInConfig()) {
		await startLanguageClient();
	}

	return Promise.resolve(api);
}

export function isLtexenabledInConfig(): boolean {
	const workspaceConfig: Code.WorkspaceConfiguration =
		Code.workspace.getConfiguration("ltex");
	const enabled: any = workspaceConfig.get("enabled");
	if (enabled === true || enabled.length > 0) {
		return true;
	}
	return false;
}

export function deactivate(): Thenable<void> | undefined {
	if (!api) {
		return undefined;
	}
	if (!api.languageClient) {
		return undefined;
	}

	return api.languageClient.stop();
}
