/**
 * File containing all methods contacting a conode
 */

const ProtoBuf = dcodeIO.ProtoBuf;
// protoFile contains all the Protocol Buffer messages
const protoFile = ProtoBuf.loadProto(`
    message ServerIdentity{
        required bytes public = 1;
    	required bytes id = 2;
    	required string address = 3;
    	required string description = 4;
	}

    message Request {
    }
        
	message Response {
        map<string, Status> system = 1;
    	optional ServerIdentity server = 2;

		message Status {
            map<string, string> field = 1;
    	}
	}
        
    message Roster {
        optional bytes id = 1;
        repeated ServerIdentity list = 2;
        optional bytes aggregate = 3;
    }
        
    message SignatureRequest {
        required bytes message = 1;
        required Roster roster = 2;
    }
        
    message SignatureResponse {
        required bytes hash = 1; 
        required bytes signature = 2;
    }
`);

/**
 * Contacts a conode and retrieves Status response
 *
 * @param address    address of the conode to contact
 * @returns {*}      status information inside a Promise object
 */
function websocketStatus(address) {
    let socket = new WebSocket("ws://"+ address + "/Status/Request");
    socket.binaryType = "arraybuffer";

    if (socket.readyState != 0 && socket.readyState != 1) {
        console.log("The opening of the WebSocket doesn't go well. Ready State constant:"+ socket.readyState);
    }

    socket.onopen = function () {
        let requestProto = protoFile.build("Request");
        let request = new requestProto({});
        let requestHex = request.encode().toHex();
        let bytes = hexToBytes(requestHex);
        socket.send(bytes);
    };

    // function returning a Promise object containing the Status message from a conode (socket.onmessage)
    function loadReceivedMessage() {
        return new Promise(function (resolve, reject) {
            socket.onmessage = function(e) {
                let returnedMessage = protoFile.build("Response").decode(e.data);
                socket.close();

                resolve(returnedMessage);
            };

            socket.onerror = function (e) {
            	socket.close();
//                reject(e);
				resolve(null)
            };
        });
    }
    return loadReceivedMessage();
}

/**
 * Contacts a conode to ask for a collective signature of an hash file
 *
 * @param address     address of the conode to contact
 * @param file        file to sign as an ArrayBuffer
 * @returns {*}       Array containing signature of the file and the aggregate-key inside a Promise object
 */
function websocketSign(address, file) {
    let socket = new WebSocket("ws://"+ address + "/CoSi/SignatureRequest");
    let aggKey = new Uint8Array(32);
    socket.binaryType = "arraybuffer";

    if (socket.readyState != 0 && socket.readyState != 1) {
        console.log("The opening of the WebSocket doesn't go well. Ready State constant: "+ socket.readyState);
    }

    socket.onopen = function onOpen(e) {
        let signMsgProto = protoFile.build("SignatureRequest");
        let rosterProto = protoFile.build("Roster");
        let siProto = protoFile.build("ServerIdentity");

        try{
            nacl_factory.instantiate(function (nacl) {
                // Create a list of ServerIdentities for the roster
                let agg = [];
                let nodes = listNodes.filter(function(node){
                	return node != null && node.server != null;
                })
                console.log(nodes)
                // remove the alert if it is displayed
                if ($("#file_size_alert_window").length !== 0) {
                    $("#file_size_alert").empty();
                }

                let listServers = nodes.map(function(node, index) {
                    let server = node.server;
                    // public key of a server
                    let pub = new Uint8Array(server.public.toArrayBuffer());
                    // multiply the x-axis of point with -1, because TweetNaCl.js doesn’t have unpack, only unpackneg
                    pub[31] ^= 128;
                    // the point is represented as a 2-dimensional array
                    let pubPos = [gf(), gf(), gf(), gf()]; // zero-point
                    unpackneg(pubPos, pub);
                    if (index === 0) {
                        agg = pubPos;
                    } else {
                        // add pubPos to agg, storing result in agg
                        add(agg, pubPos);
                    }
                    return new siProto({public: server.public, id: server.id, address: server.address,
                        description: server.description});
                });
                pack(aggKey, agg);

                let rosterMsg = new rosterProto({list: listServers});
                // Calculate the hash and create the SignatureRequest
                let hash = nacl.crypto_hash_sha256(bytesToHex(file));
                let signMsg = new signMsgProto({roster: rosterMsg, message: hash});
                socket.send(signMsg.toArrayBuffer());
            });
        } catch(err) {
            // alert appears if the file is too big (for the TweetNaCl.js library heap)
            console.log(err)
            if ($("#file_size_alert_window").length === 0) {
                $("#file_size_alert").append("<div class='alert alert-danger alert-dismissible fade in'" +
                    "id='file_size_alert_window'>"
                    + "<a href='#' class='close' data-dismiss='alert' aria-label='close'>" + "&times;"
                    + "</a><strong>" + "Warning! " + "</strong>" + "The file submitted is too big!"
                    + "</div>");
            }
        }
    };

    // function returning a Promise object containing an array composed of the response of the conode
    // and the aggregate key (socket.onmessage)
    function loadReceivedMessage() {
        return new Promise(function (resolve, reject) {
            socket.onmessage = function(e) {
                let returnedMessage = [protoFile.build("SignatureResponse").decode(e.data), aggKey];

                resolve(returnedMessage);
            };

            socket.onerror = function (e) {
                reject(e);
            };
        });
    }
    return loadReceivedMessage();
}

/**
 * Function to control the generator function's iterator
 *
 * @param g    generator function
 */
function runGenerator(g) {
    let iterator = g();
    (function iterate(message) {
        let ret = iterator.next(message);

        if (!ret.done) {
            ret.value.then(iterate);
        }
    })();
}