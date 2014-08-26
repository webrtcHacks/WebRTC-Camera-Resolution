/**
 * Main js file for WebRTC-Camera-Resolution finder
 * Created by chad on 7/19/2014.
 */

//Global variables
var camVideo = $('#camera')[0],     //where we will put & test our video output
    deviceList = $('#devices')[0],  //device list dropdown
    devices,                        //getSources object to hold various camera options
    selectedCamera = [],            //used to hold a camera's ID and other parameters
    tests,                          //holder for our test results
    r = 0,                          //used for iterating through the array
    camNum = 0,                     //used for iterating through number of camera
    scanning = false;               //variable to show if we are in the middle of a scan

/*
Get and list camera devices using MediaStreamTrack.getSources
Inspiration 1: https://code.google.com/p/webrtc/source/browse/stable/samples/js/demos/html/device-switch.html
Inspiration 2: https://raw.githubusercontent.com/muaz-khan/WebRTC-Experiment/master/demos/MediaStreamTrack.getSources.html
*/
function listVideoDevices(){

    var videoDevices = [];
    if(!MediaStreamTrack.getSources) //note for the future: getSources changing to getMediaDevices
    {
        console.log("No media stream track enumeration");
        return;
    }

    MediaStreamTrack.getSources(function (deviceOptions){
        if (deviceOptions){
            $('#selectArea').show();
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

                    //label should already exists if previous approval on HTTPS site
                    if (deviceOptions[x].label) {
                        listOption.text = deviceOptions[x].label;
                    }
                    else {
                        //Add a label if none exists (happens before first user capture approval)
                        camOption.label = listOption.text = "Camera " + camNum;
                        camNum++;
                    }
                    deviceList.add(listOption);                 //update the pull down list
                    videoDevices.push(camOption);               //only add video devices
                    console.log("Camera found: " + JSON.stringify(deviceOptions[x]));

                    //selectedCamera = devices[0];    //set the default camera in case there is no user selection
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

    console.log("adapter.js says this is " + webrtcDetectedBrowser + " " + webrtcDetectedVersion);

    if (!getUserMedia){
        alert('You need a browser that supports WebRTC');
        $("div").hide();
        return;
    }

    //check if the user is using http vs. https & redirect to https if needed
    if (document.location.protocol != "https:"){
        alert("This doesn't work well on http. Redirecting to https");
        document.location.href = "https:" + document.location.href.substring(document.location.protocol.length);
    }

    devices = listVideoDevices();

    //Show text of what res's are used on QuickScan
    var quickText = "Sizes:";
    for(var l in quickScan){
        quickText +=  " " + quickScan[l].label
    }
    $('#quickLabel').text(quickText);

});

//Start scan by controlling the quick and full scan buttons
$('button').click(function(){

    //setup for a quick scan using the hand-built quickScan object
    if (this.innerHTML == "Quick Scan"){
        console.log("Quick scan");
        tests = quickScan;
    }
    //setup for a full scan and build scan object based on inputs
    else if (this.innerHTML == "Full Scan"){
        var highRes = $('#hiRes').val();
        var lowRes = $('#loRes').val();
        console.log("Full scan from " + lowRes + " to " + highRes);
        tests = createAllResolutions(parseInt(lowRes), parseInt(highRes) );
    }
    else { return }

    scanning = true;
    $('button').prop("disabled",true);
    $('table').show();

    //if there is device enumeration
    if (devices){
        //run through the deviceList to see what is selected
         for (var deviceCount=0, d=0; d<deviceList.length; d++){
            if(deviceList[d].selected){
                //if it is selected, check the label against the getSources array to select the proper ID
                for(z=0; z<devices.length; z++) {
                    if (devices[z].label == deviceList[d].value) {
                        selectedCamera[deviceCount] = devices[z];
                        console.log(selectedCamera[deviceCount].label + "[" + selectedCamera[deviceCount].id  + "] selected");
                        deviceCount++;
                    }
                }
            }
        }

        //Make sure there is at least 1 camera selected before starting
        if (selectedCamera[0]) {
            gum(tests[r], selectedCamera[camNum].id);
        }
        else{
            alert("You must select a camera first");
        }
    }
    //if no device enumeration don't pass a Camera ID
    else{
        selectedCamera[0] = {label: "Unknown"};
        gum(tests[r]);
    }

});

//calls getUserMedia for a given camera and constraints
function gum(candidate, camId) {

    console.log("trying " + candidate.label);

    //Kill any running streams;
    if (!!window.stream){
        camVideo.src = null;
        window.stream.stop();
    }

    //create constraints object
    var constraints = {
            audio: false,
            video: {
                mandatory: {
                    sourceId: camId,
                    minWidth: candidate.width,
                    minHeight: candidate.height,
                    maxWidth: candidate.width,
                    maxHeight: candidate.height

                }
            }
        };

    getUserMedia(constraints, onStream, onFail);  //getUserMedia call

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


//Attach to play event
$('#camera').on("play", function(){

    //delay timer needed for jQuery binding
    var waitForDimensions = window.setInterval(function () {
        //see if the video dimensions are available
        if (camVideo.videoWidth * camVideo.videoHeight > 0) {
            clearInterval(waitForDimensions);
            if(tests[r].width + "x" + tests[r].height != camVideo.videoWidth + "x" + camVideo.videoHeight){
                captureResults("fail: mismatch");
                }
            else{
                captureResults("pass");
            }
        }
        //If not, wait another 50ms
    }, 100);
});

//Save results to the candidate so
function captureResults(status){
    console.log("Stream dimensions for " + tests[r].label + ": " + camVideo.videoWidth + "x" + camVideo.videoHeight);

    tests[r].status = status;
    tests[r].streamWidth =  camVideo.videoWidth;
    tests[r].streamHeight =  camVideo.videoHeight;

    var row = $('table#results')[0].insertRow(-1);
    var browserVer = row.insertCell(0);
    var deviceName = row.insertCell(1);
    var label = row.insertCell(2);
    var ratio = row.insertCell(3);
    var ask = row.insertCell(4);
    var actual = row.insertCell(5);
    var statusCell = row.insertCell(6);
    var deviceIndex = row.insertCell(7);
    var resIndex = row.insertCell(8);

    //don't show these
    deviceIndex.style.visibility="hidden";
    resIndex.style.visibility="hidden";

    browserVer.innerHTML = webrtcDetectedBrowser + " " + webrtcDetectedVersion;
    deviceName.innerHTML = selectedCamera[camNum].label;
    label.innerHTML = tests[r].label;
    ratio.innerHTML = tests[r].ratio;
    ask.innerHTML = tests[r].width + "x" + tests[r].height;
    actual.innerHTML = tests[r].streamWidth+ "x" + tests[r].streamHeight;
    statusCell.innerHTML = tests[r].status;
    deviceIndex.innerHTML = camNum;     //used for debugging
    resIndex.innerHTML = r;             //used for debugging

    r++;
    //go to the next tests
    if (r < tests.length){
        gum(tests[r], selectedCamera[camNum].id);
    }
    else if (camNum < selectedCamera.length -1){     //move on to the next camera
        camNum++;
        r=0;
        gum(tests[r], selectedCamera[camNum].id)
    }
    else{ //finish up
       $('#camera').off("play"); //turn off the event handler
       $('button').off("click"); //turn the generic button handler this off

        scanning = false;
        //dump JSON results to a new window when this button is pressed
        $('#jsonOut').show().prop("disabled", false).click(function(){
            var url = 'data:text/json;charset=utf8,' + encodeURIComponent(JSON.stringify(tests));
            window.open(url, '_blank');
            window.focus();
        });

        $('#csvOut').show().prop("disabled", false).click(function(){
            exportTableToCSV.apply(this, [$('#results'), 'gumResTestExport.csv']);
            });

        //allow to click on a row to test (only works with device Enumeration
        if (devices){
            clickRows();
        }
    }
}

//allow clicking on a row to see the camera capture
function clickRows(){
    $('tr').click(function(){
        r = $(this).find("td").eq(8).html();

        //lookup the device id based on the row label
        for(z=0; z<devices.length; z++) {
            if(devices[z].label== $(this).find("td").eq(1).html()){
                var thisCamId = devices[z].id;
            }
        }

        console.log("table click! clicked on " + tests[r].label );
        gum(tests[r], thisCamId);
    })
}


//Variables to use in the quick scan
const quickScan = [
    {
        "label": "4K",
        "width" : 3840,
        "height": 2160,
        "ratio": "16:9"
    },
    {
        "label": "1080p",
        "width": 1920,
        "height": 1080,
        "ratio": "16:9"
    },
    {
        "label": "UXGA",
        "width": 1600,
        "height": 1200,
        "ratio": "4:3"
    },
    {
        "label": "720p",
        "width": 1280,
        "height": 720,
        "ratio": "16:9"
    },
    {
        "label": "SVGA",
        "width": 800,
        "height": 600,
        "ratio": "4:3"
    },
    {
        "label": "VGA",
        "width": 640,
        "height": 480,
        "ratio": "4:3"
    },
    {
        "label": "360p",
        "width": 640,
        "height": 360,
        "ratio": "16:9"
    },
    {
        "label": "CIF",
        "width": 352,
        "height": 288,
        "ratio": "4:3"
    },
    {
        "label": "QVGA",
        "width": 320,
        "height": 240,
        "ratio": "4:3"
    },
    {
        "label": "QCIF",
        "width": 176,
        "height": 144,
        "ratio": "4:3"
    },
    {
        "label": "QQVGA",
        "width": 160,
        "height": 120,
        "ratio": "4:3"
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
            "ratio": "16:9"
        };
        resolutions.push(res);
        //SD
        res = {
            "height": y,
            "width" : (y * ratioSD).toFixed(),
            "label": (y * ratioSD).toFixed() + "x" + y,
            "ratio": "4:3"
        };
        resolutions.push(res);
    }
    console.log("resolutions length: " + resolutions.length);
    return resolutions;
}
/*
Export results table to a CSV file in new window for download
source: http://jsfiddle.net/terryyounghk/KPEGU/
*/
function exportTableToCSV($table) {

    console.log("export table");
    var $rows = $table.find('tr:has(td),tr:has(th)'),

    // Temporary delimiter characters unlikely to be typed by keyboard
    // This is to avoid accidentally splitting the actual contents
        tmpColDelim = String.fromCharCode(11), // vertical tab character
        tmpRowDelim = String.fromCharCode(0), // null character

    // actual delimiter characters for CSV format
        colDelim = '","',
        rowDelim = '"\r\n"',

    // Grab text from table into CSV formatted string
        csv = '"' + $rows.map(function (i, row) {
            var $row = $(row),
                $cols = $row.find('td,th');

            return $cols.map(function (j, col) {
                var $col = $(col),
                    text = $col.text();

                return text.replace('"', '""'); // escape double quotes

            }).get().join(tmpColDelim);

        }).get().join(tmpRowDelim)
            .split(tmpRowDelim).join(rowDelim)
            .split(tmpColDelim).join(colDelim) + '"',

    // Data URI
        csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

    window.open(csvData, '_blank');
    //window.focus();

}

