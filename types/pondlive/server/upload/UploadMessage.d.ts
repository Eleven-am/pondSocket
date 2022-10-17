
export interface IncomingUploadMessage {
    files: PondFile[];
}

export declare class PondFile {
    name: string;
    size: number;
    mimetype: string;
    filePath: string;

    /**
     * @desc Deletes the file from the server
     */
    destroy(): Promise<void>;

    /**
     * @desc Moves the file to a new location
     * @param directory - The directory to move the file to
     */
    move(directory: string): Promise<void>;
}

export declare class UploadMessage implements IncomingUploadMessage {
    get files(): PondFile[];
}
