"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { HeaderProfile, ApiResponse } from "@/lib/api/client";
import { sendRequest } from "@/lib/api/client";
import { generateCurl } from "@/lib/curl/generator";
import {
  getProfiles,
  getActiveProfileId,
  getDefaultProfile,
} from "@/lib/storage/profiles";
import { addHistory } from "@/lib/storage/history";
import HeaderProfileSelector from "@/components/HeaderProfileSelector";
import ResponseViewer from "@/components/ResponseViewer";
import CurlViewer from "@/components/CurlViewer";

const BASE_URL_KEY = "poker-api-base-url";
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type StepDef = {
  title: string;
  description: string;
};

const STEPS: StepDef[] = [
  { title: "Configure", description: "Set profile and base URL for the demo." },
  { title: "Adjust Wallet", description: "Give the player funds via admin wallet adjust." },
  { title: "Create Tournament", description: "Create a new MTT tournament." },
  { title: "Open Registration", description: "Open tournament registration (admin)." },
  { title: "Register Player", description: "Register the current user and check status." },
  { title: "Close Registration", description: "Close registration (admin)." },
  { title: "Start Tournament", description: "Start the tournament (admin)." },
  { title: "Discover Table", description: "Enter the table ID assigned to your player." },
  { title: "Poll Table State", description: "Fetch table state with optional auto-refresh." },
  { title: "Get My Hand", description: "Fetch your cards and allowed actions." },
  { title: "Perform Action", description: "Send a player action (fold, check, call, raise, all-in)." },
  { title: "Admin Advance", description: "Force-advance the table state (admin)." },
  { title: "Finish", description: "Finish the tournament and check final balance." },
];

function buildHeaders(profile: HeaderProfile): Record<string, string> {
  const h: Record<string, string> = {
    "x-vendor-id": profile.vendorId,
    "x-provider-id": profile.providerId,
  };
  if (profile.userId) h["x-user-id"] = profile.userId;
  if (profile.adminKey) h["x-admin-key"] = profile.adminKey;
  return h;
}

