# GraphViz - Algorithm Visualizer

A modern, interactive web application for visualizing graph algorithms in real-time. Built with React and Vite.

## 🎯 Features

- **Multiple Algorithm Support:**
  - Breadth-First Search (BFS)
  - Depth-First Search (DFS)
  - Dijkstra's Shortest Path
  - Prim's Minimum Spanning Tree
  - Topological Sort (Kahn's Algorithm)

- **Interactive Canvas:**
  - Drag and drop nodes
  - Create directed and undirected edges
  - Adjust edge weights
  - Real-time visualization with smooth animations
  - Multiple algorithm execution speeds

- **Modern UI:**
  - Dark theme with glassmorphic design
  - Responsive layout
  - Real-time step-by-step execution
  - Detailed algorithm state tracking
  - Legend and distance/cost displays

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build locally
npm run preview
```


## 📋 Project Structure

```
graph-viz/
├── src/
│   ├── App.jsx           # Main app component with all algorithms
│   ├── index.css         # Global styles and CSS variables
│   ├── main.jsx          # React entry point
├── dist/                 # Production build output
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md            # This file
```


## 🎨 Features Breakdown

### Algorithms Implemented

1. **BFS (Breadth-First Search)**
   - Explores nodes level by level
   - Finds shortest path in unweighted graphs
   - Queue-based implementation

2. **DFS (Depth-First Search)**
   - Explores as far as possible along each branch
   - Stack-based implementation
   - Useful for topological ordering and cycle detection

3. **Dijkstra's Algorithm**
   - Finds shortest paths with weighted edges
   - Shows distance updates at each step
   - Priority queue implementation with Min Heap

4. **Prim's MST**
   - Builds minimum spanning tree
   - Shows accumulated cost
   - Works with undirected weighted graphs

5. **Topological Sort (Kahn's)**
   - Sorts DAG (Directed Acyclic Graph)
   - Shows in-degree tracking
   - Detects cycles



**Built with React + Vite | Modern Design | Production Ready**
