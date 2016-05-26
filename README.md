# caffn8r

NOTE: probably need to host this on server, not with my developer key
NOTE: caffn8r.com purchased 

(1) Set the radius you want to search within for the coffee shops. Can choose "my location"? Or if easiest just choose a city or neighborhood (http://www.yelp.com/search?find_desc=coffee&find_loc=Beacon+Hill%2C+Seattle%2C+WA&ns=1)
(2) This will query the Google API and Yelp API the results will come back
(3) You can narrow or widen the search radius with a dynamic "range" bar...maybe?
(4) There will be 2 visuals. Diets will be a large word cloud that pulls in all the text from (1) yelp (2) twitter (3) facebook and (4) other social media (?) The second will be the google map with points (shown as coffee beans) for each coffee shop found. 
(5) You can click on words and then the coffee shops with the most mentions show up in descending order? You also click on the points on the map and it automatically generates a word cloud for that map. Clicking on any word in the word cloud pulls up all the mentions below in Yelp, social media etc. Need to make sure to exclude lots of common words like "the", "it", etc. 
(6) use firebase to allow users to post comments and make this its own mini Yelp 
(7) Use https://data.seattle.gov/ for cool things like distance to XYZ?

Search parameters (click these to pre populate the word cloud search criteria...can select multiple ones perhaps? Ie user clicks "almond milk" and "wifi" to try to narrow ones where people mentioned these in relation to this coffee shop?):
-Milks available (make their own?)
-Study/work/linger environment (wifi, tables, vibe) (text = "good wifi")
-power outlets available 
-Source of beans (text = "roasted onsite" or "roasted by __"
-Food options (text = "home made"
-Near me search radius?

Word cloud https://github.com/jasondavies/d3-cloud

APIs (for what people are saying about these shops)
1) https://www.yelp.com/developers/documentation/v2/search_api
2) Facebook APIs
3) Twitter API
4) Google API
5) foursquare API https://developer.foursquare.com/start/search

Extras:
Music
Art
Merchandise




