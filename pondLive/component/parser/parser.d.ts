declare type StaticParsed = Record<string, string[]>;
declare type DynamicParsed = Record<string, unknown>;
export declare type ParsedHTML = StaticParsed | DynamicParsed;
export declare function join(array: (string | HtmlSafeString)[], separator: string | HtmlSafeString): HtmlSafeString;
export declare class HtmlSafeString {
    private readonly statics;
    private readonly dynamics;
    constructor(statics: readonly string[], dynamics: unknown[]);
    toString(): string;
    getParts(): ParsedHTML;
    parsedHtmlToString(parsed: ParsedHTML): string;
    differentiate(parsed: HtmlSafeString): Record<string, any>;
    reconstruct(changes: Record<string, any>): HtmlSafeString;
    parse(parts: ParsedHTML): HtmlSafeString;
}
export declare function html(statics: TemplateStringsArray, ...dynamics: unknown[]): HtmlSafeString;
export {};
