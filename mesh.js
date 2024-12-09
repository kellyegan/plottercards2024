function connect(a, b) {
  line(a.get([0]), a.get([1]), b.get([0]), b.get([1]));
}

class Mesh {
  vertices;
  edges;
  transform;

  constructor() {
    this.vertices = [];
    this.edges = [];
    this.transform = math.identity(4, 4);
  }

  applyTransform(transform) {
    this.transform = math.multiply(this.transform, transform);
  }

  projectOrtho() {
    // 1. Apply object transform
    const transformedVerts = this.vertices.map((v) => {
      return math.multiply(this.transform, v);
    });

    // 2. Apply orthographic projection
    let orthographicProjection = math.matrix([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
    ]);
    projectedVerts = transformedVerts.map((p) => {
      return math.multiply(orthographicProjection, p);
    });

    // 4. Scale up verts (this could be done better)
    const scaledVerts = projectedVerts.map((v) => {
      return math.multiply(v, 200);
    });

    return scaledVerts;
  }

  projectPerspective(camera) {
    // 1. Apply object transform
    const transformedVerts = this.vertices.map((v) => {
      return math.multiply(this.transform, v);
    });

    // 2. Transform points in relation to camera
    const cameraRelativeVerts = transformedVerts.map((p) => {
      return math.add(p, camera.transform);
    });

    // 3. Project to 2D (using weak perspective)
    const focalLength = 2;
    const projectedVerts = cameraRelativeVerts.map((v) => {
      let zScale = focalLength / v.get([2]);
      let perspectiveProjection = math.matrix([
        [zScale, 0, 0, 0],
        [0, zScale, 0, 0],
      ]);

      return math.multiply(perspectiveProjection, v);
    });

    // 4. Scale up verts (this could be done better)
    const scaledVerts = projectedVerts.map((v) => {
      return math.multiply(v, 200);
    });

    return scaledVerts;
  }

  render(camera, renderVertices = false, renderEdges = true) {
    const projectedVerts = this.projectPerspective(camera);

    if (renderEdges) {
      //Draw edges between projected vertices
      this.edges.forEach((edge) => {
        connect(projectedVerts[edge[0]], projectedVerts[edge[1]]);
      });
    }
    if (renderVertices) {
      projectedVerts.forEach((vertex, i) => {
        const x = vertex.get([0]);
        const y = vertex.get([1]);
        push();
        text(i, x + 5, y + 10);
        strokeWeight(5);
        point(x, y);
        pop();
      });
    }
  }
}

class Camera {
  transform;

  constructor(x = 0, y = 0, z = -1) {
    this.transform = math.matrix([x, y, z, 1]);
  }
}

class Scene {
  objects;
  cameras;
  transform;
  stack;

  constructor() {
    this.objects = [];
    this.cameras = [];
    this.transform = math.identity(4, 4);
    this.stack = [];
  }

  reset() {
    this.objects = [];
    this.transform = math.identity(4, 4);
  }

  add(shape) {
    shape.applyTransform(this.transform);
    this.objects.push(shape);
  }

  render(camera, renderVertices = false, renderEdges = true) {
    this.objects.forEach((object) => {
      object.render(camera, renderVertices, renderEdges);
    });
  }

  translate(x, y, z) {
    let translation = math.matrix([
      [1, 0, 0, x],
      [0, 1, 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1],
    ]);

    this.transform = math.multiply(this.transform, translation);
  }

  rotateX(angle) {
    let rotationX = math.matrix([
      [1, 0, 0, 0],
      [0, cos(angle), -sin(angle), 0],
      [0, sin(angle), cos(angle), 0],
      [0, 0, 0, 1],
    ]);

    this.transform = math.multiply(this.transform, rotationX);
  }

  rotateY(angle) {
    let rotationY = math.matrix([
      [cos(angle), 0, -sin(angle), 0],
      [0, 1, 0, 0],
      [sin(angle), 0, cos(angle), 0],
      [0, 0, 0, 1],
    ]);

    this.transform = math.multiply(this.transform, rotationY);
  }

  rotateZ(angle) {
    let rotationZ = math.matrix([
      [cos(angle), -sin(angle), 0, 0],
      [sin(angle), cos(angle), 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]);

    this.transform = math.multiply(this.transform, rotationZ);
  }

  scale(x, y, z) {
    let translation = math.matrix([
      [x, 0, 0, 0],
      [0, y, 0, 0],
      [0, 0, z, 0],
      [0, 0, 0, 1],
    ]);
  }
}

class Tetrahedron extends Mesh {
  size;

