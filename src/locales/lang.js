import lang_english from "./lang.eng";
import lang_spanish from "./lang.span";

export default class Lang {
    constructor(lang, page) {
        this.setLang(lang)
        this.setPage(page)
    }

    setLang(lang) {
        this.lang = lang;
        if (lang === "span") {
            this.lang = lang_spanish;
        } else if (lang === "eng") {
            this.lang = lang_english;
        } else {
            throw new Error("Language not supported");
        }
        this.setPage(this.page)
    }

    setPage(page) {
        this.page = page
        this.map = this.lang[page]
    }

    getString(key, args = null) {
        if (args === null) {
            return this.map[key];
        } else {
            //eslint-disable-next-line
            return this.map[key].replace(new RegExp("\{([^\{]+)\}", "g"), function(_unused, varName){
                return args[varName];
            });
        }
    }

}