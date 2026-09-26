// apply.js：操作日志应用与渲染预算裁剪
function badOp(message) {
  const error = new Error(message);
  error.code = "E_BAD_OP";
  throw error;
}

export function applyOps(tree, collapsed, ops, applied) {
  const done = new Set(applied || []);
  const foldedSet = new Set(collapsed || []);
  const root = JSON.parse(JSON.stringify(tree));
  let skipped = 0;

  const find = (id) => {
    let found = null;
    const walk = (node, parent) => {
      if (found) return;
      if (node.id === id) { found = { node: node, parent: parent }; return; }
      for (const child of node.children || []) walk(child, node);
    };
    walk(root, null);
    return found;
  };

  for (const op of ops || []) {
    if (done.has(op.op_id)) { skipped += 1; continue; }
    if (op.op === "fold") {
      if (!find(op.id)) badOp("fold 引用了不存在的节点 " + op.id);
      if (foldedSet.has(op.id)) foldedSet.delete(op.id);
      else foldedSet.add(op.id);
    } else if (op.op === "insert") {
      if (find(op.id)) badOp("insert 的编号已存在 " + op.id);
      const parent = find(op.parent);
      if (!parent) badOp("insert 的父节点不存在 " + op.parent);
      parent.node.children.push({ id: op.id, label: op.label, children: [] });
      // 默认展开；foldedSet 里若留有同编号历史折叠状态则自然沿用
    } else if (op.op === "remove") {
      const found = find(op.id);
      if (!found) badOp("remove 引用了不存在的节点 " + op.id);
      if (!found.parent) badOp("remove 不能删除根节点 " + op.id);
      found.parent.children = found.parent.children.filter((child) => child.id !== op.id);
      // 折叠状态保留，同编号再插入时沿用
    } else {
      badOp("未知操作名 " + op.op);
    }
  }
  return { tree: root, collapsed: Array.from(foldedSet), skipped: skipped };
}

export function clip(rows, budget) {
  const list = rows || [];
  const limit = typeof budget === "number" && budget >= 0 ? budget : list.length;
  const rendered = list.slice(0, limit);
  const clipped = list.length - rendered.length;
  return { rendered: rendered, clipped: clipped, degraded: clipped > 0 };
}
