let restaurant, map;

document.addEventListener('DOMContentLoaded', event => {
  /* Populate the page without waiting for google maps*/
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      console.error(error);
    }
  });
  if (window.innerWidth >= 992) {
    const mapBtn = document.getElementById('map').getElementsByTagName('a')[0];
    window.setTimeout(mapBtn.click(), 250);
  }
});

/**
 * Initialize Google map, called from HTML.
 */
window.initDetailMap = () => {
  if (self.restaurant) {
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: self.restaurant.latlng,
      scrollwheel: false
    });
    //updateRestaurants();
    if (typeof google === 'object' && typeof google.maps === 'object')
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  }
};
/**
 * Add google map only on request of interactivity
 */
addGmapDetail = () => {
  document
    .getElementById('map-container')
    .setAttribute('class', 'map--requested');
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBN-_N7NAK_k8QKsoHe6pd4M8aIhA1HX6E&libraries=places&callback=initDetailMap`;
  script.type = 'text/javascript';
  document.body.appendChild(script);
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      document.title = self.restaurant.name + ' Restaurant Info';
      fillBreadcrumb();
      fillRestaurantHTML();
      lazyload();
      callback(null, restaurant);
    });
  }
};
/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute('tabindex', '0');

  const imageDiv = document.getElementById('restaurant-img');
  const image = DBHelper.imageUrlForRestaurant(restaurant);
  imageDiv.append(image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  //fillReviewsHTML();
  fetchReviews();
};

/**
 * Get current restaurant from page URL.
 */
fetchReviews = callback => {
  if (self.restaurant.reviews) {
    // reviews already fetched!
    fillReviewsHTML();
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
      self.restaurant.reviews = reviews;
      if (!reviews) {
        console.error(error);
        fillErrorReviewsHTML();
        return;
      }
      fillReviewsHTML();
    });
  }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById('restaurant-hours');
  const head = document.createElement('tr');
  const dayCol = document.createElement('th');
  const hoursCol = document.createElement('th');

  dayCol.setAttribute('scope', 'col');
  dayCol.setAttribute('tabindex', '0');
  dayCol.innerHTML = 'Day';
  head.appendChild(dayCol);

  hoursCol.setAttribute('scope', 'col');
  hoursCol.setAttribute('tabindex', '0');
  hoursCol.innerHTML = 'Opening hours';
  head.appendChild(hoursCol);

  hours.appendChild(head);

  for (let key in operatingHours) {
    const row = document.createElement('tr');
    const day = document.createElement('td');
    const time = document.createElement('td');

    day.innerHTML = key;
    day.setAttribute('tabindex', '0');
    row.appendChild(day);

    time.innerHTML = operatingHours[key];
    time.setAttribute('tabindex', '0');
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.setAttribute('id', 'reviews-title');
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    // const emptyList = document.getElementById('reviews-list');
    // container.removeChild(emptyList);
    noReviews.setAttribute('class', 'review--notfound');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });

  container.appendChild(ul);
};
fillErrorReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.setAttribute('id', 'reviews-title');
  container.appendChild(title);
  const noReviews = document.createElement('p');
  // const emptyList = document.getElementById('reviews-list');
  // container.removeChild(emptyList);
  noReviews.setAttribute('class', 'review--notfound');
  noReviews.innerHTML =
    'There are no older reviews to show: try again when online';
  container.appendChild(noReviews);
  return;
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement('li');
  const article = document.createElement('article');
  article.setAttribute('tabindex', '0');
  article.setAttribute('role', 'article');
  article.setAttribute('arial-label', 'Review.');

  const div = document.createElement('div');
  const date = document.createElement('p');
  //date.innerHTML = review.date;
  date.innerHTML = new Date(review.createdAt).toDateString();
  date.setAttribute('aria-label', `Date: ${review.date}.`);
  date.setAttribute('class', 'review--date');
  div.appendChild(date);

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.setAttribute('class', 'review--author');
  name.setAttribute('aria-label', `Author: ${review.name}.`);
  div.appendChild(name);
  div.setAttribute('class', 'review--head');
  article.appendChild(div);

  const rating = document.createElement('p');
  let ratingString =
    '<span class="review--ratingTitle" arial-hidden="true">Rating</span> <span class="review--ratingStars" arial-hidden="true">';
  for (let i = 0, len = review.rating; i < len; i++) {
    ratingString += '<span class="full">&#9733;</span>';
  }
  if (review.rating < 5) {
    for (let i = 0, len = 5 - review.rating; i < len; i++) {
      ratingString += '<span class="empty"></span>';
    }
  }
  ratingString += '</span>';
  rating.innerHTML = ratingString;
  rating.setAttribute('aria-label', `Rating: ${review.rating} out of 5.`);
  rating.setAttribute('class', 'review--rating');
  article.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.setAttribute('class', 'review--comment');
  article.appendChild(comments);

  li.appendChild(article);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document
    .getElementById('breadcrumb')
    .getElementsByTagName('ol')[0];
  const li = document.createElement('li');
  const a = document.createElement('a');

  a.innerHTML = restaurant.name;
  a.setAttribute('aria-current', 'page');

  li.appendChild(a);

  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
