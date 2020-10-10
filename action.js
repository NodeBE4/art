let { Octokit } = require('@octokit/rest')
let fs = require('fs')
let showdown  = require('showdown')
let converter = new showdown.Converter()

require('dotenv').config()

let TOKEN = process.env.TOKEN
let REPOSITORY = process.env.REPOSITORY
let [OWNER, REPO] = REPOSITORY.split('/')

let octokit = new Octokit({
  auth: TOKEN
})

const FILE = '100644'; // commit mode
const encoding = 'utf-8';
const ref = 'heads/master';

let committer = {
  name: 'NodeBE4',
  email: 'you@example.com'
}

let datafiles = {
  "book": "./data/books.json",
  "game": "./data/games.json",
  "movie": "./data/movies.json",
  "talk": "./data/talks.json",
  "music": "./data/musics.json"
}

function parseMd(text){
  let parts = text.split("### ")
  let data = {}
  for (i=1;i<parts.length;i++){
    key = parts[i].split('\n')[0].trim()
    val = parts[i].replace(key, '').replace(/\r?\n|\r/g,'').trim()
    data[key] = val
  }
  return data
}


async function performTasks() {
  let { data } = await octokit.issues.listForRepo({
    owner: OWNER,
    repo: REPO,
    state: 'open'
  })

  let promises = data.map(async (issue) => {
    try {
      let jsonfile
      let newitem = {}
      rawitem = parseMd(issue.body)
      if (issue.title=='new_music_request'){
        newitem['music'] = converter.makeHtml(rawitem['名称'])
        newitem['author'] = converter.makeHtml(rawitem['表演者'])
        newitem['year'] = rawitem['年代']
        newitem['status'] = converter.makeHtml(rawitem['状态信息'])
        jsonfile = datafiles['music']
      }else if(issue.title=='new_game_request'){
        newitem['game'] = converter.makeHtml(rawitem['游戏名称'])
        newitem['platform'] = converter.makeHtml(rawitem['平台'])
        newitem['developer'] = rawitem['制作者']
        newitem['type'] = rawitem['类型']
        newitem['mode'] = rawitem['模式']
        newitem['year'] = rawitem['年代']
        newitem['status'] = converter.makeHtml(rawitem['状态信息'])
        jsonfile = datafiles['game']
      }else if(issue.title=='new_book_request'){
        newitem['book'] = converter.makeHtml(rawitem['书名'])
        newitem['publisher'] = converter.makeHtml(rawitem['出版社'])
        newitem['author'] = rawitem['作者']
        newitem['isbn'] = converter.makeHtml(rawitem['ISBN'])
        if (rawitem['推荐理由']){
          newitem['reason'] = converter.makeHtml(rawitem['推荐理由'])
        }
        jsonfile = datafiles['book']
      }else if(issue.title=='new_movie_request'){
        newitem['movie'] = converter.makeHtml(rawitem['影视作品名称'])
        newitem['director'] = rawitem['导演']
        newitem['year'] = rawitem['年代']
        newitem['imdb'] = `<a href="${rawitem['IMDB url']}">${rawitem['IMDB名称']}</a>`
        jsonfile = datafiles['movie']
      }else if(issue.title=='new_talk_request'){
        newitem['talk'] = converter.makeHtml(rawitem['讲座名称'])
        newitem['author'] = rawitem['讲者']
        newitem['year'] = rawitem['年代']
        newitem['url'] = rawitem['视频 url']
        if (rawitem['推荐理由']){
          newitem['reason'] = converter.makeHtml(rawitem['推荐理由'])
        }
        jsonfile = datafiles['talk']
      }else{
        throw Error('非法请求');
      }

      let text = fs.readFileSync(jsonfile, {encoding:'utf8', flag:'r'})
      let json = JSON.parse(text)
      var topleader = json.filter(function (item) {
          return item == newitem ;
      }); 
      if (topleader.length > 0){
        throw Error('英雄所见略同，该条目已经存在了');
      }
      newitem['id'] = json.length 
      json.push({
        ...newitem
      });
      let content = JSON.stringify(json, undefined, 4);
      fs.writeFileSync(jsonfile, content)
      await octokit.issues.createComment({
        owner: OWNER,
        repo: REPO,
        issue_number: issue.number,
        body: `恭喜，添加成功！`
      })
      await octokit.issues.update({
        owner: OWNER,
        repo: REPO,
        issue_number: issue.number,
        state: 'closed',
        title: `添加成功: ${newitem[Object.keys(newitem)[0]]}`,
        labels: ['success']
      })
    } catch(error) {
      await octokit.issues.createComment({
        owner: OWNER,
        repo: REPO,
        issue_number: issue.number,
        body: `错误 ${error.toString()}`
      })
      await octokit.issues.update({
        owner: OWNER,
        repo: REPO,
        issue_number: issue.number,
        state: 'closed',
        labels: ['error']
      })
      throw error
    }

  })

  await Promise.all(promises)
}


performTasks()