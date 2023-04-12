import { EndpointHandler, Endpoint } from '../server/endpoint/endpoint';
import { PondPath } from '../server/utils/matchPattern';

declare global {
    namespace Express {
        export interface Application {
            upgrade(path: PondPath, handler: EndpointHandler): Endpoint;
        }
    }
}
