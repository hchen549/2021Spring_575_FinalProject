/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
var map = (map = L.map("mapid", {
  center: [43.0731, -89.4012],
  zoom: 11.4,
}));
var minValue;

var measure = "tot_pop_10";
var measureYear = "19";
var year = 2019;
var attributeYear = "19";
var neighborhoods = [];
var neigh_id_dict = {};

var getColor = chroma.scale(["#F9EBEA", "#7B241C"]).domain([0, 20000]);
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

var colorMapping = {};

// Convert color from rgb to hex
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

var measures = [
  "tot_pop_10",
  "pc_wht_10",
  "avg_huval",
  "yrblt_mdn",
  "crash",
  "crm_prop",
  "pc_ov64_10",
  "avg_stcnd",
  "pc_un18_10",
  "pc_fmwc_10",
  "crm_pers",
  "trst_trps",
  "pc_trst",
];

var measures_definition = {
  tot_pop_10: "Estimated total population",
  pc_wht_10:
    "Estimated percent of persons in the Non-Hispanic White alone race category",
  avg_huval:
    "Average assessed value of single family dwelling unit, owner occupied houses",
  yrblt_mdn:
    "Median year built for all dwelling units including single household dwelling units, multi-household units, and some residential group quarters",
  crash: "Total count of reported automobile crashes",
  crm_prop:
    "Total count of incidents reported to MPD as property related offenses.",
  pc_ov64_10: "Estimated percent of persons age 65 and over",
  avg_stcnd: "Average pavement condition (length-weighted)",
  pc_un18_10: "Estimated percent of persons age 17 and under",
  pc_fmwc_10:
    "Estimated families with own children under 18 as a percent of all households",
  crm_pers:
    "Total count of incidents reported to MPD as person related offenses",
  trst_trps: "Total number of regularly scheduled transit trips",
  pc_trst:
    "Percent of dwelling units that lie within one quarter mile walk of a regularly scheduled transit stop",
};

var measures_conversion = {
  tot_pop_10: "Total Population",
  pc_wht_10: "White pct",
  avg_huval: "Avg House Value",
  yrblt_mdn: "Median Year Built",
  crash: "Crashes",
  crm_prop: "Property-related Incidents",
  pc_ov64_10: "Senior Population",
  avg_stcnd: "Pavement Condition",
  pc_un18_10: "Youth Population",
  pc_fmwc_10: "Families with Children",
  crm_pers: "Person-related Incidents",
  trst_trps: "Available Transit Service",
  pc_trst: "Transit Stop Access",
};

var chartWidth = window.innerWidth * 0.5,
  chartWidth = 600,
  // chartHeight = 230,
  chartHeight = 220;
(leftPadding = 40),
  (rightPadding = 2),
  (topBottomPadding = 5),
  (chartInnerWidth = chartWidth - leftPadding - rightPadding),
  (chartInnerHeight = chartHeight - topBottomPadding * 2),
  // translate = "translate(" + leftPadding + "," + 0 + ")";
  (translate = "translate(" + leftPadding + "," + topBottomPadding / 2 + ")");

let modalBtn = document.getElementById("modal-btn");
let modal = document.querySelector(".modal");
let closeBtn = document.querySelector(".close-btn");
modalBtn.onclick = function () {
  modal.style.display = "block";
};
closeBtn.onclick = function () {
  modal.style.display = "none";
};
window.onclick = function (e) {
  if (e.target == modal) {
    modal.style.display = "none";
  }
};

