import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { HTTPMethod } from '../definitions/http-methods';
import { HttpStreamEndpointService } from './http-stream-endpoint.service';
import { StreamContainer } from './http-stream.service';
import { LifecycleService } from './lifecycle.service';
import { OfflineBroadcastService } from './offline-broadcast.service';
import { OfflineError, StreamingCommunicationService } from './streaming-communication.service';

type HttpParamsGetter = () => HttpParams | { [param: string]: string | string[] };
type HttpBodyGetter = () => any;

class StreamContainerWithCloseFn extends StreamContainer {
    public closeFn: () => void;
}

/**
 * Main class for communication in streams with the server. You have to register an
 * endpoint to communicate with `registerEndpoint` and connect to it with `connect`.
 *
 * Note about some behaviours:
 * - The returned function must be called to close the stream.
 * - The connection attempt can block - internally we are waiting for the first message.
 *   If there is no first message, we'll wait...
 * TODO: not good. we want to cancel connection attempts
 * - The fact that `connect` returns does not mean, that we are connected. Maybe we are offline
 *   since offile-handling is managed by this service
 * - When going offline every connection is closed and attempted to reconnect when going
 *   online. This implies that for one connect, multiple requests can be done.
 *   -> Make sure that the streams are build in a way, that it handles reconnects.
 */
@Injectable({
    providedIn: 'root'
})
export class CommunicationManagerService {
    private isRunning = false;

    private requestedStreams: { [id: number]: StreamContainerWithCloseFn } = {};

    public constructor(
        private streamingCommunicationService: StreamingCommunicationService,
        private offlineBroadcastService: OfflineBroadcastService,
        private lifecycleService: LifecycleService,
        private httpEndpointService: HttpStreamEndpointService
    ) {
        this.offlineBroadcastService.goOfflineObservable.subscribe(() => this.stopCommunication());
        this.offlineBroadcastService.goOnlineObservable.subscribe(() => this.startCommunication());
        this.lifecycleService.openslidesBooted.subscribe(() => this.startCommunication());
    }

    public registerEndpoint(name: string, url: string, healthUrl: string, method?: HTTPMethod): void {
        this.httpEndpointService.registerEndpoint(name, url, healthUrl, method);
    }

    public async connect<T>(
        endpointName: string,
        messageHandler: (message: T) => void,
        body?: HttpBodyGetter,
        params?: HttpParamsGetter
    ): Promise<() => void> {
        if (!params) {
            params = () => null;
        }

        const endpoint = this.httpEndpointService.getEndpoint(endpointName);
        const streamContainer = new StreamContainerWithCloseFn(endpoint, messageHandler, params, body);
        this.requestedStreams[streamContainer.id] = streamContainer;

        if (this.isRunning) {
            await this._connect(streamContainer);
        }

        return () => this.close(streamContainer);
    }

    private async _connect(container: StreamContainerWithCloseFn): Promise<void> {
        try {
            container.closeFn = await this.streamingCommunicationService.connect(container);
        } catch (e) {
            if (!(e instanceof OfflineError)) {
                throw e;
            }
        }
    }

    public startCommunication(): void {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        // Do not do it asynchronous blocking: just start everything up and do not care about the succeeding
        for (const container of Object.values(this.requestedStreams)) {
            this._connect(container);
        }
    }

    private stopCommunication(): void {
        this.isRunning = false;
        this.streamingCommunicationService.closeConnections();
        for (const container of Object.values(this.requestedStreams)) {
            if (container.stream) {
                container.stream.close();
            }
            container.stream = null;
        }
    }

    private close(container: StreamContainerWithCloseFn): void {
        if (container.closeFn) {
            container.closeFn();
        }
        delete this.requestedStreams[container.id];
    }
}
