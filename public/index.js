let geo_select = document.getElementById('geo-select');
let var_group_select = document.getElementById('variable-group-select');
let var_select = document.getElementById('variable-select');
const census_url = "https://api.census.gov/data/2017/acs/acs5/profile?get="
const census_key = "48337155cf6d6ed514fe6ecd2a4dc3670f2e3f25"
let shapes;

/*
*
*
*
*
  First add the map to the page
*
*
*
*
*/


// add map to page
var map = L.map('map').setView([37.8, -96], 5)

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
  maxZoom: 18,
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  id: 'mapbox.light'
}).addTo(map)

var legend = L.control({ position: 'bottomright' })
legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend')
  var limits = choropleth.options.limits
  var colors = choropleth.options.colors
  var labels = []

  // Add min & max
  div.innerHTML = '<div class="labels"><div class="min">' + limits[0] + '%</div> \
    <div class="max">' + limits[limits.length - 1] + '%</div></div>'

  limits.forEach(function (limit, index) {
    labels.push('<li style="background-color: ' + colors[index] + '"></li>')
  })

  div.innerHTML += '<ul>' + labels.join('') + '</ul>'
  return div
}

function style_plain(feature) {
  return {
    weight: 1.5,
    color: 'grey',
    fillOpacity: 0
  }
}


choropleth = L.geoJson(null, {
  style: style_plain,
  //onEachFeature: onEachFeature
}).addTo(map);

function geo_select_change() {
  fetch('http://localhost:5000/shapes/' + document.getElementById("geo-select").value)
    .then(res => res.json())
    .then(res => {
      choropleth.remove();
      choropleth = L.geoJson(res[0], {
        style: style_plain
      }).addTo(map);
      shapes = res[0];
    })
    .then(() => {
      var_group_select.disabled = false;
      var_group_select.value = 'default';
      var_select.value = 'default';
      var_select.disabled = true;
    })

}

document.getElementById("geo-select").addEventListener("change", function () {
  geo_select_change();
});



/*
*
*
*
*
  Here make code to control dropdowns (and thus the entire app)
*
*
*
*
*/


/*
      This creates the dropdown of variable groups (the second dropdown)
*/
let var_groups = fetch('https://api.census.gov/data/2017/acs/acs5/profile/groups.json')
  .then(res => res.json())
  .then(res => res.groups.filter(groups => groups.name != "DP02PR")) 
var_groups.then(res => {
  res.forEach(element => {
    let opt = document.createElement('option');
    opt.value = element.name;
    opt.text = element.description.split(" ")[1];
    var_group_select.add(opt);
  })
});


// geo_select.onchange = function () {
//   enable_select(var_group_select);
// };


/*
This creates a constant that holds the enire list of variables
When the variable group is selected, this list is filtered and then displayed
in the variable select dropdown box.
The list of variables is filtered so that only percent values are included
*/
const vars = fetch('https://api.census.gov/data/2017/acs/acs5/profile/variables.json')
  .then(res => res.json())
  .then(res => res.variables)
  .then(res => {
    let temp = {};
    let keys = Object.keys(res);
    for (key of keys) {
      if (key.substring(key.indexOf('_') - 2, key.indexOf('_')) != 'PR' && 
        key.substring(0, 2) == 'DP' &&
        key.substring(key.length - 2, key.length) == "PE" &&
        res[key]['predicateType'] == 'float') {
        temp[key] = res[key];
      }
    }
    keys = Object.keys(temp)
    for (key of keys) {
      let label = temp[key]['label']
      temp[key]['label'] = label.substring(label.indexOf('!!') + 2, label.length)
    }
    return temp;
  })


/*
  These are helper functions that are called when changes are made to dropdown boxes
*/
remove_options = function (select_element) {
  select_element.selectedIndex = 0;
  let n = select_element.length;
  for (var i = 1; i < n; i++) {
    select_element.options[1].remove();
  }
}

enable_select = function (select_element) {
  if (select_element.hasAttribute('disabled')) {
    select_element.removeAttribute('disabled');
  }
}

populate_select = function (select_element, vars, parent) {
  vars.then(res => {
    let keys = Object.keys(res).sort();
    for (key of keys) {
      if (res[key]["group"] == parent.value) {
        let opt = document.createElement('option');
        opt.value = key;
        opt.text = res[key]["label"];
        select_element.add(opt);
      }
    }
  })
}



/* When the variable group is changed, clean the variable list and repopulate with 
   variables that correspond to the selected variable group */
var_group_select.onchange = function () {

  // first remove all existing options
  remove_options(var_select);

  // enable variable select box if disabled 
  var_select.disabled = false;

  // populate select box
  populate_select(var_select, vars, this);

};


/*
  Then the variable is selected, make a call to the census API
  The results of that call are then added to the shapefile that was downloaded from 
  the mongodb server (called shapes).
*/
geo_lookup = {
  "states": "state",
  "counties": "county",
  "congress": "congressional%20district"
}

var_select.onchange = function () {
  let data_url;
  switch (geo_select.value) {
    case "states":
      data_url = census_url + var_select.value + ",NAME&for=" + geo_lookup[geo_select.value] + ":*&key=" + census_key;
      break;
    default:
      data_url = census_url + var_select.value + ",NAME&for=" + geo_lookup[geo_select.value] + ":*&in=state:*&key=" + census_key;
      break;
  }

  let census_data = {};
  fetch(data_url)
    .then(res => res.json())
    .then(res => {
      res.forEach(item => {
        switch (geo_select.value) {
          case "states":
            census_data[item[2]] = parseFloat(item[0]);
            break;
          default:
            census_data[item[2] + item[3]] = parseFloat(item[0]);
        }
      })
    })
    .then(res => {
      let keys = Object.keys(shapes.features).sort();
        for (key of keys) {
          switch(geo_select.value) {
            case 'states':
                lookup = shapes.features[key]['properties']['STATE'];
                break;
            default:
                lookup = shapes.features[key]['properties']['STATE'] + shapes.features[key]['properties']['COUNTY'];
                //break;

          }
          shapes.features[key]['properties']['var'] = census_data[lookup]
        }
        choropleth.remove();  
        
        choropleth = L.choropleth(shapes, {
          valueProperty: 'var',
          scale: ['green', 'red'],
          steps: 10,
          mode: 'q',
          style: {
            color: '#fff',
            weight: 1,
            fillOpacity: 0.8
          },
          onEachFeature: function (feature, layer) {
            switch(geo_select.value) {
              case 'states':
                layer.bindPopup('State: ' + feature.properties.NAME + '<br>' + feature.properties.var.toLocaleString() + '%')
                break;
              default:
                //layer.bindPopup('County: ' + feature.properties.NAME + '<br>' + if(var in feature.properties) {feature.properties.var.toLocaleString()  + '%' } else + '';)
            }
          }
        }).addTo(map)
        legend.addTo(map);
    })
}