/// <reference types="express" />
/// <reference types="node" />
/// <reference types="qs" />
import * as LiveExport from "./pondLive";
declare const Live: {
    PondLive: (app: import("express").Express) => LiveExport.PondLiveExpressApp;
    BroadcastChannel: typeof LiveExport.BroadcastChannel;
    createContext<ContextData extends Object>(initialData: ContextData): LiveExport.ContextDistributorType<ContextData>;
    ContextDistributor: typeof LiveExport.ContextDistributor;
    LiveRouter: typeof LiveExport.LiveRouter;
    LiveSocket: typeof LiveExport.LiveSocket;
    join(array: (string | LiveExport.HtmlSafeString)[], separator: string | LiveExport.HtmlSafeString): LiveExport.HtmlSafeString;
    html(statics: TemplateStringsArray, ...dynamics: unknown[]): LiveExport.HtmlSafeString;
    HtmlSafeString: typeof LiveExport.HtmlSafeString;
    getChanges: (diffedObject: any) => any;
    mergeObjects: (obj1: any, obj2: any) => any;
    DeepDiffMapper: (obj1: Record<string, any> | undefined, obj2: Record<string, any>) => Record<string, any>;
    CssGenerator: (id: string) => LiveExport.CSSGenerator;
    ComponentManager: typeof LiveExport.ComponentManager;
    LiveFactory<LiveContext extends Object>(context: LiveExport.LiveBuilder<LiveContext>): LiveExport.LiveComponent<LiveContext>;
    ComponentClass: typeof LiveExport.ComponentClass;
    parseCookies: (headers: import("http").IncomingHttpHeaders) => Record<string, string>;
    pondAuthorizer: (secret: string, cookie: string) => LiveExport.Authorizer;
    AuthorizeRequest: (secret: string, cookie: string, authorizer?: LiveExport.Authorizer | undefined) => (req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: import("express").Response<any, Record<string, any>>, next: import("express").NextFunction) => void;
    AuthorizeUpgrade: (secret: string, cookie: string, authorizer?: LiveExport.Authorizer | undefined) => (req: import("./pondSocket").IncomingConnection, response: import("./pondSocket").PondResponse<import("./pondBase").ResponsePicker.POND>) => void;
    getAuthorizer: (secret: string, cookie: string, authorizer?: LiveExport.Authorizer | undefined) => LiveExport.Authorizer;
    GenerateUploader: LiveExport.UploadPondLiveRequest;
    authoriseUploader: LiveExport.AuthoriseUploader;
    UploadRequest: typeof LiveExport.UploadRequest;
    UploadAuthoriseMessage: typeof LiveExport.UploadAuthoriseMessage;
    PondFile: typeof LiveExport.PondFile;
    UploadMessage: typeof LiveExport.UploadMessage;
    fileExist: (filePath: string) => boolean;
};
export { Live };
