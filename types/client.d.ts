import * as ClientExport from './pondclient';
declare const Client: {
    PondClient: typeof ClientExport.PondClientSocket;
    Channel: typeof ClientExport.Channel;
};
export { Client };
