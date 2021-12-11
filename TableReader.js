export function BuildElements(csv_input_id, table_id, map_id) {
    const table_element = document.getElementById(table_id);
    let markers = {}

    function handleFile() {
        const file = this.files[0];
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results, file) {
                let table = new Tabulator(table_element, {
                    data: results.data,
                    selectable:1,
                    layout:"fitDataStretch",
                    height: 205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
                    pagination: "local",       //paginate the data
                    paginationSize: 5,       //allow 5 rows per page of data
                    columns: [ //Define Table Columns
                        {title: "Name", field: "name", width: 150, headerFilter:"input"},
                        {title: "Host ID", field: "host_id", width: 150},
                        {title: "ID", field: "id", width: 150},
                        {title: "Neighborhood", field: "neighbourhood", width: 150},
                        {title: "Room Type", field: "room_type", width: 150},
                        {title: "Price", field: "price", width: 150},
                    ],
                });
                const first_record = [results.data[0].latitude, results.data[0].longitude]
                let map = L.map(map_id).setView(first_record, 10);
                table.on("rowClick", function(e, row) {
                    map.setView([row.getData().latitude, row.getData().longitude], 15, {noMoveStart:true})
                })
                function _moveMapHandler(event) {
                    console.log("moveMapHandler")
                    var selectedData = table.getSelectedRows()
                    if (selectedData.length>0) {
                        table.deselectRow()
                    }
                }
                function _clickedMapHandler(event) {
                    console.log("clickedMapHandler")
                    const table_element = document.getElementById(table_id);

                }
                function _clickedMarkerHandler(event) {
                    console.log(event.latlng);
                    console.log(markers[(event.latlng.lat, event.latlng.lng)].record.get(''))
                    table.selectRow(48211);

                }
                map.on('click',_clickedMapHandler)
                map.on('mousedown',_moveMapHandler)
                L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 18,
                    id: 'mapbox/streets-v11',
                    tileSize: 512,
                    zoomOffset: -1,
                    accessToken: 'pk.eyJ1Ijoib2ZpcjUxMTk5NiIsImEiOiJja3d6YmNzeG4wdXgxMm91cnQ4Y3NicWFuIn0.ajaFrHOpgyqznPKfD3cpJw'
                }).addTo(map);


                for (const record of results.data) {
                    let marker = L.marker([record.latitude, record.longitude], {title:record.name, riseOnHover:true});
                    marker.addTo(map);
                    markers[(record.latitude, record.longitude)] = {marker:marker, record:record}
                    marker.on('click', _clickedMarkerHandler)

                }

            }
        });
    }
    document.getElementById(csv_input_id).addEventListener("change", handleFile, false);
}