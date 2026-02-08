import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT & STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const AlgoLabContext = createContext();

const useAlgoLab = () => {
  const context = useContext(AlgoLabContext);
  if (!context) throw new Error('useAlgoLab must be used within AlgoLabProvider');
  return context;
};

// ═══════════════════════════════════════════════════════════════════════════════
// THEME SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const THEMES = {
  cyber: {
    name: 'Cyber',
    bg: '#0a0e1a',
    surface: '#111827',
    surfaceHover: '#1f2937',
    border: '#1e3a5f',
    primary: '#00d9ff',
    primaryDark: '#0099cc',
    secondary: '#ff00aa',
    accent: '#7c3aed',
    text: '#e5e7eb',
    textMuted: '#9ca3af',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    node: '#1e40af',
    nodeActive: '#3b82f6',
    nodeVisited: '#6366f1',
    edge: '#374151',
    edgeActive: '#00d9ff',
  },
  light: {
    name: 'Light',
    bg: '#f8fafc',
    surface: '#ffffff',
    surfaceHover: '#f1f5f9',
    border: '#cbd5e1',
    primary: '#0ea5e9',
    primaryDark: '#0284c7',
    secondary: '#ec4899',
    accent: '#8b5cf6',
    text: '#0f172a',
    textMuted: '#64748b',
    success: '#22c55e',
    warning: '#f97316',
    error: '#dc2626',
    node: '#bfdbfe',
    nodeActive: '#3b82f6',
    nodeVisited: '#818cf8',
    edge: '#e2e8f0',
    edgeActive: '#0ea5e9',
  },
  mono: {
    name: 'Monochrome',
    bg: '#0d0d0d',
    surface: '#1a1a1a',
    surfaceHover: '#262626',
    border: '#404040',
    primary: '#ffffff',
    primaryDark: '#d4d4d4',
    secondary: '#737373',
    accent: '#525252',
    text: '#fafafa',
    textMuted: '#a3a3a3',
    success: '#d4d4d4',
    warning: '#a3a3a3',
    error: '#737373',
    node: '#262626',
    nodeActive: '#fafafa',
    nodeVisited: '#737373',
    edge: '#404040',
    edgeActive: '#ffffff',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ALGORITHM TRACE GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

// SORTING ALGORITHMS

const generateBubbleSortTrace = (arr) => {
  const trace = [];
  const array = [...arr];
  const n = array.length;

  trace.push({
    array: [...array],
    comparing: [],
    sorted: [],
    description: 'Initial state',
    metrics: { comparisons: 0, swaps: 0 },
  });

  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      trace.push({
        array: [...array],
        comparing: [j, j + 1],
        sorted: Array.from({ length: i }, (_, k) => n - 1 - k),
        description: `Compare ${array[j]} vs ${array[j + 1]}`,
        metrics: { comparisons, swaps },
      });

      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        swaps++;
        trace.push({
          array: [...array],
          comparing: [j, j + 1],
          sorted: Array.from({ length: i }, (_, k) => n - 1 - k),
          description: `Swap ${array[j + 1]} ↔ ${array[j]}`,
          metrics: { comparisons, swaps },
        });
      }
    }
  }

  trace.push({
    array: [...array],
    comparing: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: 'Sorted',
    metrics: { comparisons, swaps },
  });

  return trace;
};

const generateQuickSortTrace = (arr) => {
  const trace = [];
  const array = [...arr];
  let comparisons = 0;
  let swaps = 0;

  trace.push({
    array: [...array],
    comparing: [],
    pivot: null,
    partitions: [],
    sorted: [],
    description: 'Initial state',
    metrics: { comparisons, swaps },
  });

  const partition = (low, high) => {
    const pivot = array[high];
    const pivotIndex = high;
    let i = low - 1;

    trace.push({
      array: [...array],
      comparing: [],
      pivot: pivotIndex,
      partitions: [{ start: low, end: high }],
      sorted: [],
      description: `Pivot: ${pivot} at index ${pivotIndex}`,
      metrics: { comparisons, swaps },
    });

    for (let j = low; j < high; j++) {
      comparisons++;
      trace.push({
        array: [...array],
        comparing: [j, pivotIndex],
        pivot: pivotIndex,
        partitions: [{ start: low, end: high }],
        sorted: [],
        description: `Compare ${array[j]} vs pivot ${pivot}`,
        metrics: { comparisons, swaps },
      });

      if (array[j] < pivot) {
        i++;
        if (i !== j) {
          [array[i], array[j]] = [array[j], array[i]];
          swaps++;
          trace.push({
            array: [...array],
            comparing: [i, j],
            pivot: pivotIndex === i ? j : pivotIndex === j ? i : pivotIndex,
            partitions: [{ start: low, end: high }],
            sorted: [],
            description: `Swap ${array[j]} ↔ ${array[i]}`,
            metrics: { comparisons, swaps },
          });
        }
      }
    }

    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    swaps++;
    const newPivotPos = i + 1;
    
    trace.push({
      array: [...array],
      comparing: [i + 1, high],
      pivot: null,
      partitions: [{ start: low, end: high }],
      sorted: [newPivotPos],
      description: `Place pivot at position ${newPivotPos}`,
      metrics: { comparisons, swaps },
    });

    return newPivotPos;
  };

  const quickSort = (low, high, sorted = []) => {
    if (low < high) {
      const pi = partition(low, high);
      const newSorted = [...sorted, pi];
      quickSort(low, pi - 1, newSorted);
      quickSort(pi + 1, high, newSorted);
    }
  };

  quickSort(0, array.length - 1);

  trace.push({
    array: [...array],
    comparing: [],
    pivot: null,
    partitions: [],
    sorted: Array.from({ length: array.length }, (_, i) => i),
    description: 'Sorted',
    metrics: { comparisons, swaps },
  });

  return trace;
};

const generateMergeSortTrace = (arr) => {
  const trace = [];
  const array = [...arr];
  let comparisons = 0;
  let operations = 0;

  trace.push({
    array: [...array],
    comparing: [],
    merging: [],
    sorted: [],
    description: 'Initial state',
    metrics: { comparisons, operations },
  });

  const merge = (left, mid, right) => {
    const leftArr = array.slice(left, mid + 1);
    const rightArr = array.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;

    trace.push({
      array: [...array],
      comparing: [],
      merging: [{ start: left, end: right }],
      sorted: [],
      description: `Merge range [${left}..${right}]`,
      metrics: { comparisons, operations },
    });

    while (i < leftArr.length && j < rightArr.length) {
      comparisons++;
      trace.push({
        array: [...array],
        comparing: [left + i, mid + 1 + j],
        merging: [{ start: left, end: right }],
        sorted: [],
        description: `Compare ${leftArr[i]} vs ${rightArr[j]}`,
        metrics: { comparisons, operations },
      });

      if (leftArr[i] <= rightArr[j]) {
        array[k] = leftArr[i];
        i++;
      } else {
        array[k] = rightArr[j];
        j++;
      }
      operations++;
      k++;

      trace.push({
        array: [...array],
        comparing: [],
        merging: [{ start: left, end: right }],
        sorted: [],
        description: `Place ${array[k - 1]} at position ${k - 1}`,
        metrics: { comparisons, operations },
      });
    }

    while (i < leftArr.length) {
      array[k] = leftArr[i];
      i++;
      k++;
      operations++;
    }

    while (j < rightArr.length) {
      array[k] = rightArr[j];
      j++;
      k++;
      operations++;
    }
  };

  const mergeSort = (left, right) => {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      mergeSort(left, mid);
      mergeSort(mid + 1, right);
      merge(left, mid, right);
    }
  };

  mergeSort(0, array.length - 1);

  trace.push({
    array: [...array],
    comparing: [],
    merging: [],
    sorted: Array.from({ length: array.length }, (_, i) => i),
    description: 'Sorted',
    metrics: { comparisons, operations },
  });

  return trace;
};

