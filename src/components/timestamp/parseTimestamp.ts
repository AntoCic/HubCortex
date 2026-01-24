import { Timestamp } from "firebase/firestore";
import { toast } from "../toast/toastController";

export function reviveTimestamp(json: { seconds: number; nanoseconds: number; type?: string } | Timestamp): Timestamp {
    if (json instanceof Timestamp) return json
    try {
        return new Timestamp(json.seconds, json.nanoseconds);
    } catch (error) {
        toast.logError({ title: 'reviveTimestamp errore:', message: `seconds:${json.seconds}; nanoseconds:${json.nanoseconds};` });
        return Timestamp.now();
    }
}

export function reviveTimestampsDeep(value: any): any {
    try {
        if (value === null || value === undefined) return value;
        if (value instanceof Timestamp) return value;
        if (
            typeof value === "object" &&
            value.type === "firestore/timestamp/1.0" &&
            typeof value.seconds === "number" &&
            typeof value.nanoseconds === "number"
        ) {
            return reviveTimestamp(value);
        }

        if (Array.isArray(value)) {
            return value.map(v => reviveTimestampsDeep(v));
        }
        if (typeof value === "object") {
            const out: any = {};
            for (const [k, v] of Object.entries(value)) {
                out[k] = reviveTimestampsDeep(v);
            }
            return out;
        }

        return value;

    } catch (err: any) {
        toast.logError({
            title: "reviveTimestampsDeep error",
            message: err?.message ?? "Errore sconosciuto"
        });
        return value;
    }
}


// serialize inline: Timestamp -> {seconds,nanoseconds}
export const serializeTimestamp = (value: any): any => {
    if (value === null || value === undefined) return value
    if (value instanceof Timestamp) {
        return value.toJSON()
    }
    if (value && typeof value === 'object' && (value as any)._methodName === 'serverTimestamp') {
        toast.logError('non puoi salvare un serverTimestamp devi usare Timestamp.now()');
        return Timestamp.now().toJSON()
    }
    if (Array.isArray(value)) {
        return value.map(v => serializeTimestamp(v))
    }
    if (typeof value === 'object') {
        const out: any = {}
        for (const [k, v] of Object.entries(value)) {
            out[k] = serializeTimestamp(v)
        }
        return out
    }
    return value
}