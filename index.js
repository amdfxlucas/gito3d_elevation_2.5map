// # Giro3D - Getting started

// ### Welcome to Giro3D !

// In this tutorial, we will cover the base features of Giro3D : the creation of the
// [instance](../apidoc/classes/core.Instance.html), the creation of a
// [map](../apidoc/classes/entities.Map.html), and setting up the navigation controls.

// ##### Note
// This walkthrough is based on the [2.5D Map example](../examples/getting-started.html).
// Feel free to visit this example to see the final result of this tutorial.

import { Vector3 } from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";

import TileWMS from "ol/source/TileWMS.js";

import Instance from "@giro3d/giro3d/core/Instance.js";
import Extent from "@giro3d/giro3d/core/geographic/Extent.js";
import Map from "@giro3d/giro3d/entities/Map.js";
import ColorLayer from "@giro3d/giro3d/core/layer/ColorLayer.js";
import ElevationLayer from "@giro3d/giro3d/core/layer/ElevationLayer.js";
import BilFormat from "@giro3d/giro3d/formats/BilFormat.js";
import Inspector from "@giro3d/giro3d/gui/Inspector.js";
import TiledImageSource from "@giro3d/giro3d/sources/TiledImageSource.js";

// ####
// Let's register a definition for this CRS. The definition is taken from https://epsg.io/3946.proj4.
// EPSG:25832 (ETRS89 / UTM zone 32N) for Germany ---
Instance.registerCRS(
  "EPSG:25832",
 "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
);

// Now we are ready to create our instance. Note that the `crs` parameter is necessary to determine
// the interpretation of coordinates from the 3D scene.
// We will use the `view` element from our HTML page to initialize the instance.
const instance = new Instance({
  target: "view",
  crs: "EPSG:25832",
});

// minimum and maximum X (longitude, or easting) and Y (latitude, or northing) values.

const xmin= 725414;
const ymin= 5745442;
const xmax = 728736;
const ymax= 5747497;

const extent = new Extent("EPSG:25832", xmin, xmax, ymin, ymax);

// #### Create the Map object

// Now we can create the Map. The only mandatory parameter is the extent
// but you can experiment with the other options if you'd like.
const map = new Map({ extent });

instance.add(map);

// #### Create the color layer

// If we looked at the page now, the map would be rendered as a colored rectangle.
// This is the aspect of the map without any data in it (only the background color).
// Nothing very exciting.

// Let's add a color layer.

// In Giro3D, layers are the basic components of the Map. They can be either a color layer,
// or an elevation layer. In both cases, the data comes from a source.

/*curl 'https://www.geodatenportal.sachsen-anhalt.de/wss/service/ST_LVermGeo_DOP_WMS_OpenData/guest?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fjpeg&LAYERS=lsa_lvermgeo_dop20_2&WIDTH=256&HEIGHT=256&CRS=EPSG%3A25832&BBOX=723201.0378281027%2C5746516.35463411%2C732974.0248257797%2C5756289.341631787' --output map3.jpeg */
const satelliteSource = new TiledImageSource({
  source: new TileWMS({
    url: "https://www.geodatenportal.sachsen-anhalt.de/wss/service/ST_LVermGeo_DOP_WMS_OpenData/guest?",
    projection: "EPSG:25832",
    params: {
      LAYERS: ["lsa_lvermgeo_dop20_2" ], //["ORTHOIMAGERY.ORTHOPHOTOS"],
      FORMAT: "image/jpeg",
    },
  }),
});

// SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fjpeg&STYLES=&TRANSPARENT=true&LAYERS=lsa_lvermgeo_dop20_2&WIDTH=256&HEIGHT=256&CRS=EPSG%3A25832&BBOX=398249.2201553397%2C5747737.97800882%2C399470.8435300493%2C5748959.60138353

const colorLayer = new ColorLayer({
  name: "satellite",
  source: satelliteSource,
  extent: map.extent,
});

// And add it to the map.
map.addLayer(colorLayer);

// Let's create a WMS source for this layer.
const demSource = new TiledImageSource({
  source: new TileWMS({
    url: 'https://www.geodatenportal.sachsen-anhalt.de/wss/service/INSPIRE_LVermGeo_ATKIS_EL/guest?',
    projection: "EPSG:25832",
    crossOrigin: "anonymous",
    params: {
      LAYERS: [ 'EL_ElevationGridCoverage'
                 // "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES"
              ],
      FORMAT: "image/png",//"image/x-bil;bits=32",
    },
  }),
  format: new BilFormat(),
  noDataValue: -1000,
});

// Then create the elevation layer.
// We have set the resolution factor to 1/8th of the resolution
// of each map tile, because we are not going to display the pixels
// of the layer, but rather use the elevation data to deform the
// terrain mesh. Since the terrain mesh has a much lower resolution
// than the terrain textures, we don't want to waste resources.
/*
 curl --output map.png 'https://www.geodatenportal.sachsen-anhalt.de/wss/service/INSPIRE_LVermGeo_ATKIS_EL/guest?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&STYLES=&TRANSPARENT
=true&LAYERS=EL_ElevationGridCoverage&WIDTH=256&HEIGHT=256&CRS=EPSG%3A25832&BBOX=390919.47990708053%2C5746516.35463411%2C410465.4539024347%2C5766062.328629464'
 */
/*
const elevationLayer = new ElevationLayer({
  name: "dem",
  resolutionFactor: 1 / 8,
  extent: map.extent,
  source: demSource,
}); */


//map.addLayer(elevationLayer);

// ### Set the camera and navigation controls
// Giro3D uses the THREE.js controls to navigate in the scene. In our example, we are going to use
// the `MapControls`, which are perfectly adapted to our need.

// Let's get the THREE camera of our scene.
const camera = instance.view.camera;

// Let's specify the camera position. We will position it in the southwest corner of the map, at an
// altitude of 2000 meters.
const cameraAltitude = 2000;

const cameraPosition = new Vector3(extent.west, extent.south, cameraAltitude);

camera.position.copy(cameraPosition);

// Now we can create the `MapControls` with our camera and the DOM element of our scene.
const controls = new MapControls(camera, instance.domElement);

// Let's set the controls' target to our map center.
controls.target = extent.centerAsVector3();

// And specify some parameters for the navigation.
controls.enableDamping = true;
controls.dampingFactor = 0.2;
controls.maxPolarAngle = Math.PI / 2.3;

controls.saveState();

// Now let's register those controls with the instance. The instance will automatically register
// the event handlers relevant to the navigation in the scene.
instance.view.setControls(controls);

// ### Optional: Set up the inspector

// This is an optional step, but very useful for diagnostic and debugging issues with Giro3D.
// The `Inspector` is a panel containing lots of useful information about the Giro3D instance.

// This supposes that we have a `div` ready to host our inspector.

Inspector.attach("inspector", instance);