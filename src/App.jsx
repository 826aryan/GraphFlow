import { useState, useRef, useCallback, useEffect } from "react";

// ─── Color Palette ──────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0e1a",
  panel: "#0f1629",
  panelBorder: "#1e2d4a",
  nodeDefault: "#1e3a5f",
  nodeDefaultBorder: "#2d5a8f",
  nodeCurrent: "#f97316",
  nodeVisited: "#22c55e",
  nodePath: "#3b82f6",
  nodeMST: "#a855f7",
  nodeTopoOrder: "#06b6d4",
  edgeDefault: "#1e2d4a",
  edgeActive: "#fbbf24",
  edgePath: "#3b82f6",
  edgeMST: "#a855f7",
  text: "#e2e8f0",
  textMuted: "#64748b",
  accent: "#3b82f6",
  success: "#22c55e",
  warning: "#f97316",
};

// ─── Priority Queue ───────────────────────────────────────────────────────────
class MinHeap {
  constructor() { this.heap = []; }
  push(item) { this.heap.push(item); this._bubbleUp(this.heap.length - 1); }
  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0]; const last = this.heap.pop();
    if (this.heap.length > 0) { this.heap[0] = last; this._sinkDown(0); }
    return top;
  }
  isEmpty() { return this.heap.length === 0; }
  _bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i-1)/2);
      if (this.heap[p][0] <= this.heap[i][0]) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]]; i = p;
    }
  }
  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let s = i; const l = 2*i+1, r = 2*i+2;
      if (l < n && this.heap[l][0] < this.heap[s][0]) s = l;
      if (r < n && this.heap[r][0] < this.heap[s][0]) s = r;
      if (s === i) break;
      [this.heap[i], this.heap[s]] = [this.heap[s], this.heap[i]]; i = s;
    }
  }
}

// ─── Adjacency List ───────────────────────────────────────────────────────────
function buildAdjList(nodes, edges) {
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    adj[e.source]?.push({ target: e.target, weight: e.weight, edgeId: e.id });
    if (!e.directed) adj[e.target]?.push({ target: e.source, weight: e.weight, edgeId: e.id });
  });
  return adj;
}

// ─── BFS ──────────────────────────────────────────────────────────────────────
function runBFS(nodes, edges, startId) {
  const adj = buildAdjList(nodes, edges);
  const steps = []; const visited = new Set([startId]); const queue = [startId];
  steps.push({ type:"start", node:startId, queue:[...queue], visited:[...visited], stack:[], distances:{}, description:`Start BFS from node ${startId}. Add to queue.` });
  while (queue.length > 0) {
    const curr = queue.shift();
    steps.push({ type:"visit", node:curr, queue:[...queue], visited:[...visited], stack:[], distances:{}, description:`Dequeue node ${curr}. Mark as current.` });
    for (const { target, edgeId } of (adj[curr] || [])) {
      if (!visited.has(target)) {
        visited.add(target); queue.push(target);
        steps.push({ type:"enqueue", node:target, from:curr, edgeId, queue:[...queue], visited:[...visited], stack:[], distances:{}, description:`Found unvisited neighbor ${target} from ${curr}. Enqueue it.` });
      }
    }
    steps.push({ type:"done_node", node:curr, queue:[...queue], visited:[...visited], stack:[], distances:{}, description:`Node ${curr} fully explored.` });
  }
  steps.push({ type:"complete", queue:[], visited:[...visited], stack:[], distances:{}, description:`BFS complete! Visited ${visited.size} node(s).` });
  return steps;
}

// ─── DFS ──────────────────────────────────────────────────────────────────────
function runDFS(nodes, edges, startId) {
  const adj = buildAdjList(nodes, edges);
  const steps = []; const visited = new Set(); const stack = [];
  function dfs(nodeId, from, edgeId) {
    visited.add(nodeId); stack.push(nodeId);
    steps.push({ type:"visit", node:nodeId, from, edgeId, queue:[], visited:[...visited], stack:[...stack], distances:{}, description:`Visit node ${nodeId}. Push to stack.` });
    for (const { target, edgeId:eid } of (adj[nodeId] || [])) {
      if (!visited.has(target)) {
        steps.push({ type:"explore", node:target, from:nodeId, edgeId:eid, queue:[], visited:[...visited], stack:[...stack], distances:{}, description:`Explore edge ${nodeId} → ${target}.` });
        dfs(target, nodeId, eid);
      }
    }
    stack.pop();
    steps.push({ type:"done_node", node:nodeId, queue:[], visited:[...visited], stack:[...stack], distances:{}, description:`Backtrack from ${nodeId}. Pop from stack.` });
  }
  steps.push({ type:"start", node:startId, queue:[], visited:[], stack:[], distances:{}, description:`Start DFS from node ${startId}.` });
  dfs(startId, null, null);
  steps.push({ type:"complete", queue:[], visited:[...visited], stack:[], distances:{}, description:`DFS complete! Visited ${visited.size} node(s).` });
  return steps;
}