function logHistory(
  method: string,
  path: string,
  headers: Record<string, string>,
  body: unknown,
  res: ApiResponse,
) {
  addHistory({
    id: crypto.randomUUID(),
    timestamp: res.timestamp,
    method,
    path,
    requestHeaders: headers,
    requestBody: body,
    status: res.status,
    responsePreview:
      typeof res.body === "object"
        ? JSON.stringify(res.body, null, 2).slice(0, 500)
        : String(res.rawBody).slice(0, 500),
    duration: res.duration,
  });
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<HeaderProfile>(getDefaultProfile);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);

  // Per-step responses
  const [responses, setResponses] = useState<Record<number, ApiResponse>>({});
  const [loading, setLoading] = useState(false);

  // Step 1 state
  const [walletUserId, setWalletUserId] = useState("");
  const [walletAmount, setWalletAmount] = useState("10000");
  const [walletReason, setWalletReason] = useState("Demo fund");

  // Step 2 state
  const [tournamentBody, setTournamentBody] = useState("");

  // IDs
  const [tournamentId, setTournamentId] = useState("");
  const [tableId, setTableId] = useState("");

  // Step 8 auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 10 state
  const [actionType, setActionType] = useState("check");
  const [actionAmount, setActionAmount] = useState("");

  useEffect(() => {
    const profiles = getProfiles();
    const activeId = getActiveProfileId();
    const found = profiles.find((p) => p.id === activeId);
    setProfile(found ?? profiles[0] ?? getDefaultProfile());
    setBaseUrl(localStorage.getItem(BASE_URL_KEY) ?? DEFAULT_BASE_URL);

    const savedTid = localStorage.getItem("demo-tournament-id");
    const savedTableId = localStorage.getItem("demo-table-id");
    if (savedTid) setTournamentId(savedTid);
    if (savedTableId) setTableId(savedTableId);
  }, []);

  useEffect(() => {
    setWalletUserId(profile.userId);
  }, [profile]);

  useEffect(() => {
    const now = new Date();
    const later = new Date(now.getTime() + 30 * 60 * 1000);
    setTournamentBody(
      JSON.stringify(
        {
          name: `Demo MTT ${Date.now()}`,
          startingStack: 10000,
          maxPlayers: 18,
          minPlayers: 2,
          seatMax: 9,
          buyIn: 100,
          blindStructure: [
            { level: 1, smallBlind: 10, bigBlind: 20, durationSeconds: 600 },
            { level: 2, smallBlind: 20, bigBlind: 40, durationSeconds: 600 },
            { level: 3, smallBlind: 30, bigBlind: 60, durationSeconds: 600 },
            { level: 4, smallBlind: 50, bigBlind: 100, durationSeconds: 600 },
            { level: 5, smallBlind: 100, bigBlind: 200, durationSeconds: 600 },
          ],
          registrationOpensAt: now.toISOString(),
          registrationClosesAt: later.toISOString(),
          lateRegMinutes: 0,
          payoutStructure: [
            { place: 1, percentage: 50 },
            { place: 2, percentage: 30 },
            { place: 3, percentage: 20 },
          ],
        },
        null,
        2,
      ),
    );
  }, []);

  // Persist IDs
  useEffect(() => {
    if (tournamentId) localStorage.setItem("demo-tournament-id", tournamentId);
  }, [tournamentId]);
  useEffect(() => {
    if (tableId) localStorage.setItem("demo-table-id", tableId);
  }, [tableId]);

  const saveResponse = useCallback(
    (step: number, res: ApiResponse) => {
      setResponses((prev) => ({ ...prev, [step]: res }));
    },
    [],
  );

  const doRequest = useCallback(
    async (
      method: string,
      path: string,
      body: object | null,
      pathParams: Record<string, string>,
      queryParams: Record<string, string>,
      step: number,
    ): Promise<ApiResponse> => {
      setLoading(true);
      try {
        const res = await sendRequest(baseUrl, profile, {
          method,
          path,
          headers: {},
          body,
          pathParams,
          queryParams,
        });
        saveResponse(step, res);
        const h = buildHeaders(profile);
        if (body) h["Content-Type"] = "application/json";
        logHistory(method, path, h, body, res);
        return res;
      } catch (err) {
        const errRes: ApiResponse = {
          status: 0,
          statusText: "Network Error",
          headers: {},
          body: { error: (err as Error).message },
          rawBody: (err as Error).message,
          duration: 0,
          timestamp: new Date().toISOString(),
        };
        saveResponse(step, errRes);
        return errRes;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, profile, saveResponse],
  );

  const getCurl = useCallback(
    (method: string, path: string, body?: object) => {
      const h = buildHeaders(profile);
      if (body) h["Content-Type"] = "application/json";
      return generateCurl(baseUrl, method, path, h, body);
    },
    [baseUrl, profile],
  );

  // Step handlers
  const runStep1 = useCallback(async () => {
    const body = {
      userId: walletUserId,
      amount: Number(walletAmount),
      reason: walletReason,
    };
    const res = await doRequest("POST", "/admin/wallet/adjust", body, {}, {}, 1);
    if (res.status > 0 && res.status < 400) {
      await doRequest("GET", "/wallet/balance", null, {}, {}, 1);
    }
  }, [walletUserId, walletAmount, walletReason, doRequest]);

  const runStep2 = useCallback(async () => {
    let body: object;
    try {
      body = JSON.parse(tournamentBody);
    } catch {
      return;
    }
    const res = await doRequest("POST", "/admin/tournaments", body, {}, {}, 2);
    const resBody = res.body as Record<string, unknown> | null;
    if (resBody && typeof resBody === "object" && resBody.id) {
      setTournamentId(String(resBody.id));
    }
  }, [tournamentBody, doRequest]);

  const runStep3 = useCallback(async () => {
    await doRequest(
      "POST",
      "/admin/tournaments/{tournamentId}/open-registration",
      null,
      { tournamentId },
      {},
      3,
    );
  }, [tournamentId, doRequest]);

  const runStep4 = useCallback(async () => {
    const res = await doRequest(
      "POST",
      "/tournaments/{tournamentId}/register",
      null,
      { tournamentId },
      {},
      4,
    );
    if (res.status > 0 && res.status < 400) {
      await doRequest(
        "GET",
        "/tournaments/{tournamentId}/my-status",
        null,
        { tournamentId },
        {},
        4,
      );
    }
  }, [tournamentId, doRequest]);

  const runStep5 = useCallback(async () => {
    await doRequest(
      "POST",
      "/admin/tournaments/{tournamentId}/close-registration",
      null,
      { tournamentId },
      {},
      5,
    );
  }, [tournamentId, doRequest]);

  const runStep6 = useCallback(async () => {
    await doRequest(
      "POST",
      "/admin/tournaments/{tournamentId}/start",
      null,
      { tournamentId },
      {},
      6,
    );
  }, [tournamentId, doRequest]);

  const fetchTableState = useCallback(async () => {
    if (!tableId) return;
    await doRequest("GET", "/tables/{tableId}", null, { tableId }, {}, 8);
  }, [tableId, doRequest]);

  // Auto-refresh for step 8
  useEffect(() => {
    if (autoRefresh && tableId && currentStep === 8) {
      timerRef.current = setInterval(fetchTableState, refreshInterval);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, [autoRefresh, tableId, currentStep, refreshInterval, fetchTableState]);

  const runStep9 = useCallback(async () => {
    await doRequest(
      "GET",
      "/tables/{tableId}/my-hand",
      null,
      { tableId },
      {},
      9,
    );
  }, [tableId, doRequest]);

  const runStep10 = useCallback(async () => {
    const body: Record<string, unknown> = { actionType };
    if (actionAmount) body.amount = Number(actionAmount);
    await doRequest(
      "POST",
      "/tables/{tableId}/action",
      body,
      { tableId },
      {},
      10,
    );
  }, [tableId, actionType, actionAmount, doRequest]);

  const runStep11 = useCallback(async () => {
    await doRequest(
      "POST",
      "/admin/tables/{tableId}/advance",
      null,
      { tableId },
      {},
      11,
    );
  }, [tableId, doRequest]);

  const runStep12 = useCallback(async () => {
    await doRequest(
      "POST",
      "/admin/tournaments/{tournamentId}/finish",
      null,
      { tournamentId },
      {},
      12,
    );
    await doRequest("GET", "/wallet/balance", null, {}, {}, 12);
  }, [tournamentId, doRequest]);

  const stepRes = responses[currentStep] ?? null;
  const canNext = currentStep === 0 || currentStep === 7 || !!responses[currentStep];

  // Step-specific curl
  const stepCurls: Record<number, string> = {
    1: getCurl("POST", "/admin/wallet/adjust", {
      userId: walletUserId,
      amount: Number(walletAmount),
      reason: walletReason,
    }),
    2: (() => {
      try {
        return getCurl("POST", "/admin/tournaments", JSON.parse(tournamentBody));
      } catch {
        return "";
      }
    })(),
    3: getCurl("POST", `/admin/tournaments/${tournamentId}/open-registration`),
    4: getCurl("POST", `/tournaments/${tournamentId}/register`),
    5: getCurl("POST", `/admin/tournaments/${tournamentId}/close-registration`),
    6: getCurl("POST", `/admin/tournaments/${tournamentId}/start`),
    8: getCurl("GET", `/tables/${tableId}`),
    9: getCurl("GET", `/tables/${tableId}/my-hand`),
    10: getCurl("POST", `/tables/${tableId}/action`, { actionType }),
    11: getCurl("POST", `/admin/tables/${tableId}/advance`),
    12: getCurl("POST", `/admin/tournaments/${tournamentId}/finish`),
  };

  const stepRunners: Record<number, () => Promise<void>> = {
    1: runStep1,
    2: runStep2,
    3: runStep3,
    4: runStep4,
    5: runStep5,
    6: runStep6,
    8: fetchTableState,
    9: runStep9,
    10: runStep10,
    11: runStep11,
    12: runStep12,
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold text-white">
        Tournament Flow Demo
      </h1>
      <p className="mb-6 text-sm text-gray-400">
        Walk through a complete tournament lifecycle step by step.
      </p>

      {/* Step navigation */}
      <div className="mb-6 flex flex-wrap gap-1">
        {STEPS.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentStep(i)}
            className={`rounded px-3 py-1 text-xs font-medium ${
              i === currentStep
                ? "bg-blue-600 text-white"
                : responses[i]
                  ? "bg-green-900 text-green-300"
                  : "bg-gray-700 text-gray-400"
            }`}
          >
            {i}. {s.title}
          </button>
        ))}
      </div>

      {/* Current step */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="mb-1 text-xl font-semibold text-white">
          Step {currentStep}: {STEPS[currentStep].title}
        </h2>
        <p className="mb-4 text-sm text-gray-400">
          {STEPS[currentStep].description}
        </p>

        {/* Step 0: Configure */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Profile
              </label>
              <HeaderProfileSelector onProfileChange={setProfile} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">
                Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  localStorage.setItem(BASE_URL_KEY, e.target.value);
                }}
                className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 1: Adjust wallet */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-400">
                  User ID
                </label>
                <input
                  type="text"
                  value={walletUserId}
                  onChange={(e) => setWalletUserId(e.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="w-32">
                <label className="mb-1 block text-xs text-gray-400">
                  Amount
                </label>
                <input
                  type="number"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-400">
                  Reason
                </label>
                <input
                  type="text"
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              POST /admin/wallet/adjust → GET /wallet/balance
            </div>
          </div>
        )}

        {/* Step 2: Create tournament */}
        {currentStep === 2 && (
          <div className="space-y-3">
            <label className="block text-xs text-gray-400">
              CreateTournamentDto JSON
            </label>
            <textarea
              value={tournamentBody}
              onChange={(e) => setTournamentBody(e.target.value)}
              rows={14}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 font-mono text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
            />
            <div className="text-xs text-gray-500">
              POST /admin/tournaments
            </div>
          </div>
        )}

        {/* Steps 3-6: simple confirmation */}
        {currentStep >= 3 && currentStep <= 6 && (
          <div className="text-sm text-gray-300">
            Tournament ID:{" "}
            <span className="font-mono text-blue-400">
              {tournamentId || "not set"}
            </span>
          </div>
        )}

        {/* Step 7: Discover table */}
        {currentStep === 7 && (
          <div className="space-y-3">
            <label className="block text-xs text-gray-400">Table ID</label>
            <input
              type="text"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="Enter the table ID from tournament start response"
              className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        {/* Step 8: Poll table */}
        {currentStep === 8 && (
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm text-gray-300">
              Table: <span className="font-mono text-blue-400">{tableId || "not set"}</span>
            </span>
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-600"
              />
              Auto-refresh
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-200"
              >
                <option value={1000}>1s</option>
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
              </select>
            )}
          </div>
        )}

        {/* Step 9: hand info */}
        {currentStep === 9 && (
          <div className="text-sm text-gray-300">
            Table:{" "}
            <span className="font-mono text-blue-400">
              {tableId || "not set"}
            </span>
          </div>
        )}

        {/* Step 10: action */}
        {currentStep === 10 && (
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Action</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200"
              >
                <option value="fold">fold</option>
                <option value="check">check</option>
                <option value="call">call</option>
                <option value="raise">raise</option>
                <option value="all-in">all-in</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Amount (optional)
              </label>
              <input
                type="number"
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
                className="w-28 rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 11: advance */}
        {currentStep === 11 && (
          <div className="text-sm text-gray-300">
            Table:{" "}
            <span className="font-mono text-blue-400">
              {tableId || "not set"}
            </span>
          </div>
        )}

        {/* Step 12: finish */}
        {currentStep === 12 && (
          <div className="text-sm text-gray-300">
            Tournament:{" "}
            <span className="font-mono text-blue-400">
              {tournamentId || "not set"}
            </span>
          </div>
        )}

        {/* Curl preview */}
        {stepCurls[currentStep] && (
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-medium text-gray-400">
              cURL Preview
            </h4>
            <CurlViewer curl={stepCurls[currentStep]} />
          </div>
        )}

        {/* Send button */}
        {stepRunners[currentStep] && (
          <button
            type="button"
            onClick={stepRunners[currentStep]}
            disabled={loading}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send"}
          </button>
        )}

        {/* Response */}
        {stepRes && (
          <div className="mt-4">
            <ResponseViewer response={stepRes} loading={loading} />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 disabled:opacity-50"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))
            }
            disabled={currentStep === STEPS.length - 1 || !canNext}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </main>
  );
}
