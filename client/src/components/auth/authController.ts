import * as async from 'canny/mod/async.js';
import { auth } from "./auth";

export const authController = function () {
    auth.onLogout(function () {
        // register the listener
        async.doAjax({
            path: '/logout',
            onSuccess: function (response: any): void {
                location.reload();
            }
        })
    });
}
