let map;
let service;
let infowindow;

function initMap() {
    const defaultLoc = { lat: 28.6139, lng: 77.2090 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLoc,
        zoom: 13
    });

    infowindow = new google.maps.InfoWindow();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                map.setCenter(pos);
                
                new google.maps.Marker({
                    position: pos,
                    map: map,
                    title: "You are here"
                });

                searchNearbyPlaces(pos);
            },
            () => {
                handleLocationError(true, infowindow, map.getCenter());
            }
        );
    } else {
        handleLocationError(false, infowindow, map.getCenter());
    }
}

function searchNearbyPlaces(location) {
    const request = {
        location: location,
        radius: '5000',
        keyword: 'meditation center'
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            const panel = document.getElementById('info-panel');
            panel.style.display = 'block';
            panel.innerHTML = "<h3>Top Recommendations:</h3>";

            for (let i = 0; i < results.length; i++) {
                createMarker(results[i]);
                
                panel.innerHTML += `
                    <div class="place-item">
                        <div class="place-name">${results[i].name}</div>
                        <div>${results[i].vicinity}</div>
                        <div>Rating: ${results[i].rating || 'N/A'} ⭐</div>
                    </div>
                `;
            }
        }
    });
}

function createMarker(place) {
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    google.maps.event.addListener(marker, "click", () => {
        infowindow.setContent(`<strong>${place.name}</strong><br>${place.vicinity}`);
        infowindow.open(map, marker);
    });
}
function openMap(placeName) {
    
    const query = encodeURIComponent(placeName);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
}

function handleLocationError(browserHasGeolocation, infowindow, pos) {
    infowindow.setPosition(pos);
    infowindow.setContent(
        browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation."
    );
    infowindow.open(map);
}

window.initMap = initMap;