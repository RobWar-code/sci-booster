<?php
function isLocalhost() {
    // Get the server address
    $serverAddr = $_SERVER['SERVER_ADDR'];

    // Check if the server address is one of the common localhost addresses
    $localhostAddresses = ['127.0.0.1', '::1'];
    
    return in_array($serverAddr, $localhostAddresses);
}
