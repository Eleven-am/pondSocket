import { PondResponse } from "../../pondSocket";
import { Response as ExpressResponse } from "express";
declare type Response = PondResponse | ExpressResponse;
declare type RouterType = 'http' | 'socket' | 'client-router';
export declare type RouterHeaders = {
    pageTitle: string | undefined;
    flashMessage: string | undefined;
};
export declare class LiveRouter {
    private readonly _response;
    private _responseSent;
    private readonly _routerType;
    private readonly _headers;
    constructor(response: Response, routerType?: RouterType);
    /**
     * @desc Sets the page title for the next page
     * @param title - The title of the page
     */
    set pageTitle(title: string);
    /**
     * @desc Sets the flash message for the next page
     * @param message - The message to display
     */
    set flashMessage(message: string);
    get sentResponse(): boolean;
    get headers(): RouterHeaders;
    /**
     * @desc Navigates the client to a new page
     * @param path - The path to navigate to
     */
    navigateTo(path: string): Promise<void> | void;
    /**
     * @desc Replaces the current page with a new page
     * @param path - The path to replace with
     */
    replace(path: string): Promise<void> | void;
    private _sendResponse;
    private _sendPondResponse;
    private _sendClientRouterResponse;
}
export {};