function onEachFeature(feature, layer) {
  var maxValue = d3.max(attributes_19, (d) => {
    return parseFloat(d[measure]);
  });
  getColor = chroma.scale(["#F9EBEA", "#7B241C"]).domain([0, maxValue]);

  var combinedAttributes = measure + "_" + attributeYear;

  if (feature.properties[combinedAttributes] >= 0) {
    // check whether the neighborhood is selected (clicked) before
    if (colorMapping.hasOwnProperty(feature.properties.NEIGHB_NAME)) {
      // If selected, return the assigned color
      layer.setStyle({
        fillColor: colorMapping[feature.properties.NEIGHB_NAME],
        weight: 2,
        opacity: 1,
        color: "grey",
        dashArray: "3",
        fillOpacity: 1,
        className: feature.properties["NEIGHB_NAME"] + "Map",
      });
    } else {
      // If not selected, assign the color based on the value of its attributes
      layer.setStyle({
        fillColor: getColor(feature.properties[combinedAttributes]),
        weight: 2,
        opacity: 1,
        color: "grey",
        dashArray: "3",
        fillOpacity: 1,
        className: feature.properties["NEIGHB_NAME"] + "Map",
      });
    }
  } else {
    //FiXED: Change the color of missing value
    layer.setStyle({
      fillColor: "black",
      weight: 2,
      opacity: 1,
      color: "grey",
      dashArray: "3",
      fillOpacity: 1,
      className: feature.properties["NEIGHB_NAME"] + "Map",
    });
  }
  var popupContent = measure + "_" + attributeYear;
  if (feature.properties) {
    layer.bindPopup(
      "<p>" +
        "Neighborhood: " +
        feature.properties["NEIGHB_NAME"] +
        " " +
        // feature.properties["OBJECTID"] +
        "<br>" +
        measures_conversion[measure] +
        ": " +
        feature.properties[popupContent] +
        "</p>"
    );
  }
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: changeColor,
  });
}

function highlightFeature(e) {
  var layer = e.target;
  var neighborName = layer.feature.properties["NEIGHB_NAME"];
  var GEOID;

  for (var i = 0; i < attributes_19.length; i++) {
    if (attributes_19[i]["name"] === neighborName) {
      GEOID = attributes_19[i]["geo_key"];
    }
  }
  highlightNeighBar(GEOID);

  layer.setStyle({
    weight: 5,
    color: "red",
    dashArray: "",
    fillOpacity: 1,
  });
  layer.bringToFront();
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlight(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 2,
    opacity: 1,
    color: "grey",
    dashArray: "3",
    fillOpacity: 1,
  });

  var neighborName = layer.feature.properties["NEIGHB_NAME"];
  var GEOID;

  for (var i = 0; i < attributes_19.length; i++) {
    if (attributes_19[i]["name"] === neighborName) {
      GEOID = attributes_19[i]["geo_key"];
    }
  }
  dehighlightNeighBar(GEOID);

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function changeColor(e) {
  var layer = e.target;
  var neighborName = layer.feature.properties["NEIGHB_NAME"];
  // console.log(neighborName);
  var combinedAttributes = measure + "_" + attributeYear;
  var maxValue = d3.max(attributes_19, (d) => {
    return parseFloat(d[measure]);
  });
  getColor = chroma.scale(["#F9EBEA", "#7B241C"]).domain([0, maxValue]);

  var currentColor;
  var currentColorHex;

  if (typeof layer.options.fillColor !== "string") {
    currentColor = layer.options.fillColor._rgb;
    currentColorHex = rgbToHex(
      currentColor[0],
      currentColor[1],
      currentColor[2]
    );
  } else {
    currentColorHex = layer.options.fillColor;
  }

  var supposedColor = getColor(layer.feature.properties[combinedAttributes])
    ._rgb;

  var supposedColorHex = rgbToHex(
    supposedColor[0],
    supposedColor[1],
    supposedColor[2]
  );

  // if (layer.options.fillColor !== colorScale(neighborName)) {
  if (currentColorHex === supposedColorHex) {
    // Append the neighborhood to neighborhood array
    console.log("select");
    console.log(colorScale(neighborName));
    neighborhoods.push(neighborName);
    layer.setStyle({
      weight: 2,
      opacity: 1,
      color: "grey",
      dashArray: "3",
      fillOpacity: 1,
      fillColor: colorScale(neighborName),
    });

    updateBarChartColor(colorScale);
    addLine(colorScale, false);
  } else {
    console.log("unselect");
    const index = neighborhoods.indexOf(neighborName);
    // Remove from the selected neighborhood arrays
    if (index > -1) {
      neighborhoods.splice(index, 1);
      console.log(getColor(layer.feature.properties[combinedAttributes]));

      layer.setStyle({
        weight: 2,
        opacity: 1,
        color: "grey",
        dashArray: "3",
        fillOpacity: 1,

        fillColor: getColor(layer.feature.properties[combinedAttributes]),
      });
      layer.bringToFront();
      console.log(layer.feature);
      reupdateBarChartColor(layer.feature);

      removeLine(layer.feature);
      // addLine(colorScale);
    }
  }
}

//function to instantiate the Leaflet map
function createMap() {
  //add OSM base tilelayer
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  //call getData function
  getData();
}

