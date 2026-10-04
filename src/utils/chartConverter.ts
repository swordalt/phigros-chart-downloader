// conversion between Official format to RPE format.
// based on phichain (https://github.com/Ivan-1F/phichain/tree/master/phichain-format) converter.
// all official events are linear segments, hence RPE supports them directly.
// event fitting is optional for reconstructing larger events and reducing file size.
// approximate using EASING_FITTING_EPSILON.

// official format.

interface OfficialNote {
    type: 1 | 2 | 3 | 4; // tap, drag, hold, flick
    time: number;
    holdTime: number;
    positionX: number;
    speed: number;
    floorPosition: number;
}

interface OfficialNumericEvent {
    startTime: number;
    endTime: number;
    start: number;
    end: number;
}

interface OfficialMoveEvent extends OfficialNumericEvent {
    start2?: number; // not present in formatVersion 1
    end2?: number;
}

interface OfficialSpeedEvent {
    startTime: number;
    endTime: number;
    value: number;
}

interface OfficialLine {
    bpm: number;
    judgeLineMoveEvents: OfficialMoveEvent[];
    judgeLineRotateEvents: OfficialNumericEvent[];
    judgeLineDisappearEvents: OfficialNumericEvent[];
    speedEvents: OfficialSpeedEvent[];
    notesAbove: OfficialNote[];
    notesBelow: OfficialNote[];
}

export interface OfficialChart {
    formatVersion: number;
    offset: number;
    judgeLineList: OfficialLine[];
}

// rpe format.

type RpeBeat = [number, number, number];

interface RpeCommonEvent {
    bezier: number;
    bezierPoints: [number, number, number, number];
    easingType: number;
    end: number;
    endTime: RpeBeat;
    start: number;
    startTime: RpeBeat;
}

interface RpeSpeedEvent {
    end: number;
    endTime: RpeBeat;
    start: number;
    startTime: RpeBeat;
}

interface RpeEventLayer {
    alphaEvents: RpeCommonEvent[];
    moveXEvents: RpeCommonEvent[];
    moveYEvents: RpeCommonEvent[];
    rotateEvents: RpeCommonEvent[];
    speedEvents: RpeSpeedEvent[];
}

interface RpeNote {
    above: number;
    alpha: number;
    endTime: RpeBeat;
    isFake: number;
    positionX: number;
    size: number;
    speed: number;
    startTime: RpeBeat;
    type: number;
    visibleTime: number;
    yOffset: number;
}

interface RpeJudgeLine {
    Group: number;
    Name: string;
    Texture: string;
    anchor: [number, number];
    eventLayers: RpeEventLayer[];
    father: number;
    isCover: number;
    notes: RpeNote[];
    numOfNotes: number;
    zOrder: number;
    isGif: boolean;
    rotateWithFather: boolean;
}

export interface RpeChart {
    BPMList: { bpm: number; startTime: RpeBeat }[];
    META: {
        RPEVersion: number;
        background: string;
        charter: string;
        composer: string;
        id: string;
        level: string;
        name: string;
        offset: number;
        song: string;
    };
    judgeLineList: RpeJudgeLine[];
}

export interface RpeMetaInput {
    name: string;
    level: string;
    charter: string;
    composer: string;
    song: string;
    background: string;
    id: string;
}

export interface RpeConvertOptions {
    easingFitting: boolean;
}

// helpers.

const CANVAS_WIDTH = 1350;
const CANVAS_HEIGHT = 900;
const CONSTANT_EVENT_SHRINK_TO = 1 / 4;
const MAX_DENOMINATOR = 10000;

// map note types from official to rpe.
const RPE_NOTE_TYPE: Record<OfficialNote['type'], number> = { 1: 1, 2: 4, 3: 2, 4: 3 };

// approximation.
const approximateFraction = (x: number): [number, number] => {
    let [h0, h1, k0, k1] = [0, 1, 1, 0];
    let v = x;
    for (let i = 0; i < 64; i++) {
        const a = Math.floor(v);
        const h2 = a * h1 + h0;
        const k2 = a * k1 + k0;
        if (k2 > MAX_DENOMINATOR) break;
        [h0, h1, k0, k1] = [h1, h2, k1, k2];
        const frac = v - a;
        if (frac < 1e-9) break;
        v = 1 / frac;
    }
    return [h1, k1];
};

