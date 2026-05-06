# Plan 26-04 Cleanup Queue

UAT verification residue from Task 3 (canonical class id proof). Mark these
ids `markDeleted` in the next real Pipeline.receive batch on each class.
Do NOT issue a delete-only batch — Pipeline.receive requires non-empty `data`.
Mirror the cleanup pattern from Plan 26-02.

| Test ID | Class | Class ID | GQL boundary |
|---------|-------|----------|--------------|
| `mpi-26-04-uat-verify-cd7105df-test_section` | MarketplaceProfileItem | `7bcf86a5-91dc-520d-b9bf-e308b1078d46` | `c15fb2dc-4f8c-48b5-b27a-707bd516b005` |
| `evi-26-04-uat-verify-test` | EngagementVettingItem | `21f5841f-dd27-53ef-a0f5-6a816ec7f7e1` | `c15fb2dc-4f8c-48b5-b27a-707bd516b005` |

Created: 2026-04-28
Source: Task 3 of Plan 26-04 (canonical-class-id proof writes via ZB MCP)

## How to clean up

Next time a real Pipeline.receive batch goes against either class, append
the matching test id to `markDeleted`. For example:

```ts
await pipelineWrite.pushEntities('MarketplaceProfileItem', [...realRecords], []);
// In a follow-up call (or via the seed-zb-provider style two-arg batch),
// add the cleanup id to markDeleted.
```

Or via the seed pattern (Plan 26-02), simply include `markDeleted: ["mpi-26-04-uat-verify-cd7105df-test_section"]` in the next SimpleBatch.
