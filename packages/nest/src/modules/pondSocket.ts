import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
// eslint-disable-next-line import/no-unresolved
import { DynamicModule, Provider } from '@nestjs/common';
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
        options,
    }: Metadata): DynamicModule {
        const localGuards = getLocalGuards();
        const pondSocketProvider: Provider = {
            provide: PondSocketService,
            useFactory: (moduleRef: ModuleRef, adapterHost: HttpAdapterHost, discovery: DiscoveryService) => new PondSocketService(
                moduleRef,
                discovery,
                adapterHost,
                guards,
                options ?? {},
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
        guards = [],
        providers = [],
        imports = [],
        exports = [],
        isGlobal = false,
        useFactory,
        inject,
    }: AsyncMetadata): DynamicModule {
        const provider: Provider = {
            provide: PondSocketService,
            useFactory: async (moduleRef: ModuleRef, adapterHost: HttpAdapterHost, discovery: DiscoveryService, ...args: unknown[]) => {
                const options = await useFactory(...args);
                const localGuards = getLocalGuards();

                guards = [...new Set([...localGuards, ...guards])];

                return new PondSocketService(
                    moduleRef,
                    discovery,
                    adapterHost,
                    guards,
                    options,
                );
            },
            inject: [ModuleRef, HttpAdapterHost, DiscoveryService, ...(inject || [])],
        };

        return {
            exports,
            global: isGlobal,
            imports: [...imports, DiscoveryModule],
            module: PondSocketModule,
            providers: [
                provider,
                ...providers,
                ...guards,
            ],
        };
    }
}
