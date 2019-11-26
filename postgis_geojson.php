<?php
# Connect to PostgreSQL database
include 'geoweb_pg_open.php';
# Build SQL SELECT statement and return the geometry as a GeoJSON element
$sql = 'SELECT *, public.ST_AsGeoJSON(the_geom,6) AS geojson FROM g02.feedback';
# Try query or error
$result = pg_query($sql);
if (!$result) {
  echo "An SQL error occured.\n";
  exit;
}
# Build GeoJSON feature collection array
$geojson = array(
  'type' => 'FeatureCollection',
  'features' => array()
);
# Loop through rows to build feature arrays
while ($row = pg_fetch_assoc($result)) {
  $properties = $row;
  # Remove geojson and geometry fields from properties
  unset($properties['geojson']);
  unset($properties['the_geom']);
  $feature = array(
    'type' => 'Feature',
    'geometry' => json_decode($row['geojson'], true),
    'properties' => $properties
  );
  # Add feature arrays to feature collection array
  array_push($geojson['features'], $feature);
}
header('Access-Control-Allow-Origin: *');
header('Content-type: application/json; charset=utf-8');
echo json_encode($geojson, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES |
    JSON_NUMERIC_CHECK);
include 'geoweb_pg_close.php';
?>
