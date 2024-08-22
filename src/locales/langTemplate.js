export function createStringFromTemplate(template, variables) {
    return template.replace(new RegExp("\{([^\{]+)\}", "g"), function(_unused, varName){
        return variables[varName];
    });
}