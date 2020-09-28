let fs = require('fs')
const fetch = require('node-fetch')

let data_url = 'https://wechatscope.jmsc.hku.hk/api/update_weixin_public_pretty?days='
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"

let settings = { method: "Get" }

let datafiles = {
  "book": "./data/books.json",
  "game": "./data/games.json",
  "movie": "./data/movies.json",
  "music": "./data/musics.json"
}


async function perform() {
  let keys = Object.keys(datafiles)
  keys.map((key)=>{
    jsonfile = datafiles[key]
    let text = fs.readFileSync(jsonfile, {encoding:'utf8', flag:'r'})
    let json = JSON.parse(text)
    let id = 0
    json.map((item)=>{
      if (item['id']){
        console.log(item['id'])
      }else{
        item['id'] = id
        id += 1
      }
    })
    let content = JSON.stringify(json, undefined, 4);
    fs.writeFileSync(jsonfile, content)    
  })
}

function removeDuplicates(originalArray, prop) {
     var newArray = [];
     var lookupObject  = {};

     for(var i in originalArray) {
        lookupObject[originalArray[i][prop]] = originalArray[i];
     }

     for(i in lookupObject) {
         newArray.push(lookupObject[i]);
     }
      return newArray;
 }

perform()

