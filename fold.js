// fold.js：折叠状态与可见行（基线：不折叠、不过滤，整棵树平铺）
export function visible(tree, collapsed, filter) {
  const rows = [];
  const walk = (node) => {
    rows.push(node.id);
    for (const child of node.children || []) walk(child);
  };
  walk(tree);
  return { rows: rows, folded: 0, filtered: 0, forced: 0 };
}

export function snapshot(tree, collapsed) {
  const nodes = [];
  const walk = (node, parent) => {
    nodes.push([node.id, parent, node.label]);
    for (const child of node.children || []) walk(child, node.id);
  };
  walk(tree, "");
  return { nodes: nodes, collapsed: [] };
}

export function restore(snap) {
  return { tree: { id: "", label: "", children: [] }, collapsed: [] };
}