const generateRadixSortTrace = (arr) => {
  const trace = [];
  const array = [...arr];
  let operations = 0;

  trace.push({
    array: [...array],
    buckets: [],
    currentDigit: 0,
    sorted: [],
    description: 'Initial state',
    metrics: { operations },
  });

  const getMax = (arr) => Math.max(...arr);
  const max = getMax(array);

  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const digit = Math.log10(exp);
    const buckets = Array.from({ length: 10 }, () => []);

    for (let i = 0; i < array.length; i++) {
      const bucketIndex = Math.floor(array[i] / exp) % 10;
      buckets[bucketIndex].push(array[i]);
      operations++;

      trace.push({
        array: [...array],
        buckets: buckets.map(b => [...b]),
        currentDigit: digit,
        highlighting: [i],
        sorted: [],
        description: `Place ${array[i]} in bucket ${bucketIndex} (digit ${digit})`,
        metrics: { operations },
      });
    }

    let index = 0;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < buckets[i].length; j++) {
        array[index] = buckets[i][j];
        index++;
        operations++;
      }
    }

    trace.push({
      array: [...array],
      buckets: [],
      currentDigit: digit,
      sorted: [],
      description: `Collected from buckets (digit ${digit})`,
      metrics: { operations },
    });
  }

  trace.push({
    array: [...array],
    buckets: [],
    currentDigit: null,
    sorted: Array.from({ length: array.length }, (_, i) => i),
    description: 'Sorted',
    metrics: { operations },
  });

  return trace;
};

const generateCountingSortTrace = (arr) => {
  const trace = [];
  const array = [...arr];
  let operations = 0;

  trace.push({
    array: [...array],
    counts: [],
    sorted: [],
    description: 'Initial state',
    metrics: { operations },
  });

  const max = Math.max(...array);
  const min = Math.min(...array);
  const range = max - min + 1;
  const count = Array(range).fill(0);
  const output = Array(array.length);

  // Count occurrences
  for (let i = 0; i < array.length; i++) {
    count[array[i] - min]++;
    operations++;
    trace.push({
      array: [...array],
      counts: [...count],
      highlighting: [i],
      sorted: [],
      description: `Count ${array[i]}: ${count[array[i] - min]} occurrences`,
      metrics: { operations },
    });
  }

  // Cumulative count
  for (let i = 1; i < count.length; i++) {
    count[i] += count[i - 1];
    operations++;
  }

  trace.push({
    array: [...array],
    counts: [...count],
    sorted: [],
    description: 'Cumulative counts computed',
    metrics: { operations },
  });

  // Build output
  for (let i = array.length - 1; i >= 0; i--) {
    output[count[array[i] - min] - 1] = array[i];
    count[array[i] - min]--;
    operations++;

    trace.push({
      array: [...array],
      output: [...output],
      counts: [...count],
      highlighting: [i],
      sorted: [],
      description: `Place ${array[i]} at position ${count[array[i] - min]}`,
      metrics: { operations },
    });
  }

  for (let i = 0; i < array.length; i++) {
    array[i] = output[i];
  }

  trace.push({
    array: [...array],
    counts: [],
    output: [],
    sorted: Array.from({ length: array.length }, (_, i) => i),
    description: 'Sorted',
    metrics: { operations },
  });

  return trace;
};

// GRAPH ALGORITHMS

const generateDFSTrace = (graph, start) => {
  const trace = [];
  const visited = new Set();
  const stack = [start];
  let visitCount = 0;

  trace.push({
    graph,
    visited: new Set(),
    stack: [start],
    current: null,
    edges: [],
    description: `Initialize: stack=[${start}]`,
    metrics: { visitCount },
  });

  while (stack.length > 0) {
    const current = stack.pop();

    trace.push({
      graph,
      visited: new Set(visited),
      stack: [...stack],
      current,
      edges: [],
      description: `Pop node ${current}`,
      metrics: { visitCount },
    });

    if (!visited.has(current)) {
      visited.add(current);
      visitCount++;

      trace.push({
        graph,
        visited: new Set(visited),
        stack: [...stack],
        current,
        edges: [],
        description: `Visit node ${current}`,
        metrics: { visitCount },
      });

      const neighbors = (graph.edges[current] || []).slice().reverse();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
          trace.push({
            graph,
            visited: new Set(visited),
            stack: [...stack],
            current,
            edges: [{ from: current, to: neighbor }],
            description: `Push ${neighbor} to stack`,
            metrics: { visitCount },
          });
        }
      }
    }
  }

  trace.push({
    graph,
    visited: new Set(visited),
    stack: [],
    current: null,
    edges: [],
    description: 'Traversal complete',
    metrics: { visitCount },
  });

  return trace;
};

const generateBFSTrace = (graph, start) => {
  const trace = [];
  const visited = new Set([start]);
  const queue = [start];
  let visitCount = 1;

  trace.push({
    graph,
    visited: new Set([start]),
    queue: [start],
    current: null,
    edges: [],
    description: `Initialize: queue=[${start}]`,
    metrics: { visitCount },
  });

  while (queue.length > 0) {
    const current = queue.shift();

    trace.push({
      graph,
      visited: new Set(visited),
      queue: [...queue],
      current,
      edges: [],
      description: `Dequeue node ${current}`,
      metrics: { visitCount },
    });

    const neighbors = graph.edges[current] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        visitCount++;

        trace.push({
          graph,
          visited: new Set(visited),
          queue: [...queue],
          current,
          edges: [{ from: current, to: neighbor }],
          description: `Enqueue ${neighbor}`,
          metrics: { visitCount },
        });
      }
    }
  }

  trace.push({
    graph,
    visited: new Set(visited),
    queue: [],
    current: null,
    edges: [],
    description: 'Traversal complete',
    metrics: { visitCount },
  });

  return trace;
};