// ─── Dijkstra ─────────────────────────────────────────────────────────────────
function runDijkstra(nodes, edges, startId) {
  const adj = buildAdjList(nodes, edges);
  const steps = []; const dist = {}; const prev = {}; const prevEdge = {};
  nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
  dist[startId] = 0;
  const pq = new MinHeap(); pq.push([0, startId]); const settled = new Set();
  steps.push({ type:"start", node:startId, distances:{...dist}, visited:[], queue:[startId], stack:[], description:`Initialize Dijkstra. Set dist[${startId}] = 0, all others = ∞.` });
  while (!pq.isEmpty()) {
    const [d, u] = pq.pop(); if (settled.has(u)) continue; settled.add(u);
    steps.push({ type:"visit", node:u, distances:{...dist}, visited:[...settled], queue:[], stack:[], description:`Extract min: node ${u} with distance ${d}.` });
    for (const { target:v, weight:w, edgeId } of (adj[u] || [])) {
      if (settled.has(v)) continue; const nd = dist[u] + w;
      steps.push({ type:"relax", node:v, from:u, edgeId, distances:{...dist}, visited:[...settled], queue:[], stack:[], description:`Relax edge ${u} → ${v}: ${dist[u]} + ${w} = ${nd} ${nd < dist[v] ? "< "+(dist[v]===Infinity?"∞":dist[v])+" ✓ Update!" : "≥ "+dist[v]+" No update."}` });
      if (nd < dist[v]) {
        dist[v] = nd; prev[v] = u; prevEdge[v] = edgeId; pq.push([nd, v]);
        steps.push({ type:"update", node:v, distances:{...dist}, visited:[...settled], queue:[], stack:[], description:`Updated dist[${v}] = ${nd}. Added to priority queue.` });
      }
    }
  }
  const pathNodes = new Set(); const pathEdges = new Set();
  nodes.forEach(n => {
    let cur = n.id; const path = [];
    while (cur !== null && prev[cur] !== null) { path.push(cur); pathEdges.add(prevEdge[cur]); cur = prev[cur]; }
    if (cur === startId) { path.push(startId); path.forEach(p => pathNodes.add(p)); }
  });
  steps.push({ type:"complete", distances:{...dist}, visited:[...settled], pathNodes:[...pathNodes], pathEdges:[...pathEdges], queue:[], stack:[], description:`Dijkstra complete! Shortest paths from ${startId} computed.` });
  return steps;
}

// ─── Prim's MST ───────────────────────────────────────────────────────────────
function runPrim(nodes, edges, startId) {
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    adj[e.source]?.push({ target:e.target, weight:e.weight, edgeId:e.id });
    adj[e.target]?.push({ target:e.source, weight:e.weight, edgeId:e.id });
  });
  const steps = []; const inMST = new Set([startId]);
  const mstEdges = new Set(); const mstNodes = new Set([startId]); let totalCost = 0;
  steps.push({ type:"start", node:startId, visited:[startId], mstEdges:[], mstNodes:[startId], queue:[], stack:[], distances:{}, totalCost:0, description:`Prim's MST: Start from node ${startId}. Add to MST.` });
  while (inMST.size < nodes.length) {
    let best = null;
    for (const u of inMST) {
      for (const { target:v, weight:w, edgeId } of (adj[u] || [])) {
        if (!inMST.has(v) && (!best || w < best.w)) best = { u, v, w, edgeId };
      }
    }
    if (!best) break;
    steps.push({ type:"relax", node:best.v, from:best.u, edgeId:best.edgeId, visited:[...inMST], mstEdges:[...mstEdges], mstNodes:[...mstNodes], queue:[], stack:[], distances:{}, totalCost, description:`Cheapest crossing edge: ${best.u} → ${best.v} (weight ${best.w}).` });
    inMST.add(best.v); mstEdges.add(best.edgeId); mstNodes.add(best.v); totalCost += best.w;
    steps.push({ type:"visit", node:best.v, from:best.u, edgeId:best.edgeId, visited:[...inMST], mstEdges:[...mstEdges], mstNodes:[...mstNodes], queue:[], stack:[], distances:{}, totalCost, description:`Add edge ${best.u}–${best.v} (w=${best.w}) to MST. Total cost: ${totalCost}.` });
  }
  steps.push({ type:"complete", visited:[...inMST], mstEdges:[...mstEdges], mstNodes:[...mstNodes], queue:[], stack:[], distances:{}, totalCost, description:`Prim's MST complete! ${mstEdges.size} edges, total cost = ${totalCost}.` });
  return steps;
}

