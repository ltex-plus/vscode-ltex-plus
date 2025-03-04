<!--
   - Copyright (C) 2019-2025
   - Julian Valentin, Daniel Spitzer, LTeX+ Development Community
   -
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at https://mozilla.org/MPL/2.0/.
   -->

# BRE LT<sub>E</sub>X+ Extension for VS Code: Grammar/Spell Checker Using LanguageTool with Support for L<sup>A</sup>T<sub>E</sub>X, Markdown, and Others

**LT<sub>E</sub>X+** provides offline grammar checking of various markup languages in Visual Studio Code using [LanguageTool (LT)](https://languagetool.org/). LT<sub>E</sub>X+ currently supports:
- L<sup>A</sup>T<sub>E</sub>X, BibT<sub>E</sub>X, ConT<sub>E</sub>Xt and rsweave
- Markdown, MDX and Quarto
- Typst
- Org and Neorg
- reStructuredText
- XHTML

In addition, LT<sub>E</sub>X+ can check comments in many popular programming languages (optional, opt-in).

The difference to regular spell checkers is that LT<sub>E</sub>X+ not only detects spelling errors, but also many grammar and stylistic errors such as:

- `This is an mistake.`
- `The bananas is tasty.`
- `We look forward to welcome you.`
- `Are human beings any different than animals?`

A classic use case of LT<sub>E</sub>X+ is checking scientific L<sup>A</sup>T<sub>E</sub>X papers, but why not check your next blog post, book chapter, or long e-mail before you send it to someone else?

[Find more information and documentation about LT<sub>E</sub>X+ on the official website.](https://ltex-plus.github.io/ltex-plus)

Until version 13.1.0, Julian Valentin developed LT<sub>E</sub>X+ as [LT<sub>E</sub>X](https://github.com/valentjn/vscode-ltex). 
LT<sub>E</sub>X is a fork of the abandoned [LanguageTool for Visual Studio Code extension](https://github.com/adamvoss/vscode-languagetool). This extension would not have been possible without the work of Adam Voss<sup>†</sup> and Julian Valentin.

## Features

![Grammar/Spell Checker for VS Code with LanguageTool and LaTeX Support](https://github.com/ltex-plus/vscode-ltex-plus/blob/develop/img/banner-ltex.png?raw=true)

- Comes with **everything included,** no need to install Java or LanguageTool
- **Offline checking:** Does not upload anything to the internet
- Supports **over 20 languages:** English, French, German, Dutch, Chinese, Russian, etc.
- **Issue highlighting** with hover description
- **Replacement suggestions** via quick fixes
- **User dictionaries**
- **Multilingual support** with babel commands or magic comments
- Possibility to use **external LanguageTool servers**
- **[Extensive documentation](https://ltex-plus.github.io/ltex-plus)**

## Requirements

- 64-bit Linux, Mac, or Windows operating system
- [VS Code 1.82.0 or newer](https://code.visualstudio.com/)
- Optional:
  - If you want to check documents written in a markup language that VS Code does not support out-of-the-box (e.g., L<sup>A</sup>T<sub>E</sub>X), install an extension that provides support for that language (e.g., [LaTeX Workshop Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop)) in addition to this extension.

## How to Use

1. Install the requirements listed above
2. Install this extension (see [download options](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html#how-to-install-and-use))
3. Reload the VS Code window if necessary
4. Open a L<sup>A</sup>T<sub>E</sub>X or a Markdown document, or open a new file and change the language mode to `LaTeX` or `Markdown` (open the Command Palette and select `Change Language Mode`)
5. Wait until [ltex-ls](https://ltex-plus.github.io/ltex-plus/faq.html#whats-the-difference-between-vscode-ltex-ltex-ls-and-languagetool) has been found; if necessary, LT<sub>E</sub>X+ downloads it for you. Alternatively, you can choose [offline installation](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html#offline-installation).
6. Grammar/spelling errors will be displayed! (if there are any)

## Information & Documentation

- [General Information](https://ltex-plus.github.io/ltex-plus/index.html)
  - [Overview](https://ltex-plus.github.io/ltex-plus/index.html)
  - [Installation &amp; Usage](https://ltex-plus.github.io/ltex-plus/installation-usage.html)
    - [Via Editor Extensions](https://ltex-plus.github.io/ltex-plus/installation-usage.html#via-editor-extensions)
      - [Official Extensions](https://ltex-plus.github.io/ltex-plus/installation-usage.html#official-extensions)
      - [Third-Party Extensions](https://ltex-plus.github.io/ltex-plus/installation-usage.html#third-party-extensions)
    - [Via Language Clients](https://ltex-plus.github.io/ltex-plus/installation-usage.html#via-language-clients)
    - [Via Command Line](https://ltex-plus.github.io/ltex-plus/installation-usage.html#via-command-line)
  - [Supported Languages](https://ltex-plus.github.io/ltex-plus/supported-languages.html)
    - [Code Languages](https://ltex-plus.github.io/ltex-plus/supported-languages.html#code-languages)
      - [Markup Languages](https://ltex-plus.github.io/ltex-plus/supported-languages.html#markup-languages)
      - [Programming Languages](https://ltex-plus.github.io/ltex-plus/supported-languages.html#programming-languages)
    - [Natural Languages](https://ltex-plus.github.io/ltex-plus/supported-languages.html#natural-languages)
  - [Advanced Usage](https://ltex-plus.github.io/ltex-plus/advanced-usage.html)
    - [Magic Comments](https://ltex-plus.github.io/ltex-plus/advanced-usage.html#magic-comments)
    - [Multilingual L<sup>A</sup>T<sub>E</sub>X Documents with the babel Package](https://ltex-plus.github.io/ltex-plus/advanced-usage.html#multilingual-latex-documents-with-the-babel-package)
    - [Set Language in Markdown with YAML Front Matter](https://ltex-plus.github.io/ltex-plus/advanced-usage.html#set-language-in-markdown-with-yaml-front-matter)
    - [Hiding False Positives with Regular Expressions](https://ltex-plus.github.io/ltex-plus/advanced-usage.html#hiding-false-positives-with-regular-expressions)
    - [LanguageTool HTTP Servers](https://ltex-plus.github.io/ltex-plus/advanced-usage.html#languagetool-http-servers)
  - [Settings](https://ltex-plus.github.io/ltex-plus/settings.html)
    - [`ltex.enabled`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexenabled)
    - [`ltex.language`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexlanguage)
    - [`ltex.dictionary`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexdictionary)
    - [`ltex.disabledRules`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexdisabledrules)
    - [`ltex.enabledRules`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexenabledrules)
    - [`ltex.hiddenFalsePositives`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexhiddenfalsepositives)
    - [`ltex.bibtex.fields`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexbibtexfields)
    - [`ltex.latex.commands`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexlatexcommands)
    - [`ltex.latex.environments`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexlatexenvironments)
    - [`ltex.markdown.nodes`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexmarkdownnodes)
    - [`ltex.configurationTarget`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexconfigurationtarget)
    - [`ltex.additionalRules.enablePickyRules`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexadditionalrulesenablepickyrules)
    - [`ltex.additionalRules.motherTongue`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexadditionalrulesmothertongue)
    - [`ltex.additionalRules.languageModel`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexadditionalruleslanguagemodel)
    - [`ltex.additionalRules.neuralNetworkModel`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexadditionalrulesneuralnetworkmodel)
    - [`ltex.additionalRules.word2VecModel`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexadditionalrulesword2vecmodel)
    - [`ltex.languageToolHttpServerUri`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexlanguagetoolhttpserveruri)
    - [`ltex.languageToolOrg.username`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexlanguagetoolorgusername)
    - [`ltex.languageToolOrg.apiKey`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexlanguagetoolorgapikey)
    - [`ltex.ltex-ls.path`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexltex-lspath)
    - [`ltex.ltex-ls.logLevel`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexltex-lsloglevel)
    - [`ltex.java.path`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexjavapath)
    - [`ltex.java.initialHeapSize`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexjavainitialheapsize)
    - [`ltex.java.maximumHeapSize`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexjavamaximumheapsize)
    - [`ltex.sentenceCacheSize`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexsentencecachesize)
    - [`ltex.completionEnabled`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexcompletionenabled)
    - [`ltex.diagnosticSeverity`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexdiagnosticseverity)
    - [`ltex.checkFrequency`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexcheckfrequency)
    - [`ltex.clearDiagnosticsWhenClosingFile`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexcleardiagnosticswhenclosingfile)
    - [`ltex.statusBarItem`](https://ltex-plus.github.io/ltex-plus/settings.html#ltexstatusbaritem)
    - [`ltex.trace.server`](https://ltex-plus.github.io/ltex-plus/settings.html#ltextraceserver)
  - [FAQ](https://ltex-plus.github.io/ltex-plus/faq.html)
    - [General Questions](https://ltex-plus.github.io/ltex-plus/faq.html#general-questions)
      - [What's the difference between vscode-ltex, ltex-ls, and LanguageTool?](https://ltex-plus.github.io/ltex-plus/faq.html#whats-the-difference-between-vscode-ltex-ltex-ls-and-languagetool)
      - [Why does LT<sub>E</sub>X+ have such a high CPU load?](https://ltex-plus.github.io/ltex-plus/faq.html#why-does-ltex-have-such-a-high-cpu-load)
      - [How can I check multiple languages at once?](https://ltex-plus.github.io/ltex-plus/faq.html#how-can-i-check-multiple-languages-at-once)
      - [Why does LT<sub>E</sub>X+ check in a different language than expected?](https://ltex-plus.github.io/ltex-plus/faq.html#why-does-ltex-check-in-a-different-language-than-expected)
      - [How can I fix multiple spelling errors at the same time?](https://ltex-plus.github.io/ltex-plus/faq.html#how-can-i-fix-multiple-spelling-errors-at-the-same-time)
      - [How can I prevent `\text{...}` in math mode from producing false positives?](https://ltex-plus.github.io/ltex-plus/faq.html#how-can-i-prevent-text-in-math-mode-from-producing-false-positives)
      - [What does LT<sub>E</sub>X+ stand for?](https://ltex-plus.github.io/ltex-plus/faq.html#what-does-ltex-stand-for)
      - [Where can I ask a question that's not answered here?](https://ltex-plus.github.io/ltex-plus/faq.html#where-can-i-ask-a-question-thats-not-answered-here)
    - [Questions about vscode-ltex](https://ltex-plus.github.io/ltex-plus/faq.html#questions-about-vscode-ltex)
      - [How can I prevent vscode-ltex from redownloading ltex-ls after every update?](https://ltex-plus.github.io/ltex-plus/faq.html#how-can-i-prevent-vscode-ltex-from-redownloading-ltex-ls-after-every-update)
      - [Where does vscode-ltex save its settings (e.g., dictionary, false positives)?](https://ltex-plus.github.io/ltex-plus/faq.html#where-does-vscode-ltex-save-its-settings-eg-dictionary-false-positives)
      - [How can I map the `Use '...'` quick fix to a keyboard shortcut in VS Code?](https://ltex-plus.github.io/ltex-plus/faq.html#how-can-i-map-the-use--quick-fix-to-a-keyboard-shortcut-in-vs-code)
  - [Code of Conduct](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html)
    - [Our Pledge](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#our-pledge)
    - [Our Standards](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#our-standards)
    - [Enforcement Responsibilities](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#enforcement-responsibilities)
    - [Scope](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#scope)
    - [Enforcement](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#enforcement)
    - [Enforcement Guidelines](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#enforcement-guidelines)
      - [1. Correction](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#1-correction)
      - [2. Warning](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#2-warning)
      - [3. Temporary Ban](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#3-temporary-ban)
      - [4. Permanent Ban](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#4-permanent-ban)
    - [Attribution](https://ltex-plus.github.io/ltex-plus/code-of-conduct.html#attribution)
- [vscode-ltex-plus](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html)
  - [Installation &amp; Usage (vscode-ltex-plus)](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html)
    - [Download Providers](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html#download-providers)
    - [Requirements](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html#requirements)
    - [How to Install and Use](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html#how-to-install-and-use)
    - [Offline Installation](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html#offline-installation)
      - [First Alternative: Download the Offline Version of LT<sub>E</sub>X+](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html#first-alternative-download-the-offline-version-of-ltex)
      - [Second Alternative: Download ltex-ls/Java Manually](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/installation-usage-vscode-ltex-plus.html#second-alternative-download-ltex-lsjava-manually)
  - [Setting Scopes &amp; Files](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/setting-scopes-files.html)
    - [Multi-Scope Settings](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/setting-scopes-files.html#multi-scope-settings)
    - [External Setting Files](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/setting-scopes-files.html#external-setting-files)
  - [Commands](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html)
    - [`LTeX: Activate Extension`](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html#ltex-activate-extension)
    - [`LTeX: Check Selection`](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html#ltex-check-selection)
    - [`LTeX: Check Current Document`](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html#ltex-check-current-document)
    - [`LTeX: Check All Documents in Workspace`](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html#ltex-check-all-documents-in-workspace)
    - [`LTeX: Clear Diagnostics in Current Document`](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html#ltex-clear-diagnostics-in-current-document)
    - [`LTeX: Clear All Diagnostics`](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html#ltex-clear-all-diagnostics)
    - [`LTeX: Show Status Information`](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html#ltex-show-status-information)
    - [`LTeX: Reset and Restart`](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html#ltex-reset-and-restart)
    - [`LTeX: Report Bug in LTeX`](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html#ltex-report-bug-in-ltex)
    - [`LTeX: Request Feature for LTeX`](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/commands.html#ltex-request-feature-for-ltex)
  - [Changelog](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/changelog.html)
  - [Contributing](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/contributing.html)
    - [Ways of Contribution](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/contributing.html#ways-of-contribution)
    - [How to Report Bugs](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/contributing.html#how-to-report-bugs)
      - [Known Issues and Limitations](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/contributing.html#known-issues-and-limitations)
    - [How to Request Features](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/contributing.html#how-to-request-features)
    - [How to Set Up the Project](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/contributing.html#how-to-set-up-the-project)
    - [How to Contribute Code](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/contributing.html#how-to-contribute-code)
    - [How to Test Pre-Releases](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/contributing.html#how-to-test-pre-releases)
    - [How to Edit the Documentation](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/contributing.html#how-to-edit-the-documentation)
    - [How to Translate the User Interface](https://ltex-plus.github.io/ltex-plus/vscode-ltex-plus/contributing.html#how-to-translate-the-user-interface)
- [ltex-ls-plus (LT<sub>E</sub>X+ LS)](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/installation.html)
  - [Installation](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/installation.html)
    - [Download Providers](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/installation.html#download-providers)
    - [Requirements](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/installation.html#requirements)
    - [Installation](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/installation.html#installation)
  - [Server Usage](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html)
    - [Startup](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#startup)
      - [Command-Line Arguments](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#command-line-arguments)
      - [Exit Codes](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#exit-codes)
    - [Checking Documents with the LSP](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#checking-documents-with-the-lsp)
    - [Settings](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#settings)
    - [Quick Fixes](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#quick-fixes)
    - [Commands](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#commands)
      - [`_ltex.addToDictionary` (Client)](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#ltexaddtodictionary-client)
      - [`_ltex.disableRules` (Client)](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#ltexdisablerules-client)
      - [`_ltex.hideFalsePositives` (Client)](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#ltexhidefalsepositives-client)
      - [`_ltex.checkDocument` (Server)](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#ltexcheckdocument-server)
      - [`_ltex.getServerStatus` (Server)](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#ltexgetserverstatus-server)
    - [Custom LSP Extensions](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#custom-lsp-extensions)
      - [Custom Initialization Options](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#custom-initialization-options)
      - [Custom Requests and Notifications](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#custom-requests-and-notifications)
        - [`ltex/workspaceSpecificConfiguration` (⮎)](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/server-usage.html#ltexworkspacespecificconfiguration-)
  - [CLI Usage](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/cli-usage.html)
    - [Startup](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/cli-usage.html#startup)
      - [Command-Line Arguments](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/cli-usage.html#command-line-arguments)
      - [Exit Codes](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/cli-usage.html#exit-codes)
  - [Changelog](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/changelog.html)
  - [Contributing](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/contributing.html)
    - [Ways of Contribution](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/contributing.html#ways-of-contribution)
    - [How to Report Bugs](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/contributing.html#how-to-report-bugs)
      - [Known Issues and Limitations](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/contributing.html#known-issues-and-limitations)
    - [How to Request Features](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/contributing.html#how-to-request-features)
    - [How to Set Up the Project](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/contributing.html#how-to-set-up-the-project)
    - [How to Contribute Code](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/contributing.html#how-to-contribute-code)
    - [How to Test Pre-Releases](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/contributing.html#how-to-test-pre-releases)
    - [How to Edit the Documentation](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/contributing.html#how-to-edit-the-documentation)
    - [How to Translate the User Interface](https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/contributing.html#how-to-translate-the-user-interface)
