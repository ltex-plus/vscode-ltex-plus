/* Copyright (C) 2019-2025
 * Julian Valentin, Daniel Spitzer, LTeX+ Development Community
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Path from "node:path";
import { globSync } from "glob";
import Mocha from "mocha";

export function run(): Promise<void> {
	const mocha: Mocha = new Mocha({
		ui: "bdd",
		timeout: 300000,
		color: true,
	});

	const testsRoot: string = Path.resolve(__dirname, "..");
	const files: string[] = globSync("**/**.test.js", { cwd: testsRoot }).sort();
	files.forEach((x: string) => mocha.addFile(Path.resolve(testsRoot, x)));

	return new Promise((resolve: () => void, reject: (reason?: any) => void) => {
		try {
			mocha.run((failures: number): void => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`));
				} else {
					resolve();
				}
			});
		} catch (e: unknown) {
			console.error(e);
			reject(e);
		}
	});
}
