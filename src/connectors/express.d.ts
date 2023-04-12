import { EndpointHandler, Endpoint } from '../endpoint/endpoint';
import { PondPath } from '../utils/matchPattern';

declare global {
    namespace Express {
        export interface Application {
            upgrade(path: PondPath, handler: EndpointHandler): Endpoint;
        }
    }
}
