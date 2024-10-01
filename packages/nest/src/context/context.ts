import type { PondEvent, UserData } from '@eleven-am/pondsocket-common';

import { NestRequest, NestResponse } from '../types';

export class Context {
    readonly #data: Record<string, unknown> = {};

    readonly #request: NestRequest;

    readonly #response: NestResponse;

    readonly #instance: any;

    readonly #propertyKey: string;

    constructor (
        request: NestRequest,
        response: NestResponse,
        instance: any,
        propertyKey: string,
    ) {
        this.#request = request;
        this.#response = response;
        this.#instance = instance;
        this.#propertyKey = propertyKey;
    }

    get joinRequest () {
        return this.#request.joinRequest ?? null;
    }

    get eventRequest () {
        return this.#request.eventRequest ?? null;
    }

    get connection () {
        return this.#request.connection ?? null;
    }

    get leaveEvent () {
        return this.#request.leveeEvent ?? null;
    }

    get joinResponse () {
        return this.#response.joinResponse ?? null;
    }

    get eventResponse () {
        return this.#response.eventResponse ?? null;
    }

    get connectionResponse () {
        return this.#response.connection ?? null;
    }

    get presence () {
        return this.user.presence;
    }

    get assigns () {
        return this.user.assigns;
    }

    get user () {
        if (this.connection) {
            const user: UserData = {
                id: this.connection.id,
                assigns: {},
                presence: {},
            };

            return user;
        } else if (this.leaveEvent) {
            return this.leaveEvent.user;
        }

        return this.joinRequest?.user ?? this.eventRequest!.user;
    }

    get channel () {
        return this.joinRequest?.channel ?? this.eventRequest?.channel ?? this.leaveEvent?.channel ?? null;
    }

    get event () {
        if (this.connection) {
            const event: PondEvent<string> = {
                params: this.connection.params,
                query: this.connection.query,
                payload: {},
                event: 'CONNECTION',
            };

            return event;
        }

        return this.joinRequest?.event ?? this.eventRequest?.event ?? null;
    }

    getClass () {
        return this.#instance.constructor;
    }

    getHandler () {
        return this.#instance[this.#propertyKey];
    }

    getInstance () {
        return this.#instance;
    }

    getMethod () {
        return this.#propertyKey;
    }

    addData (key: string, value: unknown) {
        this.#data[key] = value;
    }

    getData (key: string) {
        return this.#data[key] ?? null;
    }
}
