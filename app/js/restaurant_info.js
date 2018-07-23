let restaurant, map;

document.addEventListener('DOMContentLoaded', event => {
  /* Populate the page without waiting for google maps*/
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      console.error(error);
    }
  });
  document
    .getElementById('show-map')
    .addEventListener('click', addGmapDetail, true);
  document
    .getElementById('new-review-form')
    .addEventListener('submit', submitReview);
  //no need for if (el.attachEvent) {el.attachEvent('onsubmit', submitReview)} since we are also using arrow functions, so no IE11
  if (window.innerWidth >= 992) {
    const mapBtn = document.getElementById('show-map');
    window.setTimeout(mapBtn.click(), 250);
  }

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
        const newReview = document.getElementById('new-review');
        newReview.parentNode.removeChild(newReview);
        return;
      }
      document.title = `${restaurant.name} -  Info & Details`;
      document
        .querySelector('meta[name="description"]')
        .setAttribute(
          'content',
          `Information about ${
            restaurant.name
          }: location, opnening hours and latest reviews`
        );
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

  const favoriteBtn = document.getElementById('favorite-button');
  if (restaurant.is_favorite == 'true') {
    setFavoriteButton(favoriteBtn, 'true', restaurant);
  } else {
    favoriteBtn.setAttribute(
      'arial-label',
      `Add ${restaurant.name} to your favorite list.`
    );
  }
  favoriteBtn.addEventListener('click', event => {
    favoriteRestaurant(event.target, restaurant);
  });

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
    setFavoriteButton(target, 'false', restaurant);
    DBHelper.favoriteRestaurant(restaurant, 'false');
  } else {
    setFavoriteButton(target, 'true', restaurant);
    DBHelper.favoriteRestaurant(restaurant, 'true');
  }
};

/**
 * Get current restaurant from page URL.
 */
fetchReviews = callback => {
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
  const title = document.createElement('h3');

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

  //latest on top, "TripAdvisor" mode
  function compare(ar1, ar2) {
    if (ar1.createdAt < ar2.createdAt) return 1;
    if (ar1.createdAt > ar2.createdAt) return -1;
    return 0;
  }
  reviews.sort(compare);

  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });

  container.appendChild(ul);
};
fillErrorReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
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

/**
 * Escaping user input, from:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
 */
escapeRegExp = string => {
  //return string.replace(/[*+^${}()<>|[\]\\]/g, '\\$&'); // $& means the whole matched string
  return string.replace(/[*+^${}()<>|[\]\\]/g, ' ');
};

/**
 * Verify and submit review
 */
submitReview = event => {
  let review,
    reviewHtml,
    form_button = document.getElementById('new-review--submit'),
    form_name = document.getElementById('new-review--name'),
    form_comment = document.getElementById('new-review--comment'),
    form_rating = document.getElementById('new-review--rating'),
    form_stars = form_rating.value,
    form_messageArea = document.getElementById('new-review--msg'),
    reviewList = document.getElementById('reviews-list'),
    errorMessage = '';

  const check_nameEmpty = '<li>Your name couldn&apos;t be empty</li>',
    check_nameShort =
      '<li>Your name is too short (please provide at least 3 characters)</li>',
    check_commentEmpty = '<li>Your review couldn&apos;t be empty</li>',
    check_commentShort =
      '<li>Your review is too short <em>(at least 100 characters comment is requested)</em></li>',
    check_noRating = '<li>Rating is not set</li>';

  event.preventDefault();
  resetMessage(form_messageArea);
  form_button.disabled = true;
  if (!form_name.value)
    errorMessage += (errorMessage ? '<br/>' : '<ul>') + check_nameEmpty;

  if (form_name.value.length < 2)
    errorMessage += (errorMessage ? '<br/>' : '<ul>') + check_nameShort;

  if (!form_comment.value)
    errorMessage += (errorMessage ? '<br/>' : '<ul>') + check_commentEmpty;

  if (form_comment.value.length < 100)
    errorMessage += (errorMessage ? '<br/>' : '<ul>') + check_commentShort;

  if (form_stars === 'none')
    errorMessage += (errorMessage ? '<br/>' : '<ul>') + check_noRating;

  if (errorMessage) {
    errorMessage += '</ul>';
    form_messageArea.innerHTML = errorMessage;
    form_messageArea.setAttribute('class', 'error');
    form_messageArea.style.display = 'block';
    form_button.disabled = false;
  } else {
    // Assing values to review object
    review = {
      restaurant_id: self.restaurant.id,
      name: escapeRegExp(form_name.value),
      rating: parseInt(form_stars),
      comments: escapeRegExp(form_comment.value)
    };
    // add review to local and remote db
    DBHelper.saveReview(review).then(review => {
      // create new review DOM node
      reviewHtml = createReviewHTML(review);
      // clean fields in form
      form_name.value = '';
      form_comment.value = '';
      form_rating.selectedIndex = 0;
      // success message
      setTimeout(_ => {
        reviewHtml.setAttribute('class', 'added');
        if (reviewList.firstChild) {
          reviewList.insertBefore(reviewHtml, reviewList.firstChild);
        } else {
          reviewList.appendChild(reviewHtml);
        }
        form_messageArea.setAttribute('class', 'success');
        form_messageArea.innerHTML =
          '<p>Thank you for sending your review!</p>';
        form_messageArea.style.display = 'block';
        form_button.disabled = false;
        smoothScrollTo('reviews-container', 650, 100);
        reviewHtml.firstChild.focus();
      }, 250);
      setTimeout(_ => {
        resetMessage(form_messageArea);
        reviewHtml.setAttribute('class', '');
        form_button.disabled = false;
      }, 7500);
    });
  }
};

/**
 * reset form message area
 */
resetMessage = message => {
  message.style.display = 'none';
  message.classList.remove('success', 'error');
  message.innerHTML = '';
};

/**
 * Easing function
 */
easeInOutQuart = (time, from, distance, duration) => {
  if ((time /= duration / 2) < 1)
    return (distance / 2) * time * time * time * time + from;
  return (-distance / 2) * ((time -= 2) * time * time * time - 2) + from;
};
/**
 * smooth scroll animation
 * remix version of iwazaru's gist
 * @orginal: https://gist.github.com/iwazaru/4c8819420ce5237aeaf338339df25c32
 * @param {int} endX: destination x coordinate
 * @param {int} duration: animation duration in ms
 */
window.smoothScrollTo = (targetID, duration = 400, delta = 0) => {
  let startY = window.scrollY || window.pageYOffset,
    element = document.getElementById(targetID),
    endY = element.offsetTop - element.scrollTop + element.clientTop - delta;
  (distanceY = endY - startY), (startTime = new Date().getTime());
  let timer = window.setInterval(function() {
    let time = new Date().getTime() - startTime,
      newY = easeInOutQuart(time, startY, distanceY, duration);
    if (time >= duration) {
      window.clearInterval(timer);
    }
    window.scrollTo(0, newY);
  }, 1000 / 60); // 60 fps
};
