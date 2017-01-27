/**
 * MAIN
 */

// list of contacted conodes addresses
const listAddresses = [
["78.46.227.60:7771", "Ineiti's server"],
["192.33.210.8:7771", "EPFL/DEDIS Conode"],
["185.26.156.40:61117", "Ismail's Conode"],
["5.135.161.91:2001",  "Nikkolasg's server Cothority"],
["83.212.82.23:6790", "Lefteris"],
["46.101.254.191:6880",  "Kirills"],
["95.143.172.241:62307", "Daeinar's Conode"] ];

$(document).ready(function () {

    /**
     * Status part
     */
    window.listNodes = []
    listAddresses.forEach(function(addr, index){
    	startUpdateAddress(addr, index);
    	window.listNodes[index] = {"description": addr[1], "host": addr[0],
    	"uptime": "Contacting"};
    })
    update();
    window.setTimeout(update, 1000);
    window.setInterval(update, 10000);

    /**
     * Signature part
     */
    $("#signature_fileInput").change(function() {
        let file = this;
        runGenerator(function* waitingFile() {
            let fileAsArrayBuffer = yield takeCareOf(file.files[0], true);
            console.log("Asking to sign " + listAddresses[0]);
            let message = yield websocketSign(listAddresses[0], fileAsArrayBuffer);

            saveToFile(fileAsArrayBuffer, getFilename(file.value), message);
        });

    });

    /**
     * Verification part
     */
    $("#verify_file_fileInput").change(function() {
        let file = this;

        runGenerator(function* waitingFile() {
            let fileAsArrayBuffer = yield takeCareOf(file.files[0], true);

            $("#verify_signature_fileInput").change(function() {
                let file = this;

                runGenerator(function* waitingFile() {
                    let signatureAsString = yield takeCareOf(file.files[0], false);
                    let filename = getFileExtension(file.files[0].name);

                    // Verify that the second file has .json extension, if not display a warning
                    if (warningNotJSON(filename) === true) {
                        // abort the function
                        return;
                    }

                    verifySignature(fileAsArrayBuffer,signatureAsString);
                });
            });
        });
    });

    $("#verify_signature_fileInput").change(function() {
        let file = this;

        runGenerator(function* waitingFile() {
            let signatureAsString = yield takeCareOf(file.files[0], false);
            let filename = getFileExtension(file.files[0].name);

            $("#verify_file_fileInput").change(function() {
                let file = this;

                runGenerator(function* waitingFile() {
                    let fileAsArrayBuffer = yield takeCareOf(file.files[0], true);

                    // Verify that the second file has .json extension, if not display a warning
                    if (warningNotJSON(filename) === true) {
                        // abort the function
                        return;
                    }

                    verifySignature(fileAsArrayBuffer, signatureAsString);
                });
            });
        });
    });
});

/**
 * Check that the submitted file is a .json, if not display a warning
 *
 * @param filename     filename of the submitted file
 * @returns {boolean}  true if the warning was displayed, otherwise false
 */
function warningNotJSON(filename) {
    let abort = false;

    if (filename != "json") {
        abort = true;

        if ($("#verification_alert_window").length === 0) {
            // warning alert appears:
            $("#verification_alert").append("<div class='alert alert-warning alert-dismissible fade in'" +
                "id='verification_alert_window'>"
                +"<a href='#' class='close' data-dismiss='alert' aria-label='close'>"+ "&times;"
                +"</a><strong>"+ "Warning! " +"</strong>"+ "The signature file uploaded needs to be a .json."
                +"</div>");
        }
    } else if ($("#verification_alert").length !== 0) {
        $("#verification_alert").empty();
    }
    return abort;
}
