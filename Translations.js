/**
 * API: Translate text
 */
function translateText(text, sourceLang, targetLang) {
  if (!text) return "";
  return LanguageApp.translate(text, sourceLang, targetLang);
}
