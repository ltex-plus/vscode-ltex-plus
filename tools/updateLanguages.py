#!/usr/bin/python3

# Copyright (C) 2019-2025
# Julian Valentin, Daniel Spitzer, LTeX+ Development Community
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.

import argparse
import glob
import json
import os
import pathlib
import re
import shlex
import subprocess
import sys
import urllib.request
from typing import Any, Dict, Mapping, Sequence, Set, Tuple

sys.path.append(str(pathlib.Path(__file__).parent))
import common



toolsDirPath = common.repoDirPath.joinpath("tools")



def run(cmd: Sequence[str], **kwargs: Any) -> subprocess.CompletedProcess[bytes]:
  print("Running {}...".format(" ".join(shlex.quote(x) for x in cmd)))
  return subprocess.run(cmd, stdout=subprocess.PIPE, cwd=toolsDirPath)

HOSTED_LANGUAGES_URL = "https://api.languagetoolplus.com/v2/languages"



def fetchHostedLanguages(url: str = HOSTED_LANGUAGES_URL) -> Dict[str, str]:
  print(f"Fetching hosted LT language list from {url}...")
  with urllib.request.urlopen(url) as response:
    entries = json.load(response)
  return {entry["longCode"]: entry["name"] for entry in entries}



def fetchLanguages(toolsDirPath: pathlib.Path, ltexLsPath: pathlib.Path
      ) -> Tuple[Sequence[str], Sequence[str], Mapping[str, str], Set[str]]:
  classPath = os.pathsep.join([str(toolsDirPath), str(ltexLsPath.joinpath("lib", "*"))])
  run(["javac", "-cp", classPath, "LanguageToolLanguageLister.java"])
  process = run(["java", "-cp", classPath, "LanguageToolLanguageLister"])
  stdout = process.stdout.decode()

  canonicalNames: Dict[str, str] = {}
  aliasOfByCode: Dict[str, str] = {}
  for line in stdout.splitlines():
    parts = line.split("\t")
    if len(parts) != 3: continue
    recordType, code, payload = parts
    if recordType == "CANONICAL":
      canonicalNames[code] = payload
    elif recordType == "ALIAS":
      aliasOfByCode[code] = payload

  jarCodes: Set[str] = set(canonicalNames.keys()) | set(aliasOfByCode.keys())

  hostedNamesByCode = fetchHostedLanguages()
  hostedCodes = set(hostedNamesByCode.keys())

  jarOnly = jarCodes - hostedCodes
  assert not jarOnly, (
      "Local-jar codes missing from hosted LT API: {}. The script assumes "
      "every locally accepted code is also accepted by the hosted server, so "
      "that hosted-API entries can be marked simply as 'remote-only'. If this "
      "assertion fires, the docs need a way to advertise 'local-only' codes "
      "too -- see updateLanguages.py and updatePagesFromSource.py.".format(
          sorted(jarOnly)))

  remoteOnlyByCode: Dict[str, str] = {
      code: hostedNamesByCode[code] for code in sorted(hostedCodes - jarCodes)}

  # Collapse hosted-only aliases that the LT API exposes as separate canonical
  # entries even though they resolve to the same checker. `no` is the legacy
  # ISO 639-1 macrolanguage code; `nb` is the modern Bokmål code, and the
  # hosted API returns both with the same display name.
  HOSTED_ALIAS_OF: Dict[str, str] = {"no": "nb"}
  for alias, canonical in HOSTED_ALIAS_OF.items():
    if alias in remoteOnlyByCode and canonical in remoteOnlyByCode:
      aliasOfByCode[alias] = canonical

  allCodes = sorted(jarCodes | set(remoteOnlyByCode.keys()))
  def nameOf(code: str) -> str:
    if code in canonicalNames: return canonicalNames[code]
    if code in aliasOfByCode and aliasOfByCode[code] in canonicalNames:
      return canonicalNames[aliasOfByCode[code]]
    return remoteOnlyByCode[code]
  allNames = [nameOf(code) for code in allCodes]
  return allCodes, allNames, aliasOfByCode, set(remoteOnlyByCode.keys())



