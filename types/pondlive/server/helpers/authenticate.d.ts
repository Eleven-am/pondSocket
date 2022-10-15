import {PondRequest} from "./pondRequest";
import {PondResponse} from "./pondResponse";
import {NextFunction} from "./chainLambda";
import {IncomingConnection, PondResponse as SocketResponse} from "../../../pondsocket";
import {ResponsePicker} from "../../../base";

export declare type Authorizer = (request: PondRequest) => {
    clientId: string | null;
    token: string | null;
    setToken?: boolean;
    clearToken?: boolean;
};
export declare const pondAuthorizer: (secret: string, cookie: string) => Authorizer;
declare type IAuthenticateRequest = (secret: string, cookie: string, authorizer?: Authorizer) => (req: PondRequest, res: PondResponse, next: NextFunction) => void;
declare type IAuthSocketRequest = (secret: string, cookie: string, authorizer?: Authorizer) => (req: IncomingConnection, response: SocketResponse<ResponsePicker.POND>) => void;
export declare const AuthorizeRequest: IAuthenticateRequest;
export declare const AuthorizeUpgrade: IAuthSocketRequest;
export {};