const generateDijkstraTrace = (graph, start) => {
  const trace = [];
  const distances = {};
  const visited = new Set();
  const pq = [{ node: start, distance: 0 }];
  let relaxations = 0;

  graph.nodes.forEach(node => {
    distances[node] = node === start ? 0 : Infinity;
  });

  trace.push({
    graph,
    distances: { ...distances },
    visited: new Set(),
    current: null,
    edges: [],
    description: `Initialize distances from ${start}`,
    metrics: { relaxations },
  });

  while (pq.length > 0) {
    pq.sort((a, b) => a.distance - b.distance);
    const { node: current, distance: currentDist } = pq.shift();

    if (visited.has(current)) continue;

    visited.add(current);

    trace.push({
      graph,
      distances: { ...distances },
      visited: new Set(visited),
      current,
      edges: [],
      description: `Process node ${current} (dist: ${currentDist})`,
      metrics: { relaxations },
    });

    const edges = graph.weightedEdges.filter(e => e.from === current);
    for (const edge of edges) {
      const newDist = currentDist + edge.weight;
      if (newDist < distances[edge.to]) {
        relaxations++;
        distances[edge.to] = newDist;
        pq.push({ node: edge.to, distance: newDist });

        trace.push({
          graph,
          distances: { ...distances },
          visited: new Set(visited),
          current,
          edges: [edge],
          description: `Relax edge ${current}→${edge.to}: ${distances[edge.to]}`,
          metrics: { relaxations },
        });
      }
    }
  }

  trace.push({
    graph,
    distances: { ...distances },
    visited: new Set(visited),
    current: null,
    edges: [],
    description: 'Shortest paths computed',
    metrics: { relaxations },
  });

  return trace;
};

const generateBellmanFordTrace = (graph, start) => {
  const trace = [];
  const distances = {};
  let relaxations = 0;

  graph.nodes.forEach(node => {
    distances[node] = node === start ? 0 : Infinity;
  });

  trace.push({
    graph,
    distances: { ...distances },
    iteration: 0,
    edges: [],
    description: `Initialize distances from ${start}`,
    metrics: { relaxations },
  });

  for (let i = 0; i < graph.nodes.length - 1; i++) {
    let updated = false;

    for (const edge of graph.weightedEdges) {
      if (distances[edge.from] !== Infinity) {
        const newDist = distances[edge.from] + edge.weight;
        if (newDist < distances[edge.to]) {
          distances[edge.to] = newDist;
          relaxations++;
          updated = true;

          trace.push({
            graph,
            distances: { ...distances },
            iteration: i + 1,
            edges: [edge],
            description: `Relax ${edge.from}→${edge.to}: ${newDist}`,
            metrics: { relaxations },
          });
        }
      }
    }

    if (!updated) break;
  }

  trace.push({
    graph,
    distances: { ...distances },
    iteration: graph.nodes.length - 1,
    edges: [],
    description: 'Shortest paths computed',
    metrics: { relaxations },
  });

  return trace;
};

const generateFloydWarshallTrace = (graph) => {
  const trace = [];
  const n = graph.nodes.length;
  const dist = Array(n).fill(null).map(() => Array(n).fill(Infinity));
  let updates = 0;

  // Initialize
  graph.nodes.forEach((_, i) => {
    dist[i][i] = 0;
  });

  graph.weightedEdges.forEach(edge => {
    const i = graph.nodes.indexOf(edge.from);
    const j = graph.nodes.indexOf(edge.to);
    dist[i][j] = edge.weight;
  });

  trace.push({
    graph,
    matrix: dist.map(row => [...row]),
    k: -1,
    i: -1,
    j: -1,
    description: 'Initialize distance matrix',
    metrics: { updates },
  });

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          updates++;

          trace.push({
            graph,
            matrix: dist.map(row => [...row]),
            k,
            i,
            j,
            description: `Update dist[${i}][${j}] via ${k}: ${dist[i][j]}`,
            metrics: { updates },
          });
        }
      }
    }
  }

  trace.push({
    graph,
    matrix: dist.map(row => [...row]),
    k: n,
    i: -1,
    j: -1,
    description: 'All-pairs shortest paths computed',
    metrics: { updates },
  });

  return trace;
};

const generateMSTKruskalTrace = (graph) => {
  const trace = [];
  const parent = {};
  const rank = {};
  const mstEdges = [];
  let totalWeight = 0;
  let edgesProcessed = 0;

  graph.nodes.forEach(node => {
    parent[node] = node;
    rank[node] = 0;
  });

  const find = (node) => {
    if (parent[node] !== node) {
      parent[node] = find(parent[node]);
    }
    return parent[node];
  };

  const union = (u, v) => {
    const rootU = find(u);
    const rootV = find(v);

    if (rootU !== rootV) {
      if (rank[rootU] > rank[rootV]) {
        parent[rootV] = rootU;
      } else if (rank[rootU] < rank[rootV]) {
        parent[rootU] = rootV;
      } else {
        parent[rootV] = rootU;
        rank[rootU]++;
      }
      return true;
    }
    return false;
  };

  const sortedEdges = [...graph.weightedEdges].sort((a, b) => a.weight - b.weight);

  trace.push({
    graph,
    mstEdges: [],
    currentEdge: null,
    sortedEdges,
    description: 'Edges sorted by weight',
    metrics: { edgesProcessed, totalWeight },
  });

  for (const edge of sortedEdges) {
    edgesProcessed++;

    trace.push({
      graph,
      mstEdges: [...mstEdges],
      currentEdge: edge,
      sortedEdges,
      description: `Evaluate edge ${edge.from}→${edge.to} (weight: ${edge.weight})`,
      metrics: { edgesProcessed, totalWeight },
    });

    if (union(edge.from, edge.to)) {
      mstEdges.push(edge);
      totalWeight += edge.weight;

      trace.push({
        graph,
        mstEdges: [...mstEdges],
        currentEdge: edge,
        sortedEdges,
        description: `Add to MST (total weight: ${totalWeight})`,
        metrics: { edgesProcessed, totalWeight },
      });
    } else {
      trace.push({
        graph,
        mstEdges: [...mstEdges],
        currentEdge: edge,
        sortedEdges,
        description: `Skip (creates cycle)`,
        metrics: { edgesProcessed, totalWeight },
      });
    }
  }

  trace.push({
    graph,
    mstEdges: [...mstEdges],
    currentEdge: null,
    sortedEdges,
    description: `MST complete (weight: ${totalWeight})`,
    metrics: { edgesProcessed, totalWeight },
  });

  return trace;
};

// TREE ALGORITHMS

const generatePreorderTrace = (tree) => {
  const trace = [];
  const visited = [];
  let visitCount = 0;

  trace.push({
    tree,
    visited: [],
    current: null,
    stack: [],
    description: 'Initialize preorder traversal',
    metrics: { visitCount },
  });

  const preorder = (node) => {
    if (!node) return;

    visitCount++;
    visited.push(node.value);

    trace.push({
      tree,
      visited: [...visited],
      current: node.value,
      stack: [],
      description: `Visit ${node.value}`,
      metrics: { visitCount },
    });

    if (node.left) preorder(node.left);
    if (node.right) preorder(node.right);
  };

  preorder(tree);

  trace.push({
    tree,
    visited: [...visited],
    current: null,
    stack: [],
    description: 'Traversal complete',
    metrics: { visitCount },
  });

  return trace;
};