const toRpeBeat = (beat: number): RpeBeat => {
    const clamped = Math.max(0, beat);
    let whole = Math.floor(clamped);
    let [numer, denom] = approximateFraction(clamped - whole);
    if (numer >= denom) {
        whole += 1;
        numer = 0;
        denom = 1;
    }
    return [whole, numer, denom];
};

// easings from easings.net.

type EasingFn = (x: number) => number;

const BACK_C1 = 1.70158;
const BACK_C2 = BACK_C1 * 1.525;
const BACK_C3 = BACK_C1 + 1;
const ELASTIC_C4 = (2 * Math.PI) / 3;
const ELASTIC_C5 = (2 * Math.PI) / 4.5;

const easeOutBounce: EasingFn = x => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
};

// rpe easingtype id.
const RPE_EASINGS: Record<number, EasingFn> = {
    1: x => x,
    2: x => Math.sin((x * Math.PI) / 2),
    3: x => 1 - Math.cos((x * Math.PI) / 2),
    4: x => 1 - (1 - x) ** 2,
    5: x => x ** 2,
    6: x => -(Math.cos(Math.PI * x) - 1) / 2,
    7: x => (x < 0.5 ? 2 * x ** 2 : 1 - (-2 * x + 2) ** 2 / 2),
    8: x => 1 - (1 - x) ** 3,
    9: x => x ** 3,
    10: x => 1 - (1 - x) ** 4,
    11: x => x ** 4,
    12: x => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
    13: x => (x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2),
    14: x => 1 - (1 - x) ** 5,
    15: x => x ** 5,
    16: x => (x === 1 ? 1 : 1 - 2 ** (-10 * x)),
    17: x => (x === 0 ? 0 : 2 ** (10 * x - 10)),
    18: x => Math.sqrt(1 - (x - 1) ** 2),
    19: x => 1 - Math.sqrt(1 - x ** 2),
    20: x => 1 + BACK_C3 * (x - 1) ** 3 + BACK_C1 * (x - 1) ** 2,
    21: x => BACK_C3 * x ** 3 - BACK_C1 * x ** 2,
    22: x => (x < 0.5
        ? (1 - Math.sqrt(1 - (2 * x) ** 2)) / 2
        : (Math.sqrt(1 - (-2 * x + 2) ** 2) + 1) / 2),
    23: x => (x < 0.5
        ? ((2 * x) ** 2 * ((BACK_C2 + 1) * 2 * x - BACK_C2)) / 2
        : ((2 * x - 2) ** 2 * ((BACK_C2 + 1) * (x * 2 - 2) + BACK_C2) + 2) / 2),
    24: x => (x === 0 ? 0 : x === 1 ? 1 : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * ELASTIC_C4) + 1),
    25: x => (x === 0 ? 0 : x === 1 ? 1 : -(2 ** (10 * x - 10)) * Math.sin((x * 10 - 10.75) * ELASTIC_C4)),
    26: easeOutBounce,
    27: x => 1 - easeOutBounce(1 - x),
    28: x => (x < 0.5 ? (1 - easeOutBounce(1 - 2 * x)) / 2 : (1 + easeOutBounce(2 * x - 1)) / 2),
    29: x => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5
        ? -(2 ** (20 * x - 10) * Math.sin((20 * x - 11.125) * ELASTIC_C5)) / 2
        : (2 ** (-20 * x + 10) * Math.sin((20 * x - 11.125) * ELASTIC_C5)) / 2 + 1),
};

// rpe doesn't support certain easings.
const FITTING_CANDIDATES = [1, 3, 2, 6, 5, 4, 7, 9, 8, 12, 11, 10, 13, 15, 14, 17, 16, 19, 18, 22, 21, 20, 23, 25, 24, 29, 27, 26, 28];
const EASING_FITTING_EPSILON = 0.1;
const BEAT_EPSILON = 1e-9;

// Intermediate event, times in beats
interface LinearEvent {
    startBeat: number;
    endBeat: number;
    start: number;
    end: number;
    easing: number; //rpe easing
}

const isConstant = (e: LinearEvent) => e.start === e.end;

const direction = (e: LinearEvent) => Math.sign(e.end - e.start);

const duration = (e: LinearEvent) => e.endBeat - e.startBeat;

const areContiguous = (a: LinearEvent, b: LinearEvent) =>
    Math.abs(a.endBeat - b.startBeat) < BEAT_EPSILON && a.end === b.start;

