/* Copyright (C) 2019-2025
 * Julian Valentin, Daniel Spitzer, LTeX+ Development Community
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


import {runTests, runVSCodeCommand, downloadAndUnzipVSCode, TestOptions}
from '@vscode/test-electron';
import * as ChildProcess from 'child_process';
import * as Fs from 'fs';
import * as Path from 'path';
import * as Rimraf from 'rimraf';

import {version as ltexVersion} from '../package.json';
import {engines} from '../package.json';

let ltexDirPath: string;
let vscodeExecutablePath: string;
let iterations: number = 0;

const originalPath: string | undefined = process.env['PATH'];
const originalJavaHome: string | undefined = process.env['JAVA_HOME'];

async function runTestIteration(useOfflinePackage:boolean): Promise<void> {
  iterations++;
  console.log('');
  console.log(`Running test iteration ${iterations}...`);
  console.log('');
  console.log(`useOfflinePackage = ${useOfflinePackage}`);
  console.log('');

  const tmpDirPrefix: string = Path.join(ltexDirPath, 'tmp-');
  console.log(`Creating temporary directory with prefix '${tmpDirPrefix}'...`);
  const tmpDirPath: string = Fs.mkdtempSync(tmpDirPrefix);
  console.log(`Created temporary directory '${tmpDirPath}'.`);

  const ltexLibDirPath: string = Path.join(ltexDirPath, 'lib');
  const gitCleanArgs: string[] = ['-C', ltexDirPath, 'clean', '-f', '-x', ltexLibDirPath];
  console.log(`Cleaning '${ltexLibDirPath}'...`);
  const childProcess: ChildProcess.SpawnSyncReturns<string> = ChildProcess.spawnSync(
      'git', gitCleanArgs, {encoding: 'utf-8', timeout: 10000});

  if (childProcess.status != 0) {
    throw new Error(`Could not clean '${ltexLibDirPath}'. `
        + `Exit code: ${childProcess.status}. stdout: '${childProcess.stdout}'. `
        + `stderr: '${childProcess.stderr}'.`);
  }

  try {
    const userDataDirPath: string = Path.join(tmpDirPath, 'user');
    const extensionsDirPath: string = Path.join(tmpDirPath, 'extensions');
    const workspaceDirPath: string = Path.join(tmpDirPath, 'workspace');
    Fs.mkdirSync(workspaceDirPath);

    const cliArgs: string[] = [
          '--user-data-dir', userDataDirPath,
          '--extensions-dir', extensionsDirPath,
          '--install-extension', 'james-yu.latex-workshop',
        ];

    if (useOfflinePackage) {
      let platform: string = 'linux';
      if (process.platform == 'darwin') platform = 'mac';
      else if (process.platform == 'win32') platform = 'windows';
      let architecture: string = 'x64';
      if (process.arch == 'arm64') architecture = 'aarch64';
      cliArgs.push('--install-extension', Path.join(ltexDirPath,
          `vscode-ltex-bre-offline-${platform}-${architecture}.vsix`));
    }

    console.log('Calling Code CLI for extension installation...');

    await runVSCodeCommand(cliArgs);

    if (childProcess.status != 0) throw new Error('Could not install extensions.');

    if (originalPath != null) {
      process.env['PATH'] = originalPath;
    } else if (process.env['PATH'] != null) {
      delete process.env['PATH'];
    }

    if (originalJavaHome != null) {
      process.env['JAVA_HOME'] = originalJavaHome;
    } else if (process.env['JAVA_HOME'] != null) {
      delete process.env['JAVA_HOME'];
    }

    if (useOfflinePackage) {
      console.log(`Removing '${ltexLibDirPath}'...`);
      Rimraf.sync(ltexLibDirPath);
      const ltexOfflineLibDirPath: string =
          Path.join(extensionsDirPath, `ltex-bre.vscode-ltex-bre-${ltexVersion}`, 'lib');
      console.log(`Moving '${ltexOfflineLibDirPath}' to '${ltexLibDirPath}'...`);
      Fs.renameSync(ltexOfflineLibDirPath, ltexLibDirPath);
    }

    const testOptions: TestOptions = {
          vscodeExecutablePath: vscodeExecutablePath,
          launchArgs: [
            '--user-data-dir', userDataDirPath,
            '--extensions-dir', extensionsDirPath,
            workspaceDirPath,
          ],
          extensionDevelopmentPath: ltexDirPath,
          extensionTestsPath: Path.join(__dirname, './index'),
        };

    console.log('Running tests...');
    const exitCode: number = await runTests(testOptions);

    if (exitCode != 0) throw new Error(`Test returned exit code ${exitCode}.`);
  } finally {
    if (tmpDirPath != null) {
      try {
        Rimraf.sync(tmpDirPath);
      } catch {
        console.log(`Could not delete temporary directory '${tmpDirPath}', leaving on disk.`);
      }
    }
  }

  return Promise.resolve();
}

async function main(): Promise<void> {
  const fastMode: boolean = process.env.npm_config_fast ? true : false;
  console.log('Running tests in fast mode: ' + fastMode);
  
  ltexDirPath = Path.resolve(__dirname, '..', '..');
  const codeVersion: string = 'stable';
  let codePlatform: string | undefined;

  console.log('Downloading and installing latest stable VS Code...');
  vscodeExecutablePath = await downloadAndUnzipVSCode(codeVersion, codePlatform);

  await runTestIteration(false);
  if(!fastMode){
    await runTestIteration(true);
    console.log('Downloading and installing minimum required version of VS Code...');
    vscodeExecutablePath = await downloadAndUnzipVSCode(engines.vscode.substring(1), codePlatform);
    await runTestIteration(true);
  }
  return Promise.resolve();
}

main();
