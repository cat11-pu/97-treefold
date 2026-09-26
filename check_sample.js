import fs from "node:fs";
import { render } from "./app.js";
import { applyOps } from "./apply.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/tree.json", "utf8"));
const view = render(spec);

emit("可见行 =", JSON.stringify(view.rows));
emit("无过滤可见行 =", JSON.stringify(view.plain_rows));
emit("折叠隐藏的节点数 =", view.folded_hidden);
emit("过滤隐藏的节点数 =", view.filtered_hidden);
emit("强制展开的节点数 =", view.forced);
emit("快照节点数 =", view.snapshot_nodes);
emit("快照折叠节点 =", JSON.stringify(view.snapshot_collapsed));
emit("恢复后可见行数 =", view.restored_rows);
emit("恢复差异 =", view.restore_diff);
emit("跳过操作数 =", view.skipped);
emit("渲染行数 =", view.rendered.length);
emit("裁剪行数 =", view.clipped);
emit("是否降级 =", view.degraded);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  const ghost = JSON.parse(JSON.stringify(spec.tree));
  const bad = applyOps(ghost, [], [{ op_id: "ox", op: "fold", id: "ghost" }], []);
  emit("非法操作错误码 =", bad && bad.code ? bad.code : "no-error");
} catch (error) {
  emit("非法操作错误码 =", error.code || error.message);
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "可见行": [
    "r",
    "a",
    "b",
    "b1"
  ],
  "无过滤可见行": [
    "r",
    "a",
    "b",
    "a1",
    "e1",
    "c1"
  ],
  "折叠隐藏的节点数": 1,
  "过滤隐藏的节点数": 3,
  "强制展开的节点数": 1,
  "快照节点数": 8,
  "快照折叠节点": [
    "a1",
    "b",
    "c1"
  ],
  "恢复后可见行数": 4,
  "恢复差异": 0,
  "跳过操作数": 3,
  "渲染行数": 3,
  "裁剪行数": 1,
  "是否降级": true,
  "非法操作错误码": "E_BAD_OP"
};
// 有的值在收进来之前已经 stringify 过，比较前先试着解析回来，避免类型错配把正确实现判成不过。
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { /* 不是 JSON 就按原文比 */ }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (__same(got, want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