//replace contagous linear events with one singular linear event
const fitEasing = (events: LinearEvent[]): LinearEvent[] => {
    if (events.length < 2) return events;

    const first = events[0];
    const last = events[events.length - 1];
    const span = last.endBeat - first.startBeat;
    const evaluate = (fn: EasingFn, beat: number) =>
        first.start + (last.end - first.start) * fn((beat - first.startBeat) / span);

    for (const easing of FITTING_CANDIDATES) {
        const fn = RPE_EASINGS[easing];
        const fits = events.every(e =>
            Math.abs(evaluate(fn, e.startBeat) - e.start) <= EASING_FITTING_EPSILON
            && Math.abs(evaluate(fn, e.endBeat) - e.end) <= EASING_FITTING_EPSILON
        );
        if (fits) {
            return [{ startBeat: first.startBeat, endBeat: last.endBeat, start: first.start, end: last.end, easing }];
        }
    }

    return events;
};

/** Group contiguous non-constant events with matching duration and direction, then fit each group. */
const fitEvents = (events: LinearEvent[]): LinearEvent[] => {
    const result: LinearEvent[] = [];
    let buffer: LinearEvent[] = [];

    const accepts = (e: LinearEvent) => {
        if (isConstant(e)) return false;
        if (buffer.length === 0) return true;
        const head = buffer[0];
        return areContiguous(buffer[buffer.length - 1], e)
            && Math.abs(duration(head) - duration(e)) < BEAT_EPSILON
            && direction(head) === direction(e);
    };

    const drain = () => {
        result.push(...fitEasing(buffer));
        buffer = [];
    };

    for (const event of events) {
        if (!accepts(event)) drain();
        if (accepts(event)) buffer.push(event);
        else result.push(event);
    }
    drain();

    return result;
};

/** Phichain-style cleanup of a single event kind. */
const cleanupEvents = (events: LinearEvent[], easingFitting: boolean): LinearEvent[] => {
    const sorted = [...events].sort((a, b) => a.startBeat - b.startBeat);

    // Drop events that end before the chart starts (official charts begin events at -999999),
    // keeping the last one so the line still has a value
    const visible = sorted.filter((e, i) => e.endBeat > 0 || i === sorted.length - 1);

    // Merge contiguous constant events with the same value
    const merged: LinearEvent[] = [];
    for (const event of visible) {
        const last = merged[merged.length - 1];
        if (last && isConstant(last) && isConstant(event) && last.end === event.start && last.endBeat === event.startBeat) {
            last.endBeat = event.endBeat;
        } else {
            merged.push({ ...event, startBeat: Math.max(0, event.startBeat) });
        }
    }

    const fitted = easingFitting ? fitEvents(merged) : merged;

    // unnecessarily long events can be shrunken.
    const shrunk = fitted.map(e =>
        isConstant(e) && e.endBeat - e.startBeat > CONSTANT_EVENT_SHRINK_TO
            ? { ...e, endBeat: e.startBeat + CONSTANT_EVENT_SHRINK_TO }
            : e
    );

    // events that don't change anything can be safely removed.
    let prevEnd: number | undefined;
    return shrunk.filter(e => {
        const redundant = prevEnd !== undefined && isConstant(e) && e.start === prevEnd;
        prevEnd = e.end;
        return !redundant;
    });
};

const toRpeCommonEvent = (e: LinearEvent, round = false): RpeCommonEvent => ({
    bezier: 0,
    bezierPoints: [0, 0, 0, 0],
    easingType: e.easing,
    end: round ? Math.round(e.end) : e.end,
    endTime: toRpeBeat(e.endBeat),
    start: round ? Math.round(e.start) : e.start,
    startTime: toRpeBeat(e.startBeat),
});

// ---------- Conversion ----------