const generateInorderTrace = (tree) => {
  const trace = [];
  const visited = [];
  let visitCount = 0;

  trace.push({
    tree,
    visited: [],
    current: null,
    stack: [],
    description: 'Initialize inorder traversal',
    metrics: { visitCount },
  });

  const inorder = (node) => {
    if (!node) return;

    if (node.left) inorder(node.left);

    visitCount++;
    visited.push(node.value);

    trace.push({
      tree,
      visited: [...visited],
      current: node.value,
      stack: [],
      description: `Visit ${node.value}`,
      metrics: { visitCount },
    });

    if (node.right) inorder(node.right);
  };

  inorder(tree);

  trace.push({
    tree,
    visited: [...visited],
    current: null,
    stack: [],
    description: 'Traversal complete',
    metrics: { visitCount },
  });

  return trace;
};

const generatePostorderTrace = (tree) => {
  const trace = [];
  const visited = [];
  let visitCount = 0;

  trace.push({
    tree,
    visited: [],
    current: null,
    stack: [],
    description: 'Initialize postorder traversal',
    metrics: { visitCount },
  });

  const postorder = (node) => {
    if (!node) return;

    if (node.left) postorder(node.left);
    if (node.right) postorder(node.right);

    visitCount++;
    visited.push(node.value);

    trace.push({
      tree,
      visited: [...visited],
      current: node.value,
      stack: [],
      description: `Visit ${node.value}`,
      metrics: { visitCount },
    });
  };

  postorder(tree);

  trace.push({
    tree,
    visited: [],
    current: null,
    stack: [],
    description: 'Traversal complete',
    metrics: { visitCount },
  });

  return trace;
};

const generateBSTInsertTrace = (tree, value) => {
  const trace = [];
  let operations = 0;

  trace.push({
    tree: JSON.parse(JSON.stringify(tree)),
    current: null,
    inserted: null,
    description: `Insert ${value} into BST`,
    metrics: { operations },
  });

  const insert = (node, val, path = []) => {
    if (!node) {
      operations++;
      const newNode = { value: val, left: null, right: null };
      trace.push({
        tree: JSON.parse(JSON.stringify(tree)),
        current: null,
        inserted: val,
        path,
        description: `Insert ${val} as new node`,
        metrics: { operations },
      });
      return newNode;
    }

    operations++;
    trace.push({
      tree: JSON.parse(JSON.stringify(tree)),
      current: node.value,
      inserted: null,
      path: [...path, node.value],
      description: `Compare ${val} with ${node.value}`,
      metrics: { operations },
    });

    if (val < node.value) {
      node.left = insert(node.left, val, [...path, node.value]);
    } else if (val > node.value) {
      node.right = insert(node.right, val, [...path, node.value]);
    }

    return node;
  };

  const newTree = insert(tree, value);

  trace.push({
    tree: JSON.parse(JSON.stringify(newTree)),
    current: null,
    inserted: value,
    description: 'Insertion complete',
    metrics: { operations },
  });

  return trace;
};

const generateAVLRotationTrace = (tree, value) => {
  const trace = [];
  let rotations = 0;

  const height = (node) => node ? node.height : 0;

  const updateHeight = (node) => {
    if (node) {
      node.height = 1 + Math.max(height(node.left), height(node.right));
    }
  };

  const getBalance = (node) => node ? height(node.left) - height(node.right) : 0;

  const rotateRight = (y) => {
    rotations++;
    const x = y.left;
    const T2 = x.right;

    trace.push({
      tree: JSON.parse(JSON.stringify(tree)),
      rotation: { type: 'RR', node: y.value },
      description: `Right rotation at ${y.value}`,
      metrics: { rotations },
    });

    x.right = y;
    y.left = T2;

    updateHeight(y);
    updateHeight(x);

    return x;
  };

  const rotateLeft = (x) => {
    rotations++;
    const y = x.right;
    const T2 = y.left;

    trace.push({
      tree: JSON.parse(JSON.stringify(tree)),
      rotation: { type: 'LL', node: x.value },
      description: `Left rotation at ${x.value}`,
      metrics: { rotations },
    });

    y.left = x;
    x.right = T2;

    updateHeight(x);
    updateHeight(y);

    return y;
  };

  const insert = (node, val) => {
    if (!node) {
      return { value: val, left: null, right: null, height: 1 };
    }

    if (val < node.value) {
      node.left = insert(node.left, val);
    } else if (val > node.value) {
      node.right = insert(node.right, val);
    } else {
      return node;
    }

    updateHeight(node);
    const balance = getBalance(node);

    // Left-Left
    if (balance > 1 && val < node.left.value) {
      return rotateRight(node);
    }

    // Right-Right
    if (balance < -1 && val > node.right.value) {
      return rotateLeft(node);
    }

    // Left-Right
    if (balance > 1 && val > node.left.value) {
      node.left = rotateLeft(node.left);
      return rotateRight(node);
    }

    // Right-Left
    if (balance < -1 && val < node.right.value) {
      node.right = rotateRight(node.right);
      return rotateLeft(node);
    }

    return node;
  };

  trace.push({
    tree: JSON.parse(JSON.stringify(tree)),
    rotation: null,
    description: `Insert ${value} with AVL balancing`,
    metrics: { rotations },
  });

  const newTree = insert(tree, value);

  trace.push({
    tree: JSON.parse(JSON.stringify(newTree)),
    rotation: null,
    description: 'AVL tree balanced',
    metrics: { rotations },
  });

  return trace;
};

// DYNAMIC PROGRAMMING

const generateLCSTrace = (str1, str2) => {
  const trace = [];
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  let cellsProcessed = 0;

  trace.push({
    str1,
    str2,
    dp: dp.map(row => [...row]),
    i: -1,
    j: -1,
    description: 'Initialize DP table',
    metrics: { cellsProcessed },
  });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      cellsProcessed++;

      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        trace.push({
          str1,
          str2,
          dp: dp.map(row => [...row]),
          i,
          j,
          match: true,
          description: `Match: ${str1[i - 1]} = ${str2[j - 1]}`,
          metrics: { cellsProcessed },
        });
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        trace.push({
          str1,
          str2,
          dp: dp.map(row => [...row]),
          i,
          j,
          match: false,
          description: `No match: max(${dp[i - 1][j]}, ${dp[i][j - 1]})`,
          metrics: { cellsProcessed },
        });
      }
    }
  }

  trace.push({
    str1,
    str2,
    dp: dp.map(row => [...row]),
    i: m,
    j: n,
    description: `LCS length: ${dp[m][n]}`,
    metrics: { cellsProcessed },
  });

  return trace;
};

