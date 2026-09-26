// apply.js：操作日志应用与渲染预算
function badOp(message) {
  const error = new Error(message);
  error.code = "E_BAD_OP";
  return error;
}

function cloneTree(node) {
  return {
    id: node.id,
    label: node.label,
    children: (node.children || []).map(cloneTree)
  };
}

function findNode(root, id) {
  if (!root) return null;
  if (root.id === id) return root;
  for (const child of root.children || []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function findParent(root, id) {
  for (const child of (root && root.children) || []) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

// 按顺序应用日志；applied 里的 op_id 跳过并计数。不改传入的 tree/collapsed。
export function applyOps(tree, collapsed, ops, applied) {
  const done = new Set(applied || []);
  const foldedSet = new Set(collapsed || []);
  const order = Array.from(foldedSet);
  const root = cloneTree(tree);
  let skipped = 0;

  for (const op of ops || []) {
    if (done.has(op.op_id)) { skipped += 1; continue; }
    switch (op.op) {
      case "fold": {
        if (!findNode(root, op.id)) throw badOp("fold: unknown node " + op.id);
        if (foldedSet.has(op.id)) {
          foldedSet.delete(op.id);
          const at = order.indexOf(op.id);
          if (at !== -1) order.splice(at, 1);
        } else {
          foldedSet.add(op.id);
          order.push(op.id);
        }
        break;
      }
      case "insert": {
        const parent = findNode(root, op.parent);
        if (!parent) throw badOp("insert: unknown parent " + op.parent);
        if (findNode(root, op.id)) throw badOp("insert: duplicate id " + op.id);
        // 默认展开；collapsed 不动，同编号的历史折叠状态自然沿用
        parent.children.push({ id: op.id, label: op.label, children: [] });
        break;
      }
      case "remove": {
        if (op.id === root.id) throw badOp("remove: cannot remove root");
        const parent = findParent(root, op.id);
        if (!parent) throw badOp("remove: unknown node " + op.id);
        // 折叠状态保留，同编号再插入时沿用
        parent.children = parent.children.filter((child) => child.id !== op.id);
        break;
      }
      default:
        throw badOp("unknown op " + op.op);
    }
  }
  return { tree: root, collapsed: order, skipped: skipped };
}

// 预算裁剪：只渲染预算内的行
export function clip(rows, budget) {
  const list = (rows || []).slice();
  if (budget === undefined || budget === null || budget >= list.length) {
    return { rendered: list, clipped: 0, degraded: false };
  }
  const limit = Math.max(0, budget);
  const rendered = list.slice(0, limit);
  return { rendered: rendered, clipped: list.length - rendered.length, degraded: true };
}
