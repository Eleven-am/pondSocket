import { createServer } from 'http';

import PondSocket from '@eleven-am/pondsocket';
import type { Endpoint } from '@eleven-am/pondsocket/types';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import type { DiscoveredClass } from '@golevelup/nestjs-discovery/lib/discovery.interfaces';
import type { Type } from '@nestjs/common';
// eslint-disable-next-line import/no-unresolved
import { AbstractHttpAdapter, HttpAdapterHost, ModuleRef } from '@nestjs/core';

import { channelKey, endpointKey } from '../constants';
import { manageChannel } from '../managers/channel';
import { manageChannelInstance } from '../managers/channelInstance';
import { manageConnection } from '../managers/connection';
import { manageEndpoint } from '../managers/endpoint';
import { manageEndpointInstance } from '../managers/endpointInstance';
import { manageEvent } from '../managers/event';
import { manageGuards } from '../managers/guards';
import { manageJoin } from '../managers/join';
import { manageLeave } from '../managers/leave';
import { CanActivate, Constructor, GroupedInstances } from '../types';

export class PondSocketService {
    constructor (
        private readonly moduleRef: ModuleRef,
        private readonly discovery: DiscoveryService,
        private readonly adapterHost: HttpAdapterHost,
        private readonly externalGuards: Constructor<CanActivate>[],
    ) {
        const httpAdapter = this.adapterHost.httpAdapter;

        httpAdapter.listen = async (...args: any[]) => {
            const socket = await this.init(httpAdapter);

            return socket.listen(...args);
        };
    }

    private async init (httpAdapter: AbstractHttpAdapter) {
        const groupedInstances = await this.getGroupedInstances();
        const app = httpAdapter.getInstance();
        const server = createServer(app);
        const socket = new PondSocket(server);

        groupedInstances.forEach((groupedInstance) => {
            this.manageEndpoint(socket, groupedInstance);
        });

        return socket;
    }

    private manageEndpoint (
        socket: PondSocket,
        groupedInstance: GroupedInstances,
    ) {
        const instance = groupedInstance.endpoint.instance;
        const constructor = instance.constructor;
        const metadata = manageEndpoint(constructor).get();
        const { set: setGuards } = manageGuards(constructor);
        const { set: setEndpoint } = manageEndpointInstance(instance);

        if (!metadata) {
            return;
        }

        setGuards(this.externalGuards);

        const endpoint = socket.createEndpoint(metadata, async (request, response) => {
            const { get } = manageConnection(instance);
            const [handler] = get();

            if (handler) {
                await handler.value(instance, this.moduleRef, request, response);
            } else {
                response.accept();
            }
        });

        setEndpoint(endpoint);

        const channels = [...new Set([...groupedInstance.channels.map((channel) => channel)])];

        channels.forEach((channel) => {
            this.manageChannel(channel, endpoint);
        });
    }

    private manageChannel (
        channel: DiscoveredClass,
        endpoint: Endpoint,
    ) {
        const instance = channel.instance;
        const constructor = instance.constructor;
        const path = manageChannel(constructor).get();

        if (!path) {
            return;
        }

        const { set: setGuards } = manageGuards(constructor);
        const { set: setChannel } = manageChannelInstance(instance);

        setGuards(this.externalGuards);

        const channelInstance = endpoint.createChannel(path, async (request, response) => {
            const { get } = manageJoin(instance);
            const [handler] = get();

            if (handler) {
                await handler.value(instance, this.moduleRef, request, response);
            } else {
                response.accept();
            }
        });

        setChannel(channelInstance);
        const { get: getEventHandlers } = manageEvent(instance);
        const { get: getLeaveHandlers } = manageLeave(instance);

        getEventHandlers().forEach((handler) => {
            channelInstance.onEvent(handler.path, async (request, response) => {
                await handler.value(instance, this.moduleRef, request, response);
            });
        });

        const [leaveHandler] = getLeaveHandlers();

        if (leaveHandler) {
            channelInstance.onLeave(async (event) => {
                await leaveHandler.value(instance, this.moduleRef, event);
            });
        }
    }

    private async getGroupedInstances () {
        const endpoints = await this.discovery.providersWithMetaAtKey<string>(endpointKey);
        const channels = await this.discovery.providersWithMetaAtKey<string>(channelKey);

        const modules = new Map<Type, {
            endpoints: DiscoveredClass[];
            channels: DiscoveredClass[];
        }>();

        endpoints.forEach((endpoint) => {
            const module = endpoint.discoveredClass.parentModule.injectType as Type;

            if (!modules.has(module)) {
                modules.set(module, {
                    endpoints: [],
                    channels: [],
                });
            }

            modules.get(module)!.endpoints.push(endpoint.discoveredClass);
        });

        channels.forEach((channel) => {
            const module = channel.discoveredClass.parentModule.injectType as Type;

            if (!modules.has(module)) {
                modules.set(module, {
                    endpoints: [],
                    channels: [],
                });
            }

            modules.get(module)!.channels.push(channel.discoveredClass);
        });

        const instances = [...modules.values()];

        const channelsWithNoEndpoints = instances.filter((instance) => instance.channels.length > 0 && instance.endpoints.length === 0);
        const channelsWithEndpoints = instances.filter((instance) => instance.channels.length > 0 && instance.endpoints.length > 0);

        const groupedInstances = channelsWithEndpoints.map((instance) => instance.endpoints.map((endpoint): GroupedInstances => ({
            endpoint,
            channels: instance.channels,
        }))).flat();

        const baseEndpoint = endpoints.find((endpoint) => endpoint.discoveredClass.parentModule.name === 'AppModule');

        if (channelsWithNoEndpoints.length > 0) {
            if (baseEndpoint) {
                const channels = channelsWithNoEndpoints.map((instance) => instance.channels).flat();

                groupedInstances.push({
                    endpoint: baseEndpoint.discoveredClass,
                    channels,
                });
            } else {
                throw new Error('No base endpoint found');
            }
        }

        return groupedInstances;
    }
}
