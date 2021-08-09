const requestData = async function () {
  const svg_map = d3.select("#map");
  const width = svg_map.attr("width");
  const height = svg_map.attr("height");

  var state = {
    curr_country: "all",
    curr_dataset: [],
  };

  var one_star_dict = {};
  var two_star_dict = {};
  var three_star_dict = {};

  var one = await d3.csv("one-star.csv");
  var two = await d3.csv("two-star.csv");
  var three = await d3.csv("three-star.csv");
  var all = d3.merge([one, two, three]);

  state.curr_dataset = Array.from(all); // update the current state to include the *whole dataset
  state.curr_country = "all"
  const sets = [one, two, three]; // keep track of what datasets we can choose from so that we can update the curr_dataset

  one.forEach((d) => {
    if (
      d["region"].includes("New York City") ||
      d["region"].includes("Washington DC") ||
      d["region"].includes("California") ||
      d["region"].includes("Chicago")
    ) {
      d["region"] = "United States of America";
    } else if (
      d["region"].includes("Macau") ||
      d["region"].includes("Hong Kong")
    ) {
      d["region"] = "China";
    } else if (d["region"].includes("Rio de Janeiro")) {
      d["region"] = "Brazil";
    } else if (d["region"].includes("Taipei")) {
      d["region"] = "Taiwan";
    }
    if (d["region"] in one_star_dict) {
      one_star_dict[d["region"]]++;
    } else {
      one_star_dict[d["region"]] = 1;
    }
  });
  two.forEach((d) => {
    if (
      d["region"].includes("New York City") ||
      d["region"].includes("Washington DC") ||
      d["region"].includes("California") ||
      d["region"].includes("Chicago")
    ) {
      d["region"] = "United States of America";
    }
    if (d["region"] in two_star_dict) {
      two_star_dict[d["region"]]++;
    } else {
      two_star_dict[d["region"]] = 1;
    }
  });
  three.forEach((d) => {
    if (
      d["region"].includes("New York City") ||
      d["region"].includes("Washington DC") ||
      d["region"].includes("California") ||
      d["region"].includes("Chicago")
    ) {
      d["region"] = "United States of America";
    }
    if (d["region"] in three_star_dict) {
      three_star_dict[d["region"]]++;
    } else {
      three_star_dict[d["region"]] = 1;
    }
  });
  all.forEach((d) => {
    if (one.includes(d)) {
      d["stars"] = 1;
    } else if (two.includes(d)) {
      d["stars"] = 2;
    } else d["stars"] = 3;
  });
  const NUM_STARS = 3;
  for (i = 0; i < NUM_STARS; i++) {
    (d3.select('[id="' + (i + 1) + '"]').attr("isChecked", "true"))
  }

  // CREATING THE MAP
  var map = await d3.json("countries.json");
  var countries = topojson.feature(map, map.objects.countries);
  var countriesMesh = topojson.mesh(map, map.objects.countries);
  var projection = d3
    .geoMercator()
    .scale(300)
    .translate([1400 / 2, 1300 / 2.75]);
  var path = d3.geoPath().projection(projection);
  var g = svg_map.append("g");
  var centered;

  function clicked(event, d) {
    // removing hidden class from the back button so that it appears after a country is clicked
    d3.select("#back-button").classed("hidden", false);

    var x, y, r, k;
    if (d.properties.name == "Malaysia") {
      var country = "Singapore";
    } else {
      var country = d.properties.name;
    }

    state.curr_country = country; // update the state so that we know for creating filtering for barchart

    if (d && centered != d) {
      d3.select("#scatter-title").text("Cuisines in " + country);
      d3.select("#bar-title").text("Prices for " + country);
      var centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      if (country == "United States of America") {
        k = 2.3;
        a = 1400 / 4;
        b = 1300 / 5;
        r = 2;
      } else if (country == "Norway") {
        k = 3.5;
        a = 1400 / 2;
        b = 1300 / 20;
        r = 1.1;
      } else {
        k = 3.5;
        a = 1400 / 2;
        b = 1300 / 4;
        r = 1.1;
      }
      centered = d;

      state.curr_dataset = state.curr_dataset.filter(function (d) {
        return d.region === country;
      });

      createBar(state.curr_country, state.curr_dataset, "white");
      createScatter(state.curr_country, state.curr_dataset);
    } else {
      scatter_title.text("Cuisines in All Countries");
      x = 1400 / 2;
      y = 1300 / 2;
      a = x;
      b = y;
      k = 1;
      centered = null;
      state.curr_dataset = Array.from(all);
      state.curr_country = "all";
      createBar(state.curr_country, state.curr_dataset, "white");
      createScatter(state.curr_country, state.curr_dataset);
      r = 3;
    }
    g.selectAll("path").classed(
      "active",
      centered &&
      function (d) {
        return d === centered;
      }
    );
    g.transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr(
        "transform",
        "translate(" +
        a +
        "," +
        b +
        ")scale(" +
        k +
        ")translate(" +
        -x +
        "," +
        -y +
        ")"
      )
      .style("stroke-width", 1.5 / k + "px");
    d3.selectAll("circle.map-point")
      .transition()
      .duration(750)
      .attr("r", r)
      .attr(
        "transform",
        "translate(" +
        a +
        "," +
        b +
        ")scale(" +
        k +
        ")translate(" +
        -x +
        "," +
        -y +
        ")"
      );
  }

  function zoomOut() {
    d3.select("#scatter-title").text("Cuisines in All Countries");
    d3.select("#bar-title").text("Prices for All Countries");
    r = 3;
    x = 1400 / 2;
    y = 1300 / 2;
    a = x;
    b = y;
    k = 1;
    centered = null;
    g.selectAll("path").classed("active", centered);
    g.transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr(
        "transform",
        "translate(" +
        a +
        "," +
        b +
        ")scale(" +
        k +
        ")translate(" +
        -x +
        "," +
        -y +
        ")"
      )
      .style("stroke-width", 1.5 / k + "px");
    d3.selectAll("circle.map-point")
      .transition()
      .duration(750)
      .attr("r", r)
      .attr(
        "transform",
        "translate(" +
        a +
        "," +
        b +
        ")scale(" +
        k +
        ")translate(" +
        -x +
        "," +
        -y +
        ")"
      );

    var new_dataset = [];
    var i;
    const NUM_STARS = 3;
    for (i = 0; i < NUM_STARS; i++) {
      if (d3.select('[id="' + (i + 1) + '"]').attr("isChecked") == "true") {
        new_dataset.push(sets[i]);
      }
    }

    new_dataset = d3.merge(new_dataset);

    state.curr_dataset = new_dataset; // update the state
    state.curr_country = "all"

    createBar("all", state.curr_dataset, "white"); // filtering for barchart
    createScatter("all", state.curr_dataset);
  }

  g.append("g")
    .attr("class", "countries")
    .selectAll("path.countries")
    .data(countries.features)
    .attr("id", "countries")
    .join("path")
    .attr("d", path)
    .on("click", clicked)
    .attr("cursor", "pointer");

  g.append("path")
    .datum(countriesMesh)
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("fill", "none")
    .attr("d", path);

  // FILTER FOR NUM_STARS CHECKBOXES
  d3.selectAll("input").attr("isChecked", "true")
  d3.selectAll("input").on("click", function () {
    selectedStars = this.id;
    this.isChecked = this.isChecked === undefined ? false : !this.isChecked;

    $(this).attr("isChecked", this.isChecked); // update the attr "isChecked" to true/false on click

    setVis = this.isChecked ? "" : "hidden";
    d3.selectAll("circle.map-point").each(function () {
      // filtering for map points
      let element = d3.select(this);
      if (element.attr("stars") === selectedStars) {
        element.attr("visibility", setVis);
      }
    });

    // updating the dataset in the state so we can update the bar chart (and also the scatter)
    var new_dataset = [];
    var i;
    const NUM_STARS = 3;
    for (i = 0; i < NUM_STARS; i++) {
      if (d3.select('[id="' + (i + 1) + '"]').attr("isChecked") == "true") {
        new_dataset.push(sets[i]);
      }
    }

    new_dataset = d3.merge(new_dataset);

    if (state.curr_country !== "all") {
      new_dataset = new_dataset.filter(function (d) {
        return d.region === state.curr_country;
      });
    }

    state.curr_dataset = new_dataset; // update the state


    createBar(state.curr_country, state.curr_dataset, "white"); // filtering for barchart
    createScatter(state.curr_country, state.curr_dataset);
  });

  // adding the function to back-button
  d3.select("#back-button").on("click", zoomOut);

  //   PLOTTING THE RESTAURANT POINTS
  function plotPoints() {
    all.forEach((d) => {
      d["proj_coordinate"] = projection([d["longitude"], d["latitude"]]);
    });

    // next we need to plot the points projected into our map-space
    // we'll do this by using a data join

    const POINT_RAD = 3;
    const OPACITY = 0.7;
    const point_colors = ["#5b0bbf", "darkcyan", "#990000"]; //   figure out color scheme later

    svg_map
      .selectAll("circle.map-point")
      .data(all)
      .enter()
      .raise()
      .append("circle")
      .attr("class", "map-point")
      .attr("cx", (d) => d.proj_coordinate[0])
      .attr("cy", (d) => d.proj_coordinate[1])
      .attr("r", POINT_RAD)
      .attr("opacity", OPACITY)
      .attr("stars", (d) => d.stars)
      .attr("name", (d) => d.name)
      .style("fill", (d) => point_colors[d.stars - 1]);
  }
  plotPoints();
  createScatter("all", all);
  createBar("all", all, "white");
};

