"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PondBase = void 0;
const pubSub_1 = require("./pubSub");
const simpleBase_1 = require("./simpleBase");
const enums_1 = require("./enums");
class PondBase extends simpleBase_1.SimpleBase {
    constructor() {
        const broadcast = new pubSub_1.Broadcast();
        super((data) => broadcast.publish(data));
        this._broadcast = broadcast;
    }
    /**
     * @des Generate a key for a new document
     */
    get _nanoid() {
        let id = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 21; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }
    /**
     * @desc Subscribe to the database
     * @param handler - The handler to call when the database is updated
     */
    subscribe(handler) {
        return this._broadcast.subscribe((data) => {
            let change = enums_1.PondBaseActions.UPDATE_IN_POND;
            if (data.oldValue === null)
                change = enums_1.PondBaseActions.ADD_TO_POND;
            else if (data.currentValue === null)
                change = enums_1.PondBaseActions.REMOVE_FROM_POND;
            handler(Object.values(this._getDB()), data.currentValue || data.oldValue, change);
        });
    }
    /**
     * @desc Add a document to the database
     * @param doc - The document to add
     */
    addDoc(doc) {
        return super.set(this._nanoid, doc);
    }
    /**
     * @desc Left join two ponds on a key on this pond and a foreign key on the other pond
     * @param pond - The pond to join with
     * @param key - The key to join on
     * @param foreignKey - The foreign key to join on
     */
    leftJoin(pond, key, foreignKey) {
        const newPond = new PondBase();
        for (const doc of this) {
            const foreignDoc = pond.find((d) => d[foreignKey] === doc.doc[key]);
            newPond.set(doc.id, { ...doc.doc, [key]: (foreignDoc === null || foreignDoc === void 0 ? void 0 : foreignDoc.doc) || null });
        }
        return newPond;
    }
}
exports.PondBase = PondBase;
