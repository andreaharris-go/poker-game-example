"use client";

import { useState, useEffect, useCallback } from "react";
import type { HeaderProfile, ApiResponse } from "@/lib/api/client";
import { sendRequest } from "@/lib/api/client";
import {
  getProfiles,
  getActiveProfileId,
  getDefaultProfile,
} from "@/lib/storage/profiles";
import ResponseViewer from "@/components/ResponseViewer";

const BASE_URL_KEY = "poker-api-base-url";
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export default function WalletPage() {
  const [profile, setProfile] = useState<HeaderProfile>(getDefaultProfile);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);

  const [balanceRes, setBalanceRes] = useState<ApiResponse | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [txRes, setTxRes] = useState<ApiResponse | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [cursor, setCursor] = useState("");
  const [limit, setLimit] = useState("20");

  useEffect(() => {
    const profiles = getProfiles();
    const activeId = getActiveProfileId();
    setProfile(
      profiles.find((p) => p.id === activeId) ??
        profiles[0] ??
        getDefaultProfile(),
    );
    setBaseUrl(localStorage.getItem(BASE_URL_KEY) ?? DEFAULT_BASE_URL);
  }, []);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const res = await sendRequest(baseUrl, profile, {
        method: "GET",
        path: "/wallet/balance",
        headers: {},
        body: null,
        pathParams: {},
        queryParams: {},
      });
      setBalanceRes(res);
    } catch (err) {
      setBalanceRes({
        status: 0,
        statusText: "Network Error",
        headers: {},
        body: { error: (err as Error).message },
        rawBody: (err as Error).message,
        duration: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setBalanceLoading(false);
    }
  }, [baseUrl, profile]);

  const fetchTransactions = useCallback(
    async (nextCursor?: string) => {
      setTxLoading(true);
      const qp: Record<string, string> = {};
      if (limit) qp.limit = limit;
      const c = nextCursor ?? cursor;
      if (c) qp.cursor = c;
      try {
        const res = await sendRequest(baseUrl, profile, {
          method: "GET",
          path: "/wallet/transactions",
          headers: {},
          body: null,
          pathParams: {},
          queryParams: qp,
        });
        setTxRes(res);
        // Update cursor if response contains nextCursor
        const body = res.body as Record<string, unknown> | null;
        if (body && typeof body === "object" && "nextCursor" in body) {
          setCursor((body.nextCursor as string) ?? "");
        }
      } catch (err) {
        setTxRes({
          status: 0,
          statusText: "Network Error",
          headers: {},
          body: { error: (err as Error).message },
          rawBody: (err as Error).message,
          duration: 0,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setTxLoading(false);
      }
    },
    [baseUrl, profile, cursor, limit],
  );

  const handleNext = useCallback(() => {
    const body = txRes?.body as Record<string, unknown> | null;
    if (body && typeof body === "object" && body.nextCursor) {
      fetchTransactions(body.nextCursor as string);
    }
  }, [txRes, fetchTransactions]);

  const hasNext = !!(
    txRes?.body &&
    typeof txRes.body === "object" &&
    "nextCursor" in (txRes.body as Record<string, unknown>) &&
    (txRes.body as Record<string, unknown>).nextCursor
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Wallet</h1>

      {/* Balance */}
      <section className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Balance</h2>
        <button
          type="button"
          onClick={fetchBalance}
          disabled={balanceLoading}
          className="mb-3 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
        >
          {balanceLoading ? "Loading…" : "GET /wallet/balance"}
        </button>
        <ResponseViewer response={balanceRes} loading={balanceLoading} />
      </section>

      {/* Transactions */}
      <section className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Transactions</h2>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Cursor</label>
            <input
              type="text"
              value={cursor}
              onChange={(e) => setCursor(e.target.value)}
              placeholder="optional cursor"
              className="w-48 rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Limit</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-20 rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchTransactions()}
            disabled={txLoading}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            {txLoading ? "Loading…" : "GET /wallet/transactions"}
          </button>
          {hasNext && (
            <button
              type="button"
              onClick={handleNext}
              disabled={txLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Next Page →
            </button>
          )}
        </div>
        <ResponseViewer response={txRes} loading={txLoading} />
      </section>
    </main>
  );
}
