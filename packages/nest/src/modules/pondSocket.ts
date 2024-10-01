import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import type { DynamicModule, Provider } from '@nestjs/common';
// eslint-disable-next-line import/no-unresolved
import { HttpAdapterHost, ModuleRef } from '@nestjs/core';

import { getLocalGuards } from '../managers/guards';
import { PondSocketService } from '../services/pondSocket';
import { Metadata, AsyncMetadata } from '../types';

export class PondSocketModule {
    static forRoot ({
        guards = [],
        providers = [],
        imports = [],
        exports = [],
        isGlobal = false,
        redisOptions,
    }: Metadata): DynamicModule {
        const localGuards = getLocalGuards();
        const pondSocketProvider: Provider = {
            provide: PondSocketService,
            useFactory: (moduleRef: ModuleRef, adapterHost: HttpAdapterHost, discovery: DiscoveryService) => new PondSocketService(
                moduleRef,
                discovery,
                adapterHost,
                guards,
                redisOptions,
            ),
            inject: [ModuleRef, HttpAdapterHost, DiscoveryService],
        };

        guards = [...new Set([...localGuards, ...guards])];

        return {
            exports,
            global: isGlobal,
            imports: [...imports, DiscoveryModule],
            module: PondSocketModule,
            providers: [
                pondSocketProvider,
                ...providers,
                ...guards,
            ],
        };
    }

    static forRootAsync ({
        useFactory,
        inject = [],
        guards = [],
        imports = [],
        exports = [],
        providers = [],
        isGlobal = false,
    }: AsyncMetadata): DynamicModule {
        const localGuards = getLocalGuards();

        const pondSocketProvider: Provider = {
            provide: PondSocketService,
            inject: [ModuleRef, HttpAdapterHost, DiscoveryService, ...inject],
            useFactory: async (moduleRef: ModuleRef, adapterHost: HttpAdapterHost, discovery: DiscoveryService, ...args: unknown[]) => {
                const redisOptions = await useFactory(...args);

                return new PondSocketService(
                    moduleRef,
                    discovery,
                    adapterHost,
                    guards,
                    redisOptions,
                );
            },
        };

        guards = [...new Set([...localGuards, ...guards])];

        return {
            exports,
            global: isGlobal,
            imports: [...imports, DiscoveryModule],
            module: PondSocketModule,
            providers: [
                pondSocketProvider,
                ...providers,
                ...guards,
            ],
        };
    }
}