const generateKnapsackTrace = (weights, values, capacity) => {
  const trace = [];
  const n = weights.length;
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
  let cellsProcessed = 0;

  trace.push({
    weights,
    values,
    capacity,
    dp: dp.map(row => [...row]),
    i: -1,
    w: -1,
    description: 'Initialize DP table',
    metrics: { cellsProcessed },
  });

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      cellsProcessed++;

      if (weights[i - 1] <= w) {
        const include = values[i - 1] + dp[i - 1][w - weights[i - 1]];
        const exclude = dp[i - 1][w];
        dp[i][w] = Math.max(include, exclude);

        trace.push({
          weights,
          values,
          capacity,
          dp: dp.map(row => [...row]),
          i,
          w,
          decision: include > exclude ? 'include' : 'exclude',
          description: `Item ${i}: max(${include}, ${exclude}) = ${dp[i][w]}`,
          metrics: { cellsProcessed },
        });
      } else {
        dp[i][w] = dp[i - 1][w];
        trace.push({
          weights,
          values,
          capacity,
          dp: dp.map(row => [...row]),
          i,
          w,
          decision: 'skip',
          description: `Item ${i}: too heavy, skip`,
          metrics: { cellsProcessed },
        });
      }
    }
  }

  trace.push({
    weights,
    values,
    capacity,
    dp: dp.map(row => [...row]),
    i: n,
    w: capacity,
    description: `Max value: ${dp[n][capacity]}`,
    metrics: { cellsProcessed },
  });

  return trace;
};

const generateCoinChangeTrace = (coins, amount) => {
  const trace = [];
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  let cellsProcessed = 0;

  trace.push({
    coins,
    amount,
    dp: [...dp],
    currentAmount: -1,
    currentCoin: -1,
    description: 'Initialize DP array',
    metrics: { cellsProcessed },
  });

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      cellsProcessed++;

      if (i >= coin) {
        const prev = dp[i];
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);

        trace.push({
          coins,
          amount,
          dp: [...dp],
          currentAmount: i,
          currentCoin: coin,
          updated: dp[i] !== prev,
          description: `Amount ${i}, coin ${coin}: min=${dp[i]}`,
          metrics: { cellsProcessed },
        });
      }
    }
  }

  trace.push({
    coins,
    amount,
    dp: [...dp],
    currentAmount: amount,
    currentCoin: -1,
    description: `Min coins: ${dp[amount] === Infinity ? 'impossible' : dp[amount]}`,
    metrics: { cellsProcessed },
  });

  return trace;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ALGORITHM REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

