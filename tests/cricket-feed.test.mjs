import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCricketMatches } from "../supabase/functions/cricket-feed/normalize.ts";

test("provider IDs, fixture status and score data are normalized without tradable prices", () => {
  const matches = normalizeCricketMatches({ data: [
    { id: "abc-123", teams: ["Pakistan", "Sri Lanka"], name: "Pakistan vs Sri Lanka", dateTimeGMT: "2026-10-21T10:00:00", matchStarted: false, matchEnded: false, status: "Match starts tomorrow", score: [] },
    { id: "def-456", teams: ["India", "Australia"], dateTimeGMT: "2026-10-20T10:00:00", matchStarted: true, matchEnded: false, status: "Live", score: [{ inning: "India Inning 1", r: 200, w: 3, o: 31.2 }] },
    { id: "abc-123", teams: ["Duplicate", "Match"] },
    { id: "bad/id", teams: ["Invalid", "ID"] },
  ] });
  assert.equal(matches.length, 2);
  assert.deepEqual(matches.map((m) => m.status), ["upcoming", "live"]);
  assert.equal(matches[0].id, "cricketdata:abc-123");
  assert.equal(matches[1].scores[0].runs, 200);
  assert.equal(matches[0].startsAt, "2026-10-21T10:00:00.000Z");
  assert.ok(matches.every((m) => m.marketStatus === "SUSPENDED" && !("odds" in m)));
});

test("malformed provider responses fail closed", () => {
  assert.throws(() => normalizeCricketMatches({ status: "failure" }), /Invalid cricket provider response/);
  assert.deepEqual(normalizeCricketMatches({ data: [{ id: "x", teams: ["only one"] }] }), []);
});
