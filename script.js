var main = function() {
    
    // retrieve text entered into the input
    $('form').submit(function(event) {
        document.getElementById("demo").innerHTML = "";
        
        var $input = $(event.target).find('input');
        var zip = $input.val();
        
        // if the zip code is valid, process the data from Yahoo's API and display the graphs
        if (checkZip(zip)) {
            $.ajax ({ url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.places%20where%20text%3D%22" + zip + "%22&format=json&diagnostics=true&callback="  ,
                success: process});
        } else {
            displayInvalidZip();
        }

        $input.val(""); // clear the form
        return false;
    });

}

// takes the JSON data returned from the yahoo call and get the WOEID, then displays the statistics
function process(data) {
    var woeid = data.query.results.place[0].woeid;

    // use the local browser session storage to store stuff
    // check if the browser supports the session storage
    if(typeof(Storage) !== "undefined") {
        //sessionStorage.woeid = woeid; // create a new variable in the session storage and set equal

        $.ajax({url: "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%3D" + woeid + "&format=json&diagnostics=true&callback=",
            success: function(data) {
                displayStats(data);
            }});
    }
}

// From the JSON output, get the weather information and store it in the web browser's sessionStorage.
// Then, display the graphs and comparisons.
function displayStats(data) {
    // get basic information about the city and current weather
    var channel = data.query.results.channel;
    var mycity = channel.location.city;
    var display = "Weather in " + mycity;
    var currentDeg = channel.item.condition.temp;
    var currentText =  channel.item.condition.text;
    var mychill = channel.wind.chill;

    // get the forecast information
    var forecastHigh = new Array();
    var forecastLow = new Array();
    var forecastText = new Array();
    var forecastDay = new Array();
    var forecastDate = new Array();
    for(var i = 0; i < 10; i++) {
        var forecast = channel.item.forecast[i];
        forecastHigh.push(forecast.high);
        forecastLow.push(forecast.low);
        forecastText.push(forecast.text);
        forecastDay.push(forecast.day);
        forecastDate.push(forecast.date);
    }

    // store the information into a javascript object
    // the City object contains information about the current weather and the forecasts
    var currentCity = {
        city: mycity,
        deg: currentDeg,
        text: currentText,
        chill: mychill,
        highs: forecastHigh,
        lows: forecastLow,
        dates: JSON.stringify(forecastDate)
    };

    // switch out the old city for the newly entered one if one already exists
    if(sessionStorage.getItem("city1") != null) {
        // switch the cities and display the new city in the first section
        var temp = sessionStorage.getItem("city1");
        sessionStorage.setItem("city2", temp);
        sessionStorage.setItem("city1", JSON.stringify(currentCity)); // sessionStorage only takes key/value strings
        displayGraph(1);
        displayGraph(2);
        compareCities();
    } else {
        // no cities have been entered yet, just plot the one city
        sessionStorage.setItem("city1", JSON.stringify(currentCity));
        displayGraph(1);
    }
}

// Once two city zip codes have been entered, compare the weather information and display this comparison
function compareCities() {
    var city1 = JSON.parse(sessionStorage.getItem("city1"));
    var city2 = JSON.parse(sessionStorage.getItem("city2"));
    var display = city1.city + " is currently " + city1.deg + "F and " + city1.text.toLowerCase() + ", and feels like " + city1.chill + "F.<br>";
    display += city2.city + " is currently " + city2.deg + "F and " + city2.text.toLowerCase() + ", and feels like " + city2.chill + "F.<br>";
    document.getElementById("compare").innerHTML = display;
}

// Displays the graph of city1 or city2 in the appropriate HTML div.
// cityNum should be 1 for city1 or any other number for city2
function displayGraph(cityNum) {
    var TESTER, place;
    if(cityNum == 1) {
        TESTER = document.getElementById('tester');
        place = (JSON.parse(sessionStorage.getItem("city1")));
    } else {
        TESTER = document.getElementById('tester2');
        place = (JSON.parse(sessionStorage.getItem("city2")));
    }

    // setting up the plot
    var dates = JSON.parse(place.dates);
    var trace1 = {
        x: dates,
        y: place.lows,
        mode: 'lines',
        name: 'Low'
    };

    var trace2 = {
        x: dates,
        y: place.highs,
        mode: 'lines',
        name: 'High'
    };

    var data = [ trace1, trace2 ];

    var layout = {
        title: "Weather in " + place.city,

        xaxis: {
            title: 'Date'
        },
        yaxis: {
            title: 'Temp (F)'
        }
    };

    Plotly.newPlot(TESTER, data, layout);
}

// checks that the zip is a 5 digit string
function checkZip(zip) {
    if(zip.length == 5){
        for(var i = 0; i < 5; i++){
            var c = zip.charAt(i);
            if(c < '0' || c > '9') return false;
        }
    } else {
        return false;
    }
    return true;
}

// Message to display when the zip code is not valid
function displayInvalidZip() {
    document.getElementById("demo").innerHTML = "Sorry, invalid zip code. Try again.";
}

$(document).ready(main);

