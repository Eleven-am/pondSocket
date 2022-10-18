import { FileUpload } from "./upload";
export interface IncomingUploadMessage {
    files: PondFile[];
}
export declare class PondFile {
    name: string;
    size: number;
    mimetype: string;
    filePath: string;
    destroy(): Promise<void>;
    move(directory: string): Promise<void>;
}
export declare class UploadMessage implements IncomingUploadMessage {
    private readonly _files;
    constructor(files: FileUpload[]);
    get files(): PondFile[];
    /**
     * @desc Accepts the file and moves it to the specified directory
     * @param file - The file to accept
     * @param directory - The directory to move the file to
     */
    private _acceptFile;
    /**
     * @desc Checks if the folder exists
     * @param directory - The directory to check
     * @private
     */
    private _folderExists;
    /**
     * @desc Creates the folder
     * @param directory - The directory to create
     * @private
     */
    private _createFolder;
    /**
     * @desc Moves the file to the specified directory
     * @param file - The file to move
     * @param directory - The directory to move the file to
     * @private
     */
    private _moveFile;
    /**
     * \desc Deletes the file from the temporary directory
     * @param file - The file to delete
     * @private
     */
    private _deleteFile;
    /**
     * @desc Creates a pond file from the file upload
     * @param file - The file to create the pond file from
     * @private
     */
    private _createPondFile;
}
