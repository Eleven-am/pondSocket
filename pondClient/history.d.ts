import { DomWatcher } from "./domWatcher";
export declare const router: (watcher: DomWatcher) => void;
export declare const manageHistory: (url: string, action: 'replace' | 'redirect', title?: string, flashMessage?: string) => Promise<void>;
