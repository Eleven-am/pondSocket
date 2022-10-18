
export declare class LiveRouter {

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
}

export {};
