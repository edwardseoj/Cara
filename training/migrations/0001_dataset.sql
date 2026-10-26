-- Raw MediaPipe landmarks only; normalization (spec/) happens at read time.
CREATE TABLE recording_session (
    id          bigserial PRIMARY KEY,
    recorder_id text NOT NULL,  -- pseudonymous
    lighting    text NOT NULL,
    camera      text NOT NULL,
    source      text NOT NULL CHECK (source IN ('webcam', 'video import')),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sample (
    id                   bigserial PRIMARY KEY,
    recording_session_id bigint NOT NULL REFERENCES recording_session ON DELETE CASCADE,
    gesture_label        text NOT NULL,  -- includes 'idle'
    start_ms             integer NOT NULL,  -- offset from session start
    end_ms               integer NOT NULL,
    CHECK (end_ms >= start_ms)
);

CREATE TABLE frame (
    id         bigserial PRIMARY KEY,
    sample_id  bigint NOT NULL REFERENCES sample ON DELETE CASCADE,
    idx        integer NOT NULL,
    ts_ms      integer NOT NULL,
    -- [{"handedness": "Left"|"Right", "landmarks": [{"x":..,"y":..,"z":..} x21]}]
    hands      jsonb NOT NULL,
    UNIQUE (sample_id, idx)
);