def updatePackageJson(ltLanguageShortCodes: Sequence[str]) -> None:
  packageJsonPath = common.repoDirPath.joinpath("package.json")
  with open(packageJsonPath, "r") as f: packageJson = json.load(f)
  settings = packageJson["contributes"]["configuration"]["properties"]

  for settingName in ["ltex.language", "ltex.additionalRules.motherTongue"]:
    curLtLanguageShortCodes = list(ltLanguageShortCodes)

    if settingName == "ltex.language":
      curLtLanguageShortCodes.insert(0, "auto")
    elif settingName == "ltex.additionalRules.motherTongue":
      curLtLanguageShortCodes.insert(0, "")

    settings[settingName]["enum"] = curLtLanguageShortCodes
    settings[settingName]["markdownEnumDescriptions"] = [
        f"%ltex.i18n.configuration.{settingName}.{x if len(x) > 0 else 'emptyString'}."
        "markdownEnumDescription%"
        for x in curLtLanguageShortCodes]
    settings[settingName]["enumDescriptions"] = [
        f"%ltex.i18n.configuration.{settingName}.{x if len(x) > 0 else 'emptyString'}."
        "enumDescription%"
        for x in curLtLanguageShortCodes]

  for settingName in ["ltex.dictionary", "ltex.disabledRules", "ltex.enabledRules",
        "ltex.hiddenFalsePositives"]:
    settings[settingName]["propertyNames"] = {
          "type": "string",
          "enum": ltLanguageShortCodes,
        }
    settings[settingName]["properties"] = {
          languageShortCode: {
            "type" : "array",
            "items" : {
              "type" : "string",
            },
            "markdownDescription" : f"%ltex.i18n.configuration.{settingName}."
              f"{languageShortCode}.markdownDescription%",
          }
          for languageShortCode in ltLanguageShortCodes
        }

  with open(packageJsonPath, "w") as f:
    json.dump(packageJson, f, indent='	', ensure_ascii=False)
    f.write("\n")



