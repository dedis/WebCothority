
/**
 * Updating an address every 3 seconds
 * addr is "ip:port"
 * index is an index in the global listNodes
 */
function startUpdateAddress(addr, index){
    runGenerator(function* generator() {
       	var message = yield websocketStatus(addr);
       	if ( message == null ){
       		console.log("Couldn't contact " + addr)
       		message = {
       			"description": "Failed",
       			"host": addr
       		}
       	} else {
			message = nodeCreation(message);
       	}
//       	console.log("" + index + ": message is" + message);
  		listNodes[index] = message;
//  		console.log("Updated " + addr)
        update();
    });
    window.setTimeout(function(){startUpdateAddress(addr, index)},
    	3000 + index * 500)
}

/**
 * Update the Status part of the website
 */
function update() {
    var numberTraffic = 0;

	var nbrNodes = 0;
	var totalTraffic = 0;
	var nodes = [];
    for (let i = 0; i < listNodes.length; i++) {
    	var node = window.listNodes[i]
    	if (node && node.rx_bytes != null){
        	totalTraffic += (parseInt(node.rx_bytes) + parseInt(node.tx_bytes));
        }
       	nodes.push(node);
    }
    $("#numberNodes").html(nodes.length);
    $("#numberTraffic").html(totalTraffic);
    updateTable(nodes);
}

/**
 * Update the Status Table
 */
function updateTable(nodes) {
    // "clean" the table
    $("#status td").each(function() {
        this.remove();
    });

    const table = $("#status");

    nodes.forEach(function(node, i) {
    	if (node.server){
        	table.append("<tr><td>"+ node.description +"</td>" +
            	"<td>"+ node.host +"</td>" +
            	"<td>"+ node.connType +"</td>" +
            	"<td>"+ node.port +"</td>" +
            	"<td>"+ displayPrettyDate(node.uptime) +"</td>" +
            	"<td>"+ (parseInt(node.rx_bytes) + parseInt(node.tx_bytes)) +"</td>" +
            	"<td>" + helperNumberOfServices(node) + "</td>" +
            	"<td>"+ node.version +"</td></tr>");
        } else {
			table.append("<tr style='color: red'>" +
				"<td>"+ node.description +"</td>" +
				"<td>"+ node.host +"</td>" +
				"<td></td><td></td><td></td><td></td><td></td><td></td>"
			);
        }
    });
}

/**
 * helper function
 *
 * @param node        node object
 * @returns {Number}  number of available services of the node
 */
function helperNumberOfServices(node) {
    return String(node.available_services).split(',').length;
}

/**
 * Create a node from the information received from a conode
 *
 * @param message    status information received from a conode
 * @returns {node}   an object node
 */
function nodeCreation(message) {
    // Constructor of object node: must put it inside runGenerator(g) because of overshadowing
    var status = message.system.map.Status.value.field.map;
//    console.log(status);
    return {
        "available_services": status.Available_Services.value,
        "connType": status.ConnType.value,
        "description": status.Description.value,
        "host": status.Host.value,
        "port": status.Port.value,
        "rx_bytes": status.RX_bytes.value, // received
        "system": status.System.value,
        "tx_bytes": status.TX_bytes.value, // sent
        "uptime": status.Uptime.value,
        "version": status.Version.value,
        "server": message.server,
    };
}