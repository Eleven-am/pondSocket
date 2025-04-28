import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import type { DynamicModule, Provider } from '@nestjs/common';
// eslint-disable-next-line import/no-unresolved
import { HttpAdapterHost, ModuleRef } from '@nestjs/core';

import { getLocalGuards } from '../managers/guards';
import { getLocalPipes } from '../managers/pipes';
import { PondSocketService } from '../services/pondSocket';
import { Metadata, AsyncMetadata } from '../types';

export class PondSocketModule {
    static forRoot (metadata: Metadata): DynamicModule {
        const pondSocketProvider: Provider = {
            provide: PondSocketService,
            useFactory: (moduleRef: ModuleRef, adapterHost: HttpAdapterHost, discovery: DiscoveryService) => new PondSocketService(
                moduleRef,
                discovery,
                adapterHost,
                metadata.guards ?? [],
                metadata.pipes ?? [],
                metadata.isExclusiveSocketServer ?? false,
                metadata.redisOptions,
            ),
            inject: [ModuleRef, HttpAdapterHost, DiscoveryService],
        };

        return this.buildModule(pondSocketProvider, metadata);
    }

    static forRootAsync ({ inject, useFactory, ...metadata }: AsyncMetadata): DynamicModule {
        const pondSocketProvider: Provider = {
            provide: PondSocketService,
            useFactory: async (moduleRef: ModuleRef, adapterHost: HttpAdapterHost, discovery: DiscoveryService, ...args: any[]) => new PondSocketService(
                moduleRef,
                discovery,
                adapterHost,
                metadata.guards ?? [],
                metadata.pipes ?? [],
                metadata.isExclusiveSocketServer ?? false,
                await useFactory(...args),
            ),
            inject: [ModuleRef, HttpAdapterHost, DiscoveryService, ...(inject ?? [])],
        };

        return this.buildModule(pondSocketProvider, metadata);
    }

    private static buildModule (
        provider: Provider,
        {
            guards = [],
            pipes = [],
            providers = [],
            imports = [],
            exports = [],
            isGlobal = false,
        }: Metadata,
    ) {
        const localGuards = getLocalGuards();
        const localPipes = getLocalPipes();

        pipes = [...new Set([...localPipes, ...pipes])];
        guards = [...new Set([...localGuards, ...guards])];

        return {
            exports,
            global: isGlobal,
            imports: [...imports, DiscoveryModule],
            module: PondSocketModule,
            providers: [
                provider,
                ...providers,
                ...guards,
                ...pipes,
            ],
        };
    }
}