def updatePackageNlsJson(ltLanguageShortCodes: Sequence[str], ltLanguageNames: Sequence[str],
      aliasOfByCode: Mapping[str, str], remoteOnlyCodes: Set[str], uiLanguage: str) -> None:
  packageNlsJsonPath = common.repoDirPath.joinpath("package.nls.json" if uiLanguage == "en" else
      f"package.nls.{uiLanguage}.json")
  with open(packageNlsJsonPath, "r") as f: oldPackageNlsJson = json.load(f)

  newPackageNlsJson = {}

  for key, value in oldPackageNlsJson.items():
    if key == "ltex.i18n.configuration.ltex.language.fullMarkdownDescription":
      newPackageNlsJson[key] = value
      curLtLanguageShortCodes = ["auto"] + ltLanguageShortCodes
      curLtLanguageNames = [{
            "en" : "Automatic language detection (not recommended)",
            "de" : "Automatische Spracherkennung (nicht empfohlen)",
          }[uiLanguage]] + ltLanguageNames

      for ltLanguageShortCode, ltLanguageName in zip(curLtLanguageShortCodes, curLtLanguageNames):
        prefix = f"ltex.i18n.configuration.ltex.language.{ltLanguageShortCode}"
        if ltLanguageShortCode in aliasOfByCode:
          canonical = aliasOfByCode[ltLanguageShortCode]
          description = (f"{ltLanguageName} (Alias von `{canonical}`)" if uiLanguage == "de"
              else f"{ltLanguageName} (alias of `{canonical}`)")
          newPackageNlsJson[f"{prefix}.markdownEnumDescription"] = description
          newPackageNlsJson[f"{prefix}.enumDescription"] = description
          newPackageNlsJson[f"{prefix}.aliasOf"] = canonical
        else:
          newPackageNlsJson[f"{prefix}.markdownEnumDescription"] = ltLanguageName
          newPackageNlsJson[f"{prefix}.enumDescription"] = ltLanguageName
        if ltLanguageShortCode in remoteOnlyCodes:
          newPackageNlsJson[f"{prefix}.remoteOnly"] = "true"

    elif re.match(r"^ltex\.i18n\.configuration\.ltex\.language\..+\.", key) is not None:
      continue

    elif key == "ltex.i18n.configuration.ltex.dictionary.fullMarkdownDescription":
      newPackageNlsJson[key] = value

      for ltLanguageShortCode, ltLanguageName in zip(ltLanguageShortCodes, ltLanguageNames):
        prefix = f"ltex.i18n.configuration.ltex.dictionary.{ltLanguageShortCode}"

        if uiLanguage == "de":
          newPackageNlsJson[f"{prefix}.markdownDescription"] = (
              "Liste von zusätzlichen Wörtern der Sprache "
              f"`{ltLanguageShortCode}` ({ltLanguageName}), die nicht als Schreibfehler "
              "gewertet werden sollen.")
        else:
          newPackageNlsJson[f"{prefix}.markdownDescription"] = (
              f"List of additional `{ltLanguageShortCode}` ({ltLanguageName}) words that should "
              "not be counted as spelling errors.")

    elif re.match(r"^ltex\.i18n\.configuration\.ltex\.dictionary\..+\.", key) is not None:
      continue

    elif key == "ltex.i18n.configuration.ltex.disabledRules.fullMarkdownDescription":
      newPackageNlsJson[key] = value

      for ltLanguageShortCode, ltLanguageName in zip(ltLanguageShortCodes, ltLanguageNames):
        prefix = f"ltex.i18n.configuration.ltex.disabledRules.{ltLanguageShortCode}"

        if uiLanguage == "de":
          newPackageNlsJson[f"{prefix}.markdownDescription"] = (
              "Liste von zusätzlichen Regeln der Sprache "
              f"`{ltLanguageShortCode}` ({ltLanguageName}), die deaktiviert werden sollen "
              "(falls standardmäßig durch LanguageTool aktiviert).")
        else:
          newPackageNlsJson[f"{prefix}.markdownDescription"] = (
              f"List of additional `{ltLanguageShortCode}` ({ltLanguageName}) rules that should "
              "be disabled (if enabled by default by LanguageTool).")

    elif re.match(r"^ltex\.i18n\.configuration\.ltex\.disabledRules\..+\.", key) is not None:
      continue

    elif key == "ltex.i18n.configuration.ltex.enabledRules.fullMarkdownDescription":
      newPackageNlsJson[key] = value

      for ltLanguageShortCode, ltLanguageName in zip(ltLanguageShortCodes, ltLanguageNames):
        prefix = f"ltex.i18n.configuration.ltex.enabledRules.{ltLanguageShortCode}"

        if uiLanguage == "de":
          newPackageNlsJson[f"{prefix}.markdownDescription"] = (
              "Liste von zusätzlichen Regeln der Sprache "
              f"`{ltLanguageShortCode}` ({ltLanguageName}), die aktiviert werden sollen "
              "(falls standardmäßig durch LanguageTool deaktiviert).")
        else:
          newPackageNlsJson[f"{prefix}.markdownDescription"] = (
              f"List of additional `{ltLanguageShortCode}` ({ltLanguageName}) rules that should "
              "be enabled (if disabled by default by LanguageTool).")

    elif re.match(r"^ltex\.i18n\.configuration\.ltex\.enabledRules\..+\.", key) is not None:
      continue

    elif key == "ltex.i18n.configuration.ltex.hiddenFalsePositives.fullMarkdownDescription":
      newPackageNlsJson[key] = value

      for ltLanguageShortCode, ltLanguageName in zip(ltLanguageShortCodes, ltLanguageNames):
        prefix = f"ltex.i18n.configuration.ltex.hiddenFalsePositives.{ltLanguageShortCode}"

        if uiLanguage == "de":
          newPackageNlsJson[f"{prefix}.markdownDescription"] = (
              "Liste von falschen Fehlern der Sprache "
              f"`{ltLanguageShortCode}` ({ltLanguageName}), die verborgen werden sollen.")
        else:
          newPackageNlsJson[f"{prefix}.markdownDescription"] = (
              f"List of `{ltLanguageShortCode}` ({ltLanguageName}) false-positive diagnostics to hide.")

    elif re.match(r"^ltex\.i18n\.configuration\.ltex\.hiddenFalsePositives\..+\.", key) is not None:
      continue

    elif key == "ltex.i18n.configuration.ltex.additionalRules.motherTongue.markdownDescription":
      newPackageNlsJson[key] = value

      prefix = f"ltex.i18n.configuration.ltex.additionalRules.motherTongue.emptyString"

      if uiLanguage == "de":
        newPackageNlsJson[f"{prefix}.markdownEnumDescription"] = "Keine Muttersprache"
        newPackageNlsJson[f"{prefix}.enumDescription"] = "Keine Muttersprache"
      else:
        newPackageNlsJson[f"{prefix}.markdownEnumDescription"] = "No mother tongue"
        newPackageNlsJson[f"{prefix}.enumDescription"] = "No mother tongue"

      for ltLanguageShortCode, ltLanguageName in zip(ltLanguageShortCodes, ltLanguageNames):
        prefix = f"ltex.i18n.configuration.ltex.additionalRules.motherTongue.{ltLanguageShortCode}"
        if ltLanguageShortCode in aliasOfByCode:
          canonical = aliasOfByCode[ltLanguageShortCode]
          description = (f"{ltLanguageName} (Alias von `{canonical}`)" if uiLanguage == "de"
              else f"{ltLanguageName} (alias of `{canonical}`)")
          newPackageNlsJson[f"{prefix}.markdownEnumDescription"] = description
          newPackageNlsJson[f"{prefix}.enumDescription"] = description
          newPackageNlsJson[f"{prefix}.aliasOf"] = canonical
        else:
          newPackageNlsJson[f"{prefix}.markdownEnumDescription"] = ltLanguageName
          newPackageNlsJson[f"{prefix}.enumDescription"] = ltLanguageName
        if ltLanguageShortCode in remoteOnlyCodes:
          newPackageNlsJson[f"{prefix}.remoteOnly"] = "true"

    elif re.match(r"^ltex\.i18n\.configuration\.ltex\.additionalRules.motherTongue\..+\.",
          key) is not None:
      continue

    else:
      newPackageNlsJson[key] = value

  with open(packageNlsJsonPath, "w") as f:
    json.dump(newPackageNlsJson, f, indent='	', ensure_ascii=False)
    f.write("\n")



