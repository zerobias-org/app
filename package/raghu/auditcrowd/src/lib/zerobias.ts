/**
 * v1-interface compat shim over the v2 client singleton.
 *
 * The AuditCrowd UI was first built against the v1 client, whose components
 * reach the platform through `ZerobiasAppService.getInstance()` returning
 * `{ zerobiasClientApp, zerobiasClientApi }`. The v2 client kept the same
 * app/api split (and the same RxJS observables), so this shim maps the old
 * names onto the v2 singleton (`zerobias-app-service.ts`) — one init, one
 * client, both access styles.
 *
 * New code should import `getZerobiasAppService` directly; this exists so the
 * ported components stay byte-close to their proven originals.
 */
import {
  getZerobiasAppService,
  ZerobiasAppService as V2Service,
} from "./zerobias-app-service";

export type ZerobiasCompatInstance = {
  zerobiasClientApp: V2Service["app"];
  zerobiasClientApi: V2Service["api"];
  enable: boolean;
};

export default class ZerobiasAppService {
  static async getInstance(): Promise<ZerobiasCompatInstance> {
    const svc = await getZerobiasAppService();
    return { zerobiasClientApp: svc.app, zerobiasClientApi: svc.api, enable: true };
  }
}
