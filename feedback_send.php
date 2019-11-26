<?php
  $name = $_POST['name'];  // $_POST enthält die Benutzerangaben
  $email = $_POST['email'];
  $message = $_POST['message'] ;

  if (isset($_POST['geschlecht']))
     {$anrede=$_POST['geschlecht'];} // Frau/Herr
  else
     {$anrede=" ";}

  if (isset($_POST['team']))
     {$team="geoweb-Mitglied";
      $teamflag=1;}
  else
     {$team="geoweb-extern";
      $teamflag=0;}

  // Funktion mail(adress,subject,message,header)
  // für Versenden per Mail (hier in Kommentar)

  //  mail( "joe.fake@nowhere.at",
  //        "geoweb: Feedback Formular",
  //        "Gesendet von ".$anrede." ".$name." (".$team."): ".$message,
  //        "From: $email" )
  //       OR DIE("Fehler: Feedback nicht gesendet.");

  // Daten zusätzlich in Datenbank speichern (siehe auch PhpSql-Abschnitt)
  // Tabelle feedback muss in Datenbank angelegt sein

  include 'geoweb_pg_open.php'; // PostgreSQL-Datenbank öffnen

  // Daten in Tabelle feedback einfügen mit SQL-Befehl
  // INSERT INTO <tabelle> (felder, ...) VALUES (werte, ...)
  // Die Werte sind bei Textfelder in (einfache) Hochkomma zu setzen,
  // bei Zahlen ohne Hochkomma (hier nur bei teamflag)
  // SQL-String zusammensetzen
  //$sql = "CREATE TABLE g02.feedback (f_name,f_mail,f_anrede,f_msg,f_geoweb,f_datum)";
  $sql = "INSERT INTO g02.feedback (f_name,f_mail,f_anrede,f_msg,f_geoweb,f_datum,the_geom)";
  $sql = $sql . " VALUES ('" . $name . "','" . $email . "','" . $anrede .
         "','" . $message . "'," . $teamflag . ",'" . date("d-m-Y") . "',ST_GeomFromText('POINT(" . $_POST['pos'] . ")'))";



  // SQL-String an Datenbank-Server schicken (Beispiel SQLite-Datenbank:
  $res=pg_query($db,$sql) or die ('Fehler bei Speichern: '.pg_last_error($db));

  include 'geoweb_pg_close.php'; // Datenbank schließen

echo "<p><strong>Danke für das Feedback!</strong><br /><br />
     Die Daten wurden (hier nicht) per Mail übermittelt
     und in einer Datenbank gespeichert!</p>";

/* Alternativ: Aufruf einer Html-Seite für Danksagung */
/* header( "Location: http://xxx.yyy/feedback_thank.htm" );exit; */

?>
