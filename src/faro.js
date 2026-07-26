// Grafana Faro RUM bootstrap. Imported once, first, in main.jsx.
//
// Kill switch: VITE_OBSERVABILITY_ENABLED must be exactly "true", and
// VITE_FARO_URL must be set (the Faro collector URL from Grafana Cloud ->
// Frontend Observability -> Create app). Unset/missing either one = fully
// disabled, zero overhead — same "ship dark by default" convention as the
// backend's OBSERVABILITY_ENABLED (see ../Decipher-Backend/instrumentation.js).
//
// See docs/grafana-observability-plan.md (backend repo) Section 8 for the
// full rationale, including why the backend's CORS config had to allow
// traceparent/tracestate/baggage headers for the tracing correlation below
// to actually work end-to-end.

import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { ReactIntegration, createReactRouterV7Options } from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { matchRoutes, Routes, useLocation, useNavigationType, createRoutesFromChildren } from 'react-router-dom';

const FARO_URL = import.meta.env.VITE_FARO_URL;
const FARO_APP_NAME = import.meta.env.VITE_FARO_APP_NAME || 'decipher-frontend';
const ENABLED = import.meta.env.VITE_OBSERVABILITY_ENABLED === 'true' && !!FARO_URL;

// The backend origin this frontend actually talks to (same var src/services/server.js
// already uses) — trace headers are only ever attached to requests matching this,
// never sent to arbitrary third-party origins the app might fetch from.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export let faro;

if (ENABLED) {
  try {
    faro = initializeFaro({
      url: FARO_URL,
      app: {
        name: FARO_APP_NAME,
        environment: import.meta.env.MODE,
      },
      instrumentations: [
        ...getWebInstrumentations(),
        new TracingInstrumentation({
          instrumentationOptions: {
            // Only attach traceparent/tracestate to requests going to our own
            // backend — never to arbitrary third-party fetches.
            propagateTraceHeaderCorsUrls: [new RegExp(`^${API_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)],
          },
        }),
        new ReactIntegration({
          router: createReactRouterV7Options({
            matchRoutes,
            Routes,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
          }),
        }),
      ],
    });
    console.log('[faro] initialized');
  } catch (err) {
    console.error('[faro] failed to initialize — continuing without RUM:', err?.message);
  }
} else {
  console.log('[faro] disabled (set VITE_OBSERVABILITY_ENABLED=true and VITE_FARO_URL to enable)');
}
