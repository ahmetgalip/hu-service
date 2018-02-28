$(function () {

    var circleStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 0, 0.4)',
            width: 3
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 255, 0, 0.4)'
        })
    });

    var selected = ol.proj.fromLonLat([32.7615216, 39.908144]);
    var defaultZoom = 10;
    var defaultLonLatCenter = [32.7615216, 39.908144];

    if (typeof savedData_lat != "undefined" && typeof savedData_lon != "undefined" && savedData_lat && savedData_lon) {
        defaultZoom = 13;
        defaultLonLatCenter = [savedData_lon, savedData_lat];
        selected = ol.proj.fromLonLat(defaultLonLatCenter);
    }

    var startMarker = new ol.Feature({
        type: 'icon',
        geometry: new ol.geom.Point(selected)
    });

    var iconVectorSource = new ol.source.Vector({
        //projection: 'EPSG:4326'
        features: [startMarker]
    });

    var styles = {
        'icon': new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                scale: 0.1,
                src: '/images/pin-map-location-06-512.png'
            })
        })
    };

    var iconVectorLayer = new ol.layer.Vector({
        source: iconVectorSource,
        style: function (feature) {
            return styles[feature.get('type')];
        }
    });



    var stationVectorSource = new ol.source.Vector({
        projection: 'EPSG:4326'
    });

    var stationVectorLayer = new ol.layer.Vector({
        source: stationVectorSource,
        style: circleStyle
    });

    map.getLayers().push(iconVectorLayer);
    map.getLayers().push(stationVectorLayer);

    var changeMarker = function (coordinate) {
        startMarker.getGeometry().setCoordinates(coordinate);
        enableDisableSaveButton(true);
    }

    var enableDisableSaveButton = function (isEnabled) {
        $("#save-location").prop('disabled', !isEnabled);
    }

    $("#save-location").on("click", function () {

        var coords = startMarker.getGeometry().getCoordinates()

        LonLat = ol.proj.toLonLat(coords)
        var data = {
            lon: LonLat[0],
            lat: LonLat[1]
        }

        $.ajax({
            url: '/api/location',
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (data, textStatus, jQxhr) {
                enableDisableSaveButton(false);

                var resText = "kaydedildi";
                if (typeof savedData_saved != "undefined" && savedData_saved == true)
                    resText = "güncellendi";
                else {
                    $("#save-location").text("Güncelle");
                    $("#message-span").text("Servise bindiğiniz noktayı değiştirmek için harita üzerinde yeni bir yere tıkladıktan sonra güncelle butonuna basınız.");
                }
                swal("İşlem Tamamlandı", "Servise biniş noktanız " + resText + "!", "success");
            },
            error: function (jqXhr, textStatus, errorThrown) {
                if (DEBUG_MODE)
                    console.log(errorThrown);
                swal("İşlem Tamamlanamadı", "Lütfen sayfayı yeniden yükleyip tekrar deneyiniz!", "error");
            }
        });
    })


    //durakları çek
    $.ajax({
        dataType: "json",
        url: "/api/station",
    }).done(function (data) {
        // addStationCircle(data);
        utils.addCircleData(data, stationVectorSource, { radius: 85, radius_property: "weight" });
    });

    // var addStationCircle = function (duraklar) {

    //     var featuresDuraklar = [];
    //     var i, geom, feature;

    //     for (i = 0; i < duraklar.length; i++) {

    //         geom = new ol.geom.Circle(
    //             ol.proj.transform([duraklar[i].py, duraklar[i].px], 'EPSG:4326', 'EPSG:3857'),
    //             30
    //         );

    //         feature = new ol.Feature(geom);
    //         feature.set("data", duraklar[i]);
    //         featuresDuraklar.push(feature);
    //     }

    //     stationVectorSource.addFeatures(featuresDuraklar);
    // }

    var select = new ol.interaction.Select({
        condition: ol.events.condition.click
    });

    map.addInteraction(select);
    select.on('select', function (e) {
        if (e && e.selected && e.selected[0] && e.selected[0].getGeometry()) {
            var a = e.selected[0]
            var geom = e.selected[0].getGeometry()
            geom.getCenter()

            changeMarker(geom.getCenter())

            var ff = e.target.getFeatures()
            var fatures = ff.getArray();
            var data = fatures[0].get("data");

            
            $("#message-selected-station").html("Seçilen durak : <b>" + data["adi"] + "</b> - " + data["yeri"]);

            console.log(data);
        }
    });

});