function getData() {
  var promises = [
    d3.csv("data/nip_neighbassoc_19_new.csv"),
    d3.csv("data/nip_neighbassoc_18.csv"),
    d3.csv("data/nip_neighbassoc_17.csv"),
    d3.csv("data/nip_neighbassoc_16.csv"),
    d3.csv("data/nip_neighbassoc_15.csv"),
    d3.csv("data/nip_neighbassoc_14.csv"),
    d3.csv("data/nip_neighbassoc_13.csv"),
    d3.csv("data/nip_neighbassoc_12.csv"),
    d3.csv("data/nip_neighbassoc_total (2).csv"),
    // d3.json("data/EuropeCountries.topojson"),
    (us = d3.json(
      "https://opendata.arcgis.com/datasets/66e4a6a80ae64865a81bc8d4464a6417_12.geojson"
    )),
  ];

  Promise.all(promises).then(callback);
}

function callback(data) {
  attributes_19 = data[0];
  attributes_18 = data[1];
  attributes_17 = data[2];
  attributes_16 = data[3];
  attributes_15 = data[4];
  attributes_14 = data[5];
  attributes_13 = data[6];
  attributes_12 = data[7];
  attributes_all = data[8];
  madisonMap = data[data.length - 1];

  attributes_list = [
    attributes_19,
    attributes_18,
    attributes_17,
    attributes_16,
    attributes_15,
    attributes_14,
    attributes_13,
    attributes_12,
  ];

  console.log(attributes_all);

  // Minor differences between two datasets
  var undefinedCommunity = [
    "Oakbridge Community Neighborhood Association",
    "Wexford Village Homeowners Association",
  ];

  attributes_19.map((d) => {
    if (undefinedCommunity.indexOf(d.name) === -1) {
      // console.log("enter");
      return (neigh_id_dict[d.name] = d.geo_key);
    }
  });

  var all_neighborhoods = madisonMap.features.map(
    (d) => d.properties.NEIGHB_NAME
  );

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  colorScale.domain(all_neighborhoods);

  for (var i = 0; i < attributes_list.length; i++) {
    attributes_list[i] = attributes_list[i].filter((d) => {
      return parseFloat(d[measure]) > 0 && parseFloat(d[measure]) < 200000;
    });
  }

  // Remove neighborhood "City of Madison"
  attributes_19 = attributes_19.filter((d) => {
    return (
      parseFloat(d["tot_pop_10"]) > 0 && parseFloat(d["tot_pop_10"]) < 200000
    );
  });
  madisonMap.features = madisonMap.features.filter((neigh) => {
    return neigh.properties["NEIGHB_NAME"] !== "City of Madison";
  });

  console.log(attributes_all);

  // Change data format from string to numerical value
  attributes_all_new = attributes_all.map(function (d) {
    d.year = new Date(d.year);
    measures.forEach(function (m) {
      // console.log(m);
      if (m !== "year") {
        d[m] = parseFloat(d[m]);
        // d[m] = +d[m];
      }
    });
    return d;
  });

  // Add chained selection for two dropdown menu
  $alloption = $(".measure-select").html();
  $(".category-select").change(function () {
    $(".measure-select").html($alloption);
    var val = $(".category-select").find(":selected").val();
    $(".measure-select option[class!=" + val + "]").remove();
  });

  $(".category-select").on("change", function () {
    var op = $(this).val();
    console.log(op);
    if (op) {
      $(".measure-select").prop("disabled", false);
    } else {
      $(".measure-select").prop("disabled", true);
    }
  });

  // Add eventListen for submit button
  var submission = document.querySelector("#submit-button");
  submission.addEventListener("click", function () {
    // e.preventDefault();
    // var submittedValue = submission.element.subcategory.value;
    console.log($(".measure-select").find(":selected").val());
    measure = $(".measure-select").find(":selected").val();
    var measure_text = $(".measure-select").find(":selected").text();
    console.log(measure);

    // Update variable definition
    $("#variable-name").text("Variable: " + measure_text);
    $("#variable-definition").text(measures_definition[measure]);

    // Calculate the maximum value of selected measure
    var maxValueByMeasure = d3.max(attributes_all_new, (d) => {
      return parseFloat(d[measure]);
    });

    // Reset color based on maximum value of selected measure
    getColor = chroma
      .scale(["#F9EBEA", "#7B241C"])
      .domain([0, maxValueByMeasure]);

    // Remember the color of the selected elements
    colorMapping = {};
    neighborhoods.forEach((neigh) => {
      var selected_elements = document.getElementsByClassName(neigh + "Map");
      var selected_element = selected_elements[0];
      console.log(selected_element);
      console.log(getComputedStyle(selected_element)["fill"]);
      // selected_elements.style["weight"] = "red";
      // console.log(getStyles(selected_element, "fill"));
      colorMapping[neigh] = getComputedStyle(selected_element)["fill"];
    });

    // Update the color Scale of Map
    changeMapColorByMeasure();

    // Update the position and color and height of Bar chart
    var bars = d3
      .selectAll(".bar-rect")
      //re-sort bars
      .sort(function (a, b) {
        return b[measure] - a[measure];
      })
      .transition()
      .delay((d, i) => {
        return i * 20;
      })
      .duration(500);
    changeBarChartByMeasure(bars);
    addLine(colorScale, true);
  });

  // Add eventListener for reset button
  var reset = document.querySelector("#reset-button");
  reset.addEventListener("click", function () {
    var maxValue = d3.max(attributes_19, (d) => {
      return parseFloat(d[measure]);
    });
    getColor = chroma.scale(["#F9EBEA", "#7B241C"]).domain([0, maxValue]);
    var combinedAttributes = measure + "_" + attributeYear;
    map.eachLayer(function (layer) {
      if (layer.feature !== undefined) {
        if (neighborhoods.indexOf(layer.feature.properties.NEIGHB_NAME) > -1) {
          console.log("Problem!!!!!!!!!!!!!");
          console.log(getColor(layer.feature.properties[combinedAttributes]));
          layer.setStyle({
            weight: 2,
            opacity: 1,
            color: "grey",
            dashArray: "3",
            fillOpacity: 1,
            fillColor: getColor(layer.feature.properties[combinedAttributes]),
          });
          layer.bringToFront();
        }
      }
    });
    console.log(neighborhoods);
    for (var i = 0; i < madisonMap.features.length; i++) {
      var neighborName = madisonMap.features[i].properties.NEIGHB_NAME;
      var index = neighborhoods.indexOf(neighborName);
      if (index > -1) {
        // Remove the neighborhood from the array of selected neighborhood
        neighborhoods.splice(index, 1);
        console.log("success");
        reupdateBarChartColor(madisonMap.features[i]);
        removeLine(madisonMap.features[i]);
      }
    }

    // reupdateBarChartColor(layer.feature);
    // removeLine(layer.feature);
  });

  // // Update the position and color and height of Bar chart
  // var bars = d3
  //   .selectAll(".bar-rect")
  //   //re-sort bars
  //   .sort(function (a, b) {
  //     return b[measure] - a[measure];
  //   })
  //   .transition()
  //   .delay((d, i) => {
  //     return i * 20;
  //   })
  //   .duration(500);
  // changeBarChartByMeasure(bars);
  // addLine(colorScale);
  // });

  //Join year data with geojson
  for (var i = 0; i < attributes_list.length; i++) {
    joinData(madisonMap, attributes_list[i], measureYear);
    measureYear--;
  }

  // Geojson data has more neighborhoods than csv data. Therefore, we need to keep the intersection between these two
  var allNeighbourhoods = [];
  attributes_19.forEach((d) => {
    allNeighbourhoods.push(d.name);
  });

  console.log(allNeighbourhoods);
  madisonMap.features = madisonMap.features.filter((d) => {
    // console.log(d.properties.NEIGHB_NAME);
    return allNeighbourhoods.indexOf(d.properties.NEIGHB_NAME) !== -1;
  });

  console.log(madisonMap);

  var attributeWithYear = L.geoJson(madisonMap, {
    //style: startStyle,
    onEachFeature: onEachFeature,
  }).addTo(map);

  createBarChart();
  createLineChart(attributes_all_new);
}

