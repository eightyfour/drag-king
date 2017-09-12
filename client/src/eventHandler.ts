const eventQueuesMap = {
    /**
     * is called with file, JSON object
     */
    moduleConfigLoaded : [],
    loadModuleConfig : [],
    loadSubModuleConfig : [],
    showFileSearch: [],
    hideFileSearch: []
};

export enum fire {
    moduleConfigLoaded,
    loadModuleConfig,
    showFileSearch,
    hideFileSearch
}

interface Events {
    moduleConfigLoaded?: (file: any, obj: any) => void;
    loadModuleConfig?: (file: string) => void;
    loadSubModuleConfig?: (styleName: string) => void;
    showFileSearch?: () => void;
    hideFileSearch?: () => void;
}
/**
 * The eventHandler
 * You can register events via the on method. If the function which you passed returns false it will be removed from the event queue and never called again.
 *
 * You can trigger events with the fire method. This simply calls all functions which are registered to the on event.
 *
 * @type {{on: ((obj:Events)=>any); fire: ((name:string, ...args:any[])=>any)}}
 */
export const eventHandler = {
    /**
     * use this to register a event. If you function returns false it will be removed from the event queue and never
     * called again (until you register it again)!
     *
     * @param obj {Events}
     */
    on : function (obj: Events) {
        Object.keys(eventQueuesMap).forEach(function (key) {
            if (typeof obj[key] === 'function') {
                eventQueuesMap[key].push(obj[key]);
            }
        })
    },
    /**
     *
     * @param name
     * @param args
     */
    fire : function (name: string, ...args: any[]) {
        let argsList;
        if (eventQueuesMap.hasOwnProperty(name)) {
            argsList = [].slice.call(arguments, 1);
            eventQueuesMap[name] = eventQueuesMap[name].filter(function (fc) {
                return fc.apply(null, argsList) !== false;
            });
        }
    }
};