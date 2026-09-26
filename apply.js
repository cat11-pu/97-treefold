// apply.js：操作日志与预算（基线：不应用操作、不裁剪、不校验）
export function applyOps(tree, collapsed, ops, applied) {
  return { tree: tree, collapsed: collapsed, skipped: 0 };
}

export function clip(rows, budget) {
  return { rendered: rows, clipped: 0, degraded: false };
}