const ALGORITHMS = {
  sorting: {
    name: 'Sorting',
    algorithms: {
      bubble: {
        name: 'Bubble Sort',
        complexity: 'O(n²)',
        generate: generateBubbleSortTrace,
        defaultInput: [64, 34, 25, 12, 22, 11, 90],
      },
      quick: {
        name: 'Quick Sort',
        complexity: 'O(n log n) avg',
        generate: generateQuickSortTrace,
        defaultInput: [64, 34, 25, 12, 22, 11, 90],
      },
      merge: {
        name: 'Merge Sort',
        complexity: 'O(n log n)',
        generate: generateMergeSortTrace,
        defaultInput: [64, 34, 25, 12, 22, 11, 90],
      },
      radix: {
        name: 'Radix Sort',
        complexity: 'O(d·n)',
        generate: generateRadixSortTrace,
        defaultInput: [170, 45, 75, 90, 802, 24, 2, 66],
      },
      counting: {
        name: 'Counting Sort',
        complexity: 'O(n+k)',
        generate: generateCountingSortTrace,
        defaultInput: [4, 2, 2, 8, 3, 3, 1],
      },
    },
  },
  graph: {
    name: 'Graph',
    algorithms: {
      dfs: {
        name: 'Depth First Search',
        complexity: 'O(V+E)',
        generate: generateDFSTrace,
        defaultInput: {
          nodes: ['A', 'B', 'C', 'D', 'E', 'F'],
          edges: {
            A: ['B', 'C'],
            B: ['A', 'D', 'E'],
            C: ['A', 'F'],
            D: ['B'],
            E: ['B', 'F'],
            F: ['C', 'E'],
          },
        },
        startNode: 'A',
      },
      bfs: {
        name: 'Breadth First Search',
        complexity: 'O(V+E)',
        generate: generateBFSTrace,
        defaultInput: {
          nodes: ['A', 'B', 'C', 'D', 'E', 'F'],
          edges: {
            A: ['B', 'C'],
            B: ['A', 'D', 'E'],
            C: ['A', 'F'],
            D: ['B'],
            E: ['B', 'F'],
            F: ['C', 'E'],
          },
        },
        startNode: 'A',
      },
      dijkstra: {
        name: 'Dijkstra',
        complexity: 'O(E log V)',
        generate: generateDijkstraTrace,
        defaultInput: {
          nodes: ['A', 'B', 'C', 'D', 'E'],
          edges: {
            A: ['B', 'C'],
            B: ['A', 'D', 'E'],
            C: ['A', 'D'],
            D: ['B', 'C', 'E'],
            E: ['B', 'D'],
          },
          weightedEdges: [
            { from: 'A', to: 'B', weight: 4 },
            { from: 'A', to: 'C', weight: 2 },
            { from: 'B', to: 'D', weight: 3 },
            { from: 'B', to: 'E', weight: 1 },
            { from: 'C', to: 'D', weight: 5 },
            { from: 'D', to: 'E', weight: 2 },
          ],
        },
        startNode: 'A',
      },
      bellmanford: {
        name: 'Bellman-Ford',
        complexity: 'O(VE)',
        generate: generateBellmanFordTrace,
        defaultInput: {
          nodes: ['A', 'B', 'C', 'D', 'E'],
          edges: {},
          weightedEdges: [
            { from: 'A', to: 'B', weight: 4 },
            { from: 'A', to: 'C', weight: 2 },
            { from: 'B', to: 'D', weight: 3 },
            { from: 'B', to: 'E', weight: 1 },
            { from: 'C', to: 'D', weight: 5 },
            { from: 'D', to: 'E', weight: 2 },
          ],
        },
        startNode: 'A',
      },
      floyd: {
        name: 'Floyd-Warshall',
        complexity: 'O(V³)',
        generate: generateFloydWarshallTrace,
        defaultInput: {
          nodes: ['A', 'B', 'C', 'D'],
          edges: {},
          weightedEdges: [
            { from: 'A', to: 'B', weight: 3 },
            { from: 'A', to: 'C', weight: 8 },
            { from: 'B', to: 'D', weight: 1 },
            { from: 'C', to: 'B', weight: 4 },
            { from: 'D', to: 'A', weight: 2 },
            { from: 'D', to: 'C', weight: 5 },
          ],
        },
      },
      mst: {
        name: 'MST (Kruskal)',
        complexity: 'O(E log E)',
        generate: generateMSTKruskalTrace,
        defaultInput: {
          nodes: ['A', 'B', 'C', 'D', 'E'],
          edges: {},
          weightedEdges: [
            { from: 'A', to: 'B', weight: 4 },
            { from: 'A', to: 'C', weight: 2 },
            { from: 'B', to: 'C', weight: 1 },
            { from: 'B', to: 'D', weight: 5 },
            { from: 'C', to: 'D', weight: 8 },
            { from: 'C', to: 'E', weight: 10 },
            { from: 'D', to: 'E', weight: 2 },
          ],
        },
      },
    },
  },
  tree: {
    name: 'Tree',
    algorithms: {
      preorder: {
        name: 'Preorder Traversal',
        complexity: 'O(n)',
        generate: generatePreorderTrace,
        defaultInput: {
          value: 50,
          left: { value: 30, left: { value: 20, left: null, right: null }, right: { value: 40, left: null, right: null } },
          right: { value: 70, left: { value: 60, left: null, right: null }, right: { value: 80, left: null, right: null } },
        },
      },
      inorder: {
        name: 'Inorder Traversal',
        complexity: 'O(n)',
        generate: generateInorderTrace,
        defaultInput: {
          value: 50,
          left: { value: 30, left: { value: 20, left: null, right: null }, right: { value: 40, left: null, right: null } },
          right: { value: 70, left: { value: 60, left: null, right: null }, right: { value: 80, left: null, right: null } },
        },
      },
      postorder: {
        name: 'Postorder Traversal',
        complexity: 'O(n)',
        generate: generatePostorderTrace,
        defaultInput: {
          value: 50,
          left: { value: 30, left: { value: 20, left: null, right: null }, right: { value: 40, left: null, right: null } },
          right: { value: 70, left: { value: 60, left: null, right: null }, right: { value: 80, left: null, right: null } },
        },
      },
      bstinsert: {
        name: 'BST Insert',
        complexity: 'O(log n) avg',
        generate: (tree) => generateBSTInsertTrace(tree, 35),
        defaultInput: {
          value: 50,
          left: { value: 30, left: { value: 20, left: null, right: null }, right: { value: 40, left: null, right: null } },
          right: { value: 70, left: { value: 60, left: null, right: null }, right: { value: 80, left: null, right: null } },
        },
      },
      avl: {
        name: 'AVL Rotations',
        complexity: 'O(log n)',
        generate: (tree) => generateAVLRotationTrace(tree, 35),
        defaultInput: {
          value: 50,
          left: { value: 30, left: null, right: null, height: 1 },
          right: { value: 70, left: null, right: null, height: 1 },
          height: 2,
        },
      },
    },
  },
  dp: {
    name: 'Dynamic Programming',
    algorithms: {
      lcs: {
        name: 'Longest Common Subsequence',
        complexity: 'O(m·n)',
        generate: () => generateLCSTrace('ABCDGH', 'AEDFHR'),
        defaultInput: { str1: 'ABCDGH', str2: 'AEDFHR' },
      },
      knapsack: {
        name: '0/1 Knapsack',
        complexity: 'O(n·W)',
        generate: () => generateKnapsackTrace([2, 3, 4, 5], [3, 4, 5, 6], 8),
        defaultInput: { weights: [2, 3, 4, 5], values: [3, 4, 5, 6], capacity: 8 },
      },
      coinchange: {
        name: 'Coin Change',
        complexity: 'O(n·amount)',
        generate: () => generateCoinChangeTrace([1, 2, 5], 11),
        defaultInput: { coins: [1, 2, 5], amount: 11 },
      },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// VISUALIZER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SortingVisualizer = ({ step, theme }) => {
  if (!step) return null;

  const maxValue = Math.max(...step.array);

  return (
    <div className="flex items-end justify-center gap-1 h-80">
      {step.array.map((value, idx) => {
        const isComparing = step.comparing?.includes(idx);
        const isSorted = step.sorted?.includes(idx);
        const isPivot = step.pivot === idx;
        const isHighlighting = step.highlighting?.includes(idx);

        let barColor = theme.node;
        if (isSorted) barColor = theme.success;
        else if (isPivot) barColor = theme.secondary;
        else if (isComparing) barColor = theme.primary;
        else if (isHighlighting) barColor = theme.accent;

        return (
          <motion.div
            key={idx}
            className="flex-1 relative rounded-t"
            style={{
              height: `${(value / maxValue) * 100}%`,
              backgroundColor: barColor,
              minWidth: '8px',
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span
              className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-mono"
              style={{ color: theme.text }}
            >
              {value}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

const GraphVisualizer = ({ step, theme }) => {
  if (!step || !step.graph) return null;

  const positions = {
    A: { x: 150, y: 100 },
    B: { x: 100, y: 200 },
    C: { x: 200, y: 200 },
    D: { x: 50, y: 300 },
    E: { x: 150, y: 300 },
    F: { x: 250, y: 300 },
  };

  const renderEdges = () => {
    const edges = [];
    const graph = step.graph;

    if (graph.weightedEdges) {
      graph.weightedEdges.forEach((edge, idx) => {
        const from = positions[edge.from];
        const to = positions[edge.to];
        if (!from || !to) return;

        const isActive = step.edges?.some(e => e.from === edge.from && e.to === edge.to);
        const isMST = step.mstEdges?.some(e => e.from === edge.from && e.to === edge.to);

        edges.push(
          <g key={`edge-${idx}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isMST ? theme.success : isActive ? theme.edgeActive : theme.edge}
              strokeWidth={isMST ? 3 : isActive ? 2.5 : 1.5}
            />
            <text
              x={(from.x + to.x) / 2}
              y={(from.y + to.y) / 2 - 10}
              fill={theme.textMuted}
              fontSize="12"
              fontFamily="monospace"
            >
              {edge.weight}
            </text>
          </g>
        );
      });
    } else if (graph.edges) {
      Object.entries(graph.edges).forEach(([node, neighbors]) => {
        neighbors.forEach(neighbor => {
          const from = positions[node];
          const to = positions[neighbor];
          if (!from || !to) return;

          const isActive = step.edges?.some(e => e.from === node && e.to === neighbor);

          edges.push(
            <line
              key={`${node}-${neighbor}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isActive ? theme.edgeActive : theme.edge}
              strokeWidth={isActive ? 2.5 : 1.5}
            />
          );
        });
      });
    }

    return edges;
  };

  const renderNodes = () => {
    return step.graph.nodes.map(node => {
      const pos = positions[node];
      if (!pos) return null;

      const isVisited = step.visited?.has(node);
      const isCurrent = step.current === node;

      let fillColor = theme.node;
      if (isCurrent) fillColor = theme.nodeActive;
      else if (isVisited) fillColor = theme.nodeVisited;

      return (
        <g key={node}>
          <motion.circle
            cx={pos.x}
            cy={pos.y}
            r={20}
            fill={fillColor}
            stroke={theme.border}
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          <text
            x={pos.x}
            y={pos.y + 5}
            fill={theme.text}
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {node}
          </text>
          {step.distances && step.distances[node] !== undefined && (
            <text
              x={pos.x}
              y={pos.y + 35}
              fill={theme.primary}
              fontSize="11"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {step.distances[node] === Infinity ? '∞' : step.distances[node]}
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <div className="flex justify-center items-center h-80">
      <svg width="400" height="400" viewBox="0 0 300 400">
        {renderEdges()}
        {renderNodes()}
      </svg>
    </div>
  );
};

const TreeVisualizer = ({ step, theme }) => {
  if (!step || !step.tree) return null;

  const renderTree = (node, x, y, xOffset, depth = 0) => {
    if (!node) return null;

    const isVisited = step.visited?.includes(node.value);
    const isCurrent = step.current === node.value;

    let fillColor = theme.node;
    if (isCurrent) fillColor = theme.nodeActive;
    else if (isVisited) fillColor = theme.nodeVisited;

    return (
      <g key={`${node.value}-${depth}-${x}`}>
        {node.left && (
          <>
            <line
              x1={x}
              y1={y}
              x2={x - xOffset}
              y2={y + 60}
              stroke={theme.edge}
              strokeWidth={1.5}
            />
            {renderTree(node.left, x - xOffset, y + 60, xOffset / 2, depth + 1)}
          </>
        )}
        {node.right && (
          <>
            <line
              x1={x}
              y1={y}
              x2={x + xOffset}
              y2={y + 60}
              stroke={theme.edge}
              strokeWidth={1.5}
            />
            {renderTree(node.right, x + xOffset, y + 60, xOffset / 2, depth + 1)}
          </>
        )}
        <motion.circle
          cx={x}
          cy={y}
          r={18}
          fill={fillColor}
          stroke={theme.border}
          strokeWidth={2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        />
        <text
          x={x}
          y={y + 5}
          fill={theme.text}
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {node.value}
        </text>
        {node.height !== undefined && (
          <text
            x={x}
            y={y - 25}
            fill={theme.textMuted}
            fontSize="10"
            textAnchor="middle"
            fontFamily="monospace"
          >
            h:{node.height}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="flex justify-center items-center h-80 overflow-auto">
      <svg width="600" height="400" viewBox="0 0 600 400">
        {renderTree(step.tree, 300, 40, 100)}
      </svg>
    </div>
  );
};

const DPVisualizer = ({ step, theme }) => {
  if (!step) return null;

  if (step.dp && Array.isArray(step.dp) && Array.isArray(step.dp[0])) {
    // 2D DP table (LCS, Knapsack)
    const rows = step.dp.length;
    const cols = step.dp[0].length;
    const cellSize = 40;

    return (
      <div className="flex justify-center items-center h-80 overflow-auto">
        <svg width={cols * cellSize + 40} height={rows * cellSize + 40}>
          {step.dp.map((row, i) =>
            row.map((val, j) => {
              const isActive = step.i === i && step.j === j;
              const fillColor = isActive ? theme.nodeActive : theme.node;

              return (
                <g key={`${i}-${j}`}>
                  <rect
                    x={j * cellSize + 20}
                    y={i * cellSize + 20}
                    width={cellSize}
                    height={cellSize}
                    fill={fillColor}
                    stroke={theme.border}
                    strokeWidth={1}
                  />
                  <text
                    x={j * cellSize + 20 + cellSize / 2}
                    y={i * cellSize + 20 + cellSize / 2 + 5}
                    fill={theme.text}
                    fontSize="12"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {val === Infinity ? '∞' : val}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>
    );
  } else if (step.dp && Array.isArray(step.dp)) {
    // 1D DP array (Coin Change)
    const cellSize = 50;

    return (
      <div className="flex justify-center items-center h-80 overflow-auto">
        <svg width={step.dp.length * cellSize + 40} height={100}>
          {step.dp.map((val, i) => {
            const isActive = step.currentAmount === i;
            const fillColor = isActive ? theme.nodeActive : theme.node;

            return (
              <g key={i}>
                <rect
                  x={i * cellSize + 20}
                  y={30}
                  width={cellSize}
                  height={cellSize}
                  fill={fillColor}
                  stroke={theme.border}
                  strokeWidth={1}
                />
                <text
                  x={i * cellSize + 20 + cellSize / 2}
                  y={30 + cellSize / 2 + 5}
                  fill={theme.text}
                  fontSize="12"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {val === Infinity ? '∞' : val}
                </text>
                <text
                  x={i * cellSize + 20 + cellSize / 2}
                  y={20}
                  fill={theme.textMuted}
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {i}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const PlaybackControls = ({ 
  currentStep, 
  totalSteps, 
  isPlaying, 
  speed,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
  onSpeedChange,
  onJumpTo,
  theme
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="px-3 py-2 rounded font-mono text-sm transition-colors"
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.surfaceHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.surface}
        >
          ⏮ Reset
        </button>
        <button
          onClick={onPrev}
          disabled={currentStep === 0}
          className="px-3 py-2 rounded font-mono text-sm transition-colors disabled:opacity-50"
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = theme.surfaceHover)}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.surface}
        >
          ◀ Prev
        </button>
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="px-4 py-2 rounded font-mono text-sm transition-colors"
          style={{
            backgroundColor: theme.primary,
            color: theme.bg,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryDark}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={onNext}
          disabled={currentStep === totalSteps - 1}
          className="px-3 py-2 rounded font-mono text-sm transition-colors disabled:opacity-50"
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = theme.surfaceHover)}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.surface}
        >
          Next ▶
        </button>
        <div className="flex-1" />
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="px-3 py-2 rounded font-mono text-sm"
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
          }}
        >
          <option value={2000}>0.5x</option>
          <option value={1000}>1x</option>
          <option value={500}>2x</option>
          <option value={250}>4x</option>
        </select>
      </div>
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={totalSteps - 1}
          value={currentStep}
          onChange={(e) => onJumpTo(Number(e.target.value))}
          className="w-full"
          style={{
            accentColor: theme.primary,
          }}
        />
        <div className="flex justify-between text-xs font-mono" style={{ color: theme.textMuted }}>
          <span>Step {currentStep + 1} / {totalSteps}</span>
          <span>{Math.round((currentStep / (totalSteps - 1)) * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

const MetricsPanel = ({ metrics, theme }) => {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(metrics).map(([key, value]) => (
        <div
          key={key}
          className="p-3 rounded"
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div className="text-xs font-mono uppercase" style={{ color: theme.textMuted }}>
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </div>
          <div className="text-2xl font-bold font-mono mt-1" style={{ color: theme.primary }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
};

const StateInspector = ({ step, theme }) => {
  if (!step) return null;

  const renderValue = (key, value) => {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return `[${value.join(', ')}]`;
    if (typeof value === 'object') {
      if (value instanceof Set) return `Set(${value.size})`;
      if (value instanceof Map) return `Map(${value.size})`;
      return JSON.stringify(value);
    }
    return String(value);
  };

  const relevantKeys = Object.keys(step).filter(
    key => !['description', 'metrics', 'graph', 'tree', 'dp', 'array'].includes(key)
  );

  if (relevantKeys.length === 0) return null;

  return (
    <div
      className="p-4 rounded text-xs font-mono space-y-2 max-h-60 overflow-auto"
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        color: theme.text,
      }}
    >
      <div className="font-bold uppercase mb-2" style={{ color: theme.textMuted }}>
        State Variables
      </div>
      {relevantKeys.map(key => (
        <div key={key} className="flex gap-2">
          <span style={{ color: theme.accent }}>{key}:</span>
          <span style={{ color: theme.text }}>{renderValue(key, step[key])}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════════════════════

const AlgoLabProvider = ({ children }) => {
  const [theme, setTheme] = useState('cyber');
  const [category, setCategory] = useState('sorting');
  const [algorithm, setAlgorithm] = useState('bubble');
  const [trace, setTrace] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [showInfo, setShowInfo] = useState(true);
  const [showState, setShowState] = useState(true);
  const [layoutMode, setLayoutMode] = useState('default'); // default, fullscreen, split

  const currentTheme = THEMES[theme];
  const currentAlgo = ALGORITHMS[category]?.algorithms[algorithm];

  useEffect(() => {
    if (currentAlgo) {
      try {
        const input = currentAlgo.defaultInput;
        const startNode = currentAlgo.startNode;
        const newTrace = startNode 
          ? currentAlgo.generate(input, startNode)
          : currentAlgo.generate(input);
        setTrace(newTrace);
        setCurrentStep(0);
        setIsPlaying(false);
      } catch (error) {
        console.error('Trace generation failed:', error);
        setTrace(null);
      }
    }
  }, [category, algorithm]);

  useEffect(() => {
    let interval;
    if (isPlaying && trace && currentStep < trace.length - 1) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= trace.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, trace, speed]);

  const value = {
    theme: currentTheme,
    themeName: theme,
    setTheme,
    category,
    setCategory,
    algorithm,
    setAlgorithm,
    trace,
    currentStep,
    setCurrentStep,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    showInfo,
    setShowInfo,
    showState,
    setShowState,
    layoutMode,
    setLayoutMode,
    currentAlgo,
  };

  return (
    <AlgoLabContext.Provider value={value}>
      {children}
    </AlgoLabContext.Provider>
  );
};

const Sidebar = () => {
  const { theme, category, setCategory, algorithm, setAlgorithm } = useAlgoLab();

  return (
    <div
      className="w-64 h-screen overflow-y-auto border-r"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
      }}
    >
      <div className="p-6">
        <h1
          className="text-2xl font-black tracking-tight mb-1"
          style={{ color: theme.primary, fontFamily: 'monospace' }}
        >
          Algoviz
        </h1>
        <p className="text-xs uppercase tracking-wider" style={{ color: theme.textMuted }}>
          Algorithm Visualizer
        </p>
      </div>

      <div className="space-y-1 px-3">
        {Object.entries(ALGORITHMS).map(([catKey, catData]) => (
          <div key={catKey}>
            <button
              onClick={() => setCategory(catKey)}
              className="w-full text-left px-3 py-2 rounded text-sm font-mono transition-all"
              style={{
                backgroundColor: category === catKey ? theme.primary : 'transparent',
                color: category === catKey ? theme.bg : theme.text,
              }}
            >
              {catData.name}
            </button>
            {category === catKey && (
              <div className="ml-3 mt-1 space-y-1">
                {Object.entries(catData.algorithms).map(([algoKey, algoData]) => (
                  <button
                    key={algoKey}
                    onClick={() => setAlgorithm(algoKey)}
                    className="w-full text-left px-3 py-1.5 rounded text-xs font-mono transition-all"
                    style={{
                      backgroundColor: algorithm === algoKey ? theme.accent : 'transparent',
                      color: algorithm === algoKey ? theme.text : theme.textMuted,
                    }}
                  >
                    {algoData.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Toolbar = () => {
  const { theme, themeName, setTheme, showInfo, setShowInfo, showState, setShowState, layoutMode, setLayoutMode } = useAlgoLab();

  return (
    <div
      className="h-16 border-b flex items-center justify-between px-6"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
      }}
    >
      <div className="flex gap-2">
        {Object.keys(THEMES).map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className="px-3 py-1 rounded text-xs font-mono uppercase transition-all"
            style={{
              backgroundColor: themeName === t ? theme.primary : theme.surface,
              color: themeName === t ? theme.bg : theme.text,
              border: `1px solid ${theme.border}`,
            }}
          >
            {THEMES[t].name}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setLayoutMode(layoutMode === 'default' ? 'fullscreen' : 'default')}
          className="px-3 py-1 rounded text-xs font-mono uppercase transition-all"
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
          }}
        >
          {layoutMode === 'fullscreen' ? '◧ Exit' : '⛶ Full'}
        </button>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="px-3 py-1 rounded text-xs font-mono uppercase transition-all"
          style={{
            backgroundColor: showInfo ? theme.accent : theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
          }}
        >
          Info
        </button>
        <button
          onClick={() => setShowState(!showState)}
          className="px-3 py-1 rounded text-xs font-mono uppercase transition-all"
          style={{
            backgroundColor: showState ? theme.accent : theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
          }}
        >
          State
        </button>
      </div>
    </div>
  );
};

const MainContent = () => {
  const {
    theme,
    category,
    trace,
    currentStep,
    isPlaying,
    speed,
    setCurrentStep,
    setIsPlaying,
    setSpeed,
    showInfo,
    showState,
    currentAlgo,
  } = useAlgoLab();

  const currentStepData = trace?.[currentStep];

  const getVisualizer = () => {
    switch (category) {
      case 'sorting':
        return <SortingVisualizer step={currentStepData} theme={theme} />;
      case 'graph':
        return <GraphVisualizer step={currentStepData} theme={theme} />;
      case 'tree':
        return <TreeVisualizer step={currentStepData} theme={theme} />;
      case 'dp':
        return <DPVisualizer step={currentStepData} theme={theme} />;
      default:
        return null;
    }
  };

  if (!trace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ color: theme.textMuted }}>
          <div className="text-4xl mb-2">⚠</div>
          <div className="font-mono">No trace available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        {/* Algorithm Header */}
        {showInfo && (
          <div
            className="p-4 rounded"
            style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold font-mono" style={{ color: theme.text }}>
                  {currentAlgo?.name}
                </h2>
                <div className="flex gap-4 mt-2">
                  <div className="text-xs font-mono" style={{ color: theme.textMuted }}>
                    Complexity: <span style={{ color: theme.accent }}>{currentAlgo?.complexity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visualizer */}
        <div
          className="p-6 rounded"
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
          }}
        >
          {getVisualizer()}
        </div>

        {/* Step Description */}
        <div
          className="p-4 rounded font-mono text-sm"
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            color: theme.text,
          }}
        >
          {currentStepData?.description || 'No description'}
        </div>

        {/* Metrics & State */}
        <div className="grid grid-cols-2 gap-6">
          <MetricsPanel metrics={currentStepData?.metrics} theme={theme} />
          {showState && <StateInspector step={currentStepData} theme={theme} />}
        </div>

        {/* Playback Controls */}
        <PlaybackControls
          currentStep={currentStep}
          totalSteps={trace.length}
          isPlaying={isPlaying}
          speed={speed}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onNext={() => setCurrentStep(Math.min(currentStep + 1, trace.length - 1))}
          onPrev={() => setCurrentStep(Math.max(currentStep - 1, 0))}
          onReset={() => { setCurrentStep(0); setIsPlaying(false); }}
          onSpeedChange={setSpeed}
          onJumpTo={setCurrentStep}
          theme={theme}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <AlgoLabProvider>
      <AlgoLabApp />
    </AlgoLabProvider>
  );
}

function AlgoLabApp() {
  const { theme } = useAlgoLab();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar />
        <MainContent />
      </div>
    </div>
  );
}