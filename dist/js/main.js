let restaurants,neighborhoods,cuisines,mainmap;var markers=[];document.addEventListener("DOMContentLoaded",e=>{fetchNeighborhoods(),fetchCuisines(),updateRestaurants()}),fetchNeighborhoods=(()=>{DBHelper.fetchNeighborhoods((e,t)=>{e?console.error(e):(self.neighborhoods=t,fillNeighborhoodsHTML())})}),fillNeighborhoodsHTML=((e=self.neighborhoods)=>{const t=document.getElementById("neighborhoods-select");e.forEach(e=>{const n=document.createElement("option");n.innerHTML=e,n.value=e,t.append(n)})}),fetchCuisines=(()=>{DBHelper.fetchCuisines((e,t)=>{e?console.error(e):(self.cuisines=t,fillCuisinesHTML())})}),fillCuisinesHTML=((e=self.cuisines)=>{const t=document.getElementById("cuisines-select");e.forEach(e=>{const n=document.createElement("option");n.innerHTML=e,n.value=e,t.append(n)})}),window.initMap=(()=>{self.mainmap=new google.maps.Map(document.getElementById("map"),{zoom:12,center:{lat:40.722216,lng:-73.987501},scrollwheel:!1}),"object"==typeof google&&"object"==typeof google.maps&&addMarkersToMap()}),updateRestaurants=(()=>{const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),n=e.selectedIndex,s=t.selectedIndex,a=e[n].value,r=t[s].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(a,r,(e,t)=>{e?console.error(e):(resetRestaurants(t),fillRestaurantsHTML())})}),resetRestaurants=(e=>{self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers.forEach(e=>e.setMap(null)),self.markers=[],self.restaurants=e}),fillRestaurantsHTML=((e=self.restaurants)=>{const t=document.getElementById("restaurants-list");e.forEach(e=>{t.append(createRestaurantHTML(e))}),"object"==typeof google&&"object"==typeof google.maps&&addMarkersToMap()}),createRestaurantHTML=(e=>{const t=document.createElement("li"),n=document.createElement("article");n.setAttribute("role","article");const s=document.createElement("div"),a=document.createElement("img");a.className="restaurant-img",a.src=DBHelper.imageUrlForRestaurant(e),a.setAttribute("alt","Photo of "+e.name+" restaurant"),n.append(a);const r=document.createElement("h2");r.innerHTML=e.name,s.append(r);const o=document.createElement("p");o.innerHTML=e.neighborhood,o.setAttribute("class","neighborhood"),s.append(o);const l=document.createElement("p");l.innerHTML=e.address,l.setAttribute("class","address"),s.append(l);const c=document.createElement("a");return c.innerHTML="View Details",c.setAttribute("aria-label","View Details for "+e.name+" restaurant"),c.href=DBHelper.urlForRestaurant(e),s.append(c),n.append(s),t.append(n),t}),addMarkersToMap=((e=self.restaurants)=>{e&&e.forEach(e=>{const t=DBHelper.mapMarkerForRestaurant(e,self.mainmap);google.maps.event.addListener(t,"click",()=>{window.location.href=t.url}),self.markers&&self.markers.push(t)})});
//# sourceMappingURL=main.js.map