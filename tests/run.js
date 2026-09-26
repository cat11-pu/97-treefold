import assert from "node:assert";
import { visible, snapshot, restore } from "../fold.js";
import { applyOps, clip } from "../apply.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const tree = { id: "r", label: "root", children: [{ id: "a", label: "apple", children: [] }] };

check("visible returns rows", () => {
  assert.ok(Array.isArray(visible(tree, [], "").rows));
});

check("visible reports folded count", () => {
  assert.strictEqual(typeof visible(tree, [], "").folded, "number");
});

check("snapshot returns nodes", () => {
  assert.ok(Array.isArray(snapshot(tree, []).nodes));
});

check("restore returns a tree", () => {
  const back = restore({ nodes: [["r", "", "root"]], collapsed: [] });
  assert.strictEqual(typeof back.tree, "object");
});

check("applyOps returns skipped", () => {
  assert.strictEqual(typeof applyOps(tree, [], [], []).skipped, "number");
});

check("clip reports clipped", () => {
  assert.strictEqual(typeof clip(["r", "a"], 1).clipped, "number");
});

check("render exposes degraded", () => {
  const spec = { tree: tree, collapsed: [], ops: [], applied: [], filter: "", budget: 2 };
  assert.strictEqual(typeof render(spec).degraded, "boolean");
});

console.log("7 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
