WebRTC-Camera-Resolution
========================

Finds WebRTC Camera resolutions.

Simple demo to show how one can automatically identify camera resolutions for use with WebRTC.
Quick scan checks only common video resolutions.
Full scan checks all 4:3 and 16:9 resolutions between a range.

### Updated August 2014

What's new:
* Using jQuery
* Redirect to https
* Device enumeration and selection if your browser supports it
* Optional predefined set of common resolutions for a "quick" scan
* More complete scanning of every 16:9 and 4:3 resolution within a user-defined range
* Used the official adapter.js from here to normalize browser differences & help with identification
* Clicking on a row after the test is done reloads that resolution
* Dump results to JSON or CSV
 
Try it at https://webrtchacks.github.io/WebRTC-Camera-Resolution/

Read more at http://webrtchacks.com/update-camera-constraints
 
Brought to you by [webrtcHacks.com](http://webrtchacks.com)
