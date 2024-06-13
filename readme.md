# ThreeJSFoundry

**ThreeJSFoundry** is a Foundry VTT module that showcases the integration of Three.js for 3D rendering in journal entries.

## Features

- Integrate a simple Three.js scene within a Foundry VTT journal entry
- Synchronize camera views across different clients for collaborative viewing (DM -> Players)

## Installation

Place the `threejs-foundry` directory in your Foundry `modules` directory and enable it.

## Usage

1. Activate the module.
2. A journal entry "ThreeJS Window" will be created upon startup.
3. Open the journal entry and try click on the "Show Players" button.
4. You can now rotate and pan the camera on the DM client and it should be synced with the player client.

## Development

Feel free to contribute to this module by submitting issues or pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project uses the following third-party libraries:

- **Three.js** (MIT License) - [Three.js GitHub](https://github.com/mrdoob/three.js)