import lang_english from "./lang.eng";
import lang_spanish from "./lang.span";

export default class Lang {
    constructor(lang) {
        this.lang = lang;
        if (lang === "span") {
            this.lang = lang_spanish;
        } else if (lang === "eng") {
            this.lang = lang_english;
        } else {
            throw new Error("Language not supported");
        }
    }

    getLang(key, args = null) {
        if (args === null) {
            return this.lang[key];
        } else {
            //eslint-disable-next-line
            return this.lang[key].replace(new RegExp("\{([^\{]+)\}", "g"), function(_unused, varName){
                return args[varName];
            });
        }
    }

}