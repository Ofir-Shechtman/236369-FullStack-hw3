export function BuildElements(dropzone_id, input_id, table_id, map_id, info_id, clear_id, download_id) {
    const dropzone_element = document.getElementById(dropzone_id);
    const input_element = document.getElementById(input_id);
    const table_element = document.getElementById(table_id);
    const map_element = document.getElementById(map_id);
    const info_element = document.getElementById(info_id);
    const clear_element = document.getElementById(clear_id);
    const download_element = document.getElementById(download_id);
    let objectURL;
    const paginationSize = 10
    let table = new Tabulator(table_element, {
        index: "id",
        selectable:1,
        downloadRowRange: "all",
        layout:"fitDataStretch",
        height: 300,
        pagination: "local",
        paginationSize: paginationSize,
        columns: [
            {title: "Name", field: "name", width: 150, headerFilter:"input"},
            {title: "Host ID", field: "host_id", width: 150},
            {title: "ID", field: "id", width: 150},
            {title: "Neighborhood", field: "neighbourhood", width: 150},
            {title: "Room Type", field: "room_type", width: 150},
            {title: "Price", field: "price", width: 150},
        ],
    });
    let map = L.map(map_id)
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1Ijoib2ZpcjUxMTk5NiIsImEiOiJja3d6YmNzeG4wdXgxMm91cnQ4Y3NicWFuIn0.ajaFrHOpgyqznPKfD3cpJw'
    }).addTo(map);
    var markers_group = L.layerGroup();
    let markers = {}
    var sel_icon = L.icon({iconUrl: 'icons/marker_sel.png'})
    var not_sel_icon = L.icon({iconUrl: 'icons/marker_not_sel.png', iconSize: [32, 32]})


    function handleFile(file) {
        let cur_loc = undefined;
        let mouseup = undefined;
        dropzone_element.style.display = "none"
        table_element.style.visibility = "visible"
        map_element.style.visibility = "visible"
        info_element.style.visibility = "visible"
        clear_element.style.visibility = "visible"
        download_element.style.visibility = "visible"

        if (objectURL) {
            // revoke the old object url to avoid using more memory than needed
            URL.revokeObjectURL(objectURL);
        }

        objectURL = URL.createObjectURL(file);

        download_element.href = objectURL;
        download_element.download = file.name; // this name is used when the user downloads the file

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results, file) {
                table.setData(results.data)
                function _rowSelected(row) {
                    table.selectRow(parseInt(row.getData()['id']))
                    table.scrollToRow(row.getIndex(), "center", true);
                    let latlng =L.latLng(row.getData().latitude, row.getData().longitude)
                    map.flyTo(latlng,15,{noMoveStart:true})
                    markers[latlng.toString()].marker.setIcon(sel_icon)
                    let strung = JSON.stringify(row.getData(), undefined, '\t');
                    info_element.innerHTML = strung.substring(1,strung.length-1);

                }

                function _rowDeselected(row){
                    let latlng =L.latLng(row.getData().latitude, row.getData().longitude)
                    markers[latlng.toString()].marker.setIcon(not_sel_icon)
                    info_element.innerHTML = "";
                }

                table.on("rowSelected", _rowSelected)
                table.on("rowDeselected", _rowDeselected)
                table.on("dataFiltered", function(filters, rows){
                    setup_markers(rows, map)
                });
                function _moveMapHandler(event) {
                    var selectedData = table.getSelectedRows()
                    if (selectedData.length>0) {
                        table.deselectRow()
                        _rowDeselected(selectedData[0])
                    }
                }



                function _clickedMarkerHandler(event) {
                    let id = markers[event.latlng.toString()].row["id"]
                    let row = table.getRow(id)
                    let same_marker = row === mouseup
                    _moveMapHandler(event)
                    if (same_marker) return;
                    table.setPage(parseInt(row.getPosition(true)/paginationSize+1))
                    table.selectRow(parseInt(id))
                }

                function setup_markers(rows, map){
                    markers_group.clearLayers();
                    markers = {}
                    for (let row of rows) {
                        if(typeof row['getData'] === 'function'){
                            row = row.getData()
                        }
                        let marker = L.marker([row.latitude, row.longitude], {title:row.name, riseOnHover:true, icon:not_sel_icon});
                        markers_group.addLayer(marker)
                        markers[marker._latlng.toString()] = {marker:marker, row:row}
                        marker.on('click', _clickedMarkerHandler)
                    }
                    map.addLayer(markers_group);
                }

                function _mouseDown(event) {
                    cur_loc = map.getCenter()
                }
                function _mouseUp(event) {
                    let selected = table.getSelectedRows()
                    if(selected.length>0){
                        mouseup=selected[0]
                    }
                    else{
                        mouseup=undefined
                    }
                    if (map.getCenter().lat !== cur_loc.lat || map.getCenter().lng !== cur_loc.lng){
                        _moveMapHandler(event)
                    }
                }

                const first_record = [results.data[0].latitude, results.data[0].longitude];
                map.setView(first_record, 10);
                map.on('mousedown',_mouseDown)
                map.on('mouseup',_mouseUp)
                // map.on('movestart',_moveMapHandler)
                setup_markers(table.getData(), map)
            }
        });
    }




    function clearData(){
        input_element.value = ""
        // input_element.style.display = "block"
        dropzone_element.style.display = "block"
        table.clearData()
        table_element.style.visibility = "hidden"
        map_element.style.visibility = "hidden"
        info_element.innerHTML = ""
        info_element.style.visibility = "hidden"
        clear_element.style.visibility = "hidden"
        download_element.style.visibility = "hidden"
    }

    dropzone_element.addEventListener('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        dropzone_element.style.background = 'rgba(209,238,230,0.46)';
    });
    dropzone_element.addEventListener('dragleave', function(e) {
        e.stopPropagation();
        e.preventDefault();
        dropzone_element.style.background = '#fcfcfc';
    });
    dropzone_element.addEventListener('drop', function (e){
        dropzone_element.style.background = '#fcfcfc';
        e.stopPropagation();
        e.preventDefault();
        var file = e.dataTransfer.files[0];
        if(file.name.endsWith('.csv')){
            handleFile(file);
        }
    });
    input_element.addEventListener("change", function (e){
        const file = this.files[0];
        handleFile(file)
    });
    clear_element.addEventListener("click", clearData, false);
}