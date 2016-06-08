$(document).ready(function() {

$('#location-search').on('submit', function(e) {
    e.preventDefault();

    var location = $(this).find('input').val();

    $.ajax({
        url: 'https://nominatim.openstreetmap.org/search/{{term}}?format=json&addressdetails=1'.replace('{{term}}', location)
    }).then(function(res) {

        searchYelp(res[0].lat, res[0].lon);
        map.panTo(new L.LatLng(res[0].lat, res[0].lon), 13);
        $("#wordcloud").empty();
        $("#business-info").empty();
        $("#facomments").addClass("fa-spin fa-3x fa-fw");
        //resize wordcloud so it is 100% when you resize page
        //how to view on raw git?
    })

});

var businessWords;
var businessInfo;

// PUT YOUR KEYS HERE
var keys = {
    consumer_key: '1sQO6VG_mdXNkedsMVeMKw',
    consumer_secret: 'Blj3AM-0SIJirxNl_md4JsBMFDE',
    token: '-FwwA5NLdb7TSEKBDXSglrjDCfHSS-EN',
    token_secret: 'JfGBdnqOKTF_OiZrxeWkWr9JqWU'
};


navigator.geolocation.getCurrentPosition(function(position) {

    console.log(position);

    searchYelp(position.coords.latitude, position.coords.longitude);

}, function() {
    searchYelp();
});


function searchYelp(lat, lng) {
    searchHelper().catch(function(err) {
        console.log(err.stack);
        searchYelp();
    });

    function searchHelper() {
        // return search('coffee', 47.609895, -122.33025)
        return search('coffee', lat || 47.609895, lng || -122.33025)
            .then(res => {
                const template = document.getElementById('business-template').innerHTML;
                const container = document.getElementsByClassName('businesses')[0];

                var max = 0;

                businessWords = {};
                businessInfo = {};

                // document.getElementById('numBiz').textContent = res.businesses.length;

                // Get all the words and counts of each word
                const wordMap = res.businesses.reduce((acc, business) => {

                    businessInfo[business.id] = business;

                    var snippetWords = business.snippet_text.toLowerCase().replace(/[^\w ]/g, '').split(' ');

                    snippetWords.forEach(word => {
                        if (stopWords[word]) return;

                        businessWords[word] = (businessWords[word] || {});
                        businessWords[word][business.id] = true;

                        acc[word] = (acc[word] || 0) + 1;

                    });

                    return acc;
                }, {});

                // Find the most common word
                Object.keys(wordMap).forEach(word => {
                    max = Math.max(wordMap[word], max);
                });

                console.log(max, wordMap);

                const words = Object.keys(wordMap).map(word => {
                    return {
                        text: word,
                        size: 10 + 100 * (wordMap[word] / max)
                    }
                });

                Object.keys(businessWords).forEach(function(word) {
                    businessWords[word] = Object.keys(businessWords[word]);
                });

                drawCloud(words);
                $("#facomments").removeClass("fa-spin fa-3x fa-fw");

                const items = res.businesses.map(business => compile(template, business));


                container.innerHTML = items
                    .reduce((acc, n, i) => {
                        acc[i % 1] = (acc[i % 1] || []).concat(n);
                        return acc;
                    }, [])
                    .map(col => `<div class="col">${col.join('')}</div>`)
                    .join('');
            });
    }
}

document.body.addEventListener('click', function(event) {

    var target = event.target;

    if (target.nodeName === 'text') {

        $("#business-info").empty();

        const ids = businessWords[event.target.textContent];

        [].slice.call(document.getElementsByClassName('business-list-item')).forEach(function(item) {
            item.style.fontWeight = 300;
        });

        const businesses = ids.map(function(id) {

            var listElement = document.getElementById('business-' + id);

            listElement.style.fontWeight = 900;

            return businessInfo[id];

        });

        console.log(businesses);

        map.removeLayer(businessLayer);

        var points = businesses.map(function(business) {
            return [
                business.location.coordinate.latitude,
                business.location.coordinate.longitude
            ];
        });


        var coffeeIcon = L.icon({ iconUrl: 'coffee-bean.png', shadowUrl: 'coffee-bean.png', iconSize: [75, 75] });


        var markers = points.map(function(coords, i) {

            if (businesses[i].location.cross_streets === undefined || businesses[i].location.neighborhoods === undefined) {
                return L.marker(coords, { icon: coffeeIcon })
                    .bindPopup("<b>Hello!</b><br>My name is " + businesses[i].name + '.');

            } else return L.marker(coords, { icon: coffeeIcon }).bindPopup("<b>Hello!</b><br>My name is " + businesses[i].name + '. I\'m located at ' + businesses[i].location.cross_streets + ' in ' + businesses[i].location.neighborhoods + '.');

        });

        businessLayer = L.layerGroup(markers)
            .addTo(map);



    } else if (target.classList.contains('business-link')) {

        event.preventDefault();
        map.removeLayer(businessLayer);

        var business = businessInfo[target.dataset.id];

        console.log(business);

        var points = [
            [
                business.location.coordinate.latitude,
                business.location.coordinate.longitude
            ]
        ];

        console.log(points);

        var coffeeIcon = L.icon({ iconUrl: 'coffee-bean.png', shadowUrl: 'coffee-bean.png', iconSize: [75, 75] });

        var marker = points.map(function(coords, i) {
            if (business.location.cross_streets === undefined || business.location.neighborhoods === undefined) {
                return L.marker(coords, { icon: coffeeIcon })
                    .bindPopup("<b>Hello!</b><br>My name is " + business.name + '.');

            } else return L.marker(coords, { icon: coffeeIcon }).bindPopup("<b>Hello!</b><br>My name is " + business.name + '. I\'m located at ' + business.location.cross_streets + ' in ' + business.location.neighborhoods + '.');
        });

        businessLayer = L.layerGroup(marker).addTo(map);

        const template = document.getElementById('business-info-template').innerHTML;
        const container = document.getElementById('business-info');

        container.innerHTML = compile(template, business);

    }
});


function compile(template, obj) {
    return template.replace(/\{\{([^\}]+)\}\}/g, (match, capture, index) => {
        const path = capture.split('.');
        const replacement = path.reduce((acc, prop) => {
            if (acc) {
                return acc[prop];
            }
        }, obj);
        return replacement || '';
    });
}


function search(term, lat, lng) {

    return new Promise(function(resolve, reject) {

        function randomString(length, chars) {
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
            return result;
        }

        const callback = 'callback_' + randomString(10, '0123456789');

        var method = 'GET';
        var url = 'https://api.yelp.com/v2/search';
        var params = {
            callback: callback,
            ll: lat + ',' + lng,
            oauth_consumer_key: keys.consumer_key, //Consumer Key
            oauth_token: keys.token, //Token
            oauth_signature_method: "HMAC-SHA1",
            oauth_timestamp: new Date().getTime(),
            oauth_nonce: randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
            term: term
        };

        var consumerSecret = keys.consumer_secret; //Consumer Secret
        var tokenSecret = keys.token_secret; //Token Secret
        var signature = oauthSignature.generate(method, url, params, consumerSecret, tokenSecret, {
            encodeSignature: false
        });

        params['oauth_signature'] = signature.replace(/ /g, '%20').replace(/\+/g, '%2B');

        var fullUrl = url + '?' + Object.keys(params).map(n => `${n}=${params[n]}`).join('&');

        var script = document.createElement('script');

        window[callback] = function(data) {
            script.remove();
            delete window[callback];
            resolve(data);
        };

        var failureTimeout = setTimeout(function() {
            reject(new Error('Failed to load'));
        }, 1000 * 2);

        script.onload = function() {
            console.log('onload called');
            if (!this.readyState || this.readyState == "loaded" || this.readyState == "complete") {
                console.log('loaded!');
                clearTimeout(failureTimeout);
            } else {
                reject(new Error('failed to load'));
            }
        };

        script.src = fullUrl;

        document.body.appendChild(script);

    });
}


const stopWords = [
    "a",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "aren't",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can't",
    "cannot",
    "could",
    "couldn't",
    "did",
    "didn't",
    "do",
    "does",
    "doesn't",
    "doing",
    "don't",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "hadn't",
    "has",
    "hasn't",
    "have",
    "haven't",
    "having",
    "he",
    "he'd",
    "he'll",
    "he's",
    "her",
    "here",
    "here's",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "how's",
    "i",
    "i'd",
    "i'll",
    "i'm",
    "i've",
    "if",
    "in",
    "into",
    "is",
    "isn't",
    "it",
    "it's",
    "its",
    "itself",
    "let's",
    "me",
    "more",
    "most",
    "mustn't",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "ought",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
    "same",
    "shan't",
    "she",
    "she'd",
    "she'll",
    "she's",
    "should",
    "shouldn't",
    "so",
    "some",
    "such",
    "than",
    "that",
    "that's",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "there's",
    "these",
    "they",
    "they'd",
    "they'll",
    "they're",
    "they've",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "wasn't",
    "we",
    "we'd",
    "we'll",
    "we're",
    "we've",
    "were",
    "weren't",
    "what",
    "what's",
    "when",
    "when's",
    "where",
    "where's",
    "which",
    "while",
    "who",
    "who's",
    "whom",
    "why",
    "why's",
    "with",
    "won't",
    "would",
    "wouldn't",
    "you",
    "you'd",
    "you'll",
    "you're",
    "you've",
    "your",
    "yours",
    "yourself",
    "yourselves"
].reduce((acc, word) => {
    acc[word] = true;
    return acc;
}, {})

//google map

// function initMap() {
//     var mapDiv = document.getElementById('map');
//     var map = new google.maps.Map(mapDiv, {
//         center: { lat: 47.609895, lng: -122.33025 },
//         zoom: 12
//     });
// }

//<!-- leaflet -->

var map = L.map('thisLeaflet').setView([47.609895, -122.33025], 13);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>  ',
    maxZoom: 18,
    id: 'pkohn.089fnpkl',
    accessToken: 'pk.eyJ1IjoicGtvaG4iLCJhIjoiY2lvcTNhaHdhMDAwanVlbTBvazIxNTVzeSJ9.242ozghNdV0FkcK1B9CO8Q'
}).addTo(map);

var points = [];

var markers = points.map(function(coords) {
	return L.marker(coords);
});

var businessLayer =L.layerGroup(markers)
    .addTo(map);

// businessLayer.removeFrom(map);

});
