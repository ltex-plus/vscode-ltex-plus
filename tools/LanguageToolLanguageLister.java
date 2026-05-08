/* Copyright (C) 2019-2025
 * Julian Valentin, Daniel Spitzer, LTeX+ Development Community
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import org.languagetool.Language;
import org.languagetool.Languages;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class LanguageToolLanguageLister {
  public static void main(String[] args) {
    Set<String> canonicalCodes = new HashSet<>();
    for (Language language : Languages.get()) {
      String code = language.getShortCodeWithCountryAndVariant();
      canonicalCodes.add(code);
      System.out.println("CANONICAL\t" + code + "\t" + language.getName());
    }

    String allCodesString = null;
    try {
      Languages.getLanguageForShortCode("__ltex_plus_alias_probe__");
    } catch (IllegalArgumentException e) {
      Matcher m = Pattern.compile("Supported language codes are: ([^.]+)\\.").matcher(e.getMessage());
      if (m.find()) allCodesString = m.group(1);
    }

    if (allCodesString == null) return;

    for (String code : allCodesString.split(",\\s*")) {
      code = code.trim();
      if (code.isEmpty() || canonicalCodes.contains(code)) continue;
      try {
        Language lang = Languages.getLanguageForShortCode(code);
        System.out.println("ALIAS\t" + code + "\t" + lang.getShortCodeWithCountryAndVariant());
      } catch (Exception e) {
        // Listed in the supported-codes message but doesn't resolve -- skip.
      }
    }
  }
}