// ─── Topological Sort (Kahn's) ────────────────────────────────────────────────
function runTopoSort(nodes, edges) {
  const inDegree = {}; const adj = {};
  nodes.forEach(n => { inDegree[n.id] = 0; adj[n.id] = []; });
  edges.forEach(e => { adj[e.source]?.push({ target:e.target, edgeId:e.id }); inDegree[e.target] = (inDegree[e.target]||0)+1; });
  const steps = []; const deg = { ...inDegree };
  const queue = nodes.filter(n => deg[n.id] === 0).map(n => n.id);
  const topoOrder = []; const visited = new Set();
  steps.push({ type:"start", node:null, queue:[...queue], visited:[], stack:[], distances:{}, topoOrder:[], inDegree:{...deg}, description:`Kahn's Topo Sort: Nodes with in-degree 0: [${queue.join(", ")}].` });
  while (queue.length > 0) {
    const curr = queue.shift(); visited.add(curr); topoOrder.push(curr);
    steps.push({ type:"visit", node:curr, queue:[...queue], visited:[...visited], stack:[], distances:{}, topoOrder:[...topoOrder], inDegree:{...deg}, description:`Dequeue ${curr}. Topo order so far: [${topoOrder.join(" → ")}].` });
    for (const { target, edgeId } of (adj[curr] || [])) {
      deg[target]--;
      steps.push({ type:"relax", node:target, from:curr, edgeId, queue:[...queue], visited:[...visited], stack:[], distances:{}, topoOrder:[...topoOrder], inDegree:{...deg}, description:`Decrease in-degree of ${target} to ${deg[target]}.${deg[target]===0?" → In-degree is 0, enqueue!":""}` });
      if (deg[target] === 0) {
        queue.push(target);
        steps.push({ type:"enqueue", node:target, from:curr, edgeId, queue:[...queue], visited:[...visited], stack:[], distances:{}, topoOrder:[...topoOrder], inDegree:{...deg}, description:`Enqueue ${target} (in-degree reached 0).` });
      }
    }
  }
  const hasCycle = topoOrder.length < nodes.length;
  steps.push({ type:"complete", queue:[], visited:[...visited], stack:[], distances:{}, topoOrder:[...topoOrder], inDegree:{...deg}, description: hasCycle ? `⚠️ Cycle detected! Only ${topoOrder.length}/${nodes.length} nodes processed. Not a DAG.` : `Topo Sort complete! Order: ${topoOrder.join(" → ")}` });
  return steps;
}

