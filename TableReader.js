// import * as Papa  from "./papaparse/papaparse.js";


export function BuildTable(csv_input_id, table_id) {
    const table_element = document.getElementById(table_id);
    function handleFile() {
        const file = this.files[0];
        Papa.parse(file, {
            header: true,
            complete: function (results, file) {
                let table = new Tabulator(table_element, {
                    data: results.data,
                    selectable:1,
                    height: 205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
                    pagination: "local",       //paginate the data
                    paginationSize: 5,       //allow 5 rows per page of data
                    columns: [ //Define Table Columns
                        {title: "Name", field: "name", width: 150},
                        {title: "Host ID", field: "host_id", width: 150},
                        {title: "ID", field: "id", width: 150},
                        {title: "Neighborhood", field: "neighbourhood", width: 150},
                        {title: "Room Type", field: "room_type", width: 150},
                        {title: "Price", field: "price", width: 150},
                    ],
                });
                const first_record = [results.data[0].latitude, results.data[0].longitude]
                let mymap = L.map('mapid').setView(first_record, 10);
                function _moveMapHandler(event) {
                    console.log("moveMapHandler")
                    var selectedData = table.getSelectedRows()
                    console.log(selectedData[0].getIndex())
                    if (selectedData.length>0) {
                        selectedData[0].deselect()
                        table.deselectRows("all");
                    }
                }
                function _clickedMapHandler(event) {
                    console.log("clickedMapHandler")
                    const table_element = document.getElementById(table_id);

                }
                mymap.on('click',_clickedMapHandler)
                mymap.on('move',_moveMapHandler)
                L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 18,
                    id: 'mapbox/streets-v11',
                    tileSize: 512,
                    zoomOffset: -1,
                    accessToken: 'pk.eyJ1Ijoib2ZpcjUxMTk5NiIsImEiOiJja3d6YmNzeG4wdXgxMm91cnQ4Y3NicWFuIn0.ajaFrHOpgyqznPKfD3cpJw'
                }).addTo(mymap);
                for (const record of results.data) {
                    L.marker([record.latitude, record.longitude]).addTo(mymap);
                }
            }
        });



    }
    console.log("sjgtdfj")
    document.getElementById(csv_input_id).addEventListener("change", handleFile, false);


}