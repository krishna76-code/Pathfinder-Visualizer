document.addEventListener("DOMContentLoaded", function () {
  // Grid parameters
  const ROWS = 20;
  const COLS = 25;
  const grid = document.getElementById("grid");
  let nodes = [];
  let startNode = null;
  let endNode = null;
  let isMousePressed = false;
  let isStartNodeMoving = false;
  let isEndNodeMoving = false;
  let currentAlgorithm = "bfs";
  let isVisualizing = false;
  let animationSpeed = 50; // Default speed (middle of slider)

  // Algorithm descriptions
  const algorithmDescriptions = {
    bfs: "Breadth-First Search (BFS) is an algorithm for traversing or searching tree or graph data structures. It starts at a selected node, explores all neighbor nodes at the present depth prior to moving on to nodes at the next depth level. BFS guarantees the shortest path in an unweighted graph.",
    dfs: "Depth-First Search (DFS) is an algorithm for traversing or searching tree or graph data structures. The algorithm starts at the root node and explores as far as possible along each branch before backtracking. DFS does not guarantee the shortest path.",
    dijkstra:
      "Dijkstra's Algorithm is a graph search algorithm that solves the single-source shortest path problem for a graph with non-negative edge weights. This algorithm finds the path with the lowest cost (i.e. the shortest path) between a given node and every other node in the graph.",
  };

  // Initialize the grid
  function initializeGrid() {
    grid.innerHTML = "";
    nodes = [];

    for (let row = 0; row < ROWS; row++) {
      nodes[row] = [];
      for (let col = 0; col < COLS; col++) {
        const node = document.createElement("div");
        node.className = "node";
        node.id = `node-${row}-${col}`;
        node.dataset.row = row;
        node.dataset.col = col;

        // Add event listeners for wall creation
        node.addEventListener("mousedown", handleMouseDown);
        node.addEventListener("mouseenter", handleMouseEnter);
        node.addEventListener("mouseup", handleMouseUp);

        grid.appendChild(node);

        nodes[row][col] = {
          row,
          col,
          isStart: false,
          isEnd: false,
          isWall: false,
          isVisited: false,
          distance: Infinity,
          previousNode: null,
          element: node,
        };
      }
    }

    // Set start and end nodes
    startNode = nodes[10][5];
    startNode.isStart = true;
    startNode.element.classList.add("start-node");

    endNode = nodes[10][20];
    endNode.isEnd = true;
    endNode.element.classList.add("end-node");
  }

  // Event handlers for wall creation
  function handleMouseDown(e) {
    if (isVisualizing) return;

    isMousePressed = true;
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const node = nodes[row][col];

    if (node.isStart) {
      isStartNodeMoving = true;
    } else if (node.isEnd) {
      isEndNodeMoving = true;
    } else {
      toggleWall(node);
    }
  }

  function handleMouseEnter(e) {
    if (!isMousePressed || isVisualizing) return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const node = nodes[row][col];

    if (isStartNodeMoving) {
      if (!node.isEnd && !node.isWall) {
        // Remove start node class from previous start node
        startNode.isStart = false;
        startNode.element.classList.remove("start-node");

        // Set new start node
        startNode = node;
        startNode.isStart = true;
        startNode.element.classList.add("start-node");
      }
    } else if (isEndNodeMoving) {
      if (!node.isStart && !node.isWall) {
        // Remove end node class from previous end node
        endNode.isEnd = false;
        endNode.element.classList.remove("end-node");

        // Set new end node
        endNode = node;
        endNode.isEnd = true;
        endNode.element.classList.add("end-node");
      }
    } else {
      toggleWall(node);
    }
  }

  function handleMouseUp() {
    isMousePressed = false;
    isStartNodeMoving = false;
    isEndNodeMoving = false;
  }

  function toggleWall(node) {
    if (node.isStart || node.isEnd) return;

    node.isWall = !node.isWall;
    node.element.classList.toggle("wall-node");
  }

  // Algorithm implementations
  async function bfs() {
    const queue = [startNode];
    startNode.isVisited = true;
    startNode.distance = 0;

    while (queue.length > 0) {
      const currentNode = queue.shift();

      if (currentNode === endNode) {
        return true; // Path found
      }

      // Visualize the current node
      if (currentNode !== startNode && currentNode !== endNode) {
        currentNode.element.classList.add("visited-node");
        await sleep(101 - animationSpeed); // Invert speed so higher value = faster
      }

      // Get unvisited neighbors
      const neighbors = getNeighbors(currentNode);

      for (const neighbor of neighbors) {
        if (!neighbor.isVisited && !neighbor.isWall) {
          neighbor.isVisited = true;
          neighbor.distance = currentNode.distance + 1;
          neighbor.previousNode = currentNode;
          queue.push(neighbor);
        }
      }
    }

    return false; // No path found
  }

  async function dfs() {
    const stack = [startNode];
    startNode.isVisited = true;
    startNode.distance = 0;

    while (stack.length > 0) {
      const currentNode = stack.pop();

      if (currentNode === endNode) {
        return true; // Path found
      }

      // Visualize the current node
      if (currentNode !== startNode && currentNode !== endNode) {
        currentNode.element.classList.add("visited-node");
        await sleep(101 - animationSpeed);
      }

      // Get unvisited neighbors
      const neighbors = getNeighbors(currentNode);

      for (const neighbor of neighbors) {
        if (!neighbor.isVisited && !neighbor.isWall) {
          neighbor.isVisited = true;
          neighbor.distance = currentNode.distance + 1;
          neighbor.previousNode = currentNode;
          stack.push(neighbor);
        }
      }
    }

    return false; // No path found
  }

  async function dijkstra() {
    const unvisitedNodes = getAllNodes();
    startNode.distance = 0;

    while (unvisitedNodes.length > 0) {
      // Sort nodes by distance
      sortNodesByDistance(unvisitedNodes);

      // Get the node with the smallest distance
      const closestNode = unvisitedNodes.shift();

      // If we encounter a wall, skip it
      if (closestNode.isWall) continue;

      // If the closest node has a distance of Infinity, we are trapped
      if (closestNode.distance === Infinity) return false;

      closestNode.isVisited = true;

      // Visualize the current node
      if (closestNode !== startNode && closestNode !== endNode) {
        closestNode.element.classList.add("visited-node");
        await sleep(101 - animationSpeed);
      }

      // If we found the end node, we're done
      if (closestNode === endNode) return true;

      // Update unvisited neighbors
      updateUnvisitedNeighbors(closestNode);
    }

    return false; // No path found
  }

  // Helper functions for algorithms
  function getNeighbors(node) {
    const neighbors = [];
    const { row, col } = node;

    // Up
    if (row > 0) neighbors.push(nodes[row - 1][col]);
    // Right
    if (col < COLS - 1) neighbors.push(nodes[row][col + 1]);
    // Down
    if (row < ROWS - 1) neighbors.push(nodes[row + 1][col]);
    // Left
    if (col > 0) neighbors.push(nodes[row][col - 1]);

    return neighbors;
  }

  function getAllNodes() {
    const allNodes = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        allNodes.push(nodes[row][col]);
      }
    }
    return allNodes;
  }

  function sortNodesByDistance(nodesList) {
    nodesList.sort((a, b) => a.distance - b.distance);
  }

  function updateUnvisitedNeighbors(node) {
    const neighbors = getNeighbors(node);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && !neighbor.isWall) {
        const newDistance = node.distance + 1;
        if (newDistance < neighbor.distance) {
          neighbor.distance = newDistance;
          neighbor.previousNode = node;
        }
      }
    }
  }

  async function animatePath() {
    const path = getPath();

    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      if (node !== startNode && node !== endNode) {
        await sleep(50);
        node.element.classList.add("path-node");
      }
    }
  }

  function getPath() {
    const path = [];
    let currentNode = endNode;

    while (currentNode !== null && currentNode !== startNode) {
      path.unshift(currentNode);
      currentNode = currentNode.previousNode;
    }

    return path;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // UI control functions
  function resetNodes() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const node = nodes[row][col];

        // Reset algorithm-specific properties
        node.isVisited = false;
        node.distance = Infinity;
        node.previousNode = null;

        // Reset visualization classes
        if (!node.isStart && !node.isEnd && !node.isWall) {
          node.element.className = "node";
        }
      }
    }
  }

  function clearPath() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const node = nodes[row][col];

        // Reset algorithm-specific properties
        node.isVisited = false;
        node.distance = Infinity;
        node.previousNode = null;

        // Remove visualization classes but keep walls
        if (!node.isStart && !node.isEnd && !node.isWall) {
          node.element.classList.remove("visited-node", "path-node");
        }
      }
    }
  }

  function clearBoard() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const node = nodes[row][col];

        // Reset algorithm-specific properties
        node.isVisited = false;
        node.distance = Infinity;
        node.previousNode = null;
        node.isWall = false;

        // Reset all classes except start and end
        if (!node.isStart && !node.isEnd) {
          node.element.className = "node";
        }
      }
    }
  }

  function generateMaze() {
    clearBoard();

    // Simple recursive division maze algorithm
    const walls = [];

    // Add border walls
    for (let row = 0; row < ROWS; row++) {
      if (row === 0 || row === ROWS - 1) {
        for (let col = 0; col < COLS; col++) {
          if (!nodes[row][col].isStart && !nodes[row][col].isEnd) {
            walls.push(nodes[row][col]);
          }
        }
      } else {
        if (!nodes[row][0].isStart && !nodes[row][0].isEnd) {
          walls.push(nodes[row][0]);
        }
        if (!nodes[row][COLS - 1].isStart && !nodes[row][COLS - 1].isEnd) {
          walls.push(nodes[row][COLS - 1]);
        }
      }
    }

    // Add random walls
    for (let i = 0; i < ROWS * COLS * 0.25; i++) {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);

      if (
        !nodes[row][col].isStart &&
        !nodes[row][col].isEnd &&
        !nodes[row][col].isWall
      ) {
        walls.push(nodes[row][col]);
      }
    }

    // Animate wall creation
    animateWalls(walls);
  }

  async function animateWalls(walls) {
    for (let i = 0; i < walls.length; i++) {
      const node = walls[i];
      node.isWall = true;
      node.element.classList.add("wall-node");
      await sleep(10);
    }
  }

  // Event listeners for UI controls
  document
    .getElementById("visualize-btn")
    .addEventListener("click", async function () {
      if (isVisualizing) return;

      isVisualizing = true;
      clearPath();

      let pathFound = false;

      switch (currentAlgorithm) {
        case "bfs":
          pathFound = await bfs();
          break;
        case "dfs":
          pathFound = await dfs();
          break;
        case "dijkstra":
          pathFound = await dijkstra();
          break;
      }

      if (pathFound) {
        await animatePath();
      }

      isVisualizing = false;
    });

  document
    .getElementById("clear-path-btn")
    .addEventListener("click", function () {
      if (isVisualizing) return;
      clearPath();
    });

  document
    .getElementById("clear-board-btn")
    .addEventListener("click", function () {
      if (isVisualizing) return;
      clearBoard();
    });

  document
    .getElementById("generate-maze-btn")
    .addEventListener("click", function () {
      if (isVisualizing) return;
      generateMaze();
    });

  document
    .getElementById("speed-slider")
    .addEventListener("input", function (e) {
      animationSpeed = parseInt(e.target.value);
    });

  // Algorithm selection
  const algorithmButtons = document.querySelectorAll(".algorithm-btn");

  algorithmButtons.forEach((button) => {
    button.addEventListener("click", function () {
      if (isVisualizing) return;

      // Remove active class from all buttons
      algorithmButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      this.classList.add("active");

      // Update current algorithm
      currentAlgorithm = this.id;

      // Update algorithm info
      document.getElementById("current-algorithm").textContent =
        getAlgorithmTitle(currentAlgorithm);
      document.getElementById("algorithm-description").textContent =
        algorithmDescriptions[currentAlgorithm];
    });
  });

  function getAlgorithmTitle(algorithm) {
    switch (algorithm) {
      case "bfs":
        return "Breadth-First Search (BFS)";
      case "dfs":
        return "Depth-First Search (DFS)";
      case "dijkstra":
        return "Dijkstra's Algorithm";
      default:
        return "";
    }
  }

  // Initialize the grid
  initializeGrid();

  // Add event listener to prevent dragging on the grid
  document.addEventListener("dragstart", function (e) {
    e.preventDefault();
    return false;
  });

  // Add event listener to handle mouse up outside the grid
  document.addEventListener("mouseup", function () {
    isMousePressed = false;
    isStartNodeMoving = false;
    isEndNodeMoving = false;
  });
});
