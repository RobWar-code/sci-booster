<?php
header('Content-Type: application/json');

error_log("Got to upload", 0);

echo json_encode(['result'=>true]);

exit;
