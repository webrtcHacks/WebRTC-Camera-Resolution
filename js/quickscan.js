            //gUM: http://www.html5rocks.com/en/tutorials/getusermedia/intro/

            //Normalize for implementation differences
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia | navigator.msGetUserMedia;

            var camVideo = document.querySelector("video#camera"),
                         displaySize = document.querySelector("p#displaySize"),
                         streamSize = document.querySelector("p#streamSize"),
                         buttons = document.querySelector("button#startButton"),
                         results = document.querySelector("table#results");
            var stream, i = 0;

            //Based on values identified here: https://code.google.com/p/chromium/issues/detail?id=143631#c9
            var widths = [1280, 960, 640, 640, 320, 320],
            heights = [720, 720, 480, 360, 240, 180];


            function start() {
                console.log("started");
                camVideo.style.visibility = 'visible';
                results.style.visibility = 'visible';
                buttons.disabled = true;
                gum(i);
            }

            //Stop any streams, set constraints, call getUserMedia
            function gum(x) {
                console.log("gum " + x);
                if (x >= widths.length) {
                    buttons.disabled = false;
                    camVideo.removeEventListener("playing");
                    //video.style.visibility = "hidden";
                    i = 0;
                    return false;
                }
                else {
                    //Kill the stream if it is already running
                    if (!!stream) {
                        camVideo.src = null;
                        stream.stop();
                    }

                    //set getUserMedia contraints, no need for audio
                    var constraints = {
                        audio: false,
                        video: {
                            mandatory: {
                                minWidth: widths[x],
                                minHeight: heights[x],
                                maxWidth: widths[x],
                                maxHeight: heights[x]
                            }
                        }
                    }

                    //Call gUM
                    if (navigator.getUserMedia) {
                        navigator.getUserMedia(constraints, onSuccess, onFail);
                    } else {
                        onFail('No getUserMedia support')
                    }
                }
            }

            //Play if success
            function onSuccess(stream) {

                //change the video dimensions
                console.log("Video size " + i + ": " + widths[i] + "x" + heights[i]);
                camVideo.width = widths[i];
                camVideo.height = heights[i];

                window.stream = stream; // stream available to console
                camVideo.src = window.URL.createObjectURL(stream);
                camVideo.play();
                //console.log("playing " + i);
            }

            function onFail(error) {
                //alert('You need to enable video on a browser that supports getUserMedia! ' + error);
                console.log('Video error!', error);
                displayDimensions(true);
                //gum(i++);
            }

            //Attach to play event and then update dimensions after 500ms
            camVideo.addEventListener("playing", function () {
                    displayDimensions(false);
            });


            //Show both the displayed dimensions and the original unscaled stream source dimensions
            function displayDimensions(ifFail) {


                var row = results.insertRow(-1);
                var ask = row.insertCell(0);
                var actual = row.insertCell(1);
                var compare = row.insertCell(2);

                ask.innerHTML = widths[i] + "x" + heights[i];
                compare.innerHTML = widths[i] + "x" + heights[i] == camVideo.videoWidth + "x" + camVideo.videoHeight;
                
                //If the constraints fail for some reason report that
                if (ifFail) {
                    actual.innerHTML("Fail");     
                }
                //Otherwise put the dimensions
                else {
                    actual.innerHTML = camVideo.videoWidth + "x" + camVideo.videoHeight;
                }
                console.log("Display dimensions " + i + ": " + widths[i] + "x" + heights[i]);
                console.log("Stream dimensions " + i + ": " + camVideo.videoWidth + "x" + camVideo.videoHeight);

                //run gum to move to the next size
                i++;
                gum(i);
            }