requestData();

const createBar = async function (country, datasets, color) {
  svg = d3.select("#bar");
  svg.selectAll("*").remove();
  let margin = {
    top: 10,
    right: 10,
    bottom: 120,
    left: 60,
  };
  let chartWidth = svg.attr("width") - margin.left - margin.right;
  let chartHeight = svg.attr("height") - margin.top - margin.bottom;
  let annotations = svg.append("g").attr("id", "annotations");
  let chartArea = svg
    .append("g")
    .attr("id", "bars")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  if (country == "United Kingdom" || country == "Ireland") {
    chartArea
      .append("text")
      .attr("class", "bar")
      .attr("text-anchor", "middle")
      .text("No data available for the pricing of this country")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight / 2)
      .attr("font-weight", "bold")
      .attr("font-size", 20);
  } else {
    var price_dict = {
      $$$$$: 0,
      $$$$: 0,
      $$$: 0,
      $$: 0,
      $: 0,
    };

    datasets.forEach((d) => {
      price_dict[d["price"]]++;
    });
    maxNumber = function () {
      max = 0;
      for (let key in price_dict) {
        if (price_dict[key] > max) {
          max = price_dict[key];
        }
      }
      return max;
    };

    let xScale = d3
      .scaleBand()
      .domain(["$", "$$", "$$$", "$$$$", "$$$$$"])
      .range([0, chartWidth])
      .padding(0.15);

    let yScale = d3
      .scaleLinear()
      .domain([0, maxNumber() + 10])
      .range([chartHeight, 0]);

    let leftAxis = d3.axisLeft(yScale);
    let leftGridlines = d3
      .axisLeft(yScale)
      .tickSize(-chartWidth - 10)
      .tickFormat("");
    annotations
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${margin.left - 10},${margin.top})`)
      .call(leftAxis);
    annotations
      .append("g")
      .attr("class", "y gridlines")
      .attr("transform", `translate(${margin.left - 10},${margin.top})`)
      .call(leftGridlines);

    let bottomAxis = d3.axisBottom(xScale);
    annotations
      .append("g")
      .attr("class", "axis")
      .attr(
        "transform",
        `translate(${margin.left},${chartHeight + margin.top + 10})`
      )
      .call(bottomAxis);

    for (let key in price_dict) {
      if (key != "N/A") {
        chartArea
          .append("rect")
          .attr("class", "bar")
          .attr("fill", color)
          .attr("x", xScale(key)) // 0 because we have a translate() on the <g> tag for x location
          .attr("y", yScale(price_dict[key]))
          .attr("height", yScale(0) - yScale(price_dict[key]))
          .attr("width", xScale.bandwidth());
        chartArea
          .append("text")
          .style("fill", "white")
          .attr("class", "bar")
          .attr("text-anchor", "middle")
          .attr("font-size", "20px")
          .attr("x", xScale(key) + xScale.bandwidth() / 2)
          .attr("font-weight", "bold")
          .attr("y", yScale(price_dict[key]) - 10)
          .text(price_dict[key]);
      }
    }
  }
};

const createScatter = function (country, datasets) {
  let cuisineDict = {};
  let restaurants = {};

  datasets.forEach((d) => {
    if (d["cuisine"] in cuisineDict) {
      cuisineDict[d["cuisine"]]++;
      restaurants[d["cuisine"]].push(d);
    } else {
      cuisineDict[d["cuisine"]] = 1;
      restaurants[d["cuisine"]] = [d];
    }
  });

  // console.log(restaurants);
  // Lollipop chart
  svg = d3.select("#scatter");
  svg.selectAll("*").remove();
  let margin = {
    top: 10,
    right: 10,
    bottom: 120,
    left: 60,
  };
  let chartWidth = svg.attr("width") - margin.left - margin.right;
  let chartHeight = svg.attr("height") - margin.top - margin.bottom;

  let annotations = svg.append("g").attr("id", "annotations");
  let chartArea = svg
    .append("g")
    .attr("id", "points")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  let mouseover = svg
    .append("g")
    .attr("class", "mouseover")
    .attr("clicked", false)
    .attr("transform", `translate(${margin.left + 15},${margin.top + 15})`);

  function stringLen(str) {
    const dummytext = mouseover
      .append("text")
      .attr("class", "legendtext")
      .attr("visibility", "hidden");
    dummytext.text(str);
    let len = dummytext.node().getComputedTextLength();
    dummytext.remove();
    return len;
  }
  let frame = mouseover
    .append("rect")
    .attr("class", "frame")
    .attr("x", 0)
    .attr("y", 0)
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("height", 50);
  let textbox = mouseover.append("g").attr("transform", "translate(10,10)");

  function updateMouseover(d) {
    textbox.html("");

    let cuisineName = `Cuisine: ${d[0]}`;
    let percentage = `Percentage: ${d3.format(".2%")(d[1])}`;

    let maxWidth = Math.max(stringLen(cuisineName), stringLen(percentage));
    frame.attr("width", maxWidth + 30);

    textbox.append("text").text(cuisineName).attr("x", 0).attr("y", 10)
    textbox.append("text").text(percentage).attr("x", 0).attr("y", 30);
  }

  let total = d3.sum(Object.values(cuisineDict));
  cuisineDict = Object.entries(cuisineDict).sort((a, b) =>
    d3.ascending(a[1], b[1])
  );
  cuisineDict.forEach((d) => (d[1] = d[1] / total));


  let dataExtent = d3.extent(cuisineDict, (d) => d[1]);
  let percentScale = d3
    .scaleLinear()
    .domain([0, dataExtent[1]])
    .range([chartHeight, 0]);

  let cuisines = d3.map(cuisineDict, (d) => d[0]);
  let cuisineScale = d3
    .scalePoint()
    .domain(cuisines)
    .range([0, chartWidth])
    .padding(0.1);

  let leftAxis = d3.axisLeft(percentScale).tickFormat(d3.format(".0%"));
  let leftGridlines = d3
    .axisLeft(percentScale)
    .tickSize(-chartWidth - 10)
    .tickFormat("");
  annotations
    .append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${margin.left - 10},${margin.top})`)
    .call(leftAxis);
  annotations
    .append("g")
    .attr("class", "y gridlines")
    .attr("transform", `translate(${margin.left - 10},${margin.top})`)
    .call(leftGridlines);

  let bottomAxis = d3
    .axisBottom(d3.scaleLinear().domain([0, 1]).range([0, chartWidth]))
    .ticks(0);
  annotations
    .append("g")
    .attr("class", "x axis")
    .attr(
      "transform",
      `translate(${margin.left},${chartHeight + margin.top + 10})`
    )
    .call(bottomAxis);

  let lollipops = chartArea
    .selectAll("g.lollipop")
    .data(cuisineDict)
    .join("g")
    .attr("class", "lollipop")
    .attr("transform", (d) => `translate(${cuisineScale(d[0])},0)`);

  let circle = lollipops
    .append("circle")
    .attr("class", "pop")
    .attr("r", 4)
    .attr("fill", "white")
    .attr("cx", 0) // 0 because we have a translate() on the <g> tag for x location
    .attr("cy", (d) => percentScale(d[1]))
    .attr("cuisine", (d) => d[0]);

  circle.on("mouseover", function (d) {
    mouseover.attr("clicked", false)
    mouseOut(clickedCircle)
    mouseover.attr("visibility", "");
    updateMouseover(d3.select(this).datum());
    d3.select(this)
      .transition()
      .duration(200)
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("r", 6)
      .attr("fill", "#ffcc99");
  });

  circle.on("mouseout", function () {
    if (mouseover.attr("clicked") === "true") {
      return
    }
    mouseOut(d3.select(this));
  });

  function mouseOut(c) {
    mouseover.attr("visibility", "hidden");
    c
      .transition()
      .duration(200)
      .attr("stroke-width", 0)
      .attr("r", 4)
      .attr("fill", "white");
  }

  circle.on("click", function () {
    // change the title of the bar to reflect the cuisine change
    mouseover.attr("clicked", true)
    clickedCircle = circle;
    svg_title = d3.select("#bar-title");
    svg_title.text("Prices for " + d3.select(this).attr("cuisine"));

    createBar(country, restaurants[d3.select(this).attr("cuisine")], "#ffcc99");
  });
  let clickedCircle = circle;
};

