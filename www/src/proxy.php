<?php

$tile_url = $_GET['url'];
$ext = pathinfo($tile_url, PATHINFO_EXTENSION);

header('Content-Type: image/'.$ext);
header('Cache-Control: max-age=1000000, must-revalidate');
header('Pragma: public');
readfile($tile_url);
?>