// defaine button elements
const starter = document.querySelector('#starter')
const shutter = document.querySelector('#shutter')

// define canvas and render elements
const stream_element = document.querySelector('#stream')
const canvas_element = document.querySelector('#canvas')
const canvas_context = canvas_element.getContext('2d')
const render_element = document.querySelector('model-viewer')

// loading flag
let loading = false

// start button event
starter.addEventListener('click', () => {
    // return if loading or loaded
    if(loading) { return } else { loading = true }
    // update button text
    starter.innerHTML = 'Loading...'
    // request user media
    navigator.mediaDevices.getUserMedia({
        video : { facingMode : 'environment' }
    }).then(stream => {
        // hide start button
        starter.style.display = 'none'
        // show shutter button
        shutter.style.display = 'block'
        // set src object to video element
        stream_element.srcObject = stream
    }).catch(() => {
        // update start button text
        starter.innerHTML = 'Start Camera'
        // update loading flag
        loading = false
    })
})

// video element loaded event
stream_element.addEventListener('loadedmetadata', () => {
    // play video
    stream_element.play()
    // set video dimensions to canvas
    canvas_element.width = stream_element.videoWidth
    canvas_element.height = stream_element.videoHeight
})

// state value
let state = 'ready'

// shutter button event
shutter.addEventListener('click', () => {
    // return if video stream not loaded
    if(stream_element.srcObject === null) { return }
    // check state value
    if(state === 'ready') {
        // update shutter button text
        shutter.innerHTML = 'Scanning...'
        // draw video frame on canvas
        canvas_context.drawImage(stream_element, 0, 0)
        // show canvas
        canvas_element.style.display = 'block'
        // update state
        state = 'scanning'
        // recognize text
        Tesseract.recognize(
            canvas_element, 'eng'
        ).then(({ data : { text } }) => {
            // create text
            createText(text)
        }).catch(() => state = 'model')
    } else if(state === 'model') {
        // hide canvas
        canvas_element.style.display = 'none'
        // hide model viewer
        render_element.style.display = 'none'
        // update shutter button text
        shutter.innerHTML = 'Cature AR Text'
        // update state
        state = 'ready'
    }
})

// build text model method
const buildTextModel = (source, text) => {
    // uppercase text
    text = text.toUpperCase()
    // array for letter clones
    const mrr = []
    // for each letter in text
    for(let i = 0; i < text.length; i++) {
        // get letter index from char code
        const n = text.charCodeAt(i) - 65
        // push clone letter to array
        if(n > 0 && n < 26) {
            source.scene.children[n].visible = true
            mrr.push(source.scene.children[n].clone())
        } else {
            mrr.push(null)
        }
    }
    // for each children in model
    for(let i = 0; i < source.scene.children.length; i++) {
        // hide letter model
        source.scene.children[i].visible = false
    }
    // for each letter model in array
    for(let i = 0; i < mrr.length; i++) {
        if(mrr[i] !== null) {
            source.scene.add(mrr[i])
            mrr[i].position.x = i * 0.6
        }
    }
    // return scene
    return source.scene
}

// create text method
const createText = text => {
    new THREE.GLTFLoader().load('../assets/models/letters.glb', obj => {
        // build text model
        const model = buildTextModel(obj, text)
        // export model
        new THREE.GLTFExporter().parse(model, json => {
            // create blob
            const blob = new Blob([JSON.stringify(json, null, 2)], { type : 'application/json' })
            // set blob url to model viewer
            render_element.setAttribute('src', URL.createObjectURL(blob))
            // show model viewer
            render_element.style.display = 'block'
        })
        // update shutter button text
        shutter.innerHTML = 'Back to Camera'
        // update state
        state = 'model'
    })
}