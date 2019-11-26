<?php

// Öffnen einer PostgreSQL-Datenbank mit pg_connect(Connectionstring) 
// Im Connectionstring sind die Verbindungsdaten anzugeben:
// "host=... dbname=... user=... password=..."
$dbhost = 'localhost';
$dbname = 'geoweb2019';
$dbuser = 'geoweb2019';
$dbpass = 'geoweb4m10!';

// Verbindung zum PostgreSQL-Datenbank herstellen (bei Fehler Abbruch)
$db = pg_connect("host=".$dbhost." dbname=".$dbname." user=".$dbuser." password=".$dbpass) 
or die ('g02 meldet Fehler bei Verbindung zu GeoWeb-Datenbank: '.pg_last_error($db));

?> 