// Join csv data with geojson data
function joinData(madisonMap, attribute, measureYear) {
  for (var i = 0; i < madisonMap.features.length; i++) {
    var neighborsName = madisonMap.features[i]["properties"]["NEIGHB_NAME"];

    for (var j = 0; j < attribute.length; j++) {
      if (attribute[j]["name"] == neighborsName) {
        measures.forEach((measure) => {
          madisonMap.features[i]["properties"][
            measure + "_" + measureYear
          ] = parseFloat(attribute[j][measure]);
        });
        madisonMap.features[i]["properties"]["geo_key"] =
          attribute[j]["geo_key"];
      }
    }
  }
}

function createBarChart() {
  n = attributes_19.length;
  var chart = d3
    .select("#barChart")
    .append("svg")
    .attr("class", "barchart")
    .attr("height", chartInnerHeight)
    .attr("width", chartInnerWidth);

  // Calculate the max value given pre-selected variable
  var maxValue = d3.max(attributes_19, (d) => {
    return parseFloat(d[measure]);
  });

  var yScale = d3.scaleLinear().range([chartHeight, 0]).domain([0, maxValue]);
  var yAxis = d3.axisLeft().scale(yScale).tickSize(-innerWidth).tickPadding(10);

  translate = "translate(" + leftPadding + "," + topBottomPadding / 2 + ")";
  //place axis

  var axis = chart
    .append("g")
    .attr("class", "y-axis-bar")
    .attr("transform", translate)
    .call(yAxis);

  var bars = chart
    .selectAll(".rect")
    .data(attributes_19)
    .enter()
    .append("rect")
    .sort(function (a, b) {
      return b[measure] - a[measure];
    })
    .attr("id", (d) => {
      return "_" + d.geo_key;
    })
    .attr("class", (d) => {
      return "bar-rect";
    })
    // .attr("x", function (d, i) {
    //   // return i * (chartInnerWidth / n) + leftPadding;
    //   return i * (chartInnerWidth / n - 1) + leftPadding;
    // })
    .attr("width", chartInnerWidth / attributes_19.length - 1)
    //size/resize bars
    // .attr("height", function (d, i) {
    //   return 460 - yScale(parseFloat(d[measure]));
    // })
    // .attr("y", function (d, i) {
    //   return yScale(parseFloat(d[measure])) + topBottomPadding;
    // })
    // .style("fill", (d) => getColor(d[measure]))
    // .style("color", "blue")
    .style("className", (d) => {
      d.name + "Bar";
    })
    .on("mouseover", (event, d) => {
      highlightNeighBar(d.geo_key);
      highlightMap(d);
    })
    .on("mouseout", (event, d) => {
      dehighlightNeighBar(d.geo_key);
      dehighlightMap(d);
    });
  // .on("click", (event, d) => {
  //   var neighborName = d.name;
  //   neighborhoods.push(neighborName);
  //   changeBarColor(d);
  //   changeMapColor(d);
  //   addLine(colorScale);
  // });

  changeBarChartByMeasure(bars);
}

