// # Giro3D - Getting started

// ### Welcome to Giro3D !

// In this tutorial, we will cover the base features of Giro3D : the creation of the
// [instance](../apidoc/classes/core.Instance.html), the creation of a
// [map](../apidoc/classes/entities.Map.html), and setting up the navigation controls.

// ##### Note
// This walkthrough is based on the [2.5D Map example](../examples/getting-started.html).
// Feel free to visit this example to see the final result of this tutorial.

import {
  Vector3,
  CubeTextureLoader,
  DirectionalLight,
  AmbientLight,
  Color,
  PerspectiveCamera,
  MathUtils
} from "three";

import { MapControls } from "three/examples/jsm/controls/MapControls.js";

import Vector from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import WFS from 'ol/format/WFS.js';
// import WMSGetFeatureInfo from 'ol/format/WMSGetFeatureInfo.js';
import XML from 'ol/format/XML.js';
import {bbox} from 'ol/loadingstrategy.js';
import TileWMS from "ol/source/TileWMS.js";
import FeatureCollection from "@giro3d/giro3d/entities/FeatureCollection.js";
import Instance from "@giro3d/giro3d/core/Instance.js";
import Extent from "@giro3d/giro3d/core/geographic/Extent.js";
import Map from "@giro3d/giro3d/entities/Map.js";
import ColorLayer from "@giro3d/giro3d/core/layer/ColorLayer.js";
import ElevationLayer from "@giro3d/giro3d/core/layer/ElevationLayer.js";
import BilFormat from "@giro3d/giro3d/formats/BilFormat.js";
import WmsSource from "@giro3d/giro3d/sources/WmsSource.js";
import Inspector from "@giro3d/giro3d/gui/Inspector.js";
import TiledImageSource from "@giro3d/giro3d/sources/TiledImageSource.js";
import VectorSource from "ol/source/Vector";
import { wgslFn } from "three/src/nodes/TSL.js";

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

//const extent = new Extent("EPSG:25832", xmin, xmax, ymin, ymax); // Dessau-Roßlau OT. Mildensee
// const extent = new Extent("EPSG:25832",726714.8, 5746537.1, 727065.6, 5746918.2); // only CEC company premises
const extent = new  Extent("EPSG:25832", 726784.2, 5746625.4,  726882.9, 5746732.6); // nur Haus I mit strasse und einfahrt
const map = new Map({ extent,  lighting: {
    enabled: true} });

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

map.addLayer(colorLayer);

/*
const demSource = new TiledImageSource({
  source: new TileWMS({
   // url: 'https://www.geodatenportal.sachsen-anhalt.de/wss/service/INSPIRE_LVermGeo_ATKIS_EL/guest?',
   url: 'https://www.geodatenportal.sachsen-anhalt.de/wss/service/ST_LVermGeo_DGM1_WMS_OpenData/guest?',
    projection: "EPSG:25832",
    crossOrigin: "anonymous",
    extent: map.extent,
    retries: 3,
    params: {
      LAYERS: [ 'EL.ElevationGridCoverage'
                 // "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES"
              ],
      FORMAT: "image/png",//"image/x-bil;bits=32",
      version: '1.3.0',
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

// curl --output map.png 'https://www.geodatenportal.sachsen-anhalt.de/wss/service/INSPIRE_LVermGeo_ATKIS_EL/guest?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&STYLES=&TRANSPARENT
// =true&LAYERS=EL_ElevationGridCoverage&WIDTH=256&HEIGHT=256&CRS=EPSG%3A25832&BBOX=390919.47990708053%2C5746516.35463411%2C410465.4539024347%2C5766062.328629464'
 

const elevationLayer = new ElevationLayer({
  name: "dem",
  resolutionFactor: 1 / 8,
  extent: map.extent,
  source: demSource,
});
map.addLayer(elevationLayer);
*/


// const building_wms_url = 'https://geodatenportal.sachsen-anhalt.de/ows_INSPIRE_LVermGeo_ALKIS_LOD2_BU?';

 // Hausumrisse/Gebauedeumrisse WMS
 const building_wms_url =   'https://geodatenportal.sachsen-anhalt.de/ows_INSPIRE_LVermGeo_ALKIS_BU_WMS?'; //FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&SERVICE=WMS&REQUEST=GetMap&LAYERS=BU.Building

 const building_wfs_url =  'https://www.geodatenportal.sachsen-anhalt.de/wss/service/ST_LVermGeo_LoD2_WFS/guest?';

 /**  <description lang="en">Vectorial recording of parcels from the official real estate cadastre.</description>
        <description lang="de">Vektorielle Erfassung von Flurstücke aus dem amtlichen Liegenschaftskataster.</description>
        <id>LSA-ALKIS-CP</id>
        <category>map</category>
        <date>-</date>
        <type>wms</type>
        <url><![CDATA[https://geodatenportal.sachsen-anhalt.de/ows_INSPIRE_LVermGeo_ALKIS_CP_WMS?FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&SERVICE=WMS&REQUEST=GetMap&LAYERS=CP.CadastralParcel&STYLES=&CRS={proj}&WIDTH={width}&HEIGHT={height}&BBOX={bbox}]]></url>
        <permission-ref>https://wiki.openstreetmap.org/wiki/DE:Permissions/Geobasisdaten_Sachsen-Anhalt</permission-ref>
         */