export const officialToRpe = (official: OfficialChart, meta: RpeMetaInput, options: RpeConvertOptions): RpeChart => {
    const baseBpm = official.judgeLineList[0].bpm;

    const judgeLineList = official.judgeLineList.map((line): RpeJudgeLine => {
        // Official time unit is 1/32 beat at the line's own BPM; rescale onto the base BPM
        const ratio = baseBpm / line.bpm;
        const t = (time: number) => (time / 32) * ratio;
        const x = (v: number) => (v - 0.5) * CANVAS_WIDTH;
        const y = (v: number) => (v - 0.5) * CANVAS_HEIGHT;

        const moveX: LinearEvent[] = [];
        const moveY: LinearEvent[] = [];
        for (const e of line.judgeLineMoveEvents) {
            const startBeat = t(e.startTime);
            const endBeat = t(e.endTime);
            if (official.formatVersion === 1) {
                // reference: https://github.com/MisaLiu/phi-chart-render/blob/master/src/chart/convert/official.js#L203
                moveX.push({ startBeat, endBeat, start: x(Math.round(e.start / 1e3) / 880), end: x(Math.round(e.end / 1e3) / 880), easing: 1 });
                moveY.push({ startBeat, endBeat, start: y((e.start % 1e3) / 530), end: y((e.end % 1e3) / 530), easing: 1 });
            } else {
                moveX.push({ startBeat, endBeat, start: x(e.start), end: x(e.end), easing: 1 });
                moveY.push({ startBeat, endBeat, start: y(e.start2 ?? 0), end: y(e.end2 ?? 0), easing: 1 });
            }
        }

        // RPE rotation uses the opposite sign convention
        const rotate = line.judgeLineRotateEvents.map(e => ({
            startBeat: t(e.startTime), endBeat: t(e.endTime), start: -e.start, end: -e.end, easing: 1,
        }));

        const alpha = line.judgeLineDisappearEvents.map(e => ({
            startBeat: t(e.startTime), endBeat: t(e.endTime), start: e.start * 255, end: e.end * 255, easing: 1,
        }));

        const speed = line.speedEvents.map(e => ({
            startBeat: t(e.startTime), endBeat: t(e.endTime), start: e.value / 2 * 9, end: e.value / 2 * 9, easing: 1,
        }));

        // Official hold speed is absolute; RPE note speed is a multiplier of the line speed
        const lineSpeedAt = (time: number) => {
            let value = 0;
            for (const e of line.speedEvents) {
                if (e.startTime <= time && time <= e.endTime) value = e.value;
            }
            return value;
        };

        const createNote = (above: boolean) => (note: OfficialNote): RpeNote => {
            const isHold = note.type === 3;
            let noteSpeed = note.speed;
            if (isHold) {
                const lineSpeed = lineSpeedAt(note.time);
                noteSpeed = lineSpeed === 0 ? 0 : note.speed / lineSpeed;
            }
            return {
                above: above ? 1 : 2,
                alpha: 255,
                endTime: toRpeBeat(t(isHold ? note.time + note.holdTime : note.time)),
                isFake: 0,
                positionX: note.positionX / 18 * CANVAS_WIDTH,
                size: 1,
                speed: noteSpeed,
                startTime: toRpeBeat(t(note.time)),
                type: RPE_NOTE_TYPE[note.type],
                visibleTime: 999999,
                yOffset: 0,
            };
        };

        const notes = [
            ...line.notesAbove.map(createNote(true)),
            ...line.notesBelow.map(createNote(false)),
        ];

        return {
            Group: 0,
            Name: 'Untitled',
            Texture: 'line.png',
            anchor: [0.5, 0.5],
            eventLayers: [{
                alphaEvents: cleanupEvents(alpha, options.easingFitting).map(e => toRpeCommonEvent(e, true)),
                moveXEvents: cleanupEvents(moveX, options.easingFitting).map(e => toRpeCommonEvent(e)),
                moveYEvents: cleanupEvents(moveY, options.easingFitting).map(e => toRpeCommonEvent(e)),
                rotateEvents: cleanupEvents(rotate, options.easingFitting).map(e => toRpeCommonEvent(e)),
                // speed events are kept as-is, matching phichain
                speedEvents: cleanupEvents(speed, false).map(e => ({
                    end: e.end,
                    endTime: toRpeBeat(e.endBeat),
                    start: e.start,
                    startTime: toRpeBeat(e.startBeat),
                })),
            }],
            father: -1,
            isCover: 1,
            notes,
            // does not include holds, ref: https://teamflos.github.io/phira-docs/chart-standard/chart-format/rpe/judgeLine.html
            numOfNotes: notes.filter(n => n.type !== 2).length,
            zOrder: 0,
            isGif: false,
            rotateWithFather: true,
        };
    });

    return {
        BPMList: [{ bpm: baseBpm, startTime: [0, 0, 1] }],
        META: {
            RPEVersion: 150,
            background: meta.background,
            charter: meta.charter,
            composer: meta.composer,
            id: meta.id,
            level: meta.level,
            name: meta.name,
            offset: Math.round(official.offset * 1000),
            song: meta.song,
        },
        judgeLineList,
    };
};
