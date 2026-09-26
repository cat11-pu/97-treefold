// fold.js：折叠状态与可见行派生、快照与恢复
function childrenOf(node) {
  return node.children || [];
}

// 派生可见行。collapsed 只读，绝不改动传入的折叠集合。
export function visible(tree, collapsed, filter) {
  const foldedSet = new Set(collapsed || []);
  const query = String(filter || "").toLowerCase();
  const rows = [];
  let folded = 0;
  let filtered = 0;
  let forced = 0;

  if (!query) {
    // 无过滤：祖先里有折叠的整棵不显示
    const walk = (node, hidden) => {
      if (hidden) { folded += 1; return; }
      rows.push(node.id);
      const hideChildren = foldedSet.has(node.id);
      for (const child of childrenOf(node)) walk(child, hideChildren);
    };
    walk(tree, false);
    return { rows: rows, folded: folded, filtered: filtered, forced: forced };
  }

  // 有过滤：命中节点与命中路径上的祖先可见，命中路径无视折叠
  const parentOf = new Map();
  const hits = new Set();
  const scan = (node, parent) => {
    if (parent) parentOf.set(node.id, parent);
    if (String(node.label).toLowerCase().indexOf(query) !== -1) hits.add(node.id);
    for (const child of childrenOf(node)) scan(child, node.id);
  };
  scan(tree, "");

  const visibleSet = new Set();
  const forcedSet = new Set();
  for (const id of hits) {
    visibleSet.add(id);
    let cursor = parentOf.get(id);
    while (cursor) {
      visibleSet.add(cursor);
      if (foldedSet.has(cursor)) forcedSet.add(cursor);
      cursor = parentOf.get(cursor);
    }
  }
  forced = forcedSet.size;

  // 前序出行；被藏节点归因：有折叠祖先算 folded，否则算 filtered
  const walk = (node, ancestorCollapsed) => {
    if (visibleSet.has(node.id)) rows.push(node.id);
    else if (ancestorCollapsed) folded += 1;
    else filtered += 1;
    const nextCollapsed = ancestorCollapsed || foldedSet.has(node.id);
    for (const child of childrenOf(node)) walk(child, nextCollapsed);
  };
  walk(tree, false);

  return { rows: rows, folded: folded, filtered: filtered, forced: forced };
}

// 可 JSON 序列化的快照：前序三元组 + 持久折叠集合（排序去重）
export function snapshot(tree, collapsed) {
  const nodes = [];
  const walk = (node, parent) => {
    nodes.push([node.id, parent, node.label]);
    for (const child of childrenOf(node)) walk(child, node.id);
  };
  walk(tree, "");
  return { nodes: nodes, collapsed: Array.from(new Set(collapsed || [])).sort() };
}

// 从快照重建树与折叠集合
export function restore(snap) {
  const nodes = (snap && snap.nodes) || [];
  const byId = new Map();
  for (const entry of nodes) byId.set(entry[0], { id: entry[0], label: entry[2], children: [] });
  let tree = null;
  for (const entry of nodes) {
    const node = byId.get(entry[0]);
    const parent = entry[1];
    if (parent && byId.has(parent)) byId.get(parent).children.push(node);
    else tree = node;
  }
  return { tree: tree, collapsed: Array.from((snap && snap.collapsed) || []) };
}