function changeBarChartByMeasure(bars) {
  console.log("changeBarChartByMeasure");
  var maxValue = d3.max(attributes_19, (d) => {
    return parseFloat(d[measure]);
  });
  getColor = chroma.scale(["#F9EBEA", "#7B241C"]).domain([0, maxValue]);
  var yScale = d3.scaleLinear().range([chartHeight, 0]).domain([0, maxValue]);
  var yAxis = d3.axisLeft().scale(yScale).tickSize(-innerWidth).tickPadding(10);

  var chart = d3.select("#barChart").select(".barchart");

  chart.select(".y-axis-bar").transition().duration(1500).call(yAxis);
  bars
    .attr("x", function (d, i) {
      // return i * (chartInnerWidth / n) + leftPadding;
      return i * (chartInnerWidth / n - 1) + leftPadding;
    })
    //size/resize bars
    .attr("height", function (d, i) {
      return yScale(0) - yScale(parseFloat(d[measure]));
    })
    .attr("y", function (d, i) {
      return yScale(parseFloat(d[measure])) + topBottomPadding;
    })
    .style("fill", function (d) {
      if (colorMapping.hasOwnProperty(d.name)) {
        return colorMapping[d.name];
      } else {
        return getColor(d[measure]);
      }
    });

  $(".bar-chart-title").text(
    measures_conversion[measure] + " by neighborhood association"
  );

  // chart
  //   .select(".barChartTitle")
  //   .transition()
  //   .duration(200000)
  //   .text("Number of " + measure + " in each neighborhood");

  // function changeBarColor(d) {
  //   var barChart = d3.select("#barChart").select("." + "barchart");
  //   var bar = barChart.select("#_" + d.geo_key);
  //   bar.style("fill", colorScale(d.name));
}

