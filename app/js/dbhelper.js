/**
 * Common database helper functions.
 */
class DBHelper {
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
   * iDB store name for reviews
   */
  static get IDB_STORE_REVIEWS() {
    return 'reviews';
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
      const storeRestaurants = upgradeDb.createObjectStore(
        DBHelper.IDB_STORE_RESTAURANTS,
        {
          keyPath: 'id',
          autoIncrement: true
        }
      );
      const storeReviews = upgradeDb.createObjectStore(
        DBHelper.IDB_STORE_REVIEWS,
        {
          keyPath: 'id',
          autoIncrement: true
        }
      );
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
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
   * Restaurant page image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (!restaurant.photograph) {
      return DBHelper.imageErrorForRestaurant(restaurant);
    } else {
      // ref, for sizes and srcset
      //basic -->small+medium
      //media="(min-width:401px) and (max-width:600px), (min-width:992px) and (max-width:1199)" -->medium + normal
      //media="(min-width:601px) and (max-width:991px), (min-width:1200px)" --> normal
      //sizes="(max-width:991px) 100vw, 50vw"
      const sizes = '(max-width:991px) 75vw, 45vw';
      return DBHelper.imagePictureforRestaurant(restaurant, sizes);
    }
  }
  /**
   * Home page image URL.
   */
  static imageUrlForRestaurants(restaurant) {
    if (!restaurant.photograph) {
      return DBHelper.imageErrorForRestaurant(restaurant);
    } else {
      const sizes =
        '(max-width: 679px) 400px, (max-width: 989px) and (min-width: 680px) 48vw, (min-width:990px) 350px, (min-width:1780px) 400px';
      return DBHelper.imagePictureforRestaurant(restaurant, sizes);
    }
  }

  /**
   * Error image
   */
  static imageErrorForRestaurant(restaurant) {
    const div = document.createElement('div');
    const image = document.createElement('img');
    div.className = 'restimage-wrap';
    image.className = 'restaurant-img';
    //image.src = 'img/no-image-available.svg';
    image.setAttribute('data-src', 'img/no-image-available.svg');
    image.setAttribute(
      'alt',
      'No photo available for ' + restaurant.name + ' restaurant'
    );
    div.append(image);
    return div;
  }

  /**
   * Create picture for image
   */
  static imagePictureforRestaurant(restaurant, sizes) {
    const picture = document.createElement('picture');
    const sourcew = document.createElement('source');
    sourcew.setAttribute('sizes', sizes);
    sourcew.setAttribute('type', 'image/webp');
    /*sourcew.setAttribute(
      'srcset',
      DBHelper.imageSrcsetForRestaurant(restaurant.photograph, 'webp')
    );*/
    sourcew.setAttribute(
      'data-srcset',
      DBHelper.imageSrcsetForRestaurant(restaurant.photograph, 'webp')
    );
    picture.append(sourcew);
    const sourcej = document.createElement('source');
    sourcej.setAttribute('sizes', sizes);
    /*sourcej.setAttribute(
      'srcset',
      DBHelper.imageSrcsetForRestaurant(restaurant.photograph, 'jpg')
    );*/
    sourcej.setAttribute(
      'data-srcset',
      DBHelper.imageSrcsetForRestaurant(restaurant.photograph, 'jpg')
    );
    picture.append(sourcej);
    const image = document.createElement('img');
    image.className = 'restaurant-img';
    //image.src = `img/restaurants/${restaurant.photograph}.jpg`;
    image.setAttribute(
      'data-src',
      `img/restaurants/${restaurant.photograph}.jpg`
    );
    image.setAttribute('alt', 'Photo of ' + restaurant.name + ' restaurant');
    picture.append(image);
    return picture;
  }

  /**
   * Create srcset string
   */
  static imageSrcsetForRestaurant(imageName, ext) {
    return `img/restaurants/${imageName}.${ext} 860w, img/restaurants/${imageName}-720.${ext} 780w, img/restaurants/${imageName}-540.${ext} 580w, img/restaurants/${imageName}-350.${ext} 420w`;
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

  /**
   * Retrieve review per specific restaurant id
   */
  static fetchReviewsForRestaurant(id, callback) {
    DBHelper.openIDB()
      .then(db => {
        if (!db) return;
        return db
          .transaction(DBHelper.IDB_STORE_REVIEWS)
          .objectStore(DBHelper.IDB_STORE_REVIEWS)
          .getAll();
      })
      .then(idb_data => {
        id = parseInt(id); //for strict comparison
        idb_data = idb_data.filter(r => r.restaurant_id === id);
        if (idb_data && idb_data.length > 0) {
          console.log('fromIDB');
          return callback(null, idb_data);
        } else {
          console.log('fromAPI');
          fetch(DBHelper.REST_URL + 'reviews/?restaurant_id=' + id)
            .then(response => {
              //if restaurants are fetched, parse the JSON response
              return response.json();
            })
            .then(reviews => {
              //save restaurants in db and serve the downloaded response
              DBHelper.openIDB().then(db => {
                if (!db) return;
                const store = db
                  .transaction(DBHelper.IDB_STORE_REVIEWS, 'readwrite')
                  .objectStore(DBHelper.IDB_STORE_REVIEWS);
                reviews.forEach(function(review) {
                  store.put(review);
                });
              });
              return callback(null, reviews);
            })
            .catch(err => {
              //console.error('Request failed. Returned status of', err);
              console.error('Request failed');
              return callback(err, null);
            });
        }
      });
  }
  /**
   * Fetch reviews by restaurant id
   */
  static fetchReviewsByRestaurantId(id, callback) {
    DBHelper.fetchReviewsForRestaurant(id, (error, reviews) => {
      if (error) callback(error, null);
      else {
        const reviewsList = reviews;
        if (reviewsList) {
          // Got the reviews
          callback(null, reviewsList);
        } else {
          // Couldn't find reviews in the database
          callback('Reviews do not exist', null);
        }
      }
    });
  }
}
