import * as Client from './pondClient';
import * as Socket from './pondSocket';
import * as Live from './pondLive';
declare const index: {
    Client: typeof Client;
    Socket: typeof Socket;
    Live: typeof Live;
};
export default index;
