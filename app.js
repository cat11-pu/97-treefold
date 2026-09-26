// app.js：渲染结果
import { visible, snapshot, restore } from "./fold.js";
import { applyOps, clip } from "./apply.js";

export function render(spec) {
  const state = applyOps(spec.tree, spec.collapsed || [], spec.ops || [], spec.applied || []);
  const shown = visible(state.tree, state.collapsed, spec.filter || "");
  const plain = visible(state.tree, state.collapsed, "");
  const snap = snapshot(state.tree, state.collapsed);
  const back = restore(JSON.parse(JSON.stringify(snap)));
  const again = visible(back.tree, back.collapsed, spec.filter || "");
  const diff = Math.abs(again.rows.length - shown.rows.length)
    + again.rows.filter(function (id, index) { return id !== shown.rows[index]; }).length;
  const limited = clip(shown.rows, spec.budget);
  return {
    rows: shown.rows,
    plain_rows: plain.rows,
    folded_hidden: shown.folded,
    filtered_hidden: shown.filtered,
    forced: shown.forced,
    snapshot_nodes: (snap.nodes || []).length,
    snapshot_collapsed: snap.collapsed || [],
    restored_rows: again.rows.length,
    restore_diff: diff,
    skipped: state.skipped,
    rendered: limited.rendered,
    clipped: limited.clipped,
    degraded: limited.degraded
  };
}
