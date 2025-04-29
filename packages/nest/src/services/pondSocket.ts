import PondSocket from '@eleven-am/pondsocket';
import type { Endpoint } from '@eleven-am/pondsocket/types';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import type { DiscoveredClass } from '@golevelup/nestjs-discovery/lib/discovery.interfaces';
// eslint-disable-next-line import/no-unresolved
import { Logger, Type, PipeTransform, OnModuleInit } from '@nestjs/common';
// eslint-disable-next-line import/no-unresolved
import { HttpAdapterHost, ModuleRef } from '@nestjs/core';

import { channelKey, endpointKey } from '../constants';
import { manageChannel } from '../managers/channel';
import { manageChannelInstance } from '../managers/channelInstance';
import { manageConnection } from '../managers/connection';
import { manageEndpoint } from '../managers/endpoint';
import { manageEndpointInstance } from '../managers/endpointInstance';
import { manageEvent } from '../managers/event';
import { manageJoin } from '../managers/join';
import { manageLeave } from '../managers/leave';
import { CanActivate, Constructor, GroupedInstances } from '../types';

export class PondSocketService implements OnModuleInit {
    private readonly logger = new Logger(PondSocketService.name);

    constructor (
        private readonly moduleRef: ModuleRef,
        private readonly discovery: DiscoveryService,
        private readonly adapterHost: HttpAdapterHost,
        private readonly globalGuards: Constructor<CanActivate>[],
        private readonly globalPipes: Constructor<PipeTransform>[],
        private readonly isExclusiveSocketServer: boolean,
    ) {}

    async onModuleInit () {
        const instances = await this.getGroupedInstances();

        const socket = new PondSocket({
            server: this.adapterHost.httpAdapter.getHttpServer(),
            exclusiveServer: this.isExclusiveSocketServer,
        });

        instances.forEach((instance) => this.manageEndpoint(socket, instance));
    }

    private manageEndpoint (socket: PondSocket, groupedInstance: GroupedInstances) {
        const instance = groupedInstance.endpoint.instance;
        const constructor = instance.constructor;
        const metadata = manageEndpoint(constructor).get();
        const { set: setEndpoint } = manageEndpointInstance(instance);

        if (!metadata) {
            return;
        }

        const { get } = manageConnection(instance);
        const channels = [...new Set([...groupedInstance.channels.map((channel) => channel)])];
        const [handler] = get();

        const endpoint = socket.createEndpoint(metadata, async (request, response) => {
            if (handler) {
                await handler.value(instance, this.moduleRef, this.globalGuards, this.globalPipes, request, response);
            } else {
                response.accept();
            }
        });

        this.logger.log(`Mapped {${metadata}} endpoint`);

        if (handler) {
            this.logger.log(`Mapped {${metadata}} connection handler`);
        }

        setEndpoint(endpoint);
        channels.forEach((channel) => this.manageChannel(channel, endpoint, metadata));
    }

    private manageChannel (channel: DiscoveredClass, endpoint: Endpoint, endpointPath: string) {
        const instance = channel.instance;
        const constructor = instance.constructor;
        const path = manageChannel(constructor).get();

        if (!path) {
            return;
        }

        const { set: setChannel } = manageChannelInstance(instance);
        const { get } = manageJoin(instance);
        const [handler] = get();

        const channelInstance = endpoint.createChannel(path, async (request, response) => {
            if (handler) {
                await handler.value(instance, this.moduleRef, this.globalGuards, this.globalPipes, request, response);
            } else {
                response.accept();
            }
        });

        this.logger.log(`Mapped {${endpointPath}${path}} channel`);

        if (handler) {
            this.logger.log(`Mapped {${endpointPath}${path}} join handler`);
        }

        setChannel(channelInstance);
        const { get: getEventHandlers } = manageEvent(instance);
        const { get: getLeaveHandlers } = manageLeave(instance);

        getEventHandlers().forEach((handler) => {
            channelInstance.onEvent(handler.path, async (request, response) => {
                await handler.value(instance, this.moduleRef, this.globalGuards, this.globalPipes, request, response);
            });

            this.logger.log(`Mapped {${endpointPath}${path}} event {${handler.path}}`);
        });

        const [leaveHandler] = getLeaveHandlers();

        if (leaveHandler) {
            channelInstance.onLeave(async (event) => {
                await leaveHandler.value(instance, this.moduleRef, this.globalGuards, this.globalPipes, event);
            });

            this.logger.log(`Mapped {${endpointPath}${path}} leave handler`);
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

        const baseEndpoint = endpoints.length === 1 ?
            endpoints[0].discoveredClass :
            endpoints
                .find((endpoint) => endpoint.discoveredClass.parentModule.name === 'AppModule')?.discoveredClass;

        const groupedInstanceWithBaseEndpoint = groupedInstances.find((groupedInstance) => groupedInstance.endpoint.instance === baseEndpoint?.instance);

        if (channelsWithNoEndpoints.length > 0) {
            if (groupedInstanceWithBaseEndpoint) {
                const channels = channelsWithNoEndpoints.map((instance) => instance.channels).flat();

                groupedInstanceWithBaseEndpoint.channels = [...new Set([...groupedInstanceWithBaseEndpoint.channels, ...channels])];
            } else if (baseEndpoint) {
                const channels = channelsWithNoEndpoints.map((instance) => instance.channels).flat();

                groupedInstances.push({
                    endpoint: baseEndpoint,
                    channels,
                });
            } else {
                throw new Error('No base endpoint found');
            }
        }

        return groupedInstances;
    }
}
