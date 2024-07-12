const addResourcesToCache = async (resources) => {
    const cache = await caches.open("v1");
    await cache.addAll(resources);
  };
  
const sc = self.crypto.subtle
const te = new TextEncoder()
const td = new TextDecoder()
let b64key = null
let listiv = null
let keytimer = null

const mimeContents = [
    {re: new RegExp('(.jpg|.jpeg|.jfif)$', 'i'), content: 'image/jpeg'},
    {re: new RegExp('.png$', 'i'), content: 'image/png'},
    {re: new RegExp('(.html|.htm|.xhtml)$', 'i'), content: 'text/html'},
    {re: new RegExp('(.js|.mjs)$', 'i'), content: 'text/javascript'},
    {re: new RegExp('.css$', 'i'), content: 'text/css'},
    {re: new RegExp('.txt$', 'i'), content: 'text/plain'},
    {re: new RegExp('.md$', 'i'), content: 'text/markdown'},
    {re: new RegExp('.json$', 'i'), content: 'application/json'},
    {re: new RegExp('.xml$', 'i'), content: 'application/xml'},
    {re: new RegExp('.pdf$', 'i'), content: 'application/pdf'}
]

self.addEventListener("install", (event) => {
    self.skipWaiting()
    console.log('install done')
/*
    event.waitUntil(
      addResourcesToCache([
        "/",
        "/index.html",
        "/style.css",
        "/app.js",
        "/image-list.js",
        "/star-wars-logo.jpg",
        "/gallery/bountyHunters.jpg",
        "/gallery/myLittleVader.jpg",
        "/gallery/snowTroopers.jpg",
      ]),
    );
    */
});

self.addEventListener("fetch", (event) => {
    let url = new URL(event.request.url)
    console.log(`Intercepted ${event.request.url} (${url.pathname})`)
    //console.log(!/\/sec\//.test(url.pathname))
    
    let response = null
    let respText = null
    /*
    if (!url.pathname.endsWith('index.html') && !url.pathname.includes('/assets/')) {
        event.respondWith(fetch(event.request))
        return
    }*/
    if (!/\/sec\//.test(url.pathname)) {
        console.log("unciphered content access")
        event.respondWith(fetch(event.request))
        return
    }
    //so from here we handle ciphered request/content stuff
    const fetchCipheredContent = async () => {
        let decrypted = null
        console.log(`Processing ciphered request for ${url.pathname.substring(4)}`)
        let keyb = Uint8Array.from(atob(b64key), c => c.charCodeAt(0))
        let key = await sc.importKey("raw", keyb, {name: "AES-GCM", length: 256}, true, ["encrypt", "decrypt"])
        let iv = new Uint8Array(listiv)
        //clearTimeout(keytimer)
        //keytimer = setTimeout(delKey, 10000)
        let digest = await sc.digest('SHA-1', te.encode(url.pathname.substring(4)))
        //let digest = await sc.digest('SHA-1', te.encode('/index.html'))
        let newpath = '/sec/'+Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
        console.log(`${url.pathname.substring(4)} => ${newpath}`)
        response = await fetch(newpath, event.request.headers)
        //console.log(response.status)
        if (response.status == 404) {
            return fetch(url.pathname.substring(4), event.request.headers)
        }
        let encSource = await response.arrayBuffer()
        try {
            decrypted = await sc.decrypt({name: "AES-GCM", iv: iv}, key, encSource)
        } catch (err) {
            console.log(err)
        }
        //console.log(decrypted)
        let newheaders = []
        for (const e of response.headers.entries()) {
            //console.log(`${e[0]}: ${e[1]}`)
            if (e[0] === 'content-type') {
                for (var mime of mimeContents) {
                    //if (url.pathname.endsWith(mime.re)) {
                    //console.log(mime)
                    if (mime.re.test(url.pathname)) {
                        newheaders.push(['content-type', mime.content])
                        break
                    }
                }
                //console.log(newheaders[newheaders.length-1][0])
                if (newheaders[newheaders.length-1][0] != 'content-type') {
                    newheaders.push(['content-type', 'application/octet-stream'])
                }
            } else {
                newheaders.push(e)
            }
        }
        let newResponse = null
        if (url.pathname.endsWith('.html')) {
            const sourceHtml = td.decode(decrypted)
            //console.log(sourceHtml)
            //const sourceHtml = await response.text()
            //let newHtml = sourceHtml.replace('Test', `Really Great ${newpath}`)
            let newHtml = sourceHtml.replace('<body>', `<body><article>Deciphered from ${newpath}</article>`)
            newHtml = newHtml.replace('<title>Document</title>', '<title>Deciphered</title>')
            //console.log(response.headers)
            newResponse = new Response(newHtml, {
                status: response.status,
                statusText: response.statusText,
                headers: newheaders
            })
        } else {
            newResponse = new Response(decrypted, {
                status: response.status,
                statusText: response.statusText,
                headers: newheaders
            })
        }

        return newResponse
    }
     event.respondWith(fetchCipheredContent())
});

self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SETKEY') {
        console.log(`SETKEY: ${e.data.key} ${e.data.iv}`)
        b64key = e.data.key
        listiv = e.data.iv
    }
    //keytimer = setTimeout(delKey, 5000)
})

function delKey() {
    key = null
    iv = null
    console.log('KEY deleted')}
/*
self.addEventListener("fetch", (event) => {
    event.respondWith(caches.match(event.request));
});
*/
