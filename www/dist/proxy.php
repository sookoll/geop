<?php

$tile_url = $_GET['url'];
if ($path = parse_url($tile_url, PHP_URL_PATH)) {
   $ext = pathinfo($path, PATHINFO_EXTENSION);
}

header('Content-Type: image/'.$ext);
header('Cache-Control: max-age=1000000, must-revalidate');
header('Pragma: public');
readfile($tile_url);
?>