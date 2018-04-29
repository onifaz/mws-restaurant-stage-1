/**
 * Common database helper functions.
 */
class DBHelper {
  // TODO: DELETE OLD – stage1 - CODE
  /**
   * Database URL. -> NO MORE! now from REST_URL!
   * Change this to restaurants.json file location on your server.
   */
  /* static get DATABASE_URL() {
    const port = 8000; // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`;
  } */

  /**
   * REST Api URL -> Pointing to mws-restaurant-page-2 server
   * Change this to the URL of your server.
   */
  static get REST_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/`;
  }

  /**
   * IDB name
   */
  static get IDB_NAME() {
    return 'restareviews';
  }
  /**
   * iDB version
   */
  static get IDB_VERSION() {
    return 1;
  }
  /**
   * iDB store name for restaurants
   */
  static get IDB_STORE_RESTAURANTS() {
    return 'restaurants';
  }

  /**
   * Get indexDB (better -> get IDB but promised)
   */
  static openIDB() {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    return idb.open(DBHelper.IDB_NAME, DBHelper.IDB_VERSION, upgradeDb => {
      var storeRestaurants = upgradeDb.createObjectStore(
        DBHelper.IDB_STORE_RESTAURANTS,
        {
          keyPath: 'id',
          autoIncrement: true
        }
      );
      //store.createIndex('by-date', 'time'); //TODO: delete wittr example code
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // TODO: DELETE OLD – stage1 - CODE
    // let xhr = new XMLHttpRequest();
    // xhr.open('GET', DBHelper.DATABASE_URL);
    // xhr.onload = () => {
    //   if (xhr.status === 200) {
    //     // Got a success response from server!
    //     const json = JSON.parse(xhr.responseText);
    //     const restaurants = json.restaurants;
    //     callback(null, restaurants);
    //   } else {
    //     // Oops!. Got an error from server.
    //     const error = `Request failed. Returned status of ${xhr.status}`;
    //     callback(error, null);
    //   }
    // };
    // xhr.send();
    DBHelper.openIDB()
      .then(db => {
        if (!db) return;
        return db
          .transaction(DBHelper.IDB_STORE_RESTAURANTS)
          .objectStore(DBHelper.IDB_STORE_RESTAURANTS)
          .getAll();
      })
      .then(idb_data => {
        if (idb_data && idb_data.length > 0) return callback(null, idb_data);
        else {
          fetch(DBHelper.REST_URL + 'restaurants')
            .then(response => {
              //if restaurants are fetched, parse the JSON response
              return response.json();
            })
            .then(restaurants => {
              //save restaurants in db and serve the downloaded response
              DBHelper.openIDB().then(db => {
                if (!db) return;
                const store = db
                  .transaction(DBHelper.IDB_STORE_RESTAURANTS, 'readwrite')
                  .objectStore(DBHelper.IDB_STORE_RESTAURANTS);
                restaurants.forEach(function(restaurant) {
                  store.put(restaurant);
                });
              });
              return callback(null, restaurants);
            })
            .catch(err => {
              console.log('Request failed. Returned status of', err);
            });
        }
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return restaurant.photograph
      ? `img/restaurants/${restaurant.photograph}.jpg`
      : 'img/no-image-available.svg';
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