// ─── Constants ────────────────────────────────────────────────────────────────
let _nodeCounter = 0;
function makeNodeId() { return String.fromCharCode(65 + (_nodeCounter++ % 26)) + (Math.floor(_nodeCounter/26)||""); }
const SPEED_MAP = { Slow:900, Normal:450, Fast:150 };
const ALGO_LIST = ["BFS","DFS","Dijkstra","Prim's MST","Topo Sort"];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function GraphVisualizer() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [algo, setAlgo] = useState("BFS");
  const [startNode, setStartNode] = useState("");
  const [speed, setSpeed] = useState("Normal");
  const [mode, setMode] = useState("select");
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [edgeStart, setEdgeStart] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x:0, y:0 });
  const [weightInput, setWeightInput] = useState({ edgeId:null, value:"" });
  const [directed, setDirected] = useState(false);
  const canvasRef = useRef(null); const runnerRef = useRef(null); const svgRef = useRef(null);
  const currentStep = steps[stepIdx] ?? null;
  const needsStart = algo !== "Topo Sort";

  // ── Visual state ─────────────────────────────────────────────────────────
  const getNodeColor = useCallback((nodeId) => {
    if (!currentStep) return COLORS.nodeDefault;
    if (algo === "Prim's MST") {
      if (currentStep.node === nodeId && currentStep.type !== "complete") return COLORS.nodeCurrent;
      if (currentStep.mstNodes?.includes(nodeId)) return COLORS.nodeMST;
      return COLORS.nodeDefault;
    }
    if (algo === "Topo Sort") {
      if (currentStep.node === nodeId && currentStep.type !== "complete") return COLORS.nodeCurrent;
      if (currentStep.topoOrder?.includes(nodeId)) return COLORS.nodeTopoOrder;
      return COLORS.nodeDefault;
    }
    if (currentStep.pathNodes?.includes(nodeId)) return COLORS.nodePath;
    if (currentStep.node === nodeId && currentStep.type !== "complete") return COLORS.nodeCurrent;
    if (currentStep.visited?.includes(nodeId)) return COLORS.nodeVisited;
    return COLORS.nodeDefault;
  }, [currentStep, algo]);

  const getNodeBorder = useCallback((nodeId) => {
    if (!currentStep) return COLORS.nodeDefaultBorder;
    if (algo === "Prim's MST") {
      if (currentStep.node === nodeId) return "#fb923c";
      if (currentStep.mstNodes?.includes(nodeId)) return "#c084fc";
      return COLORS.nodeDefaultBorder;
    }
    if (algo === "Topo Sort") {
      if (currentStep.node === nodeId) return "#fb923c";
      if (currentStep.topoOrder?.includes(nodeId)) return "#22d3ee";
      return COLORS.nodeDefaultBorder;
    }
    if (currentStep.pathNodes?.includes(nodeId)) return "#60a5fa";
    if (currentStep.node === nodeId && currentStep.type !== "complete") return "#fb923c";
    if (currentStep.visited?.includes(nodeId)) return "#4ade80";
    return COLORS.nodeDefaultBorder;
  }, [currentStep, algo]);

  const getEdgeColor = useCallback((edgeId) => {
    if (!currentStep) return COLORS.edgeDefault;
    if (algo === "Prim's MST") {
      if (currentStep.mstEdges?.includes(edgeId)) return COLORS.edgeMST;
      if (currentStep.edgeId === edgeId) return COLORS.edgeActive;
      return COLORS.edgeDefault;
    }
    if (currentStep.pathEdges?.includes(edgeId)) return COLORS.edgePath;
    if (currentStep.edgeId === edgeId) return COLORS.edgeActive;
    return COLORS.edgeDefault;
  }, [currentStep, algo]);

  // ── Interactions ──────────────────────────────────────────────────────────
  const handleSvgClick = useCallback((e) => {
    if (mode !== "addNode") return;
    const rect = svgRef.current.getBoundingClientRect();
    const id = makeNodeId();
    setNodes(prev => [...prev, { id, x: e.clientX-rect.left, y: e.clientY-rect.top }]);
    if (!startNode) setStartNode(id);
  }, [mode, startNode]);

  const handleNodeClick = useCallback((e, nodeId) => {
    e.stopPropagation();
    if (mode === "delete") {
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setEdges(prev => prev.filter(ed => ed.source !== nodeId && ed.target !== nodeId));
      if (startNode === nodeId) setStartNode(""); return;
    }
    if (mode === "addEdge") {
      if (!edgeStart) { setEdgeStart(nodeId); return; }
      if (edgeStart !== nodeId && !edges.find(ed => ed.source===edgeStart && ed.target===nodeId))
        setEdges(prev => [...prev, { id:`${edgeStart}-${nodeId}-${Date.now()}`, source:edgeStart, target:nodeId, weight:1, directed }]);
      setEdgeStart(null);
    }
  }, [mode, edgeStart, edges, directed, startNode]);

  const handleNodeMouseDown = useCallback((e, nodeId) => {
    if (mode !== "select") return; e.stopPropagation();
    const rect = svgRef.current.getBoundingClientRect(); const node = nodes.find(n => n.id===nodeId);
    setDragging(nodeId); setDragOffset({ x:e.clientX-rect.left-node.x, y:e.clientY-rect.top-node.y });
  }, [mode, nodes]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(30, Math.min(rect.width-30, e.clientX-rect.left-dragOffset.x));
    const y = Math.max(30, Math.min(rect.height-30, e.clientY-rect.top-dragOffset.y));
    setNodes(prev => prev.map(n => n.id===dragging ? {...n,x,y} : n));
  }, [dragging, dragOffset]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  // ── Run ───────────────────────────────────────────────────────────────────
  const runAlgorithm = useCallback(() => {
    if (nodes.length === 0 || (needsStart && !startNode)) return;
    let s;
    if (algo==="BFS") s = runBFS(nodes, edges, startNode);
    else if (algo==="DFS") s = runDFS(nodes, edges, startNode);
    else if (algo==="Dijkstra") s = runDijkstra(nodes, edges, startNode);
    else if (algo==="Prim's MST") s = runPrim(nodes, edges, startNode);
    else if (algo==="Topo Sort") s = runTopoSort(nodes, edges);
    setSteps(s); setStepIdx(0); setRunning(true);
  }, [algo, nodes, edges, startNode, needsStart]);

  const completedRef = useRef(false);

  useEffect(() => {
    if (running && stepIdx >= steps.length - 1) {
      if (!completedRef.current) {
        completedRef.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRunning(false);
      }
    } else {
      completedRef.current = false;
    }
  }, [stepIdx, steps.length, running]);

  useEffect(() => {
    if (!running || stepIdx < 0 || stepIdx >= steps.length - 1) return;
    runnerRef.current = setTimeout(() => setStepIdx(i => i+1), SPEED_MAP[speed]);
    return () => clearTimeout(runnerRef.current);
  }, [running, stepIdx, steps.length, speed]);

  const pause = () => { setRunning(false); clearTimeout(runnerRef.current); };
  const stepFwd = () => { if (stepIdx < steps.length-1) { pause(); setStepIdx(i => i+1); } };
  const reset = () => { pause(); setSteps([]); setStepIdx(-1); setRunning(false); };
  const resetGraph = () => { reset(); setNodes([]); setEdges([]); setStartNode(""); _nodeCounter = 0; };

  const loadExample = () => {
    resetGraph(); _nodeCounter = 0;
    if (algo === "Topo Sort") {
      setNodes([{ id:"A",x:150,y:200 },{ id:"B",x:320,y:100 },{ id:"C",x:320,y:300 },{ id:"D",x:490,y:100 },{ id:"E",x:490,y:300 },{ id:"F",x:660,y:200 }]);
      _nodeCounter = 6;
      setEdges([
        { id:"e1",source:"A",target:"B",weight:1,directed:true },{ id:"e2",source:"A",target:"C",weight:1,directed:true },
        { id:"e3",source:"B",target:"D",weight:1,directed:true },{ id:"e4",source:"C",target:"E",weight:1,directed:true },
        { id:"e5",source:"D",target:"F",weight:1,directed:true },{ id:"e6",source:"E",target:"F",weight:1,directed:true },
        { id:"e7",source:"B",target:"E",weight:1,directed:true },
      ]);
      setDirected(true); setStartNode("A");
    } else {
      setNodes([{ id:"A",x:200,y:150 },{ id:"B",x:380,y:80 },{ id:"C",x:380,y:220 },{ id:"D",x:560,y:80 },{ id:"E",x:560,y:220 },{ id:"F",x:720,y:150 }]);
      _nodeCounter = 6;
      setEdges([
        { id:"e1",source:"A",target:"B",weight:4,directed:false },{ id:"e2",source:"A",target:"C",weight:2,directed:false },
        { id:"e3",source:"B",target:"D",weight:5,directed:false },{ id:"e4",source:"C",target:"E",weight:3,directed:false },
        { id:"e5",source:"D",target:"F",weight:1,directed:false },{ id:"e6",source:"E",target:"F",weight:6,directed:false },
        { id:"e7",source:"B",target:"C",weight:1,directed:false },
      ]);
      setDirected(false); setStartNode("A");
    }
  };

  const getEdgeMid = (e) => {
    const src = nodes.find(n => n.id===e.source); const tgt = nodes.find(n => n.id===e.target);
    if (!src||!tgt) return {x:0,y:0};
    return { x:(src.x+tgt.x)/2, y:(src.y+tgt.y)/2 };
  };
  const getArrowPoints = (e) => {
    const src = nodes.find(n => n.id===e.source); const tgt = nodes.find(n => n.id===e.target);
    if (!src||!tgt) return {x1:0,y1:0,x2:0,y2:0};
    const dx=tgt.x-src.x, dy=tgt.y-src.y, len=Math.sqrt(dx*dx+dy*dy)||1, r=24;
    return { x1:src.x+(dx/len)*r, y1:src.y+(dy/len)*r, x2:tgt.x-(dx/len)*r, y2:tgt.y-(dy/len)*r };
  };

  // Right panel
  const dsLabel = algo==="BFS"||algo==="Topo Sort" ? "Queue" : algo==="DFS" ? "Stack" : algo==="Prim's MST" ? "In MST" : "Settled";
  const dsItems = currentStep ? (
    algo==="BFS"||algo==="Topo Sort" ? currentStep.queue :
    algo==="DFS" ? currentStep.stack :
    algo==="Prim's MST" ? currentStep.mstNodes :
    currentStep.visited
  ) ?? [] : [];

  const modeBtn = (m, label, icon) => (
    <button onClick={() => { setMode(m); setEdgeStart(null); }} style={{
      padding:"8px 14px", borderRadius:8, fontSize:13, fontWeight:600,
      background: mode===m ? COLORS.accent : "transparent",
      color: mode===m ? "#fff" : COLORS.textMuted,
      border:`1px solid ${mode===m ? COLORS.accent : COLORS.panelBorder}`,
      cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all 0.15s",
    }}>{icon} {label}</button>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", width:"100vw", background:COLORS.bg, color:COLORS.text, fontFamily:"'JetBrains Mono','Fira Code',monospace", overflow:"hidden", boxSizing:"border-box" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", padding:"10px 20px", borderBottom:`1px solid ${COLORS.panelBorder}`, background:COLORS.panel, gap:12, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⬡</div>
          <span style={{ fontWeight:700, fontSize:16, letterSpacing:"0.05em" }}>GRAPH<span style={{ color:COLORS.accent }}>VIZ</span></span>
        </div>
        {/* Algorithm tabs */}
        <div style={{ display:"flex", gap:4, marginLeft:8 }}>
          {ALGO_LIST.map(a => (
            <button key={a} onClick={() => { setAlgo(a); reset(); }} style={{
              padding:"5px 12px", borderRadius:6, fontSize:12, fontWeight:600,
              background: algo===a ? COLORS.accent : "transparent",
              color: algo===a ? "#fff" : COLORS.textMuted,
              border:`1px solid ${algo===a ? COLORS.accent : COLORS.panelBorder}`,
              cursor:"pointer", transition:"all 0.15s",
            }}>{a}</button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <button onClick={loadExample} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, background:"transparent", color:COLORS.textMuted, border:`1px solid ${COLORS.panelBorder}`, cursor:"pointer" }}>Load Example</button>
        <button onClick={resetGraph} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, background:"#1a0a0a", color:"#f87171", border:"1px solid #3f1010", cursor:"pointer" }}>Clear Graph</button>
      </div>

      {/* Body */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Left sidebar */}
        <div style={{ width:220, background:COLORS.panel, borderRight:`1px solid ${COLORS.panelBorder}`, display:"flex", flexDirection:"column", overflowY:"auto", flexShrink:0 }}>

          <Section title="SETTINGS">
            {needsStart && (
              <select value={startNode} onChange={e => setStartNode(e.target.value)} style={selectStyle}>
                <option value="">-- Start Node --</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
              </select>
            )}
            {algo==="Topo Sort" && (
              <div style={{ padding:"6px 10px", borderRadius:6, background:"#0a1628", border:`1px solid ${COLORS.panelBorder}`, fontSize:11, color:COLORS.textMuted }}>
                ℹ️ Uses all nodes. Ensure edges are directed.
              </div>
            )}
            {algo==="Prim's MST" && (
              <div style={{ padding:"6px 10px", borderRadius:6, background:"#1a0a2a", border:"1px solid #4a1a6a", fontSize:11, color:"#c084fc" }}>
                🌿 MST treats edges as undirected.
              </div>
            )}
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <span style={{ fontSize:12, color:COLORS.textMuted }}>Speed</span>
              {["Slow","Normal","Fast"].map(s => (
                <button key={s} onClick={() => setSpeed(s)} style={{ padding:"4px 8px", borderRadius:6, fontSize:11, background:speed===s?"#1d3557":"transparent", color:speed===s?"#60a5fa":COLORS.textMuted, border:`1px solid ${speed===s?"#2d5a8f":COLORS.panelBorder}`, cursor:"pointer" }}>{s}</button>
              ))}
            </div>
          </Section>

          <Section title="GRAPH TOOLS">
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {modeBtn("select","Select / Drag","↖")}
              {modeBtn("addNode","Add Node","+")}
              {modeBtn("addEdge","Add Edge","⟶")}
              {modeBtn("delete","Delete","✕")}
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:COLORS.textMuted, cursor:"pointer", marginTop:4 }}>
              <input type="checkbox" checked={directed} onChange={e => setDirected(e.target.checked)} /> Directed Edges
            </label>
            {mode==="addEdge" && edgeStart && (
              <div style={{ padding:"6px 10px", borderRadius:6, background:"#1a2a1a", border:"1px solid #2d4a2d", fontSize:12, color:"#4ade80" }}>
                From: <strong>{edgeStart}</strong> → click target
              </div>
            )}
          </Section>

          <Section title="CONTROLS">
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <button onClick={runAlgorithm} disabled={nodes.length===0||(needsStart&&!startNode)||running} style={ctrlBtn("#1d3557","#3b82f6", nodes.length===0||(needsStart&&!startNode)||running)}>▶ Run</button>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => running ? pause() : setRunning(true)} disabled={steps.length===0} style={{ ...ctrlBtn("#1a2a1a","#22c55e",steps.length===0), flex:1 }}>{running?"⏸ Pause":"▶ Resume"}</button>
                <button onClick={stepFwd} disabled={running||stepIdx>=steps.length-1} style={{ ...ctrlBtn("#1a1a2a","#8b5cf6",running||stepIdx>=steps.length-1), flex:1 }}>⏭ Step</button>
              </div>
              <button onClick={reset} style={ctrlBtn("#1a1010","#f97316",false)}>↺ Reset</button>
            </div>
          </Section>

          <Section title="LEGEND">
            {[
              ["Current",COLORS.nodeCurrent],["Visited",COLORS.nodeVisited],["Shortest Path",COLORS.nodePath],
              ["MST Node",COLORS.nodeMST],["Topo Order",COLORS.nodeTopoOrder],["Unvisited",COLORS.nodeDefaultBorder],
            ].map(([label,color]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11 }}>
                <div style={{ width:12, height:12, borderRadius:"50%", background:color, flexShrink:0 }} />
                <span style={{ color:COLORS.textMuted }}>{label}</span>
              </div>
            ))}
          </Section>
        </div>

        {/* Canvas */}
        <div style={{ flex:1, position:"relative", overflow:"hidden" }} ref={canvasRef}>
          {nodes.length===0 && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none", gap:12 }}>
              <div style={{ fontSize:48, opacity:0.1 }}>⬡</div>
              <div style={{ fontSize:14, color:COLORS.textMuted, opacity:0.6 }}>Select <strong style={{ color:COLORS.accent }}>Add Node</strong> and click to start</div>
              <div style={{ fontSize:12, color:COLORS.textMuted, opacity:0.4 }}>or click <strong>Load Example</strong></div>
            </div>
          )}
          <svg ref={svgRef} width="100%" height="100%"
            style={{ cursor: mode==="addNode"?"crosshair":mode==="delete"?"not-allowed":"default" }}
            onClick={handleSvgClick} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
          >
            <defs>
              {[["arrow",COLORS.edgeActive],["arrow-default",COLORS.edgeDefault],["arrow-path",COLORS.edgePath],["arrow-mst",COLORS.edgeMST]].map(([id,fill]) => (
                <marker key={id} id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={fill} />
                </marker>
              ))}
            </defs>

            {edges.map(e => {
              const { x1,y1,x2,y2 } = getArrowPoints(e); const mid = getEdgeMid(e);
              const color = getEdgeColor(e.id); const isActive = color !== COLORS.edgeDefault;
              const markerId = color===COLORS.edgeActive?"arrow":color===COLORS.edgePath?"arrow-path":color===COLORS.edgeMST?"arrow-mst":"arrow-default";
              const showDir = directed || e.directed;
              return (
                <g key={e.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={isActive?3:1.5}
                    markerEnd={showDir?`url(#${markerId})`:undefined} strokeOpacity={isActive?1:0.4} />
                  {weightInput.edgeId===e.id ? (
                    <foreignObject x={mid.x-24} y={mid.y-12} width={48} height={24}>
                      <input type="number" value={weightInput.value} autoFocus
                        onChange={ev => setWeightInput(w => ({...w,value:ev.target.value}))}
                        onBlur={() => { const val=parseInt(weightInput.value); if(!isNaN(val)&&val>0) setEdges(prev=>prev.map(ed=>ed.id===e.id?{...ed,weight:val}:ed)); setWeightInput({edgeId:null,value:""}); }}
                        onKeyDown={ev => ev.key==="Enter"&&ev.target.blur()}
                        style={{ width:"100%",background:"#1e3a5f",color:"#fff",border:"1px solid #3b82f6",borderRadius:4,textAlign:"center",fontSize:12,padding:"2px 0" }}
                      />
                    </foreignObject>
                  ) : (
                    <g onClick={ev => { ev.stopPropagation(); setWeightInput({edgeId:e.id,value:String(e.weight)}); }}>
                      <rect x={mid.x-14} y={mid.y-10} width={28} height={20} rx={4} fill={COLORS.panel} stroke={color} strokeWidth={1} strokeOpacity={0.6} style={{ cursor:"pointer" }} />
                      <text x={mid.x} y={mid.y+4} textAnchor="middle" fontSize={11} fill={isActive?color:COLORS.textMuted} fontWeight="600" style={{ cursor:"pointer" }}>{e.weight}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {nodes.map(n => {
              const bg=getNodeColor(n.id), border=getNodeBorder(n.id);
              const isStart = n.id===startNode && needsStart;
              const dist = currentStep?.distances?.[n.id];
              const topoIdx = currentStep?.topoOrder?.indexOf(n.id);
              const inDeg = currentStep?.inDegree?.[n.id];
              return (
                <g key={n.id} onClick={e=>handleNodeClick(e,n.id)} onMouseDown={e=>handleNodeMouseDown(e,n.id)}
                  style={{ cursor:mode==="select"?"grab":mode==="delete"?"not-allowed":"pointer" }}>
                  {isStart && <circle cx={n.x} cy={n.y} r={30} fill="none" stroke={COLORS.accent} strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.5} />}
                  <circle cx={n.x} cy={n.y} r={24} fill={bg} stroke={border} strokeWidth={2.5} />
                  <text x={n.x} y={n.y+5} textAnchor="middle" fontSize={14} fontWeight="700" fill="#fff">{n.id}</text>
                  {algo==="Dijkstra" && dist!==undefined && dist!==Infinity && (
                    <text x={n.x} y={n.y+38} textAnchor="middle" fontSize={11} fill="#60a5fa" fontWeight="600">{dist}</text>
                  )}
                  {algo==="Topo Sort" && topoIdx!==undefined && topoIdx>=0 && (
                    <text x={n.x} y={n.y+38} textAnchor="middle" fontSize={11} fill="#22d3ee" fontWeight="700">#{topoIdx+1}</text>
                  )}
                  {algo==="Topo Sort" && inDeg!==undefined && (
                    <g>
                      <circle cx={n.x+18} cy={n.y-18} r={10} fill="#1e2d4a" stroke="#334155" strokeWidth={1}/>
                      <text x={n.x+18} y={n.y-14} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="700">{inDeg}</text>
                    </g>
                  )}
                  {mode==="addEdge" && edgeStart===n.id && (
                    <circle cx={n.x} cy={n.y} r={28} fill="none" stroke="#4ade80" strokeWidth={2} />
                  )}
                </g>
              );
            })}
          </svg>

          {steps.length>0 && (
            <div style={{ position:"absolute", top:10, right:10, background:COLORS.panel, border:`1px solid ${COLORS.panelBorder}`, borderRadius:8, padding:"6px 12px", fontSize:12, color:COLORS.textMuted }}>
              Step {stepIdx+1} / {steps.length}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ width:200, background:COLORS.panel, borderLeft:`1px solid ${COLORS.panelBorder}`, display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>
          <Section title={dsLabel.toUpperCase()}>
            <div style={{ display:"flex", flexDirection:"column", gap:4, minHeight:60 }}>
              {dsItems&&dsItems.length>0 ? dsItems.map((item,i)=>(
                <div key={i} style={{ padding:"4px 10px", borderRadius:6, background:"#0a1628", border:`1px solid ${COLORS.panelBorder}`, fontSize:13, fontWeight:600, color:i===0?COLORS.accent:COLORS.text }}>{item}</div>
              )) : <div style={{ color:COLORS.textMuted, fontSize:12 }}>Empty</div>}
            </div>
          </Section>

          {algo==="Dijkstra" && currentStep?.distances && (
            <Section title="DISTANCES">
              {Object.entries(currentStep.distances).map(([node,dist]) => (
                <div key={node} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"2px 0" }}>
                  <span style={{ color:COLORS.text, fontWeight:600 }}>{node}</span>
                  <span style={{ color:dist===Infinity?COLORS.textMuted:COLORS.accent }}>{dist===Infinity?"∞":dist}</span>
                </div>
              ))}
            </Section>
          )}

          {algo==="Prim's MST" && currentStep && (
            <Section title="MST COST">
              <div style={{ fontSize:22, fontWeight:700, color:"#c084fc" }}>{currentStep.totalCost??0}</div>
              <div style={{ fontSize:11, color:COLORS.textMuted }}>{currentStep.mstEdges?.length??0} edges in tree</div>
            </Section>
          )}

          {algo==="Topo Sort" && currentStep?.topoOrder?.length>0 && (
            <Section title="TOPO ORDER">
              {currentStep.topoOrder.map((n,i)=>(
                <div key={n} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12 }}>
                  <span style={{ color:COLORS.textMuted, width:18 }}>#{i+1}</span>
                  <span style={{ color:"#22d3ee", fontWeight:700 }}>{n}</span>
                </div>
              ))}
            </Section>
          )}

          {algo==="Topo Sort" && currentStep?.inDegree && (
            <Section title="IN-DEGREE">
              {Object.entries(currentStep.inDegree).map(([n,d])=>(
                <div key={n} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"2px 0" }}>
                  <span style={{ color:COLORS.text, fontWeight:600 }}>{n}</span>
                  <span style={{ color:d===0?COLORS.success:COLORS.textMuted }}>{d}</span>
                </div>
              ))}
            </Section>
          )}

          <Section title="GRAPH">
            <div style={{ fontSize:12, color:COLORS.textMuted }}>{nodes.length} nodes, {edges.length} edges</div>
          </Section>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ height:90, background:COLORS.panel, borderTop:`1px solid ${COLORS.panelBorder}`, display:"flex", alignItems:"center", gap:20, padding:"0 24px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:running?"#22c55e":steps.length>0?"#f97316":COLORS.textMuted, boxShadow:running?"0 0 8px #22c55e":"none" }} />
          <span style={{ fontSize:11, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.1em" }}>
            {running?"Running":steps.length>0?"Paused":"Ready"}
          </span>
        </div>
        <div style={{ flex:1, fontSize:13, color:currentStep?.type==="complete"?COLORS.success:COLORS.text }}>
          {currentStep ? currentStep.description
            : <span style={{ color:COLORS.textMuted }}>Pick an algorithm in the header, set a start node, and click <strong style={{ color:COLORS.accent }}>▶ Run</strong>.</span>}
        </div>
        {currentStep?.type==="relax" && (
          <div style={{ padding:"6px 14px", borderRadius:8, background:"#1a1a0a", border:"1px solid #3a3a10", fontSize:12, color:"#fbbf24", flexShrink:0 }}>
            {algo==="Prim's MST"?"Checking edge":algo==="Topo Sort"?"Updating in-degree":"Edge relaxation"}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ padding:"14px 16px", borderBottom:`1px solid #1e2d4a` }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:"#334155", marginBottom:10, textTransform:"uppercase" }}>{title}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{children}</div>
    </div>
  );
}

const selectStyle = { width:"100%", padding:"7px 10px", borderRadius:8, fontSize:13, background:"#0a0e1a", color:"#e2e8f0", border:"1px solid #1e2d4a", cursor:"pointer", outline:"none" };

function ctrlBtn(bg, accent, disabled) {
  return { padding:"8px 0", borderRadius:8, fontSize:13, fontWeight:600, background:disabled?"#0a0e1a":bg, color:disabled?"#334155":accent, border:`1px solid ${disabled?"#1e2d4a":accent+"55"}`, cursor:disabled?"not-allowed":"pointer", transition:"all 0.15s" };
}