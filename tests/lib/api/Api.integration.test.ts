// import { describe, it, expect } from "vitest";
// import { NodeAPI, PodAPI } from "../../../src/test/lib/api";

// describe("NodeAPI (integration)", () => {
//   it("listNodes should hit real backend", async () => {
//     const res = await NodeAPI.listNodes();
//     expect(res.success).toBe(true);
//     expect(Array.isArray(res.data)).toBe(true);
//   });

//   it("avgToday should return tuple", async () => {
//     const res = await NodeAPI.avgToday();
//     expect(res.success).toBe(true);
//     expect(Array.isArray(res.data)).toBe(true);
//     expect(res.data?.length).toBe(2);
//   });
// });

// describe("PodAPI (integration)", () => {
//   it("listPods should hit real backend", async () => {
//     const res = await PodAPI.listPods();
//     expect(res.success).toBe(true);
//     expect(Array.isArray(res.data)).toBe(true);
//   });

//   it("listNamespaces should return namespaces", async () => {
//     const res = await PodAPI.listNamespaces();
//     expect(res.success).toBe(true);
//     expect(Array.isArray(res.data)).toBe(true);
//   });

//   it("avgTodayPod should return tuple", async () => {
//     // ⚠️ Replace with real pod_id from your DB
//     const res = await PodAPI.avgTodayPod(1);
//     expect(res.success).toBe(true);
//     expect(Array.isArray(res.data)).toBe(true);
//     expect(res.data?.length).toBe(2);
//   });

//   it("avgTodayNamespace should return tuple", async () => {
//     // ⚠️ Replace with a real namespace
//     const res = await PodAPI.avgTodayNamespace("default");
//     expect(res.success).toBe(true);
//     expect(Array.isArray(res.data)).toBe(true);
//     expect(res.data?.length).toBe(2);
//   });

//   it("metricsBetween should return metrics", async () => {
//     const start = "2025-01-01T00:00:00";
//     const end = "2025-12-31T23:59:59";
//     const res = await PodAPI.metricsBetween(start, end);
//     expect(res.success).toBe(true);
//     expect(Array.isArray(res.data)).toBe(true);
//   });

//   it("namespaceMetricsBetween should return metrics", async () => {
//     const start = "2025-01-01T00:00:00";
//     const end = "2025-12-31T23:59:59";
//     const res = await PodAPI.namespaceMetricsBetween("default", start, end);
//     expect(res.success).toBe(true);
//     expect(Array.isArray(res.data)).toBe(true);
//   });
// });
