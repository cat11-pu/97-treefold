// fold.js：折叠状态与可见行派生、快照与恢复（纯派生，不改传入的折叠集合）
function toSet(collapsed) {
  return new Set(collapsed || []);
}

export function visible(tree, collapsed, filter) {
  const foldedSet = toSet(collapsed);
  const rows = [];
  let folded = 0;
  let filtered = 0;
  let forced = 0;
  const query = filter || "";

  if (!query) {
    // 无过滤：祖先里有折叠的整棵不显示（折叠节点本身仍显示）
    const walk = (node, hidden) => {
      if (hidden) {
        folded += 1;
        return;
      }
      rows.push(node.id);
      const hideChildren = foldedSet.has(node.id);
      for (const child of node.children || []) walk(child, hideChildren);
    };
    walk(tree, false);
    return { rows: rows, folded: folded, filtered: filtered, forced: forced };
  }

  // 有过滤：命中节点 + 命中路径上的祖先，命中路径无视折叠
  const keep = new Set();
  const mark = (node) => {
    let onPath = String(node.label).includes(query);
    for (const child of node.children || []) {
      if (mark(child)) onPath = true;
    }
    if (onPath) keep.add(node.id);
    return onPath;
  };
  mark(tree);

  const tallyHidden = (node, ancestorFolded) => {
    if (ancestorFolded) folded += 1;
    else filtered += 1;
    const nextFolded = ancestorFolded || foldedSet.has(node.id);
    for (const child of node.children || []) tallyHidden(child, nextFolded);
  };

  const walk = (node, ancestorFolded) => {
    if (keep.has(node.id)) {
      rows.push(node.id);
      if (ancestorFolded) forced += 1;
      const nextFolded = ancestorFolded || foldedSet.has(node.id);
      for (const child of node.children || []) walk(child, nextFolded);
    } else {
      tallyHidden(node, ancestorFolded);
    }
  };
  walk(tree, false);
  return { rows: rows, folded: folded, filtered: filtered, forced: forced };
}

export function snapshot(tree, collapsed) {
  const nodes = [];
  const walk = (node, parent) => {
    nodes.push([node.id, parent, node.label]);
    for (const child of node.children || []) walk(child, node.id);
  };
  walk(tree, "");
  // 只写持久折叠集合，排序保证快照确定、可 JSON 序列化
  return { nodes: nodes, collapsed: Array.from(toSet(collapsed)).sort() };
}

export function restore(snap) {
  const list = (snap && snap.nodes) || [];
  const byId = new Map();
  for (const entry of list) byId.set(entry[0], { id: entry[0], label: entry[2], children: [] });
  let tree = null;
  for (const entry of list) {
    const node = byId.get(entry[0]);
    const parent = entry[1];
    if (parent === "" || parent === null || parent === undefined) tree = node;
    else byId.get(parent).children.push(node);
  }
  return { tree: tree, collapsed: Array.from(toSet(snap && snap.collapsed)) };
}
