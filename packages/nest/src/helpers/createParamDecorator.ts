import 'reflect-metadata';

import { manageParameters } from '../managers/parametres';
import { ParamDecoratorCallback } from '../types';

export function createParamDecorator<Input> (callback: ParamDecoratorCallback<Input>) {
    return (data: Input): ParameterDecorator => (target, propertyKey, index) => {
        const { set } = manageParameters(target, propertyKey as string);
        const type = Reflect.getMetadata('design:paramtypes', target, propertyKey!)[index];

        set(index, (context) => callback(data, context, type));
    };
}