function updateBarChartColor(colorScale) {
  var bar = d3.select("#barChart").select(".barchart");
  neighborhoods.forEach((neigh) => {
    console.log(neigh, neigh_id_dict[neigh]);

    // var selectedBar = document.getElementsByClassName(neigh + "Bar");
    var selectedBar = bar
      .select("#_" + neigh_id_dict[neigh])
      .style("fill", colorScale(neigh));
    console.log(selectedBar);

    // selectedBar[0].style["fill"] = colorScale(neigh);
    // // selectedBar[1].style["color"] = colorScale(neigh);
    // selectedBar[0].style["stroke-width"] = 1;
  });
}

// Convert back to the original color after clicking on the neighborhoods again
function reupdateBarChartColor(d) {
  var bar = d3.select("#barChart").select(".barchart");
  var neighborName = d.properties["NEIGHB_NAME"];
  var variableName = measure + "_" + attributeYear;
  var selectedBar = bar
    .select("#_" + neigh_id_dict[neighborName])
    .style("fill", getColor(d.properties[variableName]));
  // var selectedBar = document.getElementsByClassName(neighborName + "Bar");

  // selectedBar[0].style["fill"] = getColor(d.properties[variableName]);
}

function createLineChart(data) {
  var height = 200;
  var width = 550;
  var margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xValue = (d) => d.year;
  const xAxisLabel = "Time";

  const yValue = (d) => d[measure];
  const yAxisLabel = measures_conversion[measure];

  // const xScale = d3
  //   .scaleTime()
  //   .domain(d3.extent(data, xValue))
  //   .range([0, innerWidth])
  //   .nice();

  var nested = d3.group(data, (d) => d.name);

  var svg = d3
    .select("#lineChart")
    .append("svg")
    .attr("class", "linePlot")
    .attr("height", "500px")
    .attr("width", "960px");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left + 50},${margin.top - 5})`);

  // Initialise a X axis:
  var xScale = d3
    .scaleTime()
    .domain(d3.extent(data, xValue))
    .range([0, innerWidth])
    .nice();

  // const xAxis = d3.axisBottom(xScale).tickSize(-innerHeight).tickPadding(15);
  var xAxis = d3
    .axisBottom()
    .scale(xScale)
    .tickSize(-innerHeight)
    .tickPadding(15);

  g.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "myXaxis");

  // Initialize an Y axis
  var yScale = d3.scaleLinear().range([innerHeight, 0]).nice();

  var yAxis = d3
    .axisLeft()
    .scale(yScale)
    .tickSize(-innerHeight)
    .tickPadding(10);
  g.append("g").attr("class", "myYaxis");

  $(".line-chart-title").text(
    measures_conversion[measure] + " by neighborhood from year 2012 - 2019"
  );

  addLine(colorScale, false);
}

function addLine(colorScale, callFromButton) {
  console.log(attributes_all_new);
  var height = 200;
  var width = 550;
  var margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  var data = attributes_all_new;

  // d3.select("#lineChart")
  //   .select(".title")
  //   .transition()
  //   .duration(200000)
  //   .text(measure + " by neighborhood from year 2012 - 2019 ");

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.year))
    .range([0, innerWidth])
    .nice();
  // Filter the data within selected neighborhoods
  var data = data.filter(function (d) {
    return neighborhoods.includes(d.name);
  });

  console.log(data.length);

  // Find the max value of selected neighborhoods
  if (data.length === 0) {
    var maxValue = 5000;
  } else {
    var maxValue = d3.max(data, (d) => {
      return d[measure];
    });
  }

  var nested = d3.group(data, (d) => d.name);

  const xValue = (d) => d.year;
  const xAxisLabel = "Time";
  const yValue = (d) => d[measure];
  const yAxisLabel = measures_conversion[measure];

  // Redefine the domain of yScale
  const yScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([innerHeight, 0])
    .nice();

  var g = d3.select("#lineChart").select("svg").select("g");

  // Remove original title
  // g.select(".title").remove();

  const xAxis = d3.axisBottom(xScale).tickSize(-innerHeight).tickPadding(15);
  const yAxis = d3.axisLeft(yScale).tickSize(-innerWidth).tickPadding(10);
  var yAxisG, xAxisG;
  console.log(document.querySelectorAll(".y-grid"));
  // if no axis exists, create one, otherwise update it

  // FIXME: Edit y-axis label
  if ((neighborhoods.length < 1) & (callFromButton === false)) {
    yAxisG = g.append("g").attr("class", "y-grid").call(yAxis);
    yAxisG
      .append("text")
      .attr("class", "axis-label")
      .attr("y", -45)
      .attr("x", -innerHeight / 2)
      .attr("fill", "black")
      .attr("transform", `rotate(-90)`)
      .attr("text-anchor", "middle");

    xAxisG = g
      .append("g")
      .attr("class", "x-grid")
      .call(xAxis)
      .attr("transform", `translate(0,${innerHeight})`);
    xAxisG
      .append("text")
      .attr("class", "axis-label")
      .attr("y", 80)
      .attr("x", innerWidth / 2)
      .attr("fill", "black")
      .text(xAxisLabel);
  } else {
    yAxisG = g.selectAll(".y-grid").transition().duration(1500).call(yAxis);
    xAxisG = g.selectAll(".x-grid").transition().duration(1500).call(xAxis);
  }

  yAxisG.selectAll(".domain").remove();
  xAxisG.select(".domain").remove();

  yAxisG.selectAll(".axis-label").text(yAxisLabel);

  var line = d3
    .line()
    .x(function (d) {
      return xScale(d.year);
    })
    .y(function (d) {
      return yScale(d[measure]);
    })
    .curve(d3.curveBasis);

  var lineData = [];
  neighborhoods.forEach(function (neigh) {
    var temp = nested.get(neigh).sort((a, b) => a.year - b.year);

    lineData.push(temp);
  });
  console.log(lineData);

  $(".line-chart-title").text(
    measures_conversion[measure] + " by neighborhood from year 2012 - 2019"
  );

  // var lines = g.selectAll(".line").data(lineData).attr("class", "line-path");
  // // transition from previous paths to new paths
  // lines
  //   .transition()
  //   .duration(1500)
  //   .attr("d", line)
  //   .style("stroke", function (d) {
  //     console.log(d);
  //     return colorScale(d.name);
  //   });

  // // enter any new data
  // lines
  //   .enter()
  //   .append("path")
  //   .merge(lines)
  //   .attr("class", "line-path")
  //   .attr("id", (d) => {
  //     console.log(d[0].geo_key);
  //     "_" + d[0].geo_key;
  //   })
  //   .attr("d", line)
  //   .style("stroke", function (d) {
  //     console.log(d);
  //     return colorScale(d[0].name);
  //   });

  var u = g.selectAll(".line-path").data(lineData);

  // Updata the line

  // TODO: Add mouseover/legend to the line
  u.enter()
    .append("path")
    .attr("class", "line-path")
    .merge(u)
    .attr("id", (d) => {
      console.log(d[0].geo_key);
      "_" + d.geo_key;
    })
    .transition()
    .duration(3000)
    .attr("d", line)
    .style("stroke", function (d) {
      console.log(d);
      if (colorMapping.hasOwnProperty(d[0].name)) {
        return colorMapping[d[0].name];
      } else {
        return colorScale(d[0].name);
      }
    })
    .attr("id", (d) => {
      return "_" + d[0].geo_key;
    })
    .style("className", function (d) {
      console.log(d[0].name + "Line");
      return d[0].name + "Line";
    });

  // neighborhoods.forEach(function (neigh) {
  //   // Arrange the year in ascending order;
  //   var temp = nested.get(neigh).sort((a, b) => a.year - b.year);
  //   console.log(temp);
  //   var geo_key = temp[0].geo_key;
  //   g.append("path")
  //     .datum(temp)
  //     .attr("fill", "none")
  //     .attr("class", "line-path")
  //     .attr("id", "_" + geo_key)
  //     .attr("stroke", colorScale(neigh))
  //     .attr("stroke-width", 2)
  //     .attr(
  //       "d",
  //       line
  //       // .curve(d3.curveBasis)
  //     );
  //   // ...
  // });
}

function removeLine(d) {
  var geo_key_id = "_" + d.properties.geo_key;
  d3.select(".linePlot")
    .select("#" + geo_key_id)
    .remove();
  // console.log(colorScale(d.properties.NEIGHB_NAME));
  // var geoClassName = d.properties.NEIGHB_NAME + "Line";
  // console.log(geoClassName);
  // console.log(document.getElementsByClassName(geoClassName));
}

function highlightNeighBar(geo_key) {
  var barChart = d3.select("#barChart").select("." + "barchart");
  var bar = barChart.select("#_" + geo_key);

  bar.style("stroke", "red").style("stroke-width", "3");
}

function highlightMap(d) {
  // var selected_elements = document.getElementsByClassName(d.name + "Map");
  // var selected_element = selected_elements[0];
  // // selected_elements.style["weight"] = "red";
  // selected_element.style["stroke"] = "red";
  // selected_element.style["stroke-width"] = "5";

  map.eachLayer(function (layer) {
    if (layer.feature !== undefined) {
      if (layer.feature.properties.NEIGHB_NAME === d.name) {
        layer.setStyle({
          weight: 5,
          color: "red",
          dashArray: "",
          fillOpacity: 1,
        });
        layer.bringToFront();
      }
    }
  });
}

function dehighlightNeighBar(geo_key) {
  var barChart = d3.select("#barChart").select("." + "barchart");
  var bar = barChart.select("#_" + geo_key);

  bar.style("stroke", "white").style("stroke-width", "0.1");
}

function dehighlightMap(d) {
  // var selected_elements = document.getElementsByClassName(d.name + "Map");
  // var selected_element = selected_elements[0];
  // console.log(selected_element);
  // // selected_elements.style["weight"] = "red";
  // selected_element.style["stroke"] = "grey";
  // selected_element.style["stroke-width"] = "2";

  map.eachLayer(function (layer) {
    if (layer.feature !== undefined) {
      if (layer.feature.properties.NEIGHB_NAME === d.name) {
        layer.setStyle({
          weight: 2,
          opacity: 1,
          color: "grey",
          dashArray: "3",
          fillOpacity: 1,
        });
        layer.bringToFront();
      }
    }
  });
}

function changeMapColorByMeasure() {
  var maxValue = d3.max(attributes_19, (d) => {
    return parseFloat(d[measure]);
  });
  getColor = chroma.scale(["#F9EBEA", "#7B241C"]).domain([0, maxValue]);

  var combinedAttributes = measure + "_" + attributeYear;

  map.eachLayer(function (layer) {
    if (layer.feature !== undefined) {
      if (layer.feature.properties[combinedAttributes] >= 0) {
        layer.bindPopup(
          "<p>" +
            "Neighborhood: " +
            layer.feature.properties["NEIGHB_NAME"] +
            " " +
            // layer.feature.properties["OBJECTID"] +
            "<br>" +
            measures_conversion[measure] +
            ": " +
            layer.feature.properties[combinedAttributes] +
            "</p>"
        );
        // check whether the neighborhood is selected (clicked) before
        if (colorMapping.hasOwnProperty(layer.feature.properties.NEIGHB_NAME)) {
          // If selected, return the assigned color
          layer.setStyle({
            fillColor: colorMapping[layer.feature.properties.NEIGHB_NAME],
            weight: 2,
            opacity: 1,
            color: "grey",
            dashArray: "3",
            fillOpacity: 1,
            className: layer.feature.properties["NEIGHB_NAME"] + "Map",
          });
        } else {
          // If not selected, assign the color based on the value of its attributes
          layer.setStyle({
            fillColor: getColor(layer.feature.properties[combinedAttributes]),
            weight: 2,
            opacity: 1,
            color: "grey",
            dashArray: "3",
            fillOpacity: 1,
            className: layer.feature.properties["NEIGHB_NAME"] + "Map",
          });
        }
      } else {
        //FiXED: Change the color of missing value
        // console.log(feature.properties[combinedAttributes]);
        layer.setStyle({
          fillColor: "black",
          weight: 2,
          opacity: 1,
          color: "grey",
          dashArray: "3",
          fillOpacity: 0.7,
          className: layer.feature.properties["NEIGHB_NAME"] + "Map",
        });
      }
      layer.bringToFront();
    }
  });

  //FIXME:Remain the highlighted color of clicked neighborhoods, probably by using a dictionary

  neighborhoods.forEach(function (neigh) {
    var selected_elements = document.getElementsByClassName(neigh + "Map");
    var selected_element = selected_elements[0];
    console.log(selected_element);
    // selected_elements.style["weight"] = "red";
    selected_element.style["fill"] = colorScale(neigh);
  });
}

$(document).ready(createMap);

// function changeMapColor(d) {
//   var selected_elements = document.getElementsByClassName(d.name + "Map");
//   var selected_element = selected_elements[0];
//   console.log(selected_element);
//   // selected_elements.style["weight"] = "red";
//   selected_element.style["fill"] = colorScale(d.name);
//   // selected_element.style["stroke-width"] = "4";
// }