def main() -> None:
  parser = argparse.ArgumentParser(description="Fetch all supported language codes from "
      "LanguageTool and updates the language-specific parts of package.json accordingly")
  parser.add_argument("--ltex-ls-path", type=pathlib.Path,
      default=pathlib.Path(__file__).parent.parent.parent.joinpath(
        "ltex-ls", "target", "appassembler"),
      help="Path to ltex-ls relative from the root directory of LTeX, supports wildcards")
  args = parser.parse_args()

  ltexLsPaths = glob.glob(str(common.repoDirPath.joinpath(args.ltex_ls_path)))
  assert len(ltexLsPaths) > 0, "ltex-ls not found"
  assert len(ltexLsPaths) < 2, "multiple ltex-ls found via wildcard"
  ltexLsPath = pathlib.Path(ltexLsPaths[0])
  print(f"Using ltex-ls from {ltexLsPath}")

  print("Fetching languages from LanguageTool...")
  ltLanguageShortCodes, ltLanguageNames, aliasOfByCode, remoteOnlyCodes = fetchLanguages(
      toolsDirPath, ltexLsPath)
  assert len(ltLanguageShortCodes) > 0, "No languages found."
  print("LanguageTool languages: {}".format(", ".join(ltLanguageShortCodes)))
  if aliasOfByCode:
    print("LanguageTool aliases: {}".format(", ".join(
        f"{a} -> {c}" for a, c in sorted(aliasOfByCode.items()))))
  if remoteOnlyCodes:
    print("Remote-only codes (hosted-API only): {}".format(", ".join(sorted(remoteOnlyCodes))))

  print("Updating package.json...")
  updatePackageJson(ltLanguageShortCodes)

  print("Updating package.nls.json...")
  updatePackageNlsJson(ltLanguageShortCodes, ltLanguageNames, aliasOfByCode, remoteOnlyCodes, "en")

  for childPath in sorted(common.repoDirPath.iterdir()):
    match = re.match(r"^package\.nls\.([A-Za-z0-9\-_]+)\.json$", childPath.name)
    if match is None: continue
    uiLanguage = match.group(1)
    print(f"Updating package.nls.{uiLanguage}.json...")
    updatePackageNlsJson(
        ltLanguageShortCodes, ltLanguageNames, aliasOfByCode, remoteOnlyCodes, uiLanguage)



if __name__ == "__main__":
  main()
