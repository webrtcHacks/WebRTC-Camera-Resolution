/**
 * Created by chad on 7/19/2014.
 */

//Normalize for implementation differences
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia | navigator.msGetUserMedia;

//Global variables
var camVideo = $('#camera')[0], //where we will put & test our video output
    selectedCamera,
    tests,                    //holder for our test results
    currentTest,                //the current resolution being tested
    camId,                      //the camera we want to test
    r = 0,                      //used for iterating through the array
    d = 0,
    scanning = false;           //variable to show if we are in the middle of a scan



/*
Get and list camera devices using MediaStreamTrack.getSources
Inspiration 1: https://code.google.com/p/webrtc/source/browse/stable/samples/js/demos/html/device-switch.html
Inspiration 2: https://raw.githubusercontent.com/muaz-khan/WebRTC-Experiment/master/demos/MediaStreamTrack.getSources.html
*/
//remove deviceList if I am not going to have a dropdown
function listVideoDevices(deviceList ){

    var videoDevices = [];
    if(!MediaStreamTrack){
        console.log("No media stream track enumeration");
        return;
    }

    MediaStreamTrack.getSources(function (deviceOptions){
        if (deviceOptions){
            deviceList.hidden = false;
            var camNum = 1; //count the number of cameras for id if device label is unavailable
            for (var x=0; x<deviceOptions.length; x++){
                if (deviceOptions[x].kind == 'video') {

                    //define our own Options so we can modify it if needed
                    //needed for http & when label attribute is empty & we have to assign one
                    var camOption = {
                        label: deviceOptions[x].label,
                        id: deviceOptions[x].id
                    };

                    var listOption = document.createElement("option");

                    if (deviceOptions[x].label) {
                        listOption.text = deviceOptions[x].label;
                    }
                    else {
                        //Add a label if none exists (happens before first user capture approval)
                        camOption.label = listOption.text = "Camera " + camNum;
                        camNum++;
                    }
                    deviceList.add(listOption);                 //update the pull down list
                    videoDevices.push(camOption);          //only add video devices
                    console.log("Camera found: " + JSON.stringify(deviceOptions[x]));
                }
            }
        }
        else {
            console.log("No device sources found");
        }
    });

    return videoDevices;
}

//find & list camera devices on load
$(document).ready(function(){
    devices = listVideoDevices( $('#devices')[0] );

    //Show text of what res's are used on QuickScan
    var quickText = "Sizes:";
    var l; //index var
    for(l in quickScan){
        quickText +=  " " + quickScan[l].label
    }
    $('#quickLabel').text(quickText);

    //check if the user is using http vs. https
    //consider forcing redirect from client
    if (document.location.protocol=="http:"){
        alert("This will not work well with http. Rerun with https");
    }

});

$('#devices').click(function(){
    //assign the camera based on what is selected in the dropdown select
    for(z=0; z<devices.length; z++) {
        if (devices[z].label == $('#devices')[0].value) {
            selectedCamera = devices[z];
            console.log(selectedCamera.label + "[" + selectedCamera.id  + "] selected");
        }
    }
});

$('button').click(function(){

    //console.log("current device is " + devices.label + " id:" + devices[d].id);

    if (this.innerHTML == "Quick Scan"){
        console.log("Quick scan");
        tests = quickScan;
    }
    else{
        var highRes = $('#hiRes').val();
        var lowRes = $('#loRes').val();
        console.log("Full scan from " + lowRes + " to " + highRes);
        tests = createAllResolutions(lowRes, highRes );
    }

    scanning = true;
    $('button').prop("disabled",true);
    $('table').show();
    gum(tests[r], selectedCamera.id);

});

//calls getUserMedia for a given camera and constraints
function gum(candidate, camId) {
    //Kill the stream if it is already running

    if (!navigator.getUserMedia) {
        console.log("No getUserMedia support");
        return;
    }

        console.log("trying " + candidate.label);

        //Kill any running streams;
        if (!!window.stream){
            camVideo.src = null;
            window.stream.stop();
        }

        //create constraints
        var constraints = {
            audio: false,
            video: {
                optional: [
                    { sourceId: camId }
                ],    //set the proper device
                mandatory: {
                    //sourceId: camId,
                    minWidth: candidate.width,
                    minHeight: candidate.height,
                    maxWidth: candidate.width,
                    maxHeight: candidate.height

                }
            }
        };

        navigator.getUserMedia(constraints, onStream, onFail);

        function onStream(stream) {

            //change the video dimensions
            console.log("Display size for " + candidate.label + ": " + candidate.width + "x" + candidate.height);
            camVideo.width = candidate.width;
            camVideo.height = candidate.height;

            window.stream = stream; // stream available to console
            camVideo.src = window.URL.createObjectURL(stream);
            camVideo.play();

        }

        function onFail(error) {
            console.log('Video error!', error);

            if (scanning) {
                //console.log("Stream dimensions for " + candidates[r].label + ": " + camVideo.videoWidth + "x" + camVideo.videoHeight);
                captureResults("fail: " + error.name);
            }
    }
}

