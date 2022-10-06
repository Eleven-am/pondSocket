import { LiveSocket } from "./liveSocket";
import { CSSGenerator, CSSOutput, HtmlSafeString } from "../../pondserver";
import { LiveRouter } from "./liveRouter";
import { ContextProvider } from "../contextManager";
interface Constructor<T> {
    new (...args: any[]): T;
}
declare type ComponentConstructor = {
    new (...args: any[]): LiveComponent;
};
export interface Route {
    path: string;
    Component: ComponentConstructor;
}

export interface MountContext {
    path: string;
    params: Record<string, string>;
    query: Record<string, string>;
}

export interface RenderContext<LiveContext> {
    context: Readonly<LiveContext>;
    renderRoutes: () => HtmlSafeString;
}

export interface LiveComponent<LiveContext extends Object = any> {
    routes: Route[];
    providers?: ContextProvider[];
    /**
     * @desc Called on every render to generate the CSS for the component.
     * @param context - The context of the component.
     * @param css - The CSS generator.
     */
    manageStyles?(context: LiveContext, css: CSSGenerator): CSSOutput;
    /**
     * @desc Called when the component is mounted.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    mount?(context: MountContext, socket: LiveSocket<LiveContext>, router: LiveRouter): void | Promise<void>;
    /**
     * @desc Called when the value of a provided context changes.
     * @param name - The name of the context that changed.
     * @param provider - The context of the component.
     * @param socketContext - The context of the socket.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    onContextChange?<ContextType>(name: string, provider: ContextType, socketContext: LiveContext, socket: LiveSocket<LiveContext>, router: LiveRouter): void | Promise<void>;
    /**
     * @desc Called when the component is connected to the server over websockets.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    onRendered?(context: Readonly<LiveContext>, socket: LiveSocket<LiveContext>, router: LiveRouter): void | Promise<void>;
    /**
     * @desc Called when the component receives an event from the client.
     * @param event - The event name.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    onEvent?(event: any, context: Readonly<LiveContext>, socket: LiveSocket<LiveContext>, router: LiveRouter): void | Promise<void>;
    /**
     * @desc Called when the component receives an info from the server.
     * @param info - The info content.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    onInfo?(info: any, context: Readonly<LiveContext>, socket: LiveSocket<LiveContext>, router: LiveRouter): void | Promise<void>;
    /**
     * @desc Called when the component is disconnected from the server.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     */
    onUnmount?(context: Readonly<LiveContext>, socket: LiveSocket<LiveContext>): void | Promise<void>;
    /**
     * @desc Called on every render to generate the HTML for the component.
     * @param context - The context of the component.
     * @param classes - The CSS classes generated by the component.
     */
    render(context: RenderContext<LiveContext>, classes: Record<string, string>): HtmlSafeString;
}

export declare function LiveFactory<LiveContext extends Object>(props: LiveComponent<LiveContext>): Constructor<LiveComponent<LiveContext>>;

export declare class Component<LiveContext extends Object = any> implements LiveComponent<LiveContext> {
    routes: Route[];
    providers: ContextProvider[];
    /**
     * @desc Called on every render to generate the CSS for the component.
     * @param context - The context of the component.
     * @param css - The CSS generator.
     */
    manageStyles(context: LiveContext, css: CSSGenerator): CSSOutput;
    /**
     * @desc Called when the component is mounted.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    mount(context: MountContext, socket: LiveSocket<LiveContext>, router: LiveRouter): void;
    /**
     * @desc Called when the component is connected to the server over websockets.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    onRendered(context: Readonly<LiveContext>, socket: LiveSocket<LiveContext>, router: LiveRouter): void;
    /**
     * @desc Called when the component receives an event from the client.
     * @param event - The event name.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    onEvent(event: any, context: Readonly<LiveContext>, socket: LiveSocket<LiveContext>, router: LiveRouter): void;
    /**
     * @desc Called when the component receives an info from the server.
     * @param info - The info content.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     * @param router - The router of this instance of the connection.
     */
    onInfo(info: any, context: Readonly<LiveContext>, socket: LiveSocket<LiveContext>, router: LiveRouter): void;
    /**
     * @desc Called when the component is disconnected from the server.
     * @param context - The context of the component.
     * @param socket - The socket of user connection.
     */
    onUnmount(context: Readonly<LiveContext>, socket: LiveSocket<LiveContext>): void;
    /**
     * @desc Called on every render to generate the HTML for the component.
     * @param context - The context of the component.
     * @param classes - The CSS classes generated by the component.
     */
    render(context: RenderContext<LiveContext>, classes: Record<string, string>): HtmlSafeString;
}