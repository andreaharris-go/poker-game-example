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

export default function TournamentsPage() {
  const [profile, setProfile] = useState<HeaderProfile>(getDefaultProfile);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);

  // List state
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState("");
  const [limit, setLimit] = useState("20");
  const [listRes, setListRes] = useState<ApiResponse | null>(null);
  const [listLoading, setListLoading] = useState(false);

  // Detail state
  const [tournamentId, setTournamentId] = useState("");
  const [detailRes, setDetailRes] = useState<ApiResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action state
  const [actionRes, setActionRes] = useState<ApiResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const fetchList = useCallback(async () => {
    setListLoading(true);
    const qp: Record<string, string> = {};
    if (status) qp.status = status;
    if (cursor) qp.cursor = cursor;
    if (limit) qp.limit = limit;
    try {
      const res = await sendRequest(baseUrl, profile, {
        method: "GET",
        path: "/tournaments",
        headers: {},
        body: null,
        pathParams: {},
        queryParams: qp,
      });
      setListRes(res);
    } catch (err) {
      setListRes({
        status: 0, statusText: "Network Error", headers: {},
        body: { error: (err as Error).message },
        rawBody: (err as Error).message, duration: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setListLoading(false);
    }
  }, [baseUrl, profile, status, cursor, limit]);

  const fetchDetail = useCallback(async () => {
    if (!tournamentId) return;
    setDetailLoading(true);
    try {
      const res = await sendRequest(baseUrl, profile, {
        method: "GET",
        path: "/tournaments/{tournamentId}",
        headers: {},
        body: null,
        pathParams: { tournamentId },
        queryParams: {},
      });
      setDetailRes(res);
    } catch (err) {
      setDetailRes({
        status: 0, statusText: "Network Error", headers: {},
        body: { error: (err as Error).message },
        rawBody: (err as Error).message, duration: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setDetailLoading(false);
    }
  }, [baseUrl, profile, tournamentId]);

  const runAction = useCallback(
    async (method: string, path: string) => {
      if (!tournamentId) return;
      setActionLoading(true);
      setActionRes(null);
      try {
        const res = await sendRequest(baseUrl, profile, {
          method,
          path,
          headers: {},
          body: null,
          pathParams: { tournamentId },
          queryParams: {},
        });
        setActionRes(res);
      } catch (err) {
        setActionRes({
          status: 0, statusText: "Network Error", headers: {},
          body: { error: (err as Error).message },
          rawBody: (err as Error).message, duration: 0,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setActionLoading(false);
      }
    },
    [baseUrl, profile, tournamentId],
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Tournaments</h1>

      {/* List */}
      <section className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">
          List Tournaments
        </h2>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All</option>
              <option value="created">created</option>
              <option value="registration_open">registration_open</option>
              <option value="registration_closed">registration_closed</option>
              <option value="running">running</option>
              <option value="finished">finished</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Cursor</label>
            <input
              type="text"
              value={cursor}
              onChange={(e) => setCursor(e.target.value)}
              className="w-40 rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
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
            onClick={fetchList}
            disabled={listLoading}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            {listLoading ? "Loading…" : "Fetch"}
          </button>
        </div>
        <ResponseViewer response={listRes} loading={listLoading} />
      </section>

      {/* Detail & actions */}
      <section className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">
          Tournament Detail &amp; Actions
        </h2>
        <div className="mb-3 flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-400">
              Tournament ID
            </label>
            <input
              type="text"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              placeholder="Enter tournament ID"
              className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={fetchDetail}
            disabled={detailLoading || !tournamentId}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            {detailLoading ? "Loading…" : "Get Detail"}
          </button>
        </div>

        <ResponseViewer response={detailRes} loading={detailLoading} />

        {/* Quick actions */}
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-gray-400">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                runAction("POST", "/tournaments/{tournamentId}/register")
              }
              disabled={actionLoading || !tournamentId}
              className="rounded bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              Register
            </button>
            <button
              type="button"
              onClick={() =>
                runAction(
                  "POST",
                  "/admin/tournaments/{tournamentId}/open-registration",
                )
              }
              disabled={actionLoading || !tournamentId}
              className="rounded bg-yellow-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              Open Registration (admin)
            </button>
            <button
              type="button"
              onClick={() =>
                runAction(
                  "POST",
                  "/admin/tournaments/{tournamentId}/close-registration",
                )
              }
              disabled={actionLoading || !tournamentId}
              className="rounded bg-yellow-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              Close Registration (admin)
            </button>
            <button
              type="button"
              onClick={() =>
                runAction("POST", "/admin/tournaments/{tournamentId}/start")
              }
              disabled={actionLoading || !tournamentId}
              className="rounded bg-yellow-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              Start (admin)
            </button>
            <button
              type="button"
              onClick={() =>
                runAction("POST", "/admin/tournaments/{tournamentId}/finish")
              }
              disabled={actionLoading || !tournamentId}
              className="rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              Finish (admin)
            </button>
          </div>
          {actionRes && (
            <div className="mt-3">
              <ResponseViewer response={actionRes} loading={actionLoading} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
