import * as THREE from "./scripts/three/build/three.module.js"; // Import the main THREE.js library
import { OrbitControls } from "./scripts/three/examples/jsm/controls/OrbitControls.js"; // Import the OrbitControls for controlling the camera
console.log("Orbit controls imported!");

// Define the CameraSyncSocketHandler class to synchronize the camera between clients
class CameraSyncSocketHandler {
  // The constructor initializes the class with a camera, controls, renderer, and a flag indicating if the current user is a GM (Game Master)
  constructor(camera, controls, renderer, isGM) {
    this.identifier = "module.threejs-foundry"; // Unique identifier for this module's socket messages
    this.camera = camera;
    this.controls = controls;
    this.renderer = renderer;
    this.isGM = isGM; // Flag indicating if the current user is a GM
    // Register socket handlers for this instance
    this.registerSocketHandlers();
  }

  // This method registers a socket handler that listens for messages with the identifier of this module
  registerSocketHandlers() {
    game.socket.on(this.identifier, ({ type, payload }) => {
      // Depending on the type of the message, handle it differently
      switch (type) {
        case "camera":
          // If the message is of type "camera", handle it with the handleCameraUpdate method
          this.handleCameraUpdate(payload);
          break;
        default:
          // If the message type is unknown, throw an error
          throw new Error("unknown type");
      }
    });
  }

  // This method sends a message with a given type and payload, but only if the current user is a GM
  emit(type, payload) {
    if (this.isGM) {
      return game.socket.emit(this.identifier, { type, payload });
    }
  }

  // This method handles updates to the camera. It updates the camera's position, target, and the renderer's size based on the received data
  handleCameraUpdate({ position, target, view }) {
    // Update the camera's position
    this.camera.position.set(position.x, position.y, position.z);
    // Update the camera's target
    this.controls.target.set(target.x, target.y, target.z);
    // Update the renderer's size
    this.renderer.setSize(view.width, view.height);
    // Log the updated camera position and view
    console.log("Camera updated:", { position, target, view });
  }
}

// This hook runs once when Foundry is ready
Hooks.once("ready", async function () {
  // Only execute if the current user is the GM
  if (game.user.isGM) {
    // Check if a journal entry with the name "ThreeJS Window" exists
    let threeJsJournal = game.journal.getName("ThreeJS Window");

    // If it doesn't exist, create it
    if (!threeJsJournal) {
      threeJsJournal = await JournalEntry.create({
        name: "ThreeJS Window",
        pages: [
          {
            name: "Page 1",
            type: "text",
            text: {
              content:
                '<div id="threejs-container">This is the place for the three.js injection.</div>',
              format: 1,
            },
          },
        ],
      });
      console.log("Journal entry created!");
    } else {
      console.log("Journal entry already exists!");
    }

    // Do not render the journal entry immediately upon creation
    // If you need to render it manually later, you can call this line elsewhere
    // new JournalSheet(threeJsJournal, {}).render(true, {
    //   width: 1000,
    //   height: 600,
    // });
  }
});

// This hook runs whenever a journal sheet is rendered (probably unnecessary with the JournalTextPageSheet hook - too lazy to test right now)
Hooks.on("renderJournalSheet", (app, html, data) => {
  Hooks.on("renderJournalTextPageSheet", (app, html, data) => {
    // Find the container where the three.js scene will be injected
    let contentArea = html.find("#threejs-container");
    console.log('contentArea:', contentArea);
    // If the container exists and doesn't already have a canvas element, set up the three.js scene
    if (contentArea && contentArea.length > 0 && contentArea.find("canvas").length === 0) {
      console.log("Rendering JournalSheet");

      // Get the width and height of the app window
      let width = app.options.width;
      let height = app.options.height;
      console.log(width, height);

      // Create a new three.js scene
      const scene = new THREE.Scene();

      // Create a new PerspectiveCamera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 5;

      // Create a new WebGLRenderer and set its size
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(width, height);
      // Append the renderer's DOM element to the container
      contentArea[0].appendChild(renderer.domElement);

      // Create new OrbitControls for the camera
      const controls = new OrbitControls(camera, renderer.domElement);

      // Create a cube and add it to the scene
      const geometry = new THREE.BoxGeometry(2, 2, 2); // Create a cube
      const material = new THREE.MeshBasicMaterial({ color: 0x22dd88 }); // Green-ish
      const cube = new THREE.Mesh(geometry, material); // Combine geometry and material

      scene.add(cube);

      // Animation loop to render the scene
      const animate = function () {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };

      // Event listener for changes in the controls
      controls.addEventListener("change", () => {
        // Only emit camera updates if the current user is a GM
        if (game.user.isGM) {
          game.modules.get("threejs-foundry").socketHandler.emit("camera", {
            position: {
              x: camera.position.x,
              y: camera.position.y,
              z: camera.position.z,
            },
            target: {
              x: controls.target.x,
              y: controls.target.y,
              z: controls.target.z,
            },
            view: {
              width,
              height,
            },
          });
        }
      });

      // Get the module and initialize the CameraSyncSocketHandler
      const testModule = game.modules.get("threejs-foundry");
      testModule.socketHandler = new CameraSyncSocketHandler(
        camera,
        controls,
        renderer,
        game.user.isGM
      );
      console.log("CameraSyncSocketHandler listening for updates");

      // Start the animation loop
      animate();
    }
  });
});
