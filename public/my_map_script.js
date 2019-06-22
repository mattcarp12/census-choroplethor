// add map to page
var map = L.map('map').setView([37.8, -96], 5)

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.light'
}).addTo(map)

function style(feature) {
    return {
        weight: 1,
        color: 'grey',
        //dashArray: '3',
        fillOpacity: 0,
        //fillColor: getColor(feature.properties.density),
        //fillColor: 'red'
    }
}

geojson = L.geoJson(null, {
    style: style,
    //onEachFeature: onEachFeature
}).addTo(map);

function geo_select_change() {
    fetch('http://localhost:3000/shapes/' + document.getElementById("geo-select").value)
        .then(res => res.json())
        .then(res => {
            geojson.remove();
            geojson = L.geoJson(res[0], {style: style}).addTo(map);
        })

}

document.getElementById("geo-select").addEventListener("change",   function() {
    geo_select_change() 
});


