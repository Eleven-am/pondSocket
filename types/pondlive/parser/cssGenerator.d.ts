import { HtmlSafeString } from "./parser";
export declare type CSSOutput = {
    string: HtmlSafeString;
    classes: Record<string, string>;
};
export declare type CSSGenerator = (statics: TemplateStringsArray, ...dynamics: unknown[]) => CSSOutput;
export declare const CssGenerator: (id: string) => CSSGenerator;
