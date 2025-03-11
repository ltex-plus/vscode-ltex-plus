/* Copyright (C) 2019-2025
 * Julian Valentin, Daniel Spitzer, LTeX+ Development Community
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Code from 'vscode';
import * as CodeLanguageClient from 'vscode-languageclient/node';
import * as ChildProcess from 'child_process';
import * as Crypto from 'crypto';
import extractZip from 'extract-zip';
import * as Fs from 'fs';
import * as Http from 'http';
import * as Https from 'https';
import * as Net from 'net';
import * as Os from 'os';
import * as Path from 'path';
import * as SemVer from 'semver';
import * as Tar from 'tar';
import * as Url from 'url';

import {i18n} from './I18n';
import Logger from './Logger';
import ProgressStack from './ProgressStack';

export default class DependencyManager {
  private _context: Code.ExtensionContext;
  private _vscodeLtexVersion: string;
  private _ltexLsPath: string | null = null;
  private _javaPath: string | null = null;
  private _ltexLsVersion: string | null = null;
  private _javaVersion: string | null = null;

  private static _isWindows: boolean = (Os.platform() === 'win32');

  private static readonly _offlineInstructionsUrl: string = 'https://ltex-plus.github.io/'
      + 'ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html#offline-installation';

  private static readonly _toBeDownloadedLtexLsTag: string =
      '18.4.0';
  private static readonly _toBeDownloadedLtexLsVersion: string =
      '18.4.0';
  private static readonly _toBeDownloadedLtexLsHashDigests: {[fileName: string]: string} = {
    'ltex-ls-plus-18.4.0-linux-aarch64.tar.gz':
      'a0499f8d6afd2c6570f6e37d4ee3b2a36050015a0bad88c4176217f068f54d84',
    'ltex-ls-plus-18.4.0-linux-x64.tar.gz':
      'bcab2f049a7b5854c574eff81eb747182c68410d7c0af3a51e1f581c52b8cd25',
    'ltex-ls-plus-18.4.0-mac-aarch64.tar.gz':
      '126de7017c53c2a2058aecbe5ca308a2a42f4a521dfc44144de2aea28b1d3432',
    'ltex-ls-plus-18.4.0-mac-x64.tar.gz':
      'f678e31b77b7fe5e109bcd00ceebd9ad351cde078e90f3158ab66f3388c183b1',
    'ltex-ls-plus-18.4.0-windows-aarch64.zip':
      'a5ac34d2d4bde14574096082200a9fb93d46d25d25fde394416e3b9b0996b1e9',
    'ltex-ls-plus-18.4.0-windows-x64.zip':
      '6e4228dfa06d4855ae53cf41ab32f64cae6dcbd307e0b08b6892d10b117efba5',
    'ltex-ls-plus-18.4.0.tar.gz':
      '06454f2edc85eb691e0c3127113f3317b83416a0f3e94903588e8133c5b6a8c4',
  };

  public constructor(context: Code.ExtensionContext) {
    this._context = context;
    // deprecated: replace with context.extension starting with VS Code 1.55.0
    const vscodeLtexExtension: Code.Extension<any> | undefined =
        Code.extensions.getExtension('ltex-plus.vscode-ltex-plus');
    if (vscodeLtexExtension == null) throw new Error(i18n('couldNotGetVscodeLtexVersion'));
    this._vscodeLtexVersion = vscodeLtexExtension.packageJSON.version;
  }

  private static isValidPath(path: string | null): boolean {
    return ((path != null) && (path.length > 0));
  }

  private static normalizePath(path: string | null | undefined): string | null {
    if (path == null) return null;
    const homeDirPath: string = Os.homedir();
    return path.replace(/^~($|\/|\\)/, `${homeDirPath}$1`);
  }

  private static parseUrl(urlStr: string): Https.RequestOptions {
    const url: Url.URL = new Url.URL(urlStr);
    return {
          hostname: url.hostname,
          path: url.pathname + url.search,
          headers: {'User-Agent': 'vscode-ltex'},
        };
  }

  private static async downloadFile(urlStr: string, path: string, codeProgress: ProgressStack):
        Promise<void> {
    const file: Fs.WriteStream = Fs.createWriteStream(path);
    const origTaskName: string = codeProgress.getTaskName();

    return new Promise((resolve: () => void, reject: (reason?: any) => void) => {
      Https.get(DependencyManager.parseUrl(urlStr), (response: Http.IncomingMessage) => {
        if ((response.statusCode === 301) || (response.statusCode === 302)
              || (response.statusCode === 307)) {
          if (response.headers.location == null) {
            reject(new Error(i18n('receivedRedirectionStatusCodeWithoutLocationHeader',
                response.statusCode)));
            return;
          }

          Logger.log(i18n('redirectedTo', response.headers.location));
          DependencyManager.downloadFile(response.headers.location, path, codeProgress)
              .then(resolve).catch(reject);
          return;
        } else if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(i18n('requestFailedWithStatusCode', response.statusCode)));
          return;
        }

        const totalBytes: number = ((response.headers['content-length'] != null)
            ? parseInt(response.headers['content-length']) : 0);
        const totalMb: number = Math.round(totalBytes / 1e6);
        let downloadedBytes: number = 0;
        let lastTaskNameUpdate: number = Date.now();
        codeProgress.updateTask(0, ((totalBytes > 0)
            ? `${origTaskName}  0MB/${totalMb}MB` : origTaskName));

        response.pipe(file);

        if (totalBytes > 0) {
          response.on('data', (chunk: any) => {
            downloadedBytes += chunk.length;
            const now: number = Date.now();

            if (now - lastTaskNameUpdate >= 500) {
              lastTaskNameUpdate = now;
              const downloadedMb: number = Math.round(downloadedBytes / 1e6);
              const taskName: string = `${origTaskName}  ${downloadedMb}MB/${totalMb}MB`;
              codeProgress.updateTask(downloadedBytes / totalBytes, taskName);
            }
          });
        }

        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (e: Error) => {
        Fs.unlinkSync(path);
        reject(e);
      });
    });
  }

  private static async verifyFile(path: string, hashDigest: string): Promise<void> {
    return new Promise((resolve: () => void, reject: (reason?: any) => void) => {
      const hash: Crypto.Hash = Crypto.createHash('sha256');
      const readStream: Fs.ReadStream = Fs.createReadStream(path);

      readStream.on('data', (d: any) => hash.update(d));

      readStream.on('end', () => {
        const actualHashDigest: string = hash.digest('hex');

        if (actualHashDigest === hashDigest) {
          resolve();
        } else {
          reject(new Error(i18n('couldNotVerifyDownloadedFile',
              path, hashDigest, actualHashDigest)));
        }
      });

      readStream.on('error', (e: Error) => reject(e));
    });
  }

  private getLatestLtexLsVersion(versions: string[]): string | null {
    let latestVersion: string | null = null;

    versions.forEach((version: string) => {
      if (SemVer.valid(version) && ((latestVersion == null) || SemVer.gt(version, latestVersion))) {
        latestVersion = version;
      }
    });

    return latestVersion;
  }

  private async installDependency(urlStr: string, hashDigest: string, name: string,
        codeProgress: ProgressStack): Promise<void> {
    codeProgress.startTask(0.1, i18n('downloading', name));
    const url: Url.URL = new Url.URL(urlStr);
    if (url.pathname == null) throw new Error(i18n('couldNotGetPathNameFromUrl', urlStr));
    const archiveName: string = Path.basename(url.pathname);
    const archiveType: string = ((Path.extname(archiveName) == '.zip') ? 'zip' : 'tar.gz');
    const tmpDirPath: string = Fs.mkdtempSync(Path.join(this._context.extensionPath, 'tmp-'));
    const archivePath: string = Path.join(tmpDirPath, archiveName);
    codeProgress.finishTask();

    codeProgress.startTask(0.7, i18n('downloading', name));
    Logger.log(i18n('downloadingFromTo', name, urlStr, archivePath));
    await DependencyManager.downloadFile(urlStr, archivePath, codeProgress);
    codeProgress.finishTask();

    codeProgress.startTask(0.1, i18n('verifying', name));
    await DependencyManager.verifyFile(archivePath, hashDigest);
    codeProgress.finishTask();

    codeProgress.startTask(0.1, i18n('extracting', name));
    Logger.log(i18n('extractingTo', archivePath, tmpDirPath));

    if (archiveType == 'zip') {
      await extractZip(archivePath, {dir: tmpDirPath});
    } else {
      await Tar.extract({file: archivePath, cwd: tmpDirPath});
    }

    codeProgress.updateTask(0.8);

    const fileNames: string[] = Fs.readdirSync(tmpDirPath);
    let extractedDirPath: string | null = null;
    Logger.log(i18n('searchingForDirectory', tmpDirPath));

    for (let i: number = 0; i < fileNames.length; i++) {
      const filePath: string = Path.join(tmpDirPath, fileNames[i]);
      const stats: Fs.Stats = Fs.lstatSync(filePath);

      if (stats.isDirectory()) {
        if (extractedDirPath == null) {
          extractedDirPath = filePath;
        } else {
          Logger.warn(i18n('foundMultipleDirectoriesAfterExtraction', extractedDirPath, filePath));
        }
      } else {
        try {
          Logger.log(i18n('deleting', filePath));
          Fs.unlinkSync(filePath);
        } catch (e: unknown) {
          Logger.warn(i18n('couldNotDeleteLeavingTemporaryFileOnDisk', filePath), e);
        }
      }
    }

    if (extractedDirPath == null) {
      throw new Error(i18n('couldNotFindDirectoryAfterExtractingArchive'));
    }

    Logger.log(i18n('foundExtractedDirectory', extractedDirPath));
    codeProgress.updateTask(0.85);

    const targetDirPath: string = Path.join(
        this._context.extensionPath, 'lib', Path.basename(extractedDirPath));
    const targetExists: boolean = Fs.existsSync(targetDirPath);
    codeProgress.updateTask(0.9);

    if (targetExists) {
      Logger.warn(i18n('didNotMoveAsTargetAlreadyExists', extractedDirPath, targetDirPath));
    } else {
      Logger.log(i18n('movingTo', extractedDirPath, targetDirPath));
      Fs.renameSync(extractedDirPath, targetDirPath);
    }

    codeProgress.updateTask(0.95);

    try {
      Logger.log(i18n('deleting', tmpDirPath));
      Fs.rmdirSync(tmpDirPath);
    } catch (e: unknown) {
      Logger.warn(i18n('couldNotDeleteLeavingTemporaryDirectoryOnDisk', tmpDirPath), e);
    }

    codeProgress.finishTask();

    return Promise.resolve();
  }

  private async installLtexLs(): Promise<void> {
    const progressOptions: Code.ProgressOptions = {
          title: 'LTeX',
          location: Code.ProgressLocation.Notification,
          cancellable: false,
        };

    return Code.window.withProgress(progressOptions,
          async (progress: Code.Progress<{increment?: number; message?: string}>):
            Promise<void> => {
      const codeProgress: ProgressStack = new ProgressStack(
          i18n('downloadingAndExtractingLtexLs'), progress);

      let platform: string = 'linux';
      let arch: string = 'x64';
      let archiveType: string = 'tar.gz';

      if (DependencyManager._isWindows) {
        platform = 'windows';
        archiveType = 'zip';
      } else if (process.platform == 'darwin') {
        platform = 'mac';
      }
      if (process.arch == 'arm64'){
         arch = 'aarch64';
       }

      const ltexLsArchiveName: string = 'ltex-ls-plus-'
          + `${DependencyManager._toBeDownloadedLtexLsVersion}-${platform}-${arch}.${archiveType}`;
      const ltexLsUrl: string = 'https://github.com/ltex-plus/ltex-ls-plus/releases/download/'
          + `${DependencyManager._toBeDownloadedLtexLsTag}/${ltexLsArchiveName}`;
      const ltexLsHashDigest: string =
          DependencyManager._toBeDownloadedLtexLsHashDigests[ltexLsArchiveName];

      await this.installDependency(ltexLsUrl, ltexLsHashDigest,
          `ltex-ls-plus ${DependencyManager._toBeDownloadedLtexLsVersion}`, codeProgress);
    });
  }

  private searchBundledLtexLs(libDirPath: string): string | null {
    const names: string[] = Fs.readdirSync(libDirPath);
    const ltexLsVersions: string[] = [];

    names.forEach((name: string) => {
      if (name.startsWith('ltex-ls-plus-')) {
        ltexLsVersions.push(name.substring(13));
      }
    });

    const ltexLsVersion: string | null = this.getLatestLtexLsVersion(ltexLsVersions);
    return ((ltexLsVersion != null)
    ? Path.join(libDirPath, `ltex-ls-plus-${ltexLsVersion}`) : null);
  }

  public async install(): Promise<boolean> {
    const libDirPath: string = Path.join(this._context.extensionPath, 'lib');
    const workspaceConfig: Code.WorkspaceConfiguration = Code.workspace.getConfiguration('ltex');

    if (!Fs.existsSync(libDirPath)) {
      Logger.log(i18n('creating', libDirPath));
      Fs.mkdirSync(libDirPath);
    }

    try {
      // try 0: use ltex.ltex-ls.path
      // try 1: use lib/ (don't download)
      // try 2: download and use lib/
      Logger.log('');
      this._ltexLsPath = DependencyManager.normalizePath(workspaceConfig.get('ltex-ls.path', ''));

      if (DependencyManager.isValidPath(this._ltexLsPath)) {
        Logger.log(i18n('ltexLtexLsPathSetTo', this._ltexLsPath));
      } else {
        Logger.log(i18n('ltexLtexLsPathNotSet'));
        Logger.log(i18n('searchingForLtexLsIn', libDirPath));
        this._ltexLsPath = this.searchBundledLtexLs(libDirPath);

        if (DependencyManager.isValidPath(this._ltexLsPath)) {
          Logger.log(i18n('ltexLsFoundIn', this._ltexLsPath));
        } else {
          Logger.log(i18n('couldNotFindVersionOfLtexLsIn', libDirPath));
          Logger.log(i18n('initiatingDownloadOfLtexLs'));
          await this.installLtexLs();
          this._ltexLsPath = this.searchBundledLtexLs(libDirPath);

          if (DependencyManager.isValidPath(this._ltexLsPath)) {
            Logger.log(i18n('ltexLsFoundIn', this._ltexLsPath));
          } else {
            throw Error(i18n('couldNotDownloadOrExtractLtexLs'));
          }
        }
      }
    } catch (e: unknown) {
      Logger.error(i18n('downloadOrExtractionOfLtexLsFailed'), e);
      Logger.log(i18n('youMightWantToTryOfflineInstallationSee',
          DependencyManager._offlineInstructionsUrl));
      Logger.showClientOutputChannel();
      return this.showOfflineInstallationInstructions(i18n('couldNotInstallLtexLs'));
    }

    Logger.log('');
    Logger.log(i18n('usingLtexLsFrom', this._ltexLsPath));
    this._javaPath = DependencyManager.normalizePath(workspaceConfig.get('java.path'));

    if (DependencyManager.isValidPath(this._javaPath)) {
      Logger.log(i18n('usingJavaFrom', this._javaPath));
    } else {
      Logger.log(i18n('usingJavaBundledWithLtexLs'));
    }

    if (await this.test()) {
      Logger.log('');
      return true;
    } else {
      Logger.log(i18n('youMightWantToTryOfflineInstallationSee',
          DependencyManager._offlineInstructionsUrl));
      Logger.showClientOutputChannel();
      return await this.showOfflineInstallationInstructions(i18n('couldNotRunLtexLs'));
    }
  }

  private async showOfflineInstallationInstructions(message: string): Promise<boolean> {
    return new Promise((resolve: (value: boolean) => void) => {
      Code.window.showErrorMessage(`${message} ${i18n('youMightWantToTryOfflineInstallation')}`,
            i18n('tryAgain'), i18n('offlineInstructions')).then(
            async (selectedItem: string | undefined) => {
        if (selectedItem == i18n('tryAgain')) {
          resolve(await this.install());
          return;
        } else if (selectedItem == i18n('offlineInstructions')) {
          Code.env.openExternal(Code.Uri.parse(DependencyManager._offlineInstructionsUrl));
        }

        resolve(false);
      });
    });
  }

  private async test(): Promise<boolean> {
    const executable: CodeLanguageClient.Executable = await this.getLtexLsExecutable();
    if (executable.args == null) executable.args = [];
    executable.args.push('--version');
    const executableOptions: ChildProcess.SpawnSyncOptionsWithStringEncoding =
    DependencyManager._isWindows ? {
      encoding: 'utf-8',
      timeout: 30000,
      shell: true,
    }
    : {
      encoding: 'utf-8',
      timeout: 30000,
    };

    if (executable.options != null) {
      executableOptions.cwd = executable.options.cwd;
      executableOptions.env = executable.options.env;
    }

    Logger.log(i18n('testingLtexLs'));
    Logger.logExecutable(executable);

    let childProcess: ChildProcess.SpawnSyncReturns<string> | null = null;

    try {
      childProcess = ChildProcess.spawnSync(executable.command, executable.args, executableOptions);
    } catch (e: unknown) {
      Logger.error(i18n('testFailed'), e);
      return Promise.resolve(false);
    }

    let success: boolean = false;
    let ltexLsVersion: string = '';
    let javaVersion: string = '';
    let javaMajorVersion: number = -1;

    if ((childProcess.status == 0) && childProcess.stdout.includes('ltex-ls')) {
      try {
        const versionInfo: any = JSON.parse(childProcess.stdout);

        if (Object.prototype.hasOwnProperty.call(versionInfo, 'ltex-ls')) {
          ltexLsVersion = versionInfo['ltex-ls'];
        }

        if (Object.prototype.hasOwnProperty.call(versionInfo, 'java')) {
          const match: RegExpMatchArray | null = versionInfo['java'].match(/(\d+)(?:\.(\d+))?/);

          if ((match != null) && (match.length >= 3)) {
            javaVersion = versionInfo['java'];
            javaMajorVersion = parseInt(match[1]);
            if (javaMajorVersion == 1) javaMajorVersion = parseInt(match[2]);
          }
        }

        if ((ltexLsVersion.length > 0) && (javaVersion.length > 0)) {
          success = true;
        }
      } catch (_e: unknown) {
        // don't throw error as debug info is printed below
      }
    }

    if (success) {
      Logger.log(i18n('testSuccessful'));
      this._ltexLsVersion = ltexLsVersion;
      this._javaVersion = javaVersion;
      return Promise.resolve(true);
    } else {
      Logger.error(i18n('testFailed'), childProcess.error);

      if ((childProcess.status != null) && (childProcess.status != 0)) {
        Logger.log(i18n('ltexLsTerminatedWithNonZeroExitCode', childProcess.status));
      } else if (childProcess.signal != null) {
        Logger.log(i18n('ltexLsTerminatedDueToSignal', childProcess.signal));
      } else {
        Logger.log(i18n('ltexLsDidNotPrintExpectVersionInformation'));
      }

      Logger.log(i18n('stdoutOfLtexLs'));
      Logger.log(childProcess.stdout);
      Logger.log(i18n('stderrOfLtexLs'));
      Logger.log(childProcess.stderr);
      return Promise.resolve(false);
    }
  }

  public async getLtexLsExecutable(): Promise<CodeLanguageClient.Executable> {
    if (!DependencyManager.isValidPath(this._ltexLsPath)) {
      return Promise.reject(new Error(i18n('couldNotGetLtexLsExecutable')));
    }

    const env: NodeJS.ProcessEnv = {};

    for (const name in process.env) {
      if ((Object.prototype.hasOwnProperty.call(process.env, name)) && (name != 'JAVA_HOME')) {
        env[name] = process.env[name];
      }
    }

    if (DependencyManager.isValidPath(this._javaPath)) {
      env['JAVA_HOME'] = this._javaPath!;
    }

    const ltexLsScriptPath: string = Path.join(
        this._ltexLsPath!, 'bin', (DependencyManager._isWindows
          ? 'ltex-ls-plus.bat' : 'ltex-ls-plus'));

    if (!DependencyManager._isWindows) {
      const cwd: string = this._ltexLsPath!;
      const directories: string[] = Fs.readdirSync(cwd).filter(function (file: string) {
        return Fs.statSync(Path.join(cwd, file)).isDirectory() && file.startsWith('jdk-');
      });

      const jdkExecutablePath: string = Path.join(
        cwd, directories[0], 'bin', 'java'
      );

      Fs.chmodSync(ltexLsScriptPath, 0o755);
      Fs.chmodSync(jdkExecutablePath, 0o755);    
    }
    
    const workspaceConfig: Code.WorkspaceConfiguration = Code.workspace.getConfiguration('ltex');
    const initialJavaHeapSize: number | undefined = workspaceConfig.get('java.initialHeapSize');
    const maximumJavaHeapSize: number | undefined = workspaceConfig.get('java.maximumHeapSize');
    const javaArguments: string[] = [];

    if (initialJavaHeapSize != null) javaArguments.push(`-Xms${initialJavaHeapSize}m`);
    if (maximumJavaHeapSize != null) javaArguments.push(`-Xmx${maximumJavaHeapSize}m`);
    env['JAVA_OPTS'] = javaArguments.join(' ');

    if (DependencyManager._isWindows) {
      return {command: '"'+ltexLsScriptPath+'"', args: [], options: {'env': env, 'shell': true}};
    } else {
      return {command: ltexLsScriptPath, args: [], options: {'env': env}};
    }
  }

  public static getDebugServerOptions(): CodeLanguageClient.ServerOptions | null {
    const executableOptions: ChildProcess.SpawnSyncOptionsWithStringEncoding =
    DependencyManager._isWindows ? {
      encoding: 'utf-8',
      timeout: 30000,
      shell: true,
    }
    : {
      encoding: 'utf-8',
      timeout: 30000,
    };
    const childProcess: ChildProcess.SpawnSyncReturns<string> = ((this._isWindows)
        ? ChildProcess.spawnSync('wmic', ['process', 'list', 'FULL'], executableOptions)
        : ChildProcess.spawnSync('ps', ['-A', '-o', 'args'], executableOptions));
    if (childProcess.status != 0) return null;
    const output: string = childProcess.stdout;

    const matchPos: number = output.search(
        /LtexLanguageServerLauncher.*--server-type(?: +|=)tcpSocket/);
    if (matchPos == -1) return null;
    const startPos: number = output.lastIndexOf('\n', matchPos);
    const endPos: number = output.indexOf('\n', matchPos);
    const line: string = output.substring(((startPos != -1) ? startPos : 0),
        ((endPos != -1) ? endPos : output.length));

    const match: RegExpMatchArray | null = line.match(/--port(?: +|=)([0-9]+)/);
    if (match == null) return null;
    const port: number = parseInt(match[1]);
    if (port == 0) return null;

    const socket: Net.Socket = new Net.Socket();
    socket.connect(port, 'localhost');

    return () => {
      return Promise.resolve({writer: socket, reader: socket});
    };
  }

  public get vscodeLtexVersion(): string {
    return this._vscodeLtexVersion;
  }

  public get ltexLsVersion(): string | null {
    return this._ltexLsVersion;
  }

  public get javaVersion(): string | null {
    return this._javaVersion;
  }
}
