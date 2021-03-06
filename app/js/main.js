let restaurants, neighborhoods, cuisines, mainmap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
  lazyload();

  // Alternative to SW Background SYNC
  // if (navigator.onLine) {
  //   DBHelper.syncAllData();
  // }
  // window.addEventListener('online', function() {
  //   DBHelper.syncAllData();
  // });
  // window.addEventListener('offline', function() {
  //   console.info('It seems we are offline at the moment...');
  // });
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.mainmap = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  //updateRestaurants();
  if (typeof google === 'object' && typeof google.maps === 'object')
    addMarkersToMap();
};

/**
 * Add google map only on request of interactivity
 */
addGmapMain = () => {
  document
    .getElementById('map-container')
    .setAttribute('class', 'map--requested');
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBN-_N7NAK_k8QKsoHe6pd4M8aIhA1HX6E&libraries=places&callback=initMap`;
  script.type = 'text/javascript';
  document.body.appendChild(script);
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
        lazyload();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  if (typeof google === 'object' && typeof google.maps === 'object')
    addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement('li');
  const article = document.createElement('article');
  article.setAttribute('role', 'article');
  const div = document.createElement('div');
  div.setAttribute('class', 'rest-info');

  const image = DBHelper.imageUrlForRestaurants(restaurant);
  article.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  div.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.setAttribute('class', 'neighborhood');
  div.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.setAttribute('class', 'address');
  div.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute(
    'aria-label',
    'View Details for ' + restaurant.name + ' restaurant'
  );
  more.href = DBHelper.urlForRestaurant(restaurant);
  div.append(more);

  const favoriteBtn = document.createElement('button');
  favoriteBtn.setAttribute('class', 'favorite-button');
  const status = restaurant.is_favorite == 'true' ? 'true' : 'false';
  setFavoriteButton(favoriteBtn, status, restaurant);
  // if (status === 'false')
  //   favoriteBtn.setAttribute(
  //     'arial-label',
  //     `Add ${restaurant.name} to your favorite list.`
  //   );
  favoriteBtn.addEventListener('click', event => {
    favoriteRestaurant(event.target, restaurant);
  });
  div.append(favoriteBtn);

  article.append(div);
  li.append(article);

  return li;
};

/*
 * Set status (text and class) for favorite button
 */
setFavoriteButton = (target, status, restaurant) => {
  if (status === 'true') {
    target.classList.add('is-favorite');
    target.innerHTML = '&#9733; Favorite';
    target.setAttribute(
      'arial-label',
      `${
        restaurant.name
      } is one of your favorite restaurants. Click to remove it from your favorites' list`
    );
  } else {
    target.classList.remove('is-favorite');
    target.innerHTML = '&#9734; Add to favorite';
    target.setAttribute(
      'arial-label',
      `Add ${restaurant.name} to your favorite list.`
    );
  }
};

/*
 * Restaurant function add-to or remove-from favorites
 */
favoriteRestaurant = (target, restaurant) => {
  if (target.className.indexOf('is-favorite') > -1) {
    setFavoriteButton(target, 'false');
    DBHelper.favoriteRestaurant(restaurant, 'false');
  } else {
    setFavoriteButton(target, 'true');
    DBHelper.favoriteRestaurant(restaurant, 'true');
  }
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  if (restaurants)
    // Added because sometimes gmap is faster than resta server
    restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.mainmap);
      google.maps.event.addListener(marker, 'click', () => {
        window.location.href = marker.url;
      });
      if (self.markers) self.markers.push(marker);
    });
};
