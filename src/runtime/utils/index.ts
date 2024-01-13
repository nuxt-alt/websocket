import { H3Event } from 'h3';

export class WebSocketUpgradeResponse {
    status: number;
    headers: Headers;
    constructor(_status = 101, _headers: Headers = new Headers()) {
        this.status = _status;
        this.headers = _headers;
    }
}

export function isWebSocketUpgradeRequest(event: H3Event): boolean {
    return event.headers.get('upgrade') === 'websocket';
}

export function upgradeWebSocket(event: H3Event): WebSocketUpgradeResponse {
    return new WebSocketUpgradeResponse();
}