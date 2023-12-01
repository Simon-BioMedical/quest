import { transform } from "./replace2.js";
import { questionQueue, moduleParams } from "./questionnaire.js";

let prevRes = {};

const questLF = await localforage.createInstance({
  name:"questParams",
  storeName:"params"
})

async function fetchModule(url){
  let response = await fetch(url)
  if (!response.ok){
    return `<h3>Problem retrieving questionnaire module <i>${url}</i>:</h3> HTTP response code: ${response.status}`
  }
  return await response.text()
}

async function startUp() {


  let searchParams = new URLSearchParams(location.search)
  if (location.hash.split('&').includes('run') || searchParams.has('run')) {
      document.getElementById('logic').checked=true;
      document.getElementById("styling").checked = styling
      document.getElementById('questNavbar').style.display = 'none';
      document.getElementById('markup').style.display = 'none';
      document.getElementById('renderText').style.display = 'none';
  } else {
    let logic = await questLF.getItem("logic") ?? false;
    let styling = await questLF.getItem("styling") ?? false
    document.getElementById("logic").checked = logic
    document.getElementById("styling").checked = styling
  }
  setStylingAndLogic()

  let cachedPreviousResults = await questLF.getItem("previousResults") ?? "";
  // prevRes is a ugh.. global variable
  prevRes = cachedPreviousResults.length>0?JSON.parse(cachedPreviousResults):{}
  document.getElementById("json_input").innerText=cachedPreviousResults;




  var ta = document.getElementById("ta");
  ta.onkeyup = (ev) => {
    transform.tout((previousResults) => {
      transform.render(
        {
          text: ta.value,
        },
        "rendering",
        previousResults
      ); // <-- this is where quest.js is engaged
      // transform.render({url: 'https://jonasalmeida.github.io/privatequest/demo2.txt&run'}, 'rendering') // <-- this is where quest.js is engaged
      if (document.querySelector(".question") != null) {
        document.querySelector(".question").classList.add("active");
      }
    });
  };

  // handle the Search params with the URLSearchParam API instead of a string...
  let params = new URLSearchParams(location.search)
  if (params.has("config")) {
    moduleParams.config = config;
    ta.value = await fetchModule(confirm.markdown)
    //ta.value = await (await fetch(config.markdown)).text();
  }
  if (params.has("url")) {
    let url = params.get("url")
    console.log(url)
    //ta.value = await (await fetch(url)).text();
    ta.value = await fetchModule(url)
    ta.onkeyup()
  } else if (location.hash.length > 1) {
    console.log(location.hash.substring(1))
    ta.value = await fetchModule( location.hash.substring(1) ) 
    //ta.value = await (await fetch(location.hash.substring(1))).text();
    ta.onkeyup()
  }
  if(params.has("style")) {
    document.getElementById("logic").dataset.sheetOn=params.get("style")
  }

  if (params.has("run")){
    let parentElement = document.getElementById("rendering").parentElement
    parentElement.classList.remove("col-12","col-md-6")
    if (!params.has("style")){
      document.getElementById("pagestyle").setAttribute("href", "Style1.css")
    }
  }
  /*var q = (location.search + location.hash).replace(/[\#\?]/g, "");
    if (q.length > 3) {
      if (!q.startsWith("config")) {
        ta.value = await (await fetch(q.split("&")[0])).text(); // getting the first of markup&css
      } else {
        moduleParams.config = config;
        ta.value = await (await fetch(config.markdown)).text();
      }
      ta.onkeyup();
    }
  ta.style.width =
    parseInt(ta.parentElement.style.width.slice(0, -1)) - 5 + "%";
*/
  document.getElementById("increaseSizeButton").onclick = increaseSize;
  document.getElementById("decreaseSizeButton").onclick = decreaseSize;
  document.getElementById("clearMem").addEventListener("click",clearLocalForage)

  document.getElementById("updater").onclick = function (event) {
    let txt = "";
    try {
      prevRes = (json_input.value.length>0)?JSON.parse(json_input.value):{};
      questLF.setItem("previousResults",json_input.value);
      txt = "added json... ";
    } catch (err) {
      txt = "caught error: " + err;
    }
    loaddisplay.innerText = txt;
  };

  let myTree = questionQueue;
}

function increaseSize() {
  let ta = document.getElementById("ta");
  let style = window.getComputedStyle(ta, null).getPropertyValue("font-size");
  let fontSize = parseFloat(style);
  ta.style.fontSize = fontSize + 1 + "px";
}

function decreaseSize() {
  let ta = document.getElementById("ta");
  let style = window.getComputedStyle(ta, null).getPropertyValue("font-size");
  let fontSize = parseFloat(style);
  ta.style.fontSize = fontSize - 1 + "px";
}

function clearLocalForage() {
  localforage
    .clear()
    .then(() => {
      loaddisplay.innerHTML = "local forage cleared";
    })
    .catch((err) => {
      loaddisplay.innerHTML = "caught error" + err;
      console.log("error while clearing lf.  ", err);
    });

  questionQueue.clear();

  prevRes = {};
}

transform.tout = function (fun, tt = 500) {
  if (transform.tout.t) {
    clearTimeout(transform.tout.t);
  }
  transform.tout.t = setTimeout(fun(prevRes), tt);
};

function setStylingAndLogic(){
  function setValue(cssId,inputId){
    let inputElement = document.getElementById(inputId)
    let cssElement = document.getElementById(cssId)
    cssElement.setAttribute("href",inputElement.checked?inputElement.dataset.sheetOn:inputElement.dataset.sheetOff)
  }
  setValue("pagestyle","styling")
  setValue("pagelogic","logic")
}



window.onload = function () {
  startUp();

  document.querySelectorAll('input.form-check-input').forEach( (el) => {
    el.addEventListener("change",(event)=>{
      console.log(event.target.id,event.target.checked)
      questLF.setItem(event.target.id,event.target.checked)
      setStylingAndLogic()
    })
  })
};
