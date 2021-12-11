export function BuildElements(csv_input_id, table_id, map_id, info_id, clear_id, download_id) {
    const input_element = document.getElementById(csv_input_id);
    const table_element = document.getElementById(table_id);
    const map_element = document.getElementById(map_id);
    const info_element = document.getElementById(info_id);
    const clear_element = document.getElementById(clear_id);
    const download_element = document.getElementById(download_id);
    let markers = {}

    function handleFile() {
        input_element.style.display = "none"
        table_element.style.display = "block"
        map_element.style.display = "block"
        info_element.style.display = "block"
        clear_element.style.display = "block"
        download_element.style.display = "block"
        const file = this.files[0];
        const paginationSize = 10
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results, file) {
                let table = new Tabulator(table_element, {
                    data: results.data,
                    index: "id",
                    selectable:1,
                    layout:"fitDataStretch",
                    height: 205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
                    pagination: "local",       //paginate the data
                    paginationSize: paginationSize,       //allow 5 rows per page of data
                    columns: [ //Define Table Columns
                        {title: "Name", field: "name", width: 150, headerFilter:"input"},
                        {title: "Host ID", field: "host_id", width: 150},
                        {title: "ID", field: "id", width: 150},
                        {title: "Neighborhood", field: "neighbourhood", width: 150},
                        {title: "Room Type", field: "room_type", width: 150},
                        {title: "Price", field: "price", width: 150},
                    ],
                });
                const first_record = [results.data[0].latitude, results.data[0].longitude];
                let map = L.map(map_id).setView(first_record, 10);

                function _ParsedRowSelected(row_data, noMoveStart) {
                    table.selectRow(parseInt(row_data['id']))
                    map.flyTo([row_data.latitude, row_data.longitude],15,{noMoveStart:true})
                    let latlng =L.latLng(row_data.latitude, row_data.longitude)
                    markers[latlng.toString()].marker.setIcon(sel_icon)
                    info_element.innerHTML = JSON.stringify(row_data, undefined, '\t');
                }

                function _rowSelected(row) {
                    _ParsedRowSelected(row.getData(), true)
                }


                table.on("rowSelected", _rowSelected)

                function _rowDeselected(row){
                    let latlng =L.latLng(row.getData().latitude, row.getData().longitude)
                    markers[latlng.toString()].marker.setIcon(not_sel_icon)
                    info_element.innerHTML = "";
                }
                table.on("rowDeselected", _rowDeselected)

                function _moveMapHandler(event) {
                    var selectedData = table.getSelectedRows()
                    if (selectedData.length>0) {
                        table.deselectRow()
                        _rowDeselected(selectedData[0])
                    }
                }
                function _clickedMapHandler(event) {
                    const table_element = document.getElementById(table_id);
                }
                function _clickedMarkerHandler(event) {
                    let id = markers[event.latlng.toString()].record["id"]
                    let row = table.getRow(id)
                    let selected = table.getSelectedRows()
                    let same_marker = selected.length>0 && row === selected[0]
                    _moveMapHandler(event)
                    if (same_marker) return;
                    table.setPage(parseInt(row.getPosition(true)/paginationSize+1))
                    table.selectRow(parseInt(id))
                    // _ParsedRowSelected(row.getData(), true)



                }
                map.on('click',_clickedMapHandler)
                map.on('movestart',_moveMapHandler)
                L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 18,
                    id: 'mapbox/streets-v11',
                    tileSize: 512,
                    zoomOffset: -1,
                    accessToken: 'pk.eyJ1Ijoib2ZpcjUxMTk5NiIsImEiOiJja3d6YmNzeG4wdXgxMm91cnQ4Y3NicWFuIn0.ajaFrHOpgyqznPKfD3cpJw'
                }).addTo(map);
                var sel_icon = L.icon({iconUrl: 'icons/marker_sel.png'})
                var not_sel_icon = L.icon({iconUrl: 'icons/marker_not_sel.png', iconSize: [32, 32]})
                for (const record of results.data) {
                    let marker = L.marker([record.latitude, record.longitude], {title:record.name, riseOnHover:true, icon:not_sel_icon});
                    marker.addTo(map);
                    markers[marker._latlng.toString()] = {marker:marker, record:record}
                    marker.on('click', _clickedMarkerHandler)
                }
            }
        });
    }
    function clearData(){
        input_element.value = ""
        input_element.style.display = "block"
        var table = Tabulator.findTable(table_element)[0];
        table.clearData()
        table_element.style.display = "none"
        map_element.style.display = "none"
        info_element.innerHTML = ""
        info_element.style.display = "none"
        clear_element.style.display = "none"
        download_element.style.display = "none"
    }

    function downloadData(){
        console.log("download")
    }
    document.getElementById(csv_input_id).addEventListener("change", handleFile, false);
    document.getElementById(clear_id).addEventListener("click", clearData, false);
    document.getElementById(download_id).addEventListener("click", downloadData, false);
}