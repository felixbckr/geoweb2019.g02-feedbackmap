import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import Stamen from 'ol/source/Stamen';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Vector from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Feature from 'ol/Feature';
import {circular} from 'ol/geom/Polygon';
import Point from 'ol/geom/Point';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Overlay from 'ol/Overlay';
import {fromLonLat, toLonLat} from 'ol/proj';
import sync from 'ol-hashed';
import Control from 'ol/control/Control';

// define the map
const map = new Map({
  target: 'map',
  view: new View({
    center: fromLonLat([16.37, 48.2]),
    zoom: 13
  })
});

// watercolor background layer
map.addLayer(new TileLayer({
  source: new Stamen({
    layer: 'watercolor'
  })
}));


// OGD layer of districts of vienna
const bezirkeLayer = new VectorLayer({
  source: new Vector({
    url: 'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:BEZIRKSGRENZEOGD&srsName=EPSG:4326&outputFormat=json',
    format: new GeoJSON()
  })
});
map.addLayer(bezirkeLayer);


//adds a new vectorlayer for the GPS based locationmark
const GPSmarker = new VectorSource();
const GPSlayer = new VectorLayer({
  source: GPSmarker
});
map.addLayer(GPSlayer);

//gets the GPS-Location and accuracy from the browsers geolocation API
//adds point to the layer
navigator.geolocation.watchPosition(function(pos) {
  const coords = [pos.coords.longitude, pos.coords.latitude];
  const accuracy = circular(coords, pos.coords.accuracy);
  GPSmarker.clear(true);
  GPSmarker.addFeatures([
    new Feature(accuracy.transform('EPSG:4326', map.getView().getProjection())),
    new Feature(new Point(fromLonLat(coords)))
  ]);
}, function(error) {
  alert(`ERROR: ${error.message}`);
}, {
  enableHighAccuracy: true
});


// layer containing existing feedback points
// postgis_geojson.php needs deliver a valid GeoJSON!

const feedbackLayer = new VectorLayer({
  source: new Vector({
    url: 'https://student.ifip.tuwien.ac.at/geoweb/2019/g02/feedbackMap/postgis_geojson.php',
    format: new GeoJSON()
  })
});
map.addLayer(feedbackLayer);

// set the style of existing feedback points
feedbackLayer.setStyle(function(feature) {
  return new Style({
    image: new Circle({
      radius: 7,
      fill: new Fill({
        color: 'rgba(232, 12, 12, 1)'
      }),
      stroke: new Stroke({
        color: 'rgba(127, 127, 127, 1)',
        width: 1
      })
    })
  });
});


// sync view of map with the url-hash
sync(map);


// define an Overlay, which should appear on the map on user-click
const overlay = new Overlay({
  element: document.getElementById('popup-container'),
  positioning: 'bottom-center',
  offset: [0, -10],
  autoPan: true
});
map.addOverlay(overlay);
overlay.getElement().addEventListener('click', function() {
  overlay.setPosition();
});

// define what happens when user clicks on the map
map.on('singleclick', function(e) {
  let markup = ''; // the variable "markup" is html code, as string
  map.forEachFeatureAtPixel(e.pixel, function(feature) {
    const properties = feature.getProperties();
    markup += markup + '<hr><table>';
    for (const property in properties) {
      if (property != 'geometry') {
        markup += '<tr><th>' + property + '</th><td>' + properties[property] + '</td></tr>';
      }
    }
    markup += '</table>';
  }, {
    layerFilter: (l) => l === feedbackLayer //kurzschreibweise für Callbackfunction
  });
  if (markup) { // if any table was created (= feature already existed at clicked point)
    document.getElementById('popup-content').innerHTML = markup;
    overlay.setPosition(e.coordinate);
  } else { // if no feature existed on clicked point
    overlay.setPosition();
    const pos = toLonLat(e.coordinate);
    window.location.href =
        'https://student.ifip.tuwien.ac.at/geoweb/2019/g02/feedbackMap/feedback.php?pos=' +
        pos.join(' ');
  }
});

const GPSfeedback = document.getElementById('GPSfeedback');

GPSfeedback.addEventListener('click', function(event) {
  console.log('Hallo Welt');
  function success(pos) {
    const GPSposition = [pos.coords.longitude, pos.coords.latitude];
    console.log('GPSposition: ' + GPSposition);
    // const position = toLonLat(GPSposition);
    // console.log('position: ' + position);
    window.location.href = 'https://student.ifip.tuwien.ac.at/geoweb/2019/g02/feedbackMap/feedback.php?pos=' + GPSposition.join(' ');
  }
  console.log('Ende Succes');
  navigator.geolocation.getCurrentPosition(success);
  console.log('Nach Succes');
});

// function to calculate statistics for districts
// sets the property 'FEEDBACKS' for each district to the number of feedbacks inside
function calculateStatistics() {
  const feedbacks = feedbackLayer.getSource().getFeatures();
  const bezirke = bezirkeLayer.getSource().getFeatures();
  if (feedbacks.length > 0 && bezirke.length > 0) {
    for (let i = 0, ii = feedbacks.length; i < ii; ++i) {
      const feedback = feedbacks[i];
      for (let j = 0, jj = bezirke.length; j < jj; ++j) {
        const bezirk = bezirke[j];
        let count = bezirk.get('FEEDBACKS') || 0;
        const feedbackGeom = feedback.getGeometry();
        if (feedbackGeom && bezirk.getGeometry().intersectsCoordinate(feedbackGeom.getCoordinates())) {
          ++count;
        }
        bezirk.set('FEEDBACKS', count);
      }
    }
  }
}

// we need both layers to calculate the statistics
// try to calculate the statistics when either is loaded
bezirkeLayer.getSource().once('change', calculateStatistics);
feedbackLayer.getSource().once('change', calculateStatistics);

// set the style of the district according to the number of feedbacks
bezirkeLayer.setStyle(function(feature) {
  let fillColor;
  const feedbackCount = feature.get('FEEDBACKS');
  if (feedbackCount <= 1) {
    fillColor = 'rgba(247, 252, 185, 0.7';
  } else if (feedbackCount < 5) {
    fillColor = 'rgba(173, 221, 142, 0.7)';
  } else {
    fillColor = 'rgba(49, 163, 84, 0.7)';
  }
  return new Style({
    fill: new Fill({
      color: fillColor
    }),
    stroke: new Stroke({
      color: 'rgba(4, 4, 4, 1)',
      width: 1
    })
  });
});

