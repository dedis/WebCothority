/**
 * fonction de mise à jour des données de la page
 */
function update(listNodes) {
    var numberBandwidth = 0;
    $("#numberNodes").html(listNodes.length);
    for (var i = 0; i < listNodes.length; i++) {
        numberBandwidth += (parseInt(listNodes[i].rx_bytes) + parseInt(listNodes[i].tx_bytes));
    }
    $("#numberBandwidth").html(numberBandwidth);
    updateTable(listNodes);
}

/**
 * fonction de mise à jour du tableau
 */
function updateTable(listNodes) {
    //updateTable
    $("#status td").each(function() {
        this.remove();
    });
    var table = $("#status");
    $.each(listNodes, function(i, node) {
        table.append("<tr><td>"+ node.description +"</td>" +
            "<td>"+ node.connType +"</td>" +
            "<td>"+ node.port +"</td><" +
            "td>"+ node.uptime +"</td>" +
            "<td>"+ (parseInt(node.rx_bytes) + parseInt(node.tx_bytes)) +"</td>" +
            "<td>" + helperNumberOfServices(node) + "</td>" +
            "<td>"+ node.version +"</td></tr>");
    });

}

function helperNumberOfServices(node) {
    var numberOfServices = String(node.available_services).split(',').length;
    return numberOfServices;
}