//TO DO: set to iterate only after play
//Add event listener
//Might need to change scan function

//Attach to play event
//camVideo.addEventListener("playing", function(){captureResults("pass") });
$('#camera').on("play", function(){

    var timer = 10;

    //delay timer needed for jQuery binding
    var waitForDimensions = window.setInterval(function () {
        //see if the video dimensions are available
        if (camVideo.videoWidth * camVideo.videoHeight > 0) {
            clearInterval(waitForDimensions);
            captureResults("pass");
        }
        //If not, wait another 10ms
        else {
            //console.log("No video dimensions after " + timer + " ms");
            timer += 10;
        }
    }, 10);
});

//resultsTable = $('table#results')[0];

//Save results to the candidate so
function captureResults(status){
    console.log("Stream dimensions for " + tests[r].label + ": " + camVideo.videoWidth + "x" + camVideo.videoHeight);

    tests[r].status = status;
    tests[r].streamWidth =  camVideo.videoWidth;
    tests[r].streamHeight =  camVideo.videoHeight;

    var row = $('table#results')[0].insertRow(-1);
    var deviceName = row.insertCell(0);
    var label = row.insertCell(1);
    var ask = row.insertCell(2);
    var actual = row.insertCell(3);
    var statusCell = row.insertCell(4);
    var deviceIndex = row.insertCell(5);
    var resIndex = row.insertCell(6);

    //don't show these
    deviceIndex.style.visibility="hidden";
    resIndex.style.visibility="hidden";

    deviceName.innerHTML = devices[d].label;
    label.innerHTML = tests[r].label;
    ask.innerHTML = tests[r].width + "x" + tests[r].height;
    actual.innerHTML = tests[r].streamWidth+ "x" + tests[r].streamHeight;
    statusCell.innerHTML = tests[r].status;
    deviceIndex.innerHTML = d;
    resIndex.innerHTML = r;

    r++;
    if (r < tests.length){
        gum(tests[r], selectedCamera.id);
    }
    else{
    /*    //Move on to the next camera
        d++;
        if (d<devices.length){
            r=0;
            gum(candidates[r], devices[d]);
        }
        else{}*/
           $('#camera').off("play"); //turn off the event handler
           $('button').off("click"); //turn the generic button handler this off

            scanning = false;
            $('#jsonOut').show().prop("disabled", false).click(function(){
                var url = 'data:text/json;charset=utf8,' + encodeURIComponent(JSON.stringify(tests));
                window.open(url, '_blank');
                window.focus();
            });
            clickRows();

    }
}

//allow clicking on a row to see the camera capture
function clickRows(){
    $('tr').click(function(){
        //d = $(this).find("td").eq(5).html();
        r = $(this).find("td").eq(6).html();
        console.log("table click! clicked on " + tests[r].label );
        gum(tests[r], selectedCamera.id);
    })
}


//Variables to use in the quick scan
const quickScan = [
    {
        "label": "4K",
        "width" : 3840,
        "height": 2160,
        "ratio": "HD"
    },
    {
        "label": "1080p",
        "width": 1920,
        "height": 1080,
        "ratio": "HD"
    },
    {
        "label": "720p",
        "width": 1280,
        "height": 720,
        "ratio": "HD"
    },
    {
        "label": "SVGA",
        "width": 800,
        "height": 600,
        "ratio": "SD"
    },
    {
        "label": "VGA",
        "width": 640,
        "height": 480,
        "ratio": "SD"
    },
    {
        "label": "CIF",
        "width": 352,
        "height": 288,
        "ratio": "SD"
    },
    {
        "label": "QVGA",
        "width": 320,
        "height": 240,
        "ratio": "SD"
    }

];

//creates an object with all HD & SD video ratios between two heights
function createAllResolutions(minHeight, maxHeight){
    const ratioHD = 16/9;
    const ratioSD = 4/3;

    var resolutions = [],
        res;

    for (var y=maxHeight; y>=minHeight; y--){
        //HD
        res = {
            "height": y,
            "width": (y * ratioHD).toFixed(),
            "label": (y * ratioHD).toFixed() + "x" + y,
            "ratio": "HD"
        };
        resolutions.push(res);
        //SD
        res = {
            "height": y,
            "width" : (y * ratioSD).toFixed(),
            "label": (y * ratioSD).toFixed() + "x" + y,
            "ratio": "SD"
        };
        resolutions.push(res);
    }
    console.log("resolutions length: " + resolutions.length);
    return resolutions;
}