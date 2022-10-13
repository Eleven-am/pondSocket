import { IncomingMessage, Server as HTTPServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { BaseClass, PondError, PondPath, RejectPromise } from "../pondbase";
import { Endpoint, EndpointHandler } from "./endpoint";
import internal from "stream";
import { NextFunction, SocketMiddleWare } from "./socketMiddleWare";

export class PondSocket extends BaseClass {
  private readonly _server: HTTPServer;
  private readonly _socketServer: WebSocketServer;
  private readonly _socketChain: SocketMiddleWare;

  constructor(server?: HTTPServer, socketServer?: WebSocketServer) {
    super();
    this._server = server || new HTTPServer();
    this._socketServer = socketServer || new WebSocketServer({ noServer: true });
    this._socketChain = new SocketMiddleWare(this._server);
    this._init();
  }

  /**
   * @desc Rejects the client's connection
   * @param error - Reason for rejection
   */
  private static _rejectClient(error: RejectPromise<internal.Duplex>) {
    const { errorMessage, errorCode, data: socket } = error;
    socket.write(`HTTP/1.1 ${errorCode} ${errorMessage}\r\n\r\n`);
    socket.destroy();
  }

  /**
   * @desc Specifies the port to listen on
   * @param port - the port to listen on
   * @param callback - the callback to call when the server is listening
   */
  public listen(port: number, callback: (port?: number) => void) {
    return this._server.listen(port, callback);
  }

  /**
   * @desc adds a middleware to the server
   * @param middleware - the middleware to add
   */
  public useOnUpgrade(middleware: (req: IncomingMessage, socket: internal.Duplex, head: Buffer, next: NextFunction) => void) {
    this._socketChain.use(middleware);
  }

  /**
   * @desc Accepts a new socket upgrade request on the provided endpoint using the handler function to authenticate the socket
   * @param path - the pattern to accept || can also be a regex
   * @param handler - the handler function to authenticate the socket
   *
   * @example
   * const endpoint = pond.createEndpoint('/api/socket', (req, res) => {
   *    const { query } = parse(req.url || '');
   *    const { token } = query;
   *    if (!token)
   *       return res.reject("No token provided");
   *    res.accept({
   *       assign: {
   *           token
   *       }
   *    });
   * })
   */
  public createEndpoint(path: PondPath, handler: EndpointHandler) {
    const endpoint = new Endpoint(this._socketServer, handler);
    this._socketChain.use(async (req, socket, head, next) => {
      const address = req.url || "";
      const dataEndpoint = this.generateEventRequest(path, address);
      if (!dataEndpoint)
        return next();

      endpoint.authoriseConnection(req, socket, head, dataEndpoint)
        .catch(error => PondSocket._rejectClient(error));
    });

    return endpoint;
  }

  /**
   * @desc Makes sure that every client is still connected to the pond
   * @param server - WebSocket server
   */
  private _pingClients(server: WebSocketServer) {
    server.on("connection", (ws: WebSocket & { isAlive?: boolean }) => {
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });
    });

    const interval = setInterval(() => {
      server.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    server.on("close", () => clearInterval(interval));
  }

  /**
   * @desc Initializes the server
   */
  private _init() {
    this._server.on("error", (error) => {
      throw new PondError("Server error", 500, { error });
    });

    this._server.on("listening", () => {
      this._pingClients(this._socketServer);
    });
  }
}