// Let's compute the extrusion offset of building polygons to give them walls.
const extrusionOffsetCallback = (feature) => {
  const properties = feature.getProperties();
 // 'ELEVATION' , 'OBJECTID', 'HEIGHTABOVEGROUND', 'SHAPE' (Multipolygon)
  const buildingHeight = properties["HEIGHTABOVEGROUND"]; 
  const extrusionOffset = buildingHeight;

  if (Number.isNaN(extrusionOffset)) {
    return null;
  }
  return extrusionOffset;
};



const vectorSource = new Vector({
  format: new WFS(), // new XML(), // new GeoJSON(),
  loader: function(extent, resolution, projection, success, failure) {
    const feature_name = 'BU.Building';
    const out_format = 'text/xml';//'GEOJSON'; // application/json   'text/xml; subtype=gml/3.1.1' // ONLY supported by version=2.0.0
     const proj = projection.getCode();
     const url = building_wfs_url + 'SERVICE=WFS&' +
         'VERSION=1.1.0&REQUEST=GetFeature&typename=' + // ALKIS_LOD2_BU:BU.Building & ALKIS_LOD2_BU:BU.BuildingPart
         feature_name + ',BU.BuildingPart&' +
         `SRSNAME=${proj}&` +
         // `outputFormat=${out_format}&SRSNAME=${proj}&` +
         'bbox=' + extent.join(',') + ',' + proj;
     const xhr = new XMLHttpRequest();
     xhr.open('GET', url);
     const onError = function() {
       vectorSource.removeLoadedExtent(extent);
       failure();
     }
     xhr.onerror = onError;
     xhr.onload = function() {
       if (xhr.status == 200) {
        
         const features = vectorSource.getFormat().readFeatures(xhr.responseText);
         vectorSource.addFeatures(features);
         success(features);
       } else {
         onError();
       }
     }
     xhr.send();
   },
   strategy: bbox,
 });


// This is the style function that will assign a different style depending on a feature's attribute.
// The `feature` argument is an OpenLayers feature.
const buildingStyle = (feature) => {
  const properties = feature.getProperties();
  let fillColor = "#FFFFFF";

  //const hovered = properties.hovered ?? false;
  // const clicked = properties.clicked ?? false;

    const hovered = false;
    const clicked = false;

  // --- MODIFICATION: The 'usage_1' property from the French BDTOPO dataset is likely different
  // in German datasets. This switch statement is kept as a template but may need property name
  // and value adjustments for the German data structure.
  switch (properties.usage_1) {
    case "Industriel":
      fillColor = "#f0bb41";
      break;
    case "Agricole":
      fillColor = "#96ff0d";
      break;
    case "Religieux":
      fillColor = "#41b5f0";
      break;
    case "Sportif":
      fillColor = "#ff0d45";
      break;
    case "Résidentiel":
      fillColor = "#cec8be";
      break;
    case "Commercial et services":
      fillColor = "#d8ffd4";
      break;
  }

  const fill = clicked
    ? "yellow"
    : hovered
      ? new Color(fillColor).lerp(hoverColor, 0.2) 
      : fillColor;

  return {
    fill: {
      color: fill,
      shading: true,
    },
    stroke: {
      color: clicked ? "yellow" : hovered ? "white" : "black",
      lineWidth: clicked ? 5 : undefined,
    },
  };
};



const buildingFeatureCollection = new FeatureCollection({
  source: vectorSource,
  extent,
  extrusionOffset: extrusionOffsetCallback,
  style: buildingStyle,
  // minLevel: 11,
  // maxLevel: 11,
});

instance.add(buildingFeatureCollection);


https://www.geodatenportal.sachsen-anhalt.de/wss/service/ST_LVermGeo_ALKIS_WFS_Gemarkung_Flur_OpenData/guest?

// To make sure that the buildings remain correctly displayed whenever
// one entity become transparent (i.e it's opacity is less than 1), we need
// to set the render of the feature collection to be greater than the map's.
 map.renderOrder = 0;
buildingFeatureCollection.renderOrder = 1;


// Add a sunlight
const sun = new DirectionalLight("#ffffff", 2);
sun.position.set(1, 0, 1).normalize();
sun.updateMatrixWorld(true);
instance.scene.add(sun);

// Add an ambient light
const ambientLight = new AmbientLight(0xffffff, 0.2);
instance.scene.add(ambientLight);


// ### Set the camera and navigation controls
// Giro3D uses the THREE.js controls to navigate in the scene. In our example, we are going to use
// the `MapControls`, which are perfectly adapted to our need.


 const camera = instance.view.camera; 
 camera.near = 0.1; // 0.1 - 1.0
 camera.far = 1000;
 camera.aspect = window.innerWidth / window.innerHeight;
 camera.fov = 55;
//const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
//instance.view.camera.copy(camera);


// Let's specify the camera position. We will position it in the southwest corner of the map, at an
// altitude of 2000 meters.
const cameraAltitude = 2000;

// const cameraPosition = new Vector3(extent.west, extent.south, cameraAltitude);
const cameraPosition = new Vector3(726831.29 , 5746686.22, 2.0); // in front of Haus I

camera.position.copy(cameraPosition);
/*
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
instance.view.setControls(controls); */

// ### Optional: Set up the inspector

// This is an optional step, but very useful for diagnostic and debugging issues with Giro3D.
// The `Inspector` is a panel containing lots of useful information about the Giro3D instance.

// This supposes that we have a `div` ready to host our inspector.

Inspector.attach("inspector", instance);