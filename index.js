// get location method
const getLocation = () => {
    // return promise
    return new Promise((resolve, reject) => {
        //  load locations list
        fetch('./data/cities.json').then(x => x.json()).then(map => {
            // get current location
            navigator.geolocation.getCurrentPosition(
                pos => {
                    // get latitude and longitude
                    const latitude = pos.coords.latitude
                    const longitude = pos.coords.longitude
                    // variables to remember best match
                    let cityIndex = null
                    let cityValue = 0
                    // for each location data in array
                    for(let i = 0; i < map.length; i++) {
                        // get latitude difference
                        const dLT = Math.abs(latitude - map[i].latitude) * 2
                        // get longitude difference
                        const dLN = Math.abs(longitude - map[i].longitude)
                        // check for minimum value
                        if(cityIndex === null || cityValue > dLT + dLN) {
                            // strore as minimum
                            cityIndex = i
                            cityValue = dLT + dLN
                        }
                    }
                    // resolve best match
                    resolve(map[cityIndex])
                }, reject, {
                    // settings for geolocation
                    enableHighAccuracy : false,
                    timeout : 5000,
                    maximumAge : 0
                }
            )
        }).catch(reject)
    })
}

// load model method
const loadModel = () => {
    // return new promise
    return new Promise((resolve, reject) => {
        // load model using three loader
        new THREE.GLTFLoader().load('./data/letters.glb', resolve, () => {}, reject)
    })
}

// build text model method
const buildTextModel = (model, text) => {
    // uppercase text
    text = text.toUpperCase()
    // array for letter clones
    const mrr = []
    // for each letter in text
    for(let i = 0; i < text.length; i++) {
        // get letter index from char code
        const n = text.charCodeAt(i) - 65
        // push clone letter to array
        mrr.push(model.scene.children[n].clone())
    }
    // for each children in model
    for(let i = 0; i < 26; i++) {
        // hide letter model
        model.scene.children[i].visible = false
    }
    // for each letter model in array
    for(let i = 0; i < mrr.length; i++) {
        model.scene.add(mrr[i])
        mrr[i].position.x = i * 0.6
    }
    return model
}

// export model method
const exportModel = model => {
    return new Promise((resolve, reject) => {
        // export model using three loader
        new THREE.GLTFExporter().parse(model, json => {
            // create blob using json
            const blob = new Blob([JSON.stringify(json, null, 2)], {type : 'application/json'})
            // resolve blob url
            resolve(URL.createObjectURL(blob))
        }, reject)
    })
}

// define elements
const cover = document.querySelector('.cover')
const button = document.querySelector('button')
const viewer = document.querySelector('model-viewer')

// loaded flag 
let loaded = false

// add button click event
button.addEventListener('click', () => {
    // return if loaded or change flag to continue
    if(loaded) { return } else { load = true }
    // update button text
    button.innerHTML = 'Loading...'
    // load model
    loadModel().then(model => {
        // get location
        getLocation().then(location => {
            // create text model
            const textModel = buildTextModel(model, location.city.en)
            // export text model
            exportModel(textModel.scene).then(blobURL => {
                // set to model viewer
                viewer.setAttribute('src', blobURL)
                // on model viewer load
                viewer.onload = () => {
                    // reduce cover opacity and delay
                    cover.style.opacity = 0
                    setTimeout(() => {
                        // hide cover
                        cover.style.display = 'none'
                    }, 300)
                }
            })
        })
    })
})