  constructor(size) {
    super();

    this.size = size;

    // Generate vertices
    this.vertices = [
      [size / 2, size / 2, size / 2, 1],
      [size / 2, -size / 2, -size / 2, 1],
      [-size / 2, size / 2, -size / 2, 1],
      [-size / 2, -size / 2, size / 2, 1],
    ];

    //Generate edges
    this.edges = [
      [0, 1],
      [1, 2],
      [2, 0],
      [3, 0],
      [3, 1],
      [3, 2],
    ];
  }
}

class Octahedron extends Mesh {
  size;

  constructor(size) {
    super();

    this.size = size;

    // Generate vertices
    this.vertices = [
      [size / 2, 0, 0, 1],
      [0, size / 2, 0, 1],
      [0, 0, size / 2, 1],
      [0, -size / 2, 0, 1],
      [0, 0, -size / 2, 1],
      [-size / 2, 0, 0, 1],
    ];

    //Generate edges
    this.edges = [
      [0, 1],
      [0, 2],
      [0, 4],
      [0, 3],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
      [5, 1],
      [5, 2],
      [5, 4],
      [5, 3],
    ];
  }
}

class Cube extends Mesh {
  size;

  constructor(size) {
    super();

    this.size = size;

    // Generate vertices
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 4; j++) {
        let x = -this.size / 2 + ((this.size * Math.floor((j + 1) / 2)) % 2);
        let y = -this.size / 2 + ((this.size * Math.floor(j / 2)) % 2);
        let z = -this.size / 2 + this.size * i;

        this.vertices.push(math.matrix([x, y, z, 1]));
      }
    }

    //Generate edges
    this.edges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];
  }
}

class Icosahedron extends Mesh {
  size;

  constructor(size) {
    super();

    const halfsize = size / 2;
    const halfphi = halfsize * math.phi;

    // Generate vertices
    this.vertices = [
      [0, halfsize, halfphi, 1],
      [0, -halfsize, halfphi, 1],
      [halfphi, 0, halfsize, 1],
      [halfsize, halfphi, 0, 1],
      [-halfsize, halfphi, 0, 1],
      [-halfphi, 0, halfsize, 1],
      [0, -halfsize, -halfphi, 1],
      [0, halfsize, -halfphi, 1],
      [halfphi, 0, -halfsize, 1],
      [halfsize, -halfphi, 0, 1],
      [-halfsize, -halfphi, 0, 1],
      [-halfphi, 0, -halfsize, 1],
    ];

    this.edges = [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 0],
      [3, 4],
      [4, 0],
      [4, 5],
      [5, 0],
      [5, 1],
      [6, 7],
      [7, 8],
      [8, 6],
      [8, 9],
      [9, 6],
      [9, 10],
      [10, 6],
      [10, 11],
      [11, 6],
      [11, 7],
      [1, 9],
      [9, 1],
      [1, 10],
      [10, 5],
      [5, 11],
      [4, 11],
      [4, 7],
      [7, 3],
      [2, 9],
      [2, 8],
      [3, 8],
    ];
  }
}

class Dodecahedron extends Mesh {
  size;

  constructor(size) {
    super();

    this.size = size;
    const s = size / 2;
    const p = s * math.phi;
    const i = s / math.phi;

    // Generate vertices
    this.vertices = [
      [s, s, s, 1],
      [s, s, -s, 1],
      [s, -s, s, 1],
      [s, -s, -s, 1],
      [-s, s, s, 1],
      [-s, s, -s, 1],
      [-s, -s, s, 1],
      [-s, -s, -s, 1],
      [0, i, p, 1],
      [0, i, -p, 1],
      [0, -i, p, 1],
      [0, -i, -p, 1],
      [i, p, 0, 1],
      [i, -p, 0, 1],
      [-i, p, 0, 1],
      [-i, -p, 0, 1],
      [p, 0, i, 1],
      [p, 0, -i, 1],
      [-p, 0, i, 1],
      [-p, 0, -i, 1],
    ];

    //Generate edges
    this.edges = [
      [0, 8],
      [8, 10],
      [10, 2],
      [2, 16],
      [16, 0],
      [0, 12],
      [12, 1],
      [1, 17],
      [17, 16],
      [12, 14],
      [14, 4],
      [4, 8],
      [10, 6],
      [6, 18],
      [18, 4],
      [2, 13],
      [13, 15],
      [15, 6],
      [17, 3],
      [3, 13],
      [15, 7],
      [7, 19],
      [19, 18],
      [3, 11],
      [11, 7],
      [14, 5],
      [5, 19],
      [1, 9],
      [9, 11],
      [5, 9],
    ];
  }
}