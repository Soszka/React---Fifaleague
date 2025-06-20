import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import pl from "./locales/pl.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
    es: { translation: es },
    de: { translation: de },
  },
  lng: "pl",
  fallbackLng: "pl",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
