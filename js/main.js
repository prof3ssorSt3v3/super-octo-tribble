let CACHE = null;

document.addEventListener('DOMContentLoaded', () => {
  caches.open('multi-cache').then((_cache) => {
    CACHE = _cache;
    document.querySelector('form').addEventListener('submit', saveFiles);
    showAllJSON(true); //toggle the Boolean to run the different versions

    let dialog = document.getElementById('err');
    dialog.addEventListener('click', (ev) => ev.target.closest('dialog').close());
  });
});

function saveFiles(ev) {
  ev.preventDefault();
  //the inputs
  let nm = document.querySelector('input#name');
  let script = document.querySelector('input#script');
  let img = document.querySelector('input#image');
  //image file extension
  let imgExt = img.files[0].name.split('.').pop();
  //unique id
  let id = crypto.randomUUID();
  //object for json
  let obj = {
    id,
    name: nm.value,
    image: `${id}.${imgExt}`,
    script: `${id}.js`,
  };
  //json file object
  let jsonFile = new File([JSON.stringify(obj)], `${id}.json`, { type: 'application/json' });
  //Request and Response for JavaScript
  let reqS = new Request(`${id}.js`);
  let respS = new Response(script.files[0]);
  //Request and Response for Image
  let reqI = new Request(`${id}.${imgExt}`);
  let respI = new Response(img.files[0]);
  //Request and Response for JSON
  let reqJSON = new Request(`${id}.json`);
  let respJSON = new Response(jsonFile);
  //save the script, image and json
  Promise.all([CACHE.put(reqS, respS), CACHE.put(reqI, respI), CACHE.put(reqJSON, respJSON)])
    .then(() => {
      //load both the JSON and the Image
      return Promise.all([CACHE.match(`${id}.${imgExt}`), CACHE.match(`${id}.json`)]);
    })
    .then((responses) => {
      //get the contents from both the image and json
      //assuming we don't know for sure the order of the responses in the array
      return Promise.all(
        responses.map((resp) => {
          if (resp.headers.get('content-type').includes('json')) {
            return resp.json();
          } else {
            return resp.blob();
          }
        })
      );
    })
    .then((contents) => {
      //go build one item (instead of list)
      console.log(contents[0] instanceof Object);
      console.log(contents[1] instanceof Blob);
      const json = contents[0] instanceof Blob ? contents[1] : contents[0];
      const blob = contents[1] instanceof Blob ? contents[1] : contents[0];
      let url = URL.createObjectURL(blob);
      let p = `<p class="card" data-ref="${json.id}">${json.id} ${json.name} <img src="${url}" alt="${json.name}" /></p>`;
      document.querySelector('.content').innerHTML += p;
      //load and run the JS file
      return CACHE.match(`${id}.js`);
    })
    .then((resp) => {
      return resp.text();
    })
    .then((txt) => {
      let f = new File([txt], `${id}.js`, { type: 'application/javascript' });
      let url = URL.createObjectURL(f);
      // <script src="${url}">
      return import(url); //async too
      //dynamic import method... like import * as MOD from 'asdfs.js'
    })
    .then((mod) => {
      //mod is a module object which contains a list of exported things
      const funcs = [];
      for (let f in mod) {
        funcs.push(f);
      }
      let selected = Math.floor(Math.random() * funcs.length);
      mod[funcs[selected]]();
      //run the function from inside the imported module
      document.querySelector('form').reset(); //only one form on the page
    })
    .catch((err) => {
      tellUser(err.message);
    });
}

function tellUser(msg) {
  let dialog = document.getElementById('err');
  let p = dialog.querySelector('p');
  p.textContent = msg;
  dialog.showModal();
  //https://www.youtube.com/watch?v=Fl9R8OokMkE - reference for dialog
}

function showAllJSON(version) {
  //loop through all the items in the cache and create paragraphs with name and image
  //filtering out the scripts
  if (version) {
    //version 1
    CACHE.matchAll()
      .then((responses) => {
        //all the files
        //have to look at the headers to figure out the types
        return Promise.all(
          responses
            .filter((resp) => {
              if (resp.headers.get('content-type').includes('json')) {
                // || resp.headers.get('content-type').includes('image')) {
                return true;
              }
            })
            .map((resp) => {
              // if (resp.headers.get('content-type').includes('json')) {
              return resp.json();
              // } else {
              // return resp.blob();
              // }
            })
        );
      })
      .then((contents) => {
        let objects = contents.filter((item) => {
          //the array of json object
          return !(item instanceof Blob);
        });
        // let blobs = contents.filter(item=>{
        //the array of blobs if you want to solve it this way
        // return item instanceof Blob;
        // });
        let df = new DocumentFragment();

        objects.forEach((obj) => {
          let p = document.createElement('p');
          let img = document.createElement('img');
          p.setAttribute('data-ref', obj.id);
          p.className = 'card';
          p.textContent = obj.name;
          img.alt = obj.name;
          img.src = '';
          buildImageSource(obj.image, obj.id); //this is an async method so it will be resolved after the HTML is added.
          p.append(img);
          df.append(p);
        });
        document.querySelector('section.content').append(df);
      })
      .catch((err) => {
        tellUser(err.message);
      });
  } else {
    //version 2

    CACHE.keys()
      .then((requests) => {
        console.log('step 1', requests.length);
        //the names of all the files
        //look at the file names to figure out the types
        let jsonNames = requests.filter((req, index) => {
          return req.url.endsWith('.json');
          //you could also keep other types if you want/need
        });
        return Promise.all(jsonNames.map((filename) => CACHE.match(filename)));
      })
      .then((files) => {
        console.log('step 2');
        return Promise.all(files.map((file) => file.json()));
      })
      .then((objects) => {
        console.log('step 3');
        //the json objects for building the html
        let df = new DocumentFragment();

        objects.forEach((obj) => {
          let p = document.createElement('p');
          let img = document.createElement('img');
          p.setAttribute('data-ref', obj.id);
          p.className = 'card';
          p.textContent = obj.name;
          img.alt = obj.name;
          img.src = '';
          buildImageSource(obj.image, obj.id); //this is an async method so it will be resolved after the HTML is added.
          p.append(img);
          df.append(p);
        });
        document.querySelector('section.content').append(df);
      })
      .catch((err) => {
        tellUser(err.msg);
      });
  }
}

async function buildImageSource(imgName, ref) {
  let imgFile = await CACHE.match(imgName);
  let blob = await imgFile.blob();
  let url = URL.createObjectURL(blob);
  let img = document.querySelector(`[data-ref="${ref}"] img`);
  console.log('load img', url);
  img.src = url;
}
