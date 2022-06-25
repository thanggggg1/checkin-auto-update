import { createSetting } from "./index";
import i18next from "i18next";

export enum LanguageEnum {
  VI = "vi",
  EN = "en",
}

const { get: getLanguage, set: _setLanguage, use: useLanguage } = createSetting<
  LanguageEnum
>("language", LanguageEnum.VI);

const initI18next = () => {
  return i18next.init({
    lng: getLanguage(),
    debug: process.env.NODE_ENV !== "production",
    fallbackLng: "en",
    resources: {
      en: {
        translation: require("../../languages/en.json"),
      },
      vi: {
        translation: require("../../languages/vi.json"),
      },
    },
  });
};

const setLanguage = (language: LanguageEnum) => {
  return i18next.changeLanguage(language).then(() => _setLanguage(language));
};

const translate = i18next.t.bind(i18next);
const t = translate;

export { initI18next, getLanguage, setLanguage, useLanguage, translate, t ,_setLanguage,i18next};


export const antdModalLanguageProps = {
  cancelText: t('cancel'),
  okText: t('OK')
}