// onclick move through sections
const go_action_button = d3.select("#go-action");

// move from section-0 (title page) to section-1 (map) by clicking down arrow
go_action_button.on("click", function () {
  $("html,body").animate({
    scrollTop: $("#section-1").offset().top,
  },
    "slow"
  );

  $("#more-details").animate({
    opacity: 100,
  },
    5000
  );

  $("#more-details").css("visibility", "visible");
});

const more_details_button = d3.select("#more-details");
var more_details_state = "map"; // this is either going to be map or graphs

// move from section-1 (map) to section-2 (graphs) by clicking more-details button
more_details_button.on("click", function () {
  if (more_details_state == "map") {
    $("html,body").animate({
      scrollTop: $("#section-2").offset().top,
    },
      "slow"
    );
    more_details_button.text("back to map");
    more_details_state = "graphs";
  } else if (more_details_state == "graphs") {
    $("html,body").animate({
      scrollTop: $("#section-1").offset().top,
    },
      "slow"
    );
    more_details_button.text("more details");
    more_details_state = "map";
  }
});

// if you scroll back to the top remove the more-details button
$(document).scroll(function () {
  var scrollPos = $(document).scrollTop();
  if (scrollPos < 50) {
    $("#more-details").css("visibility", "hidden");
  }
  if (
    scrollPos >= $(window).height() / 2 &&
    scrollPos < 1.5 * $(window).height()
  ) {
    $("#more-details").css("opacity", "100");
    $("#more-details").css("visibility", "visible");
    $("#more-details").text("more details");
    more_details_state = "map";
  }
  if (scrollPos >= 1.5 * $(window).height()) {
    $("#more-details").css("opacity", "100");
    $("#more-details").css("visibility", "visible");
    $("#more-details").text("back to map");
    more_details_state = "graphs";
  }
});