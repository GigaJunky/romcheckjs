(async function() {

const Audio = document.getElementById("Audio")
, fileInput = document.getElementById("file-input")
, datfileInput = document.getElementById("datfile-input")
, btnSaveWav = document.getElementById("btnSaveWav")
, btnSaveCas = document.getElementById("btnSaveCas")
, selZFiles = document.getElementById("selZFiles")
, selDFiles = document.getElementById("selDFiles")
, FileCS = document.getElementById("FileCS")
, CasCS = document.getElementById("CasCS")
, WavCS = document.getElementById("WavCS")
, taBas = document.getElementById("taBas")
, lblCount = document.getElementById("lblCount")
,c_table = makeCRCTable()
, cfg = {checksums: ['SHA-1','CRC32'] }
console.log('cfg: ', cfg)


fileInput.onchange = readFilesCStext // readFilesCSJson //readZipFiles //readFile
datfileInput.onchange = readDatFiles //readZipFiles //readFile

const enc = new TextDecoder("utf-8")
function encStr(s) { return new TextEncoder("utf-8").encode(s) }
function decStr(b) { return new TextDecoder("utf-8").decode(b) }

let zentries, dir, dskbuf, cas, cocoCasWave, dat, datText, table, gamesTable = []

// #region Tabulator
//headerMenu:headerMenu

var rowMenu = [
    {
        label:"<i class='fas fa-user'></i> Change Name",
        action:function(e, row){ row.update({name:"Steve Bobberson"}); }
    }
    ,{
        label:"<i class='fas fa-check-square'></i> Select Row",
        action:function(e, row){ row.select(); }
    }
    ,{ separator:true }
    ,{ label:"Print", action:function(e, row){ table.print(false, true) }} 

    ,{
        label:"Admin Functions",
        menu:[
            {
                label:"<i class='fas fa-trash'></i> Delete Row",
                action:function(e, row){ row.delete(); }
            },
            {
                label:"<i class='fas fa-ban'></i> Disabled Option",
                disabled:true,
            },
        ]
    }
    ,
    { separator:true },
    
    {
        label:"Download",
        menu:[
             { label:"CSV"  , action:function(e, row){ table.download("csv", "data.csv") }}
            ,{ label:"JSON" , action:function(e, row){ table.download("json", "data.json") }} 
            ,{ label:"HTML" , action:function(e, row){ table.download("html", "data.html", {style:true}) }} 
            ,{ label:"PDF"  , action:function(e, row){ table.download("pdf", "data.pdf", { orientation:"portrait", title:"Example Report" }) }} 
            ,{ label:"xlsx" , action:function(e, row){ table.download("xlsx", "data.xlsx", {sheetName:"My Data"}) }} 
        ]
    }
]


table = new Tabulator("#table", { movableColumns: true, layout:"fitDataFill", clipboard:true, autoColumns:true, 
    placeholder:"Awaiting Data, Please Load File",
    rowContextMenu: rowMenu,
    pagination:"local",
    paginationSize: 100,
    paginationSizeSelector:[30, 50, 80, 100, 200],
    paginationCounter:"rows",
    autoColumnsDefinitions:function(definitions){
        for (const c of definitions) {
            c.headerFilter = true
            ,c.headerMenu = headerMenu
            //c.headerVertical = true
        }
        return definitions
    }
})

//trigger an alert message when the row is clicked
table.on("rowClick", function(e, row){ 
    alert("Row " + row.getData().id + " Clicked!!!!")
})
table.on("dataLoaded", function(data){
    console.log("dataLoaded:",  data.length)
    lblCount.innerHTML = data.length
})
table.on("dataFiltered", function(filters, rows){
    //filters - array of filters currently applied
    //rows - array of row components that pass the filters
    lblCount.innerHTML = rows.length
})


//define column header menu as column visibility toggle
    var headerMenu = function () {
        var menu = []
        var columns = this.getColumns()

        for (let column of columns) {

            //create checkbox element using font awesome icons
            let icon = document.createElement("i")
            icon.classList.add("fas")
            icon.classList.add(column.isVisible() ? "fa-check-square" : "fa-square")

            //build label
            let label = document.createElement("span")
            let title = document.createElement("span")

            title.textContent = " " + column.getDefinition().title

            label.appendChild(icon)
            label.appendChild(title)

            //create menu item
            menu.push({
                label: label,
                action: function (e) {
                    //prevent menu closing
                    e.stopPropagation()

                    //toggle current column visibility
                    column.toggle()

                    //change menu item icon
                    if (column.isVisible()) {
                        icon.classList.remove("fa-square")
                        icon.classList.add("fa-check-square")
                    } else {
                        icon.classList.remove("fa-check-square")
                        icon.classList.add("fa-square")
                    }
                }
            })
        }

        return menu
    }
//#endregion


    //NoIntro DB
async function readDatFiles(event)
{
    const file = event.target.files[0]
    const arrayBuffer = await file.arrayBuffer()
    datText =  decStr(arrayBuffer)
    const jDat = JSON.parse(datText)
    //gamesTable = []
    for (const g of jDat.datafile.game) {
        if(g.source)
            for (const gs of g.source) 
                if(gs.file)
                    for (const gsf of gs.file) {
                        //console.log(g.$.name, gsf.$.crc32 )
                        if(!gamesTable.some( i => i.crc == gsf.$.crc32))
                            gamesTable.push({glen: jDat.datafile.game.length, zname: undefined, zsize: undefined,  name: g.$.name, match: 0, size: gsf.$.size, crc: gsf.$.crc32, crcMatch: undefined, md5: gsf.$.md5, sha1: gsf.$.sha1, sha1Match: undefined, bad: gsf.$.bad, region: g.archive[0].$.region })
                    }
    }
    table.setData(gamesTable)
}

async function readFilesCStext(f)
{
    console.log('f:', dat)
    //const games = dat.datafile.game
    //console.log(games.length)

    for (const file of fileInput.files) {
        let folder = 'a26'
        console.log("fn: ",file.name)
        const arrayBuffer = await file.arrayBuffer()
        //const sha1 = await SHAbuf(arrayBuffer)

        
        const {entries} = await unzipit.unzip(file)
        for (const [name, entry] of Object.entries(entries)) {
            //console.log(entry)
            if(cfg.checksums != undefined){
                checksums = await checkSums(new Uint8Array(await entry.arrayBuffer()), cfg.checksums)
                console.log("cs:",checksums)
            }

            const crc =  entry._rawEntry.crc32.toString(16).padStart(8,"0")
            //matches = dat.filter(f=> f[0].crc == crc)
            //const matches = games.filter(f=> f.source && f.source[0].file && f.source[0].file[0].$.crc32 == crc ) //NoIntro .json
            //const matches = gamesTable.filter(f=> f.crc == crc ) //NoIntro .json
            let fi = gamesTable.findIndex(i => i.crc == crc)
            if(fi >=0){
                gamesTable[fi].folder = folder
                gamesTable[fi].match = 1
                gamesTable[fi].crcMatch = crc == checksums.CRC32
                gamesTable[fi].sha1Match = gamesTable[fi].sha1 == checksums.SHA1
                gamesTable[fi].zsize = file.size
                gamesTable[fi].zname = file.name
                console.log(gamesTable[fi])
            }else
                gamesTable.push({folder: folder, zname: file.name, zsize: file.size, match: -1, crc: crc, crcMatch: crc == checkSums.crc32 })

            taBas.value += `\n${name} bytes: ${entry.size} crc: ${crc}, match: ${fi} `
        }
    }
    table.setData(gamesTable)   
}


async function readFilesCSJson(f)
{
    console.log('rfCSJson:', dat)

    const games = dat.datafile.game
    console.log(games.length, cfg)

    for (const file of fileInput.files) {
        const arrayBuffer = await file.arrayBuffer()
        let checksums
        //const sha1 = await SHAbuf(arrayBuffer)
        const {entries} = await unzipit.unzip(file)
        for (const [name, entry] of Object.entries(entries)) {
    
            console.log(entry)
            const crc =  entry._rawEntry.crc32.toString(16).padStart(8,"0")
            //matches = dat.filter(f=> f[0].crc == crc)
            const matches = games.filter(f=> f.source && f.source[0].file && f.source[0].file[0].$.crc32 == crc ) //NoIntro .json
            console.log(matches)
            if(matches.length > 0)
                taBas.value += `\n${name} bytes: ${entry.size} crc: ${crc}, match: ${matches[0].$.name} `
            else
                taBas.value += `\n${name} bytes: ${entry.size} crc: ${crc}, match: No`
            //taBas.value += `\n${file.name}, ${sha1} `
        }
    }
}


//for unzipit
async function readZipFiles() {
    const f = fileInput.files[0]
    const arrayBuffer = await f.arrayBuffer()
    FileCS.innerText =  await SHAbuf(arrayBuffer)
    CasCS.innerText =  ""
    WavCS.innerText =  ""
    selZFiles.style.display = "block"
    selDFiles.style.display = "none"

    if(f.name.toLowerCase().endsWith(".zip")){
        const {entries} = await unzipit.unzip(f)
        zentries = entries
        selZFiles.options.length = 0
        for (const [name, entry] of Object.entries(zentries)) {
            var opt = document.createElement('option')
            opt.value = name
            opt.innerHTML = `${name} bytes: ${entry.size}`
            selZFiles.appendChild(opt)
        }
    } else{
        selZFiles.options.length = 0
        await readFile(f)
    }
}

//#region checksum
async function CheckSum(arrayBuffer, alg='SHA-1'){
    const hashBuffer = await crypto.subtle.digest(`${alg}`, arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase()
}

async function checkSums(buf, types = ['CRC32'])
{
    let cs = {}
    for (const type of types) 
        cs[type.replace('-',"")] = type == 'CRC32' ? crc32(buf).toString(16).padStart(8,"0") : await CheckSum(buf, type)

    cs.size = buf.length
    return cs
}

function crc32(buf) {
    let crc = -1
    for(var i=0, iTop=buf.length; i<iTop; i++) 
        crc =  (crc >>> 8 ) ^ c_table[(crc ^ buf[i]) & 0xff] //buffer
    return (crc ^ (-1)) >>> 0
}

function makeCRCTable(){
  let c, crcTable = []
  for(var n =0; n < 256; n++){
      c = n
      for(var k =0; k < 8; k++)
          c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
      crcTable[n] = c >>> 0
  }
  return crcTable
}
//#endregion

}())
