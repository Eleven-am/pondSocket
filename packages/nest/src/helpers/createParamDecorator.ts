import { manageParameters } from '../managers/parametres';
import { ParamDecoratorCallback } from '../types';

export function createParamDecorator<Input> (callback: ParamDecoratorCallback<Input>) {
    return (data: Input): ParameterDecorator => (target, propertyKey, index) => {
        const { set } = manageParameters(target, propertyKey as string);

        set(index, (context) => callback(data, context));
